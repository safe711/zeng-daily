const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const identifierPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const stampPattern=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const fingerprintPattern=/^[a-f0-9]{64}$/;
export function subscriptionDefaults(){return {plan:{amountCents:20000,payee:''},contractId:'',contractFingerprint:'',stopped:false,payments:[]};}
export async function mediaFingerprint(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),value=>value.toString(16).padStart(2,'0')).join('');}
export const AGREEMENT_VERSION='monthly-personal-v1';
export function subscriptionAgreement(amountCents,payee=''){
  return `月度订阅确认书\n\n月度金额：人民币 ${formatAmount(amountCents)} 元。${payee?`\n收款方备注：${payee}。`:''}\n\n本人自愿以自身名义登记本次月度付款。付款由本人在支付宝核对收款人和金额后主动完成，本应用不发起转账、不自动扣款、不核实收款方到账。\n\n每次手动付款并保存本人签字后，在应用中登记一个日历月。提前续费接续上一期；逾期付款从实际付款日重新起算。续费金额与日期在页面单独显示，下一次付款仍由本人主动确认。\n\n本页月度方案不设长期固定期限；本人可以停止以后的续费提示与付款。停止提示不撤销已经发生的付款、不自动退款，也不修改应用之外的任何原件。\n\n本人仅确认自己的付款记录，不代表父母或任何第三方签署。本页面不声称能够承接或改变现实灾祸，不验证身份，也不判定外部协议的法律效力。\n\n原始协议图片仅作为历史原件备查，其旧金额、期限及原有签字不自动用于本次月度确认。本人手写签名另行保存，并与此次付款及本页文本版本关联。`;
}
function isDate(value){return typeof value==='string'&&datePattern.test(value)&&!value.startsWith('0000')&&Number.isFinite(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;}
function isStamp(value){return typeof value==='string'&&stampPattern.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;}
function isText(value){return typeof value==='string'&&value.length<=2000;}
export function parseAmount(value){
  if(typeof value!=='string'||!/^\d{1,6}(\.\d{1,2})?$/.test(value.trim()))throw Error('金额须为大于零的人民币金额，最多两位小数');
  const [whole,fraction='']=value.trim().split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(cents<=0||cents>100_000_000)throw Error('金额超出允许范围');
  return cents;
}
export const formatAmount=cents=>(cents/100).toFixed(2);
export function nextMonth(date,anchorDay=Number(date.slice(8))){
  if(!isDate(date)||!Number.isInteger(anchorDay)||anchorDay<1||anchorDay>31)throw Error('续费日期无效');
  const year=Number(date.slice(0,4));const month=Number(date.slice(5,7));
  const targetYear=month===12?year+1:year;const targetMonth=month===12?1:month+1;
  if(targetYear>9999)throw Error('续费日期超出范围');
  const lastDay=new Date(`${String(targetYear).padStart(4,'0')}-${String(targetMonth).padStart(2,'0')}-01T12:00:00Z`);
  lastDay.setUTCMonth(lastDay.getUTCMonth()+1);lastDay.setUTCDate(0);
  return `${String(targetYear).padStart(4,'0')}-${String(targetMonth).padStart(2,'0')}-${String(Math.min(anchorDay,lastDay.getUTCDate())).padStart(2,'0')}`;
}
export function validateSubscription(subscription){
  if(!subscription||!subscription.plan||!Number.isSafeInteger(subscription.plan.amountCents)||subscription.plan.amountCents<0||subscription.plan.amountCents>100_000_000||!isText(subscription.plan.payee)||(subscription.contractId!==''&&!identifierPattern.test(subscription.contractId))||(subscription.contractId? !fingerprintPattern.test(subscription.contractFingerprint):subscription.contractFingerprint!=='')||typeof subscription.stopped!=='boolean'||!Array.isArray(subscription.payments)||subscription.payments.length>10000)throw Error('订阅数据无效');
  const ids=new Set();let pending=0;
  for(const payment of subscription.payments){
    if(!payment||!identifierPattern.test(payment.id)||ids.has(payment.id)||!isDate(payment.paidDate)||!isStamp(payment.recordedAt)||!Number.isSafeInteger(payment.amountCents)||payment.amountCents<=0||payment.amountCents>100_000_000||!isText(payment.payee)||!isText(payment.note)||!identifierPattern.test(payment.contractId)||!fingerprintPattern.test(payment.contractFingerprint)||!isDate(payment.periodStart)||!isDate(payment.periodEnd)||payment.periodStart<payment.paidDate||payment.periodEnd!==nextMonth(payment.periodStart,payment.anchorDay)||!Number.isInteger(payment.anchorDay)||payment.anchorDay<1||payment.anchorDay>31||!['pending-signature','signed'].includes(payment.status)||payment.verification!=='self-reported'||payment.agreementVersion!==AGREEMENT_VERSION||payment.agreementText!==subscriptionAgreement(payment.amountCents,payment.payee))throw Error('付款记录无效');
    if(payment.disasterMemberIds!==undefined&&(!Array.isArray(payment.disasterMemberIds)||payment.disasterMemberIds.length!==2||new Set(payment.disasterMemberIds).size!==2||payment.disasterMemberIds.some(id=>!['ZENG-DZ-001','ZENG-DZ-002'].includes(id))))throw Error('请选择两位挡灾奴');
    if(payment.status==='signed'){
      if(!identifierPattern.test(payment.signatureId)||!fingerprintPattern.test(payment.signatureFingerprint)||!isStamp(payment.signedAt)||payment.signedAt<payment.recordedAt||payment.confirmation!=='self-only-v1')throw Error('签字记录无效');
    }else{pending++;if(payment.signatureId!==''||payment.signatureFingerprint!==''||payment.signedAt!==''||payment.confirmation!=='')throw Error('未签字记录无效');}
    ids.add(payment.id);
  }
  if(pending>1)throw Error('存在多条未签字付款');
  return subscription;
}
export function configureSubscription(subscription,{amount,payee}){
  subscription.plan={amountCents:parseAmount(amount),payee:String(payee).trim()};validateSubscription(subscription);
}
export function recordPayment(subscription,{id,paidDate,note='',disasterMemberIds,now=new Date()},today){
  validateSubscription(subscription);
  if(!isDate(today)||!isDate(paidDate)||paidDate>today)throw Error('请选择不晚于今天的实际付款日期');
  if(subscriptionStatus(subscription,today).active)throw Error('订阅中，本期到期后再付款');
  if(subscription.stopped)throw Error('请先恢复续费提示');
  if(!subscription.plan.amountCents)throw Error('请先设置并确认每月金额');
  if(!subscription.contractId)throw Error('请先导入协议原件');
  if(subscription.payments.some(payment=>payment.status==='pending-signature'))throw Error('请先完成上一笔付款的本人签字');
  if(subscription.payments.some(payment=>payment.id===id))throw Error('此笔付款已记录');
  const latest=subscription.payments.filter(payment=>payment.status==='signed').at(-1);
  if(latest&&paidDate<latest.paidDate)throw Error('新增付款日期不能早于上一笔付款');
  const continued=latest&&latest.periodEnd>=paidDate;
  const periodStart=continued?latest.periodEnd:paidDate;
  const anchorDay=continued?latest.anchorDay:Number(paidDate.slice(8));
  const payment={id,paidDate,note:String(note).trim(),recordedAt:now.toISOString(),amountCents:subscription.plan.amountCents,payee:subscription.plan.payee,contractId:subscription.contractId,contractFingerprint:subscription.contractFingerprint,agreementVersion:AGREEMENT_VERSION,agreementText:subscriptionAgreement(subscription.plan.amountCents,subscription.plan.payee),periodStart,periodEnd:nextMonth(periodStart,anchorDay),anchorDay,status:'pending-signature',verification:'self-reported',signatureId:'',signatureFingerprint:'',signedAt:'',confirmation:''};
  if(disasterMemberIds!==undefined)payment.disasterMemberIds=disasterMemberIds;
  validateSubscription({...subscription,payments:[...subscription.payments,payment]});subscription.payments.push(payment);
  return payment;
}
export function signPayment(subscription,id,asset,{confirmed=false,now=new Date()}={}){
  const payment=subscription.payments.find(item=>item.id===id);
  if(!payment||payment.status!=='pending-signature')throw Error('没有待签字付款，或此笔已签字');
  if(!confirmed)throw Error('请确认仅以本人身份登记此次付款，不代任何第三方签字');
  if(!asset||asset.kind!=='signature'||asset.paymentId!==id||!identifierPattern.test(asset.id)||!fingerprintPattern.test(asset.fingerprint)||!(asset.blob instanceof Blob)||asset.blob.type!=='image/png'||!asset.blob.size||asset.blob.size>8_000_000||asset.ink!==true)throw Error('请先手写本人签名');
  const signed={...payment,status:'signed',signatureId:asset.id,signatureFingerprint:asset.fingerprint,signedAt:now.toISOString(),confirmation:'self-only-v1'};
  validateSubscription({...subscription,payments:subscription.payments.map(item=>item.id===id?signed:item)});
  Object.assign(payment,signed);return payment;
}
export function subscriptionStatus(subscription,today){
  if(!isDate(today))throw Error('当前日期无效');
  const signed=subscription.payments.filter(payment=>payment.status==='signed');
  const pending=subscription.payments.find(payment=>payment.status==='pending-signature');
  const latest=signed.at(-1);const active=signed.some(payment=>payment.periodStart<=today&&payment.periodEnd>today);
  const renewalDate=latest?.periodEnd||'';
  const remainingDays=renewalDate?Math.round((Date.parse(`${renewalDate}T12:00:00Z`)-Date.parse(`${today}T12:00:00Z`))/86400000):null;
  let code=active?(remainingDays<=3?'due-soon':'active'):latest?(today>=renewalDate?'expired':'scheduled'):'not-started';
  if(!subscription.plan.amountCents)code='not-configured';
  if(pending)code='pending-signature';
  if(subscription.stopped)code='stopped';
  const labels={'not-configured':'尚未设置','not-started':'尚未登记付款','pending-signature':'已自记付款 · 待本人签字',active:'本期已登记（自记）','due-soon':'本期即将到期（自记）',expired:'本期已到期（自记）',scheduled:'下一期已登记（自记）',stopped:'已停止续费提示'};
  return {code,label:labels[code],renewalDate,remainingDays,pending,latest,active};
}
