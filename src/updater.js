export const CLIENT_BUILD='daily-shell-v0.1.2-test.8-refresh5';

export function workerBuild(worker){
  if(!worker)return Promise.resolve(null);
  return new Promise(resolve=>{
    const channel=new MessageChannel();
    const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};
    const timer=setTimeout(()=>finish(null),1500);
    channel.port1.onmessage=event=>finish(event.data?.build??null);
    try{worker.postMessage({type:'GET_BUILD'},[channel.port2]);}catch{finish(null);}
  });
}

export function createUpdater({notify,serviceWorker=navigator.serviceWorker,fetcher=fetch,readBuild=workerBuild,reload=()=>location.reload(),delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=()=>Date.now(),clientBuild=CLIENT_BUILD}={}){
  let busy=false;
  return async()=>{
    if(busy)return;
    busy=true;
    try{
      if(!serviceWorker)throw Error('此浏览器暂不支持应用更新');
      const response=await fetcher(`./sw.js?check=${now()}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('无法连接更新服务器，请稍后重试');
      const target=(await response.text()).match(/const CACHE\s*=\s*['"]([^'"]+)['"]/)?.[1];
      if(!target)throw Error('服务器版本信息异常，请稍后重试');
      if(target===clientBuild){notify('已是最新版本');return;}
      const registration=await serviceWorker.getRegistration();
      if(!registration)throw Error('离线服务尚未安装，请重新打开日课');
      notify('发现新版，正在更新…');
      await registration.update();
      const deadline=now()+45000;
      let requested=null;
      while(now()<deadline){
        const controller=serviceWorker.controller;
        if(await readBuild(controller)===target){
          notify('更新成功');
          await delay(3000);
          reload();
          return;
        }
        const waiting=registration.waiting;
        if(waiting&&waiting!==requested&&await readBuild(waiting)===target){
          requested=waiting;
          waiting.postMessage({type:'SKIP_WAITING'});
        }
        await delay(200);
      }
      throw Error('更新尚未完成，请保持联网后重试');
    }catch(error){notify(error.name==='TimeoutError'?'连接更新服务器超时，请稍后重试':`更新未完成：${error.message}`);}
    finally{busy=false;}
  };
}
