export function createNotifier(element,{setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let timer=null;
  let revision=0;
  return (text)=>{
    if(element.dataset?.updateActive==='true')return;
    if(/(?:已备份|已同步)\s*0\s*张/.test(String(text??'')))return;
    const current=++revision;
    if(timer!==null)clearTimer(timer);
    timer=null;
    element.textContent=String(text??'').replaceAll('NAS','服务器');
    if(text)timer=setTimer(()=>{
      if(current!==revision)return;
      element.textContent='';
      timer=null;
    },3000);
  };
}
