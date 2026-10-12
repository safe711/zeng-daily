import {photoIds} from './tasks.js';
import {validDate,validMediaId} from './model.js';
import {mediaGeneration,photoFingerprint,saveShoePhoto,getShoeReport,listShoePhotos,listShoeReports,saveShoeReport} from './photos.js';
import {SHOE_ALBUM,shoeDirectory,shoePhotoPath,shoeReportPath} from './taskfiles.js';
export {SHOE_ALBUM,shoeDirectory,shoePhotoPath,shoeReportPath};
const queues=new Map();
function enqueue(key,action){
  const previous=queues.get(key)||Promise.resolve();const pending=previous.catch(()=>{}).then(action);queues.set(key,pending);
  return pending.finally(()=>{if(queues.get(key)===pending)queues.delete(key);});
}
export const shoeRecordKey=record=>JSON.stringify([record.id,record.taskTitle,record.date,record.note,record.savedAt,record.taskDetails,record.shoes.map(shoe=>[shoe.id,photoIds(shoe,'before'),photoIds(shoe,'after'),shoe.completedAt])]);
export async function decodeShoeImage(blob){
  const url=URL.createObjectURL(blob);const image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('无法读取照片，请改选 JPEG 或 PNG 图片'));image.src=url;});return {image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(url)};}
  catch(error){URL.revokeObjectURL(url);throw error;}
}
export async function importShoePhoto(file,metadata,{decode=decodeShoeImage,canvas=()=>document.createElement('canvas'),persist=saveShoePhoto}={}){
  shoePhotoPath({...metadata,id:'12345678-1234-4234-8234-123456789abc'});
  if(!(file instanceof Blob)||!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)||!file.size||file.size>20_000_000)throw Error('请选择不超过 20 MB 的照片，不支持此文件类型');
  const epoch=mediaGeneration();const decoded=await decode(file);
  try{
    if(!decoded.width||!decoded.height||decoded.width*decoded.height>40_000_000)throw Error('照片尺寸过大或无法读取');
    const surface=canvas();const scale=Math.min(1,1600/Math.max(decoded.width,decoded.height));surface.width=Math.round(decoded.width*scale);surface.height=Math.round(decoded.height*scale);
    const context=surface.getContext('2d');if(!context)throw Error('无法处理照片');context.fillStyle='#fff';context.fillRect(0,0,surface.width,surface.height);context.drawImage(decoded.image,0,0,surface.width,surface.height);
    const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/jpeg',.88));
    if(!blob||blob.type!=='image/jpeg'||!blob.size||blob.size>8_000_000)throw Error('照片处理失败，请换一张照片');
    if(epoch!==mediaGeneration())throw Error('本机数据已清空，旧照片操作已取消');
    const photo={...metadata,id:crypto.randomUUID(),blob,createdAt:new Date().toISOString(),status:'pending',remotePath:'',error:''};await persist(photo);return photo;
  }finally{decoded.close();}
}
async function syncAsset(asset,token,report,{fetcher=fetch,persist=report?saveShoeReport:saveShoePhoto}={}){
  const path=report?shoeReportPath(asset):shoePhotoPath(asset);const type=report?'image/png':'image/jpeg';
  if(!(asset.blob instanceof Blob)||asset.blob.type!==type||!asset.blob.size||asset.blob.size>8_000_000)throw Error('洗鞋图片无效或超过 8 MB');
  if(asset.status==='uploaded')return asset;
  const epoch=mediaGeneration();
  try{
    if(!token)throw Error('服务器 上传尚未连接，图片已保存在本机');
    const fingerprint=await photoFingerprint(asset.blob);if(epoch!==mediaGeneration())return null;
    const parameters=new URLSearchParams({date:asset.date,record:asset.recordId});if(asset.taskName)parameters.set('name',asset.taskName);
    if(!report){parameters.set('shoe',asset.shoeId);parameters.set('phase',asset.phase);parameters.set('id',asset.id);}
    const response=await fetcher(`./api/nas/shoes/${report?'reports':'photos'}?${parameters}`,{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':type,'Authorization':`Bearer ${token}`,'X-Shoe-Fingerprint':fingerprint},body:asset.blob,signal:AbortSignal.timeout(90000)});
    const result=await response.json();if(!response.ok||result.uploaded!==true||result.path!==path||result.fingerprint!==fingerprint)throw Error(result.error||'服务器 未确认洗鞋图片内容与目录');
    if(epoch!==mediaGeneration())return null;
    const updated={...asset,fingerprint,status:'uploaded',remotePath:result.path,error:''};await persist(updated);return updated;
  }catch(error){if(epoch===mediaGeneration())await persist({...asset,status:'pending',error:error.message});throw error;}
}
export function syncShoePhoto(photo,token,options){const epoch=mediaGeneration();const key=`photo:${photo.id}`;if(queues.has(key))return Promise.resolve(null);return enqueue(key,()=>epoch===mediaGeneration()?syncAsset(photo,token,false,options):null);}
export function archiveShoeCard(prepared,token,{upload=true,read=getShoeReport,persist=saveShoeReport,fetcher=fetch}={}){
  const epoch=mediaGeneration();const record=prepared.record;
  if(!record.savedAt)return Promise.reject(Error('请先保存完整的洗鞋记录'));
  if(!(prepared.file instanceof Blob)||prepared.file.type!=='image/png'||!prepared.file.size||prepared.file.size>8_000_000)return Promise.reject(Error('洗鞋截图无效或超过 8 MB'));
  return enqueue(`report:${record.id}`,async()=>{
    if(epoch!==mediaGeneration())return null;
    const fingerprint=await photoFingerprint(prepared.file);const sourceKey=shoeRecordKey(record);const existing=await read(record.id);
    if(epoch!==mediaGeneration())return null;
    const report=existing?.fingerprint===fingerprint&&existing.sourceKey===sourceKey?existing:{recordId:record.id,date:record.date,taskName:record.taskTitle,sourceKey,blob:prepared.file,fingerprint,status:'pending',remotePath:'',error:''};
    if(report!==existing)await persist(report);
    if(epoch!==mediaGeneration())return null;
    return upload?syncAsset(report,token,true,{persist,fetcher}):report;
  });
}
export async function syncPendingShoeMedia(token,{records=()=>[],photos=listShoePhotos,reports=listShoeReports,read=getShoeReport,photoPersist=saveShoePhoto,reportPersist=saveShoeReport,fetcher=fetch}={}){
  const epoch=mediaGeneration();const totals={photos:0,reports:0,failed:0};
  const references=()=>new Set(records().flatMap(record=>record.shoes.flatMap(shoe=>[...photoIds(shoe,'before'),...photoIds(shoe,'after')]).filter(Boolean)));
  for(const photo of await photos()){
    if(epoch!==mediaGeneration())return totals;if(photo.status==='uploaded'||!references().has(photo.id))continue;
    try{if(await syncShoePhoto({...photo,taskName:photo.taskName||records().find(r=>r.id===photo.recordId)?.taskTitle},token,{persist:photoPersist,fetcher}))totals.photos++;}catch{totals.failed++;}
  }
  for(const report of await reports()){
    if(epoch!==mediaGeneration())return totals;if(report.status==='uploaded')continue;
    try{const uploaded=await enqueue(`report:${report.recordId}`,async()=>{
      const latest=await read(report.recordId);const record=records().find(item=>item.id===report.recordId);
      if(epoch!==mediaGeneration()||!latest||latest.status==='uploaded'||!record?.savedAt||latest.sourceKey!==shoeRecordKey(record))return null;
      return syncAsset({...latest,taskName:latest.taskName||record.taskTitle},token,true,{persist:reportPersist,fetcher});
    });if(uploaded)totals.reports++;}catch{totals.failed++;}
  }
  return totals;
}
