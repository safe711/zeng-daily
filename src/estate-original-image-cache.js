const CACHE='zeng-character-originals-v1',pending=new Map();
async function decodeOriginal(response,timeoutMs=15000){const blob=await response.blob(),url=URL.createObjectURL(blob);let timer;try{const image=new Image();image.src=url;await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('原图解码超时')),timeoutMs);})]);if(!image.naturalWidth||!image.naturalHeight)throw Error('原图内容无效');return image;}finally{clearTimeout(timer);URL.revokeObjectURL(url);}}
export function loadOriginalImage(url,{timeoutMs=15000}={}){
 const key=new URL(url,import.meta.url).href;if(pending.has(key))return pending.get(key);
 const job=(async()=>{let storage,saved;try{if('caches'in globalThis){storage=await caches.open(CACHE);saved=await storage.match(key);}}catch{}
  if(saved){try{return await decodeOriginal(saved,timeoutMs);}catch{try{await storage?.delete(key);}catch{}}}
  let failure;for(let attempt=0;attempt<2;attempt++){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const response=await fetch(key,{cache:'no-cache',signal:controller.signal});if(!response.ok)throw Error('原图加载失败：'+response.status);const copy=response.clone(),image=await decodeOriginal(response,timeoutMs);if(storage)storage.put(key,copy).catch(()=>{});return image;}catch(error){failure=error;}finally{clearTimeout(timer);}if(attempt===0)await new Promise(resolve=>setTimeout(resolve,250));}throw failure;
 })();pending.set(key,job);const release=()=>{if(pending.get(key)===job)pending.delete(key);};job.then(release,release);return job;
}
