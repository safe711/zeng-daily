export const paymentLink='https://qr.alipay.com/fkx14183eygj8nwfry2rn6b';
export const paymentQr='./assets/payment-qr.jpg';
export const paymentRecipient='Zenith（*仪）';
export const embeddedContract=null;
export const pushService=null;

export function verifiedPaymentLink(value){
  if(!value)return '';
  let target;try{target=new URL(value);}catch{throw Error('收款链接无效');}
  if(target.protocol!=='https:'||target.hostname!=='qr.alipay.com'||target.port||target.username||target.password||target.hash||!/^\/[A-Za-z0-9_-]{6,200}$/.test(target.pathname)||target.search)throw Error('仅接受已核对的支付宝官方收款链接');
  return target.href;
}
