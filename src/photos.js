import {validDate,RITUAL_KINDS} from './model.js';
let database;
let mediaAccount=null;
export function setMediaAccount(id){if(id!==null&&!/^(?:ZENG-(?:DS|DZ)-\d{3}|OWNERTEST|ZENG_OWNER_\d{3})$/.test(id))throw Error('账号编号无效');if(id===mediaAccount)return;resetPhotoUploads();const prior=database;database=undefined;mediaAccount=id;prior?.then(db=>db.close()).catch(()=>{});}
let photoGeneration=0;
export function resetPhotoUploads(){photoGeneration++;}
export const mediaGeneration=()=>photoGeneration;
export const photoFingerprint=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
export function photoPath(photo){
  if(!validDate(photo.date)||!RITUAL_KINDS.includes(photo.kind)||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(photo.id))throw Error('照片日期、礼仪或编号无效');
  return `日课请安/${photo.date}-${photo.kind}-${photo.id}.jpg`;
}
function openDatabase() {
  if(!database)database=new Promise((resolve,reject)=>{
    const request=indexedDB.open(mediaAccount?'daily-photos:'+mediaAccount:'daily-photos',4);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('photos'))request.result.createObjectStore('photos',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('reports'))request.result.createObjectStore('reports',{keyPath:'date'});
      if(!request.result.objectStoreNames.contains('subscriptionMedia'))request.result.createObjectStore('subscriptionMedia',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('shoePhotos'))request.result.createObjectStore('shoePhotos',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('shoeReports'))request.result.createObjectStore('shoeReports',{keyPath:'recordId'});
    };
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=undefined;};resolve(request.result);};
    request.onerror=()=>{database=undefined;reject(Error('照片存储无法打开'));};
    request.onblocked=()=>{database=undefined;reject(Error('请关闭其他日课窗口后重试'));};
  });
  return database;
}
async function operation(mode,action,storeName='photos',epoch,emit=true) {
  const db=await openDatabase();
  if(epoch!==undefined&&epoch!==photoGeneration)throw Error('本机数据已清空，旧图片保存已取消');
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(storeName,mode);
    const request=action(transaction.objectStore(storeName));
    transaction.oncomplete=()=>{if(mode==='readwrite'&&emit)globalThis.dispatchEvent?.(new Event('daily-media-saved'));resolve(request.result);};
    transaction.onerror=()=>reject(Error('照片保存失败，可能存储空间不足'));
    transaction.onabort=()=>reject(Error('照片存储操作未完成'));
  });
}
export const savePhoto=photo=>operation('readwrite',store=>store.put(photo));
export const deletePhoto=id=>operation('readwrite',store=>store.delete(id));
export const getPhoto=id=>operation('readonly',store=>store.get(id));
export const listPhotos=()=>operation('readonly',store=>store.getAll());
export const clearPhotos=()=>{resetPhotoUploads();return operation('readwrite',store=>store.clear());};
export const saveReport=report=>operation('readwrite',store=>store.put(report),'reports');
export const getReport=date=>operation('readonly',store=>store.get(date),'reports');
export const listReports=()=>operation('readonly',store=>store.getAll(),'reports');
export const saveSubscriptionMedia=asset=>operation('readwrite',store=>store.put(asset),'subscriptionMedia');
export const listSubscriptionMedia=()=>operation('readonly',store=>store.getAll(),'subscriptionMedia');
export const getSubscriptionMedia=id=>operation('readonly',store=>store.get(id),'subscriptionMedia');
export const deleteSubscriptionMedia=id=>operation('readwrite',store=>store.delete(id),'subscriptionMedia');
export const saveShoePhoto=photo=>operation('readwrite',store=>store.put(photo),'shoePhotos',photoGeneration);
export const getShoePhoto=id=>operation('readonly',store=>store.get(id),'shoePhotos');
export const listShoePhotos=()=>operation('readonly',store=>store.getAll(),'shoePhotos');
export const deleteShoePhoto=id=>operation('readwrite',store=>store.delete(id),'shoePhotos');
export const saveShoeReport=report=>operation('readwrite',store=>store.put(report),'shoeReports',photoGeneration);
export const getShoeReport=id=>operation('readonly',store=>store.get(id),'shoeReports');
export const listShoeReports=()=>operation('readonly',store=>store.getAll(),'shoeReports');
export async function clearMedia(){
  resetPhotoUploads();
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{const names=['photos','reports','subscriptionMedia','shoePhotos','shoeReports'];const transaction=db.transaction(names,'readwrite');for(const name of names)transaction.objectStore(name).clear();transaction.oncomplete=resolve;transaction.onerror=()=>reject(Error('本机图片清除失败'));transaction.onabort=transaction.onerror;});
}
export async function latestRitualPhoto(date,kind) {
  return (await listPhotos()).filter(photo=>photo.date===date&&photo.kind===kind).sort((first,second)=>second.createdAt.localeCompare(first.createdAt))[0] || null;
}
export async function capturePhoto(video,date,kind='morning',{persist=true}={}) {
  const epoch=photoGeneration;
  if(!video.videoWidth || !video.videoHeight)throw Error('相机画面尚未就绪，请稍后再拍');
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
  const context=canvas.getContext('2d');
  if(!context)throw Error('无法处理相机画面');
  context.drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
  if(!blob || !blob.size || blob.size>8_000_000)throw Error('照片处理失败或过大，请重拍');
  if(epoch!==photoGeneration)throw Error('本机数据已清空，旧拍照操作已取消');
  const photo={id:crypto.randomUUID(),date,kind,source:'camera',createdAt:new Date().toISOString(),blob,status:'pending',remotePath:'',error:''};
  if(persist)await savePhoto(photo);
  return photo;
}
export async function syncPhoto(photo,token,{fetcher=fetch,persist=savePhoto}={}) {
  if(photo.status==='uploaded')return photo;
  const expected=photoPath(photo);
  if(!(photo.blob instanceof Blob)||photo.blob.type!=='image/jpeg'||!photo.blob.size||photo.blob.size>8_000_000)throw Error('照片内容无效或超过 8 MB');
  const epoch=photoGeneration;
  let uploaded;
  try {
    if(!token)throw Error('服务器 连接密钥尚未填写');
    const fingerprint=await photoFingerprint(photo.blob);
    if(epoch!==photoGeneration)return null;
    const response=await fetcher(`./api/nas/photos?date=${encodeURIComponent(photo.date)}&kind=${encodeURIComponent(photo.kind)}&id=${encodeURIComponent(photo.id)}`,{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'image/jpeg','Authorization':`Bearer ${token}`,'X-Photo-Fingerprint':fingerprint},body:photo.blob,signal:AbortSignal.timeout(30000)});
    const result=await response.json();
    if(!response.ok||result.uploaded!==true||result.path!==expected||result.fingerprint!==fingerprint)throw Error(result.error||'服务器 未确认照片内容与保存目录');
    uploaded={...photo,status:'uploaded',remotePath:result.path,fingerprint,error:''};
  }catch(error){
    if(epoch===photoGeneration)await persist({...photo,status:'pending',error:error.name==='TimeoutError'?'连接超时，可稍后重试':error.message});
    throw error;
  }
  if(epoch!==photoGeneration)return null;
  await persist(uploaded);
  return uploaded;
}

