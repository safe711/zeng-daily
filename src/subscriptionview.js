import {disasterIcon,disasterDescription,disasterSelection,disasterMembers} from './familyui.js';
import {dayKey} from './model.js';
import {configureSubscription,recordPayment,signPayment,subscriptionStatus,formatAmount,subscriptionAgreement,mediaFingerprint} from './subscription.js';
import {saveSubscriptionMedia,getSubscriptionMedia,deleteSubscriptionMedia} from './photos.js';
import {createSignaturePad} from './signature.js';
import {paymentLink,paymentQr,paymentRecipient,paymentAmountCents,embeddedContract,verifiedPaymentLink} from './integrations.js';
import {unsealContract} from './contractcrypto.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function saveBlob(blob,name){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export async function checkContract(file){
  if(!(file instanceof Blob)||!['image/png','image/jpeg'].includes(file.type)||!file.size||file.size>8_000_000)throw Error('协议原件须为 PNG 或 JPEG 图片，且不超过 8 MB');
  const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
  if(file.type==='image/png'&&![137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)||file.type==='image/jpeg'&&(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255))throw Error('协议图片内容无效');
  const bitmap=await createImageBitmap(file).catch(()=>{throw Error('无法读取协议图片，请换用清晰的 PNG 或 JPEG');});
  const pixels=bitmap.width*bitmap.height;bitmap.close();if(pixels>20_000_000)throw Error('协议图片分辨率过高，请选择较小的原件图片');
}
export function mountSubscription(container,state,{commit,notify,getPrivateConfig=()=>null,loadPrivateContract=null}){
  let alive=true;let busy=false;let pad=null;const urls=[];const subscription=state.subscription;const status=subscriptionStatus(subscription,dayKey());
  const pending=status.pending;const latest=status.latest;
  const renewal=status.renewalDate||'尚未开通';
  const due=status.remainingDays===null?'':status.remainingDays<0?`已到期 ${-status.remainingDays} 天`:status.remainingDays===0?'今日到期':`距续费 ${status.remainingDays} 天`;
  const restoreInput=(id,fingerprint,kind,paymentId='')=>`<label class="muted">恢复对应${kind==='signature'?'本人签名':'原件'}图片备份<input type="file" accept="image/png,image/jpeg" data-restore-id="${id}" data-restore-fingerprint="${fingerprint}" data-restore-kind="${kind}" data-payment-id="${paymentId}"></label>`;
  container.insertAdjacentHTML('beforeend',`<div class="subscription-view">
    <section class="subscription-overview" aria-label="订阅状态"><small>SUBSCRIPTION</small><h3 class="disaster-title">${disasterIcon()}挡灾订阅</h3><div class="subscription-introduction"><p>${disasterDescription}</p><p>受益人：曾仪父母及姥姥 <span class="${status.active&&!subscription.stopped&&latest?.disasterMemberIds?.length===2?'network-online':'network-offline'}">（${status.active&&!subscription.stopped&&latest?.disasterMemberIds?.length===2?'保护中':'未保护'}）</span></p></div><h3>${escape({'not-configured':'待设置','not-started':'未开通','pending-signature':'待签字',active:'已订阅·挡灾中','due-soon':'已订阅·挡灾中',expired:'已到期',scheduled:'下期已确认',stopped:'已暂停'}[status.code])}</h3><div class="subscription-amount">${subscription.plan.amountCents?`¥ ${formatAmount(subscription.plan.amountCents)} <small>/ 月</small>`:'月费尚未设置'}</div><dl><div><dt>续费时间</dt><dd>${escape(renewal)}</dd></div>${due?`<div><dt>到期提示</dt><dd>${escape(subscription.stopped?'提示已停止':due)}</dd></div>`:''}</dl></section>
    <div class="subscription-primary"><button type="button" class="subscription-pay" data-sub="pay" ${!paymentLink||pending||subscription.stopped||subscription.plan.amountCents!==paymentAmountCents?'disabled':''}>付款 · ¥ ${formatAmount(subscription.plan.amountCents)}</button>${paymentLink?`<small>收款人：${escape(paymentRecipient)} · 付款码金额 ¥ ${formatAmount(paymentAmountCents)}</small>`:'<small class="muted">收款码待接入</small>'}${!pending?`<button type="button" class="subscription-confirm-payment" data-sub="confirm-payment" ${!subscription.contractId||subscription.stopped?'disabled':''}>已付款，去签字</button>`:''}</div>
    ${subscription.plan.amountCents!==paymentAmountCents?'<p class="muted">付款码固定金额为200元，与当前月费不一致；请核对订阅方案或更换付款码。</p>':''}<div class="subscription-toolbar"><button type="button" data-sub="view-contract">查看契约</button><button type="button" data-sub="manage">管理</button>${latest&&!latest.disasterMemberIds?'<button type="button" data-sub="select-disaster">选择本期挡灾奴</button>':''}${paymentQr?'<button type="button" data-sub="view-payment-code">付款码</button>':''}</div>
    <section class="subscription-declaration" aria-label="契约文字"><p class="subscription-declaration-text">“协议已签署，终身生效，直至狗奴父母死亡。”</p></section>
    <dialog class="subscription-member-dialog contract-viewer"><div class="contract-viewer-header"><h3>选择本期挡灾奴</h3><button type="button" data-sub="close-members">关闭</button></div><form data-sub-form="members">${disasterSelection()}<button>保存选择</button></form></dialog>
    <dialog class="subscription-qr contract-viewer" aria-labelledby="payment-qr-title"><div class="contract-viewer-header"><h3 id="payment-qr-title">支付宝收款码</h3><button type="button" data-sub="close-payment-code">关闭</button></div><p>收款人：${escape(paymentRecipient)} · 固定金额 ¥ ${formatAmount(paymentAmountCents)}</p>${paymentQr?`<img src="${escape(paymentQr)}" alt="用户提供的支付宝收款码原图"><p><a href="${escape(paymentQr)}" download="支付宝收款码.jpg">保存付款码</a></p>`:''}<p>如果付款按钮未唤起支付宝，可保存这张图片，再到支付宝“扫一扫”中从相册选择。当前月费 ¥ ${formatAmount(subscription.plan.amountCents)}，请在支付宝核对收款人并确认金额。</p></dialog>
    <dialog class="subscription-management contract-viewer" aria-labelledby="subscription-management-title"><div class="contract-viewer-header"><h3 id="subscription-management-title">订阅管理</h3><button type="button" data-sub="close-management">关闭管理</button></div>
    <section class="subscription-agreement"><details><summary>${pending?'本笔':'当前'}确认文本</summary><p class="agreement-text">${escape(pending?.agreementText||subscriptionAgreement(subscription.plan.amountCents,subscription.plan.payee))}</p></details></section>
    <section><details class="subscription-original"><summary>历史协议原件 · 私密备查</summary><p class="muted">原件和本人的新签名保存在本机，并随账号历史私密同步 服务器；不随礼仪图片分享，也不放进文字 JSON 备份。本页月度方案不设长期固定期限；原图片保留原貌，并未涂改已有签字。</p><div id="subscription-contract" aria-live="polite">${subscription.contractId?'正在读取本机协议…':'尚未导入协议原件。'}</div><label>导入或更换协议图片（PNG / JPEG，最多 8 MB）<input id="subscription-contract-input" type="file" accept="image/png,image/jpeg"></label><button type="button" data-sub="expand-contract" ${subscription.contractId?'':'disabled'}>展开 / 收起原件</button><button type="button" data-sub="download-contract" ${subscription.contractId?'':'disabled'}>单独备份当前协议</button><p class="muted">原件的旧金额、旧期限及既有签字不自动用于本页月度确认。更换原件不会改变历史付款关联的原件。</p></details>${subscription.contractId?'':'<p class="muted">请展开历史原件并导入图片，之后才能登记付款。</p>'}</section>
    <section><h3>月度方案 · 手动付款</h3><form data-sub-form="plan"><label>每月金额（人民币，需你自行确认）<input name="amount" type="text" inputmode="decimal" maxlength="10" required value="${subscription.plan.amountCents?formatAmount(subscription.plan.amountCents):''}" placeholder="尚未确认，先留空"></label><label>收款方备注（选填，不会据此转账）<input name="payee" type="text" maxlength="2000" value="${escape(subscription.plan.payee)}" placeholder="自行填写称呼或已核对的账号"></label><p class="muted">仅保存金额和备注，不生成收款码。请在支付宝自行核对收款人并完成付款。方案修改仅影响之后的新付款记录。</p><button type="submit">保存月度方案</button></form></section>
    <section class="subscription-payment">${pending?`<p class="gold">${escape(pending.paidDate)} · ¥ ${formatAmount(pending.amountCents)} · 待签字</p>`:`<form data-sub-form="payment"><label>付款日期<input name="paidDate" type="date" value="${dayKey()}" max="${dayKey()}" required></label>${disasterSelection()}<label>备注（选填）<textarea name="note" maxlength="2000"></textarea></label><label class="check"><input name="paid" type="checkbox" required>本笔付款已由我完成</label><button type="submit" ${!subscription.plan.amountCents||!subscription.contractId||subscription.stopped?'disabled':''}>继续签字</button></form>`}</section>
    <section class="subscription-signing"><h3>手写签字</h3>${pending?`<p>${escape(pending.paidDate)} · ¥ ${formatAmount(pending.amountCents)}</p><div id="signing-contract-status" role="status">正在核对契约…</div>${pending.disasterMemberIds?'':disasterSelection()}<canvas id="subscription-signature" aria-label="本人手写签名板"></canvas><p id="signature-status" role="status">请写下本人姓名。</p><button type="button" data-sub="clear-signature">清除重写</button><label class="check"><input id="signature-consent" type="checkbox">我已核对契约及本次月度付款，确认以上为本人签名</label><button type="button" data-sub="save-signature" disabled>确认签字</button>`:`<p class="muted">${latest?'下次付款后可再次签字。':'付款完成后可签字。'}</p>`}</section>
    <section><h3>续费提示</h3><p>仅在打开应用时展示状态和日期。本版本无法保证关闭 iPhone 应用后的定时推送；可在系统提醒事项中另设中性标题。</p><button type="button" data-sub="toggle-reminder">${subscription.stopped?'恢复续费提示':'停止续费提示'}</button><p class="muted">停止仅关闭本应用的提示，不撤销已发生的支付、不处理退款，也不改变外部协议。任何实际扣款协议应在支付宝管理。</p></section>
    <section><h3>付款与签字历史</h3><p class="muted">共 ${subscription.payments.length} 笔，显示最近 20 笔。文字备份保留完整元数据及本笔确认文本；原件图片和签名请在这里单独下载。</p>${subscription.payments.slice(-20).reverse().map(payment=>`<article class="subscription-history"><h4>${escape(payment.paidDate)} · ¥ ${formatAmount(payment.amountCents)}</h4><p>${payment.status==='signed'?'已保存本人签字':'待本人签字'} · 自记未核验</p><p>本期起始 ${escape(payment.periodStart)}<br>下次续费 ${escape(payment.periodEnd)}${payment.payee?`<br>收款方备注：${escape(payment.payee)}`:''}${payment.note?`<br>备注：${escape(payment.note)}`:''}</p>${payment.signedAt?`<small>签字时间：${escape(new Date(payment.signedAt).toLocaleString())}</small>`:''}<details><summary>本笔月度确认文本</summary><p>${escape(payment.agreementText)}</p></details><div class="signature-preview" data-signature-preview="${escape(payment.id)}"></div><button type="button" data-sub="download-payment-contract" data-id="${escape(payment.id)}">备份本笔原件</button>${payment.signatureId?`<button type="button" data-sub="download-signature" data-id="${escape(payment.id)}">备份本人签名</button>`:''}</article>`).join('')||'<p class="muted">尚无付款记录。</p>'}</section>
    </dialog>
    <dialog class="subscription-payment-dialog contract-viewer" aria-labelledby="subscription-payment-title"><div class="contract-viewer-header"><h3 id="subscription-payment-title">确认付款</h3><button type="button" data-sub="close-payment">关闭</button></div><div class="subscription-payment-body"></div><p class="muted">由本人确认，未核验到账。</p></dialog>
    <dialog class="contract-connection contract-viewer"><div class="contract-viewer-header"><h3>连接 服务器 契约原件</h3><button type="button" data-sub="close-connection">关闭</button></div><p>首次查看请连接家里的 Wi-Fi，已信任证书后会自动连接 服务器；无需填写地址或密钥。读取后会保存原件到本机，之后外出也能查看。</p><button type="button" data-page="隐私">查看自动备份状态</button></dialog>
    <dialog class="contract-unlock contract-viewer" aria-labelledby="contract-unlock-title"><div class="contract-viewer-header"><h3 id="contract-unlock-title">解锁契约</h3><button type="button" data-sub="close-unlock">关闭</button></div><form data-sub-form="unlock"><label>独立查看密码<input name="password" type="password" minlength="12" maxlength="256" autocomplete="off" required></label><button type="submit">解锁并查看</button></form></dialog>
    <dialog class="contract-viewer subscription-contract-viewer" aria-labelledby="contract-viewer-title"><div class="contract-viewer-header"><h3 id="contract-viewer-title">手签契约</h3><button type="button" data-sub="close-contract" autofocus>关闭契约</button></div><div class="contract-viewer-image"></div></dialog>
  </div>`);
  const root=container.querySelector('.subscription-view');let contractAvailable=false;
  const management=root.querySelector('.subscription-management');
  const paymentDialog=root.querySelector('.subscription-payment-dialog');
  const qrDialog=root.querySelector('.subscription-qr');
  const unlockDialog=root.querySelector('.contract-unlock');
  const connectionDialog=root.querySelector('.contract-connection');
  paymentDialog.querySelector('.subscription-payment-body').append(root.querySelector('.subscription-payment'));
  if(pending)management.before(root.querySelector('.subscription-signing'));
  const viewer=root.querySelector('.subscription-contract-viewer');let viewerUrl='';
  function clearViewer(){if(viewerUrl)URL.revokeObjectURL(viewerUrl);viewerUrl='';viewer.querySelector('.contract-viewer-image').replaceChildren();}
  viewer.addEventListener('close',clearViewer);
  if(subscription.contractId)root.querySelector('.subscription-original').insertAdjacentHTML('beforeend',restoreInput(subscription.contractId,subscription.contractFingerprint,'contract'));
  for(const payment of subscription.payments.slice(-20)){
    const article=root.querySelector(`[data-signature-preview="${payment.id}"]`).closest('article');
    article.insertAdjacentHTML('beforeend',`<details><summary>恢复本笔图片备份</summary>${restoreInput(payment.contractId,payment.contractFingerprint,'contract')}${payment.signatureId?restoreInput(payment.signatureId,payment.signatureFingerprint,'signature',payment.id):''}</details>`);
  }
  async function readVerified(id,kind,fingerprint,paymentId){const asset=await getSubscriptionMedia(id);if(!asset||asset.kind!==kind||(paymentId&&asset.paymentId!==paymentId)||await mediaFingerprint(asset.blob)!==fingerprint)throw Error('对应本机图片缺失或内容不一致');return asset;}
  function appendImage(element,asset,alt){const url=URL.createObjectURL(asset.blob);urls.push(url);const image=document.createElement('img');image.src=url;image.alt=alt;element.replaceChildren(image);}
  async function paintContract(){
    if(!subscription.contractId)return;
    const element=root.querySelector('#subscription-contract');
    try{const asset=await readVerified(subscription.contractId,'contract',subscription.contractFingerprint);if(!alive)return;appendImage(element,asset,'本机订阅协议原件，不作为新签字');}catch{if(alive)element.textContent='协议原件在此浏览器缺失或内容不一致；请恢复对应图片备份。文字备份不包含图片。';}
  }
  async function paintSignatures(){
    for(const payment of subscription.payments.slice(-20)){
      if(!payment.signatureId)continue;
      const element=root.querySelector(`[data-signature-preview="${payment.id}"]`);
      try{const asset=await readVerified(payment.signatureId,'signature',payment.signatureFingerprint,payment.id);if(!alive)return;appendImage(element,asset,`${payment.paidDate} 本人手写签名`);}catch{if(alive)element.textContent='本人签名图片缺失或内容不一致，请恢复对应图片备份。';}
    }
  }
  function enableSigning(){const button=root.querySelector('[data-sub="save-signature"]');if(button)button.disabled=busy||!contractAvailable||!pad?.hasInk()||!root.querySelector('#signature-consent').checked;}
  if(pending){
    pad=createSignaturePad(root.querySelector('canvas'),{onChange:ink=>{root.querySelector('#signature-status').textContent=ink?'签名已写入；请核对并勾选本人确认。':'请手写本人姓名，点一下不算签名。';enableSigning();}});
    readVerified(pending.contractId,'contract',pending.contractFingerprint).then(()=>{if(!alive)return;contractAvailable=true;root.querySelector('#signing-contract-status').textContent='本笔协议原件已在本机找到，内容校验一致。';enableSigning();}).catch(()=>{if(alive)root.querySelector('#signing-contract-status').textContent='本笔协议原件缺失或内容不一致，暂不能签字；请恢复对应图片备份。';});
  }
  async function persistThenCommit(asset,change,{restore=false}={}){
    const previous=restore?await getSubscriptionMedia(asset.id):null;
    await saveSubscriptionMedia(asset);
    try{if(!alive)throw Error('页面已离开，未提交记录；请重新打开后操作');commit(change);}catch(error){if(previous&&alive)await saveSubscriptionMedia(previous).catch(()=>{});else await deleteSubscriptionMedia(asset.id).catch(()=>{});throw error;}
  }
  async function importPrivateContract({restore=false}={}){
    if(busy||subscription.contractId&&!restore||!getPrivateConfig()?.contractAvailable)return;busy=true;
    try{
      let blob;
      if(loadPrivateContract)blob=await loadPrivateContract();
      else{const response=await fetch('./api/private/contract',{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok||Number(response.headers.get('content-length'))>8_000_000)throw Error('私有契约暂时无法读取');blob=await response.blob();}
      await checkContract(blob);if(!alive)return;
      const fingerprint=await mediaFingerprint(blob);
      if(restore&&fingerprint!==subscription.contractFingerprint)throw Error('服务器 原件与这台手机的契约记录不一致，请在管理中恢复对应原件');
      const asset={id:restore?subscription.contractId:crypto.randomUUID(),kind:'contract',blob,fingerprint,createdAt:new Date().toISOString()};
      await persistThenCommit(asset,draft=>{if(!restore){draft.subscription.contractId=asset.id;draft.subscription.contractFingerprint=asset.fingerprint;}},{restore});
      notify('私有契约已就绪');
      return true;
    }catch(error){if(alive)notify(error.message);return false;}finally{busy=false;}
  }
  async function unlock(password){
    if(busy)return;busy=true;
    try{
      if(embeddedContract?.url!=='./assets/contract.enc.json')throw Error('内置契约尚未接入');
      const response=await fetch(embeddedContract.url,{signal:AbortSignal.timeout(15000)});
      if(!response.ok||Number(response.headers.get('content-length'))>11_000_000)throw Error('内置契约暂时无法读取');
      const text=await response.text();if(text.length>11_000_000)throw Error('内置契约格式无效');
      const blob=await unsealContract(JSON.parse(text),password);if(!alive)return;
      await checkContract(blob);const asset={id:crypto.randomUUID(),kind:'contract',blob,fingerprint:await mediaFingerprint(blob),createdAt:new Date().toISOString()};
      await persistThenCommit(asset,draft=>{draft.subscription.contractId=asset.id;draft.subscription.contractFingerprint=asset.fingerprint;});
      notify('契约已解锁');queueMicrotask(()=>container.querySelector('[data-sub="view-contract"]')?.click());
    }catch(error){notify(error.message);}finally{busy=false;}
  }
  async function change(event){
    if(event.target.id==='signature-consent'){enableSigning();return;}
    if(event.target.dataset.restoreId){
      const file=event.target.files[0];if(!file||busy)return;busy=true;
      try{
        await checkContract(file);const fingerprint=await mediaFingerprint(file);if(!alive)return;
        if(fingerprint!==event.target.dataset.restoreFingerprint)throw Error('这张图片与记录的内容指纹不一致；请选当时单独下载的原始备份');
        const asset={id:event.target.dataset.restoreId,kind:event.target.dataset.restoreKind,paymentId:event.target.dataset.paymentId,blob:file,fingerprint,createdAt:new Date().toISOString()};
        await persistThenCommit(asset,()=>{},{restore:true});notify('对应图片备份已恢复，未修改付款或签字记录');
      }catch(error){notify(error.message);}finally{busy=false;}return;
    }
    if(event.target.id!=='subscription-contract-input'||busy)return;
    const file=event.target.files[0];if(!file)return;busy=true;
    try{
      await checkContract(file);if(!alive)return;
      const asset={id:crypto.randomUUID(),kind:'contract',blob:file,fingerprint:await mediaFingerprint(file),createdAt:new Date().toISOString()};
      await persistThenCommit(asset,draft=>{draft.subscription.contractId=asset.id;draft.subscription.contractFingerprint=asset.fingerprint;});notify('协议原件已保存到本机，等待账号同步；尚未签署');
    }catch(error){notify(error.message);}finally{busy=false;}
  }
  function submit(event){
    const form=event.target;if(!form.dataset.subForm)return;event.preventDefault();event.stopPropagation();if(busy)return;
    const data=new FormData(form);const value=name=>String(data.get(name)||'');
    try{
      if(form.dataset.subForm==='unlock'){const password=value('password');form.reset();unlock(password);return;}
      if(form.dataset.subForm==='members'){const ids=data.getAll('disasterMember');if(ids.length!==2)throw Error('请选择两位挡灾奴');commit(draft=>{const payment=draft.subscription.payments.find(p=>p.id===latest?.id);if(!payment)throw Error('本期付款记录不存在');payment.disasterMemberIds=ids;});notify('本期挡灾奴已保存');return;}
      if(form.dataset.subForm==='plan'){commit(draft=>configureSubscription(draft.subscription,{amount:value('amount'),payee:value('payee')}));notify('月度方案已保存；未发起付款');}
      if(form.dataset.subForm==='payment'){
        if(!data.has('paid'))throw Error('请先在支付宝付款，再勾选本人付款确认');
        commit(draft=>recordPayment(draft.subscription,{id:crypto.randomUUID(),paidDate:value('paidDate'),note:value('note'),disasterMemberIds:data.getAll('disasterMember')},dayKey()));notify('已保存本人付款记录，请手写签字；到账尚未核实');
      }
    }catch(error){notify(error.message);}
  }
  async function click(event){
    const button=event.target.closest('[data-sub]');if(!button||busy)return;const action=button.dataset.sub;event.stopPropagation();if(action==='select-disaster'){root.querySelector('.subscription-member-dialog').showModal();return;}if(action==='close-members'){root.querySelector('.subscription-member-dialog').close();return;}
    try{
      if(action==='view-payment-code'){qrDialog.showModal();return;}
      if(action==='close-payment-code'){qrDialog.close();return;}
      if(action==='manage'){management.showModal();return;}
      if(action==='close-management'){management.close();return;}
      if(action==='close-payment'){paymentDialog.close();return;}
      if(action==='close-connection'){connectionDialog.close();return;}
      if(action==='close-unlock'){unlockDialog.querySelector('form').reset();unlockDialog.close();return;}
      if(action==='confirm-payment'){if(!subscription.contractId)throw Error('契约尚未就绪');paymentDialog.showModal();return;}
      if(action==='pay'){
        if(subscription.plan.amountCents!==paymentAmountCents)throw Error('付款码固定金额为200元，与当前月费不一致，请核对订阅方案或更换付款码');
        const target=verifiedPaymentLink(paymentLink);if(!target)throw Error('收款码尚未接入');
        location.assign(target);return;
      }
      if(action==='close-contract'){viewer.close();return;}
      if(action==='view-contract'){
        if(!subscription.contractId){if(getPrivateConfig()?.contractAvailable){if(await importPrivateContract())queueMicrotask(()=>container.querySelector('[data-sub="view-contract"]')?.click());return;}if(embeddedContract){unlockDialog.showModal();return;}if(loadPrivateContract){connectionDialog.showModal();return;}management.showModal();root.querySelector('.subscription-original').open=true;root.querySelector('.subscription-original').scrollIntoView({block:'start'});notify('尚未导入契约图片，请在“历史协议原件”中选择图片；服务器 上的契约需从 服务器 应用入口查看');return;}
        busy=true;
        let asset;
        try{asset=await readVerified(subscription.contractId,'contract',subscription.contractFingerprint);}catch(error){if(loadPrivateContract||getPrivateConfig()?.contractAvailable){busy=false;if(!getPrivateConfig()?.contractAvailable){connectionDialog.showModal();return;}if(await importPrivateContract({restore:true}))queueMicrotask(()=>container.querySelector('[data-sub="view-contract"]')?.click());return;}if(alive){management.showModal();root.querySelector('.subscription-original').open=true;root.querySelector('.subscription-original').scrollIntoView({block:'start'});}throw error;}
        if(!alive)return;
        clearViewer();viewerUrl=URL.createObjectURL(asset.blob);const image=document.createElement('img');image.src=viewerUrl;image.alt='用户提供的手签契约原图';viewer.querySelector('.contract-viewer-image').append(image);viewer.showModal();return;
      }
      if(action==='clear-signature'){pad?.clear();return;}
      if(action==='expand-contract'){root.querySelector('#subscription-contract').classList.toggle('expanded');return;}
      if(action==='toggle-reminder'){commit(draft=>{draft.subscription.stopped=!draft.subscription.stopped;});notify(subscription.stopped?'续费提示已恢复':'续费提示已停止，记录保留');return;}
      if(action==='save-signature'){
        busy=true;enableSigning();
        const blob=await pad.toBlob();if(!alive)return;
        const asset={id:crypto.randomUUID(),kind:'signature',paymentId:pending.id,blob,fingerprint:await mediaFingerprint(blob),ink:true,createdAt:new Date().toISOString()};
        const selected=pending.disasterMemberIds||[...root.querySelectorAll('[name="disasterMember"]:checked')].map(n=>n.value);if(selected.length!==2)throw Error('请选择两位挡灾奴');await persistThenCommit(asset,draft=>{const payment=draft.subscription.payments.find(p=>p.id===pending.id);payment.disasterMemberIds=selected;signPayment(draft.subscription,pending.id,asset,{confirmed:root.querySelector('#signature-consent').checked});});notify('本人签字与本期记录已保存到本机；仍为自记未核验');return;
      }
      if(['download-contract','download-payment-contract','download-signature'].includes(action)){
        const payment=subscription.payments.find(item=>item.id===button.dataset.id);const signature=action==='download-signature';
        const id=action==='download-contract'?subscription.contractId:signature?payment?.signatureId:payment?.contractId;
        const fingerprint=action==='download-contract'?subscription.contractFingerprint:signature?payment?.signatureFingerprint:payment?.contractFingerprint;
        const asset=await readVerified(id,signature?'signature':'contract',fingerprint,signature?payment?.id:undefined);if(!alive)return;
        saveBlob(asset.blob,`${signature?'本人签名':'订阅协议'}-${payment?.paidDate||dayKey()}-${asset.id}.${asset.blob.type==='image/jpeg'?'jpg':'png'}`);
      }
    }catch(error){notify(error.message);}finally{busy=false;if(alive)enableSigning();}
  }
  root.addEventListener('change',change);root.addEventListener('submit',submit);root.addEventListener('click',click);paintContract();paintSignatures();if(!loadPrivateContract)importPrivateContract();
  return ()=>{alive=false;pad?.dispose();unlockDialog.querySelector('form').reset();for(const dialog of [viewer,management,paymentDialog,unlockDialog,connectionDialog,qrDialog])if(dialog.open)dialog.close();clearViewer();viewer.removeEventListener('close',clearViewer);for(const url of urls)URL.revokeObjectURL(url);root.removeEventListener('change',change);root.removeEventListener('submit',submit);root.removeEventListener('click',click);};
}
