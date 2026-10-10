export function createHoldController({now,requestFrame,cancelFrame,onProgress,onComplete,duration=3000}) {
  let frame;
  let startedAt;
  let active=false;
  function cancel() {
    active=false;
    if(frame !== undefined) cancelFrame(frame);
    frame=undefined;
    onProgress(0);
  }
  function tick() {
    if(!active) return;
    const progress=Math.min(1,Math.max(0,(now()-startedAt)/duration));
    onProgress(progress);
    if(progress>=1) {
      active=false;
      frame=undefined;
      onComplete();
      return;
    }
    frame=requestFrame(tick);
  }
  return {start(){if(active)return;active=true;startedAt=now();onProgress(0);frame=requestFrame(tick);},cancel};
}
