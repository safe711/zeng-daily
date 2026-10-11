const iterations=310000;
const limit=8_000_000;
const toBase64=bytes=>{let text='';for(const value of bytes)text+=String.fromCharCode(value);return btoa(text);};
function fromBase64(value){
  if(typeof value!=='string'||value.length>11_000_000||!value.length||value.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw Error('加密契约格式无效');
  try{return Uint8Array.from(atob(value),character=>character.charCodeAt(0));}catch{throw Error('加密契约格式无效');}
}
async function derive(password,salt,usage){
  if(typeof password!=='string'||password.length<12||password.length>256)throw Error('查看密码须为 12 至 256 个字符');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,{name:'AES-GCM',length:256},false,[usage]);
}
export function validateSealedContract(envelope){
  if(!envelope||envelope.version!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==iterations||!['image/png','image/jpeg'].includes(envelope.type))throw Error('加密契约格式无效');
  const salt=fromBase64(envelope.salt),iv=fromBase64(envelope.iv),ciphertext=fromBase64(envelope.ciphertext);
  if(salt.length!==16||iv.length!==12||ciphertext.length<=16||ciphertext.length>limit+16)throw Error('加密契约格式无效');
  if(Object.keys(envelope).some(key=>!['version','kdf','iterations','type','salt','iv','ciphertext'].includes(key)))throw Error('加密契约包含不允许的字段');
  return {salt,iv,ciphertext};
}
export async function sealContract(blob,password){
  if(!(blob instanceof Blob)||!['image/png','image/jpeg'].includes(blob.type)||!blob.size||blob.size>limit)throw Error('契约图片无效');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await derive(password,salt,'encrypt');
  const additionalData=new TextEncoder().encode(`daily-contract-v1:${blob.type}`);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData},key,await blob.arrayBuffer()));
  return {version:1,kdf:'PBKDF2-SHA256',iterations,type:blob.type,salt:toBase64(salt),iv:toBase64(iv),ciphertext:toBase64(ciphertext)};
}
export async function unsealContract(envelope,password){
  const {salt,iv,ciphertext}=validateSealedContract(envelope);const key=await derive(password,salt,'decrypt');
  const additionalData=new TextEncoder().encode(`daily-contract-v1:${envelope.type}`);
  try{return new Blob([await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData},key,ciphertext)],{type:envelope.type});}catch{throw Error('查看密码不正确，或加密契约已损坏');}
}
