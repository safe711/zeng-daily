export function createNotifier(element,{setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let timer=null;
  let revision=0;
  return (text,duration=0)=>{
    const current=++revision;
    if(timer!==null)clearTimer(timer);
    timer=null;
    element.textContent=text;
    if(text&&duration>0)timer=setTimer(()=>{
      if(current!==revision)return;
      element.textContent='';
      timer=null;
    },duration);
  };
}
