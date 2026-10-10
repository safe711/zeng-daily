let database;
function openDatabase() {
  if(!database)database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('daily-photos',3);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('photos'))request.result.createObjectStore('photos',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('reports'))request.result.createObjectStore('reports',{keyPath:'date'});
      if(!request.result.objectStoreNames.contains('subscriptionMedia'))request.result.createObjectStore('subscriptionMedia',{keyPath:'id'});
    };
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=undefined;};resolve(request.result);};
    request.onerror=()=>{database=undefined;reject(Error('照片存储无法打开'));};
    request.onblocked=()=>{database=undefined;reject(Error('请关闭其他日课窗口后重试'));};
  });
  return database;
}
async function operation(mode,action,storeName='photos') {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(storeName,mode);
    const request=action(transaction.objectStore(storeName));
    transaction.oncomplete=()=>resolve(request.result);
    transaction.onerror=()=>reject(Error('照片保存失败，可能存储空间不足'));
    transaction.onabort=()=>reject(Error('照片存储操作未完成'));
  });
}
export const savePhoto=photo=>operation('readwrite',store=>store.put(photo));
export const getPhoto=id=>operation('readonly',store=>store.get(id));
export const listPhotos=()=>operation('readonly',store=>store.getAll());
export const clearPhotos=()=>operation('readwrite',store=>store.clear());
export const saveReport=report=>operation('readwrite',store=>store.put(report),'reports');
export const getReport=date=>operation('readonly',store=>store.get(date),'reports');
export const listReports=()=>operation('readonly',store=>store.getAll(),'reports');
export const saveSubscriptionMedia=asset=>operation('readwrite',store=>store.put(asset),'subscriptionMedia');
export const getSubscriptionMedia=id=>operation('readonly',store=>store.get(id),'subscriptionMedia');
export const deleteSubscriptionMedia=id=>operation('readwrite',store=>store.delete(id),'subscriptionMedia');
export async function clearMedia(){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{const names=['photos','reports','subscriptionMedia'];const transaction=db.transaction(names,'readwrite');for(const name of names)transaction.objectStore(name).clear();transaction.oncomplete=resolve;transaction.onerror=()=>reject(Error('本机图片清除失败'));transaction.onabort=transaction.onerror;});
}
export async function latestRitualPhoto(date,kind) {
  return (await listPhotos()).filter(photo=>photo.date===date&&photo.kind===kind).sort((first,second)=>second.createdAt.localeCompare(first.createdAt))[0] || null;
}
export async function capturePhoto(video,date,kind='morning') {
  if(!video.videoWidth || !video.videoHeight)throw Error('相机画面尚未就绪，请稍后再拍');
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
  const context=canvas.getContext('2d');
  if(!context)throw Error('无法处理相机画面');
  context.drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
  if(!blob || !blob.size || blob.size>8_000_000)throw Error('照片处理失败或过大，请重拍');
  const photo={id:crypto.randomUUID(),date,kind,source:'camera',createdAt:new Date().toISOString(),blob,status:'pending',remotePath:'',error:''};
  await savePhoto(photo);
  return photo;
}
export async function syncPhoto(photo,token,{fetcher=fetch,persist=savePhoto}={}) {
  if(photo.status==='uploaded')return photo;
  let uploaded;
  try {
    if(!token)throw Error('NAS 连接密钥尚未填写');
    const response=await fetcher(`./api/nas/photos?date=${encodeURIComponent(photo.date)}&kind=${encodeURIComponent(photo.kind)}&id=${encodeURIComponent(photo.id)}`,{method:'POST',headers:{'Content-Type':'image/jpeg','Authorization':`Bearer ${token}`},body:photo.blob,signal:AbortSignal.timeout(30000)});
    const result=await response.json();
    if(!response.ok || result.uploaded!==true || typeof result.path!=='string')throw Error(result.error || 'NAS 上传未成功');
    uploaded={...photo,status:'uploaded',remotePath:result.path,error:''};
  }catch(error){
    await persist({...photo,status:'pending',error:error.name==='TimeoutError'?'连接超时，可稍后重试':error.message});
    throw error;
  }
  await persist(uploaded);
  return uploaded;
}
