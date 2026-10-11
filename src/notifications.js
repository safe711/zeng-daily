export function createNotifier(element,{setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let timer=null;
  let revision=0;
  return (text)=>{
    const current=++revision;
    if(timer!==null)clearTimer(timer);
    timer=null;
    element.textContent=text;
    if(text)timer=setTimer(()=>{
      if(current!==revision)return;
      element.textContent='';
      timer=null;
    },3000);
  };
}
