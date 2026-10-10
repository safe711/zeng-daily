export function createSignaturePad(canvas,{onChange=()=>{},pixelRatio=()=>globalThis.devicePixelRatio||1,ResizeObserverClass=globalThis.ResizeObserver}={}){
  const context=canvas.getContext('2d');if(!context)throw Error('此浏览器无法打开手写签名板');
  const strokes=[];let stroke=null;let pointerId=null;let disposed=false;
  function hasInk(){return strokes.some(points=>points.reduce((distance,point,index)=>index?distance+Math.hypot(point.x-points[index-1].x,point.y-points[index-1].y):0,0)>.03);}
  function paint(){
    const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    const ratio=Math.min(3,Math.max(1,pixelRatio()));canvas.width=Math.round(bounds.width*ratio);canvas.height=Math.round(bounds.height*ratio);
    context.fillStyle='#faf8f2';context.fillRect(0,0,canvas.width,canvas.height);context.strokeStyle='#252319';context.lineWidth=2.5*ratio;context.lineCap='round';context.lineJoin='round';
    for(const points of strokes){if(points.length<2)continue;context.beginPath();context.moveTo(points[0].x*canvas.width,points[0].y*canvas.height);for(const point of points.slice(1))context.lineTo(point.x*canvas.width,point.y*canvas.height);context.stroke();}
  }
  function point(event){const bounds=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width)),y:Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))};}
  function down(event){if(disposed||pointerId!==null||event.isPrimary===false||event.button!==0)return;event.preventDefault();pointerId=event.pointerId;stroke=[point(event)];strokes.push(stroke);canvas.setPointerCapture?.(pointerId);}
  function move(event){if(event.pointerId!==pointerId||!stroke)return;event.preventDefault();stroke.push(point(event));paint();onChange(hasInk());}
  function up(event){if(event.pointerId!==pointerId)return;move(event);const finished=pointerId;pointerId=null;stroke=null;if(canvas.hasPointerCapture?.(finished))canvas.releasePointerCapture(finished);onChange(hasInk());}
  function cancel(event){if(event.pointerId!==pointerId)return;pointerId=null;stroke=null;onChange(hasInk());}
  const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel};
  for(const [name,handler] of Object.entries(handlers))canvas.addEventListener(name,handler);
  const observer=ResizeObserverClass?new ResizeObserverClass(paint):null;observer?.observe(canvas);paint();
  return {hasInk,clear(){strokes.length=0;pointerId=null;stroke=null;paint();onChange(false);},async toBlob(){
    if(disposed||!hasInk())throw Error('请在签名板上手写本人姓名，点一下不算签名');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob?.size)throw Error('签名图片生成失败');return blob;
  },dispose(){disposed=true;observer?.disconnect();for(const [name,handler] of Object.entries(handlers))canvas.removeEventListener(name,handler);}};
}
