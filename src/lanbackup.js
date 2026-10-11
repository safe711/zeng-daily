import {listPhotos,listReports,listShoePhotos,listShoeReports,syncPhoto} from './photos.js';
import {syncPendingReports} from './reports.js';
import {syncPendingShoeMedia} from './shoes.js';

export function validateLanUrl(value){
  const url=new URL(value);
  const parts=url.hostname.split('.').map(Number);
  const privateIp=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
  if(url.protocol!=='https:'||!privateIp||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('请输入家庭 NAS 的 HTTPS 局域网地址');
  return url.origin;
}
export function createLanBackup({records=()=>[],notify=()=>{},storage=globalThis.localStorage,fetcher=globalThis.fetch,online=()=>globalThis.navigator?.onLine!==false,photos=listPhotos,reports=listReports,shoePhotos=listShoePhotos,shoeReports=listShoeReports,sendPhoto=syncPhoto,sendReports=syncPendingReports,sendShoes=syncPendingShoeMedia}={}){
  let config=null,busy=false,pairing=null;
  let disabled=storage.getItem('daily-lan-disabled')==='true';
  try{const saved=JSON.parse(storage.getItem('daily-lan-backup'));if(saved?.key&&saved.key.length>=32&&saved.key.length<=256)config={url:validateLanUrl(saved.url),key:saved.key};}catch{}
  function save(url,key){
    url=validateLanUrl(url);key=key.trim();if(key.length<32||key.length>256)throw Error('请填写日课独立访问密钥');
    const next={url,key};storage.setItem('daily-lan-backup',JSON.stringify(next));config=next;disabled=false;storage.removeItem('daily-lan-disabled');
  }
  function disconnect(){storage.removeItem('daily-lan-backup');storage.setItem('daily-lan-disabled','true');disabled=true;config=null;}
  async function connect(){
    if(config)return config;if(disabled||!online())throw Error('请在家里的 Wi-Fi 打开软件以连接 NAS');
    if(pairing)return pairing;
    pairing=(async()=>{
      let candidate;try{candidate=JSON.parse(storage.getItem('daily-lan-device'));}catch{}
      if(!candidate?.id||!candidate?.token){candidate={id:crypto.randomUUID(),token:'device-'+crypto.randomUUID()+'-'+crypto.randomUUID()};storage.setItem('daily-lan-device',JSON.stringify(candidate));}
      const response=await fetcher('https://192.168.1.20:4180/api/nas/pair',{method:'POST',credentials:'omit',redirect:'error',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(candidate),signal:AbortSignal.timeout(3000)});
      if(!response.ok)throw Error('暂未完成 NAS 自动连接，请在家里的 Wi-Fi 重试');
      if((await response.json()).paired!==true)throw Error('NAS 连接未确认');
      if(disabled)throw Error('自动备份已停止');
      save('https://192.168.1.20:4180',candidate.token);
      const status=globalThis.document?.querySelector('[data-lan-status]');if(status)status.textContent='已连接家庭 NAS，已开启自动备份';
      notify('已自动连接家庭 NAS');return config;
    })().finally(()=>{pairing=null;});return pairing;
  }
  async function retry(){disabled=false;storage.removeItem('daily-lan-disabled');return run({manual:true});}
  async function run({manual=false}={}){
    if(busy||disabled||!online()){if(manual)notify('请先连接家庭 NAS；照片仍保存在手机');return;}
    busy=true;
    try{
      const connection=await connect();
      const pending=(await photos()).filter(p=>p.status!=='uploaded');
      const other=[...await reports(),...await shoePhotos(),...await shoeReports()].some(p=>p.status!=='uploaded');
      if(!pending.length&&!other){if(manual)notify('没有待上传的照片或截图');return;}
      const probe=await fetcher(connection.url+'/api/nas/status',{credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(3000)});
      if(!probe.ok)throw Error('NAS 未连接或密钥不正确');
      const status=await probe.json();if(status.configured!==true)throw Error('NAS 照片目录尚未就绪');
      const upload=(path,options={})=>{
        if(config!==connection)throw Error('NAS 连接已变更');
        if(!/^\.\/api\/nas\/(photos|reports|shoes\/photos|shoes\/reports)\?/.test(path))throw Error('上传路径无效');
        return fetcher(connection.url+path.slice(1),{...options,credentials:'omit',redirect:'error',headers:{...options.headers,Authorization:'Bearer '+connection.key}});
      };
      let uploaded=0,failed=0;
      for(const photo of pending){if(config!==connection)return;try{if(await sendPhoto(photo,connection.key,{fetcher:upload}))uploaded++;}catch{failed++;}}
      if(config!==connection)return;
      const summary=await sendReports(connection.key,{fetcher:upload});
      const shoes=await sendShoes(connection.key,{fetcher:upload,records});
      failed+=summary.failed+shoes.failed;uploaded+=summary.uploaded+shoes.photos+shoes.reports;
      notify(`已备份 ${uploaded} 张照片与截图到 NAS${failed?`，${failed} 张保留在手机待补传`:''}`);
      return {uploaded,failed};
    }catch{if(manual)notify('暂时连不上家庭 NAS，请确认连接家里的 Wi-Fi、已信任证书并允许本地网络；照片仍保存在手机');}
    finally{busy=false;}
  }
  async function readContract(){
    const connection=await connect();
    let response;
    try{response=await fetcher(connection.url+'/api/private/contract',{credentials:'omit',redirect:'error',cache:'no-store',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(15000)});}catch{throw Error('暂时连不上 NAS，请连接家里的 Wi-Fi，并确认已信任 NAS 证书');}
    if(config!==connection)throw Error('NAS 连接已变更，请重试');
    if(response.status===401)throw Error('此设备的 NAS 连接已失效，请联系管理者重新连接');
    if(!response.ok)throw Error('NAS 契约原件暂时无法读取');
    if(Number(response.headers.get('content-length'))>8000000)throw Error('契约原件过大');
    const blob=await response.blob();
    if(blob.size>8000000)throw Error('契约原件过大');
    return blob;
  }
  function settingsHtml(){return `<section><h3>回家自动备份到 NAS</h3><p>在家里的 Wi-Fi 打开软件，会自动连接 NAS 并补传照片、汇总截图和洗鞋记录。无需填写地址或密钥。外出时保留待上传图片，下次回家补传。</p><p>若浏览器提示访问本地网络，请选择允许。连接凭证只保存在本机。</p><p data-lan-status>${config?'已连接家庭 NAS，已开启自动备份':disabled?'自动备份已停止':'正在等待家庭 NAS 自动连接'}</p><button data-action="lan-retry">立即连接并补传</button><button data-action="lan-disconnect">停止自动备份</button><p><button type="button" data-action="certificate-guide">证书安装帮助</button></p></section>`;}
  return {save,disconnect,connect,retry,run,readContract,settingsHtml,get enabled(){return !disabled;},get configured(){return !!config;}};
}
