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

export function disclaimerHtml(){return `<dialog id="role-disclaimer" class="contract-viewer" aria-labelledby="role-disclaimer-title"><div class="contract-viewer-header"><h3 id="role-disclaimer-title">免责声明</h3><button type="button" data-action="close-disclaimer">关闭</button></div><div class="disclaimer-copy"><p>ZENG LEGACY 是用于成年人自愿参与的私人角色扮演、剧情展示与日常记录的软件。以下说明适用于应用中的家族介绍、家规、招募、契约、订阅、任务及身份称谓。</p><h4>一、剧情与角色</h4><p>主子、奴才、主仆等级、人身归属、放弃权利等措辞属于剧情及角色表达，不代表现实中的人格、权利或法律地位发生改变。剧情中的誓言、身份与服从关系，不应作为现实控制、拘禁、威胁或强迫他人的依据。</p><h4>二、自愿参与与退出</h4><p>现实中的参与应建立在成年人知情、自愿和明确边界的基础上。参与者可以拒绝具体活动、暂停或退出角色扮演；不得以剧情、承诺或身份要求其接受身体伤害、剥夺自由或放弃基本生活保障。</p><h4>三、财产、债务与抵押</h4><p>剧情中的资产申报、人民币100万元忠诚债务、房产车辆抵押等内容属于故事设定。本软件不用于订立、确认或执行真实债务、资产抵押、人身归属或财产转移；点击、打卡、积分、角色签名和录制视频，不作为要求他人承担真实债务或交付财产的依据。如有独立的现实财产事务，应另行核实事实、明确双方意愿并寻求专业意见，不以剧情文字代替现实手续。</p><h4>四、订阅与象征性活动</h4><p>挡灾、灾祸转移、身份赏赐和忠诚积分属于角色叙事或象征性记录，软件不承诺改变他人健康、命运或现实风险。订阅和供奉记录不等于核实付款；现实付款须由本人核对收款人、金额和意愿，软件不自动扣款。</p><h4>五、隐私与使用责任</h4><p>照片、视频、签名、任务记录和账号资料涉及个人隐私。上传及分享前，应取得有关人员的同意；不得利用软件实施欺骗、胁迫、骚扰或泄露他人隐私。本声明不用于免除现实违法行为或侵害他人权益的责任。</p><p class="muted">说明版本：2026年10月12日。剧情页面保持叙事表达，现实使用边界集中在本声明中说明。</p></div></dialog>`;}