export async function deleteTaskMedia({taskId,recordIds,shoePhotoIds,taskMediaIds}){
 const db=await openDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['shoePhotos','shoeReports','subscriptionMedia'],'readwrite');
  const sets={shoePhotos:new Set(shoePhotoIds),shoeReports:new Set(recordIds),subscriptionMedia:new Set(taskMediaIds)};
  for(const name of Object.keys(sets)){const request=tx.objectStore(name).openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const asset=cursor.value;if(sets[name].has(cursor.primaryKey)||(name==='subscriptionMedia'&&['task-photo','task-report'].includes(asset.role)&&asset.taskId===taskId)||(name!=='subscriptionMedia'&&recordIds.includes(asset.recordId)))cursor.delete();cursor.continue();};}
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Error('任务已删除，本机关联图片清理未完成；服务器 备份保留'));
 });
}

export async function exportMedia(){const names=['photos','reports','subscriptionMedia','shoePhotos','shoeReports'];const assets=[];for(const store of names){for(const a of await operation('readonly',s=>s.getAll(),store)){const {blob,...meta}=a;if(blob)assets.push({store,meta,blob});}}return assets;}
export async function importMedia(assets,{notify=true}={}){for(const a of assets){if(!['photos','reports','subscriptionMedia','shoePhotos','shoeReports'].includes(a.store)||!a.blob)throw Error('媒体恢复格式无效');await operation('readwrite',s=>s.put({...a.meta,blob:a.blob}),a.store,undefined,notify);}}
