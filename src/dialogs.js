// Keep the dismissal area outside the visible frame, in the native modal layer.
// Camera and welcome dialogs retain their own lifecycle.
export function installDialogDismissal(root=document.body){
 const bound=new WeakSet();
 function prepare(){for(const dialog of root.querySelectorAll('dialog.contract-viewer')){
  let frame=dialog.querySelector(':scope > .modal-content-frame');
  if(!frame){
   frame=document.createElement('div');frame.className='modal-content-frame';
   for(const node of [...dialog.childNodes]){
    if(node.nodeType===1&&node.classList.contains('modal-dismiss-space'))node.remove();
    else frame.append(node);
   }
   dialog.append(frame);
  }
  dialog.classList.add('modal-dismiss-shell');
  if(!dialog.querySelector(':scope > .modal-dismiss-space')){
   const space=document.createElement('button');space.type='button';space.className='modal-dismiss-space';space.setAttribute('aria-label','点击空白处关闭');space.innerHTML='<span>点击空白处关闭</span>';dialog.append(space);
  }
  if(bound.has(dialog))continue;bound.add(dialog);let beganOnBlank=false;
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  const blank=target=>target===dialog||target===dialog.querySelector(':scope > .modal-content-frame')||target.closest?.('.modal-dismiss-space')?.parentElement===dialog;
  dialog.addEventListener('pointerdown',e=>{beganOnBlank=blank(e.target);},true);
  dialog.addEventListener('pointercancel',()=>{beganOnBlank=false;},true);
  dialog.addEventListener('click',e=>{
   const dismiss=dialog.open&&blank(e.target)&&(beganOnBlank||e.detail===0);beganOnBlank=false;
   if(!dismiss)return;e.preventDefault();e.stopImmediatePropagation();
   const cancelled=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(cancelled)&&dialog.open)dialog.close();
  },true);
 }}
 prepare();const observer=new MutationObserver(prepare);observer.observe(root,{childList:true,subtree:true});
 return ()=>observer.disconnect();
}
