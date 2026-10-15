import {CLIENT_BUILD} from './version.js';
import {createUpdateProgress} from './progress.js';
export {CLIENT_BUILD} from './version.js';
export function isNewerBuild(build,current){const parse=value=>/^daily-shell-v(\d+)\.(\d+)\.(\d+)$/.exec(value||'')?.slice(1).map(Number),a=parse(build),b=parse(current);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;}
export function workerBuild(worker){if(!worker)return Promise.resolve(null);return new Promise(resolve=>{const channel=new MessageChannel();const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};const timer=setTimeout(()=>finish(null),1500);channel.port1.onmessage=event=>finish(event.data?.build??null);try{worker.postMessage({type:'GET_BUILD'},[channel.port2]);}catch{finish(null);}});}
export function restartApp(build){const url=new URL(location.href);url.searchParams.set('app-build',build);location.replace(url.href);}
export function createUpdater({notify,onAvailable=()=>{},serviceWorker=navigator.serviceWorker,fetcher=fetch,readBuild=workerBuild,reload=restartApp,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=()=>Date.now(),clientBuild=CLIENT_BUILD,progress=createUpdateProgress()}={}){
 try{localStorage.removeItem('daily-app-update-complete');}catch{}
 let busy=false,target=null,checking=null,lastCheck=-Infinity,lastProgress=0,lastDone=-1,downloadFailed=false;
 const available=build=>onAvailable(isNewerBuild(build,clientBuild),build);
 const discover=async()=>{const response=await fetcher(`./sw.js?check=${now()}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('无法连接更新服务器，请稍后重试');const build=(await response.text()).match(/const CACHE\s*=\s*['"]([^'"]+)['"]/)?.[1];if(!build)throw Error('服务器版本信息异常，请稍后重试');available(build);return build;};
 const peek=()=>{if(busy||now()-lastCheck<60000)return checking||Promise.resolve();if(checking)return checking;lastCheck=now();checking=discover().catch(()=>null).finally(()=>{checking=null;});return checking;};
 serviceWorker?.addEventListener?.('message',event=>{const p=event.data;if(!busy||p?.type!=='UPDATE_PROGRESS'||p.build!==target)return;if(p.phase==='failed'){downloadFailed=true;return;}if(Number.isFinite(p.done)&&p.done>lastDone){lastDone=p.done;lastProgress=now();}progress.update(p.total?p.done/p.total*100:undefined,p.done===p.total?'资源已就绪，正在启用新版…':`正在更新 ${p.done} / ${p.total}`);});
 const update=async()=>{if(busy)return;busy=true;try{
  if(!serviceWorker)throw Error('此浏览器暂不支持应用更新');target=await discover();if(!isNewerBuild(target,clientBuild)){progress.cancel();notify('已是最新版本');return;}
  const registration=await serviceWorker.getRegistration();if(!registration)throw Error('离线服务尚未安装，请重新打开应用');notify('发现新版，正在更新…');progress.start('正在准备新版…');lastDone=-1;downloadFailed=false;lastProgress=now();const deadline=now()+15*60000;await registration.update();let requested=null;
  while(now()<deadline&&now()-lastProgress<90000){if(downloadFailed)throw Error('更新下载未完成，请保持联网后重试');if(await readBuild(serviceWorker.controller)===target){available(clientBuild);notify('更新成功');progress.finish('更新完成',{hideAfter:0});await delay(2000);reload(target);return;}const waiting=registration.waiting,candidate=registration.installing||waiting;candidate?.postMessage({type:'GET_PROGRESS'});if(waiting&&waiting!==requested&&await readBuild(waiting)===target){requested=waiting;progress.update(99,'下载完成，正在启用新版…');waiting.postMessage({type:'SKIP_WAITING'});}await delay(150);}
  throw Error('更新下载长时间没有进展，请保持联网后重试');
 }catch(error){const message=error.name==='TimeoutError'?'连接更新服务器超时，请稍后重试':`更新未完成：${error.message}`;notify(message);progress.error(message);}finally{busy=false;target=null;}};
 update.peek=peek;return update;
}
