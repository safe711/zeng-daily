// Keep headings in their own panels without viewport CSS sticky compositing.
export function mountFamilyHeaders(host){
 const panels=[...host.querySelectorAll('.family-page>.family-panel')];if(!panels.length)return ()=>{};
 let frame=0,alive=true;
 function update(){frame=0;if(!alive)return;const safe=parseFloat(getComputedStyle(document.documentElement,'::before').height)||0;const positions=panels.map(panel=>{const summary=panel.querySelector(':scope>summary'),border=parseFloat(getComputedStyle(panel).borderTopWidth)||0,height=summary.offsetHeight;return {summary,top:panel.open?Math.min(Math.max(safe-panel.getBoundingClientRect().top-border,0),Math.max(0,panel.offsetHeight-height-border*2)):0};});for(const {summary,top}of positions){summary.style.top=top.toFixed(2)+'px';summary.classList.toggle('is-viewport-locked',top>0);}}
 const schedule=()=>{if(alive&&!frame)frame=requestAnimationFrame(update);};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);for(const panel of panels)panel.addEventListener('toggle',schedule);const resize=new ResizeObserver(schedule);resize.observe(host);update();
 return ()=>{alive=false;cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);for(const panel of panels){panel.removeEventListener('toggle',schedule);const summary=panel.querySelector(':scope>summary');summary?.style.removeProperty('top');summary?.classList.remove('is-viewport-locked');}};
}
