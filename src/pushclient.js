import {RITUAL_KINDS} from './model.js';
export function reminderSchedule(settings,timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone){
  return {timeZone,times:Object.fromEntries(RITUAL_KINDS.map(kind=>[kind,settings[kind]||''])),paused:!!settings.paused};
}
export function applicationKey(value){
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]{87}$/.test(value))throw Error('后台推送公钥无效');
  const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')+'='),character=>character.charCodeAt(0));if(bytes.length!==65||bytes[0]!==4)throw Error('后台推送公钥无效');return bytes;
}
export function createPushClient({staticHosting=false}={}){
  let configuration=null;let registered=false;let serial=Promise.resolve();
  const supported=()=>globalThis.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in globalThis&&'Notification' in globalThis;
  const deviceId=()=>{let id=localStorage.getItem('daily-push-device');if(!id){id=crypto.randomUUID();localStorage.setItem('daily-push-device',id);}return id;};
  async function request(path,options={}){
    const response=await fetch(path,{...options,redirect:'error',credentials:'same-origin',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','X-Daily-Device':deviceId(),...options.headers}});
    if(!response.ok)throw Error(response.status===401?'私有访问已过期，请联网重新登录':'后台提醒操作未成功，请检查私有服务');return response.json();
  }
  async function refresh(){
    if(staticHosting)return null;
    try{
      const response=await fetch('./api/private/status',{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(5000)});
      if(!response.ok)return null;const value=await response.json();if(value.private!==true)return null;
      configuration=value;
      if(configuration.pushConfigured){const status=await request('./api/push/device');registered=status.registered===true;}
      return configuration;
    }catch{return configuration;}
  }
  function sync(settings){
    const schedule=reminderSchedule(settings);
    const pending=serial.catch(()=>{}).then(async()=>{
      if(!registered)return false;
      const registration=await navigator.serviceWorker.ready;const subscription=await registration.pushManager.getSubscription();
      if(!subscription)throw Error('此设备尚未订阅推送');
      await request('./api/push/device',{method:'POST',body:JSON.stringify({id:deviceId(),subscription:subscription.toJSON(),schedule})});return true;
    });serial=pending;return pending;
  }
  async function enable(settings){
    if(!configuration?.pushConfigured)throw Error('NAS/Windows 后台推送发送未开通');
    if(!supported())throw Error('此环境不支持推送，请用可信 HTTPS，并在 iPhone 主屏幕打开');
    const mobileApple=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    if(mobileApple&&!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)throw Error('请先添加到 iPhone 主屏幕，再从主屏幕开启提醒');
    const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('未获得系统通知权限');
    const registration=await navigator.serviceWorker.ready;
    const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(configuration.publicKey)});
    const pending=serial.catch(()=>{}).then(()=>request('./api/push/device',{method:'POST',body:JSON.stringify({id:deviceId(),subscription:subscription.toJSON(),schedule:reminderSchedule(settings)})}));
    serial=pending;await pending;registered=true;return true;
  }
  async function stop(){
    if(!configuration?.pushConfigured)return false;
    const pending=serial.catch(()=>{}).then(async()=>{await request('./api/push/device',{method:'DELETE'});registered=false;if(supported()){const registration=await navigator.serviceWorker.ready;const subscription=await registration.pushManager.getSubscription();if(subscription)await subscription.unsubscribe();}return true;});serial=pending;return pending;
  }
  const test=()=>request('./api/push/test',{method:'POST',body:'{}'});
  return {refresh,enable,stop,sync,test,supported,get configuration(){return configuration;},get registered(){return registered;}};
}
