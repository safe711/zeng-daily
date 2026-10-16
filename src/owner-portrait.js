import {fetchAccountServer} from './server.js';
const CACHE='daily-owner-portrait-v1',KEY=new URL('./owner-login-portrait',import.meta.url).href;
let ready=null,pending=null;
async function decodePortrait(blob){
 const bytes=new Uint8Array(await blob.slice(0,3).arrayBuffer());
 if(!blob.size||blob.size>8000000||blob.type!=='image/jpeg'||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error('主子头像内容无效');
 const url=URL.createObjectURL(blob),image=new Image();image.src=url;
 try{await image.decode();}catch(error){URL.revokeObjectURL(url);throw error;}
 return {blob,url};
}
// Cache only this shared display portrait; never use account/private-photo databases.
export async function preloadOwnerPortrait(load){
 if(ready)return ready;
 if(pending){try{const result=await pending;if(result||!load)return result;}catch(error){if(!load)throw error;}}
 pending=(async()=>{
  let cache;try{cache=await caches.open(CACHE);const saved=await cache.match(KEY);if(saved){try{return ready=await decodePortrait(await saved.blob());}catch{await cache.delete(KEY);}}}catch{}
  if(!load)return null;
  const portrait=await decodePortrait(await load());
  try{await cache?.put(KEY,new Response(portrait.blob,{headers:{'Content-Type':'image/jpeg'}}));}catch{}
  return ready=portrait;
 })();try{return await pending;}finally{pending=null;}
}

export async function preloadOwnerForAccount(account){return preloadOwnerPortrait(async()=>{const response=await fetchAccountServer('/api/account/owner-portrait',{method:'POST',credentials:'omit',redirect:'error',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({account})},{timeout:20000});if(!response.ok)throw Error('头像暂不可用');return response.blob();});}
