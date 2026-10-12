import {saveReport,getReport,listReports} from './photos.js';
import {validDate} from './model.js';
export const reportFingerprint=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const queues=new Map();
let generation=0;
export function resetReportQueue(){generation++;}
function enqueue(date,action){
  const previous=queues.get(date)||Promise.resolve();
  const pending=previous.catch(()=>{}).then(action);queues.set(date,pending);
  return pending.finally(()=>{if(queues.get(date)===pending)queues.delete(date);});
}
export async function syncReport(report,token,{fetcher=fetch,persist=saveReport}={}){
  if(!validDate(report.date)||!(report.blob instanceof Blob)||report.blob.type!=='image/png'||!report.blob.size||report.blob.size>8_000_000)throw Error('汇总截图无效');
  if(report.status==='uploaded')return report;
  const epoch=generation;
  try{
    if(!token)throw Error('本机上传服务连接密钥尚未填写');
    const response=await fetcher(`./api/nas/reports?date=${encodeURIComponent(report.date)}`,{method:'POST',headers:{'Content-Type':'image/png','Authorization':`Bearer ${token}`,'X-Report-Fingerprint':report.fingerprint},body:report.blob,signal:AbortSignal.timeout(90000)});
    const result=await response.json();const expected=`日课分享截图/${report.date.slice(0,7)}/${report.date}.png`;
    if(!response.ok||result.uploaded!==true||result.fingerprint!==report.fingerprint||result.path!==expected)throw Error(result.error||'服务器 未确认截图写入');
    const updated={...report,status:'uploaded',remotePath:result.path,error:''};
    if(generation===epoch)await persist(updated);
    return updated;
  }catch(error){
    if(generation===epoch)await persist({...report,status:'pending',error:error.name==='TimeoutError'?'连接超时，可稍后重试':error.message});
    throw error;
  }
}
export function archiveReport(prepared,token,{fingerprint:hash=reportFingerprint,read=getReport,persist=saveReport,fetcher=fetch,upload=true}={}){
  if(!prepared.report.allComplete)return Promise.resolve(null);
  const epoch=generation;const date=prepared.report.date;
  return enqueue(date,async()=>{
    if(generation!==epoch)return null;
    const fingerprint=await hash(prepared.file);const existing=await read(date);
    let report;
    if(existing?.fingerprint===fingerprint)report=existing;
    else{report={date,blob:prepared.file,fingerprint,status:'pending',remotePath:'',createdAt:new Date().toISOString(),error:''};if(generation!==epoch)return null;await persist(report);}
    if(generation!==epoch)return null;
    if(!upload)return report;
    return syncReport(report,token,{fetcher,persist});
  });
}
export async function syncPendingReports(token,{list=listReports,read=getReport,persist=saveReport,fetcher=fetch}={}){
  const epoch=generation;const pending=(await list()).filter(report=>report.status!=='uploaded');let uploaded=0;let failed=0;
  for(const report of pending){
    try{const synced=await enqueue(report.date,async()=>{if(generation!==epoch)return false;const latest=await read(report.date);if(generation!==epoch)return false;if(latest&&latest.status!=='uploaded'){await syncReport(latest,token,{fetcher,persist});return true;}return false;});if(synced)uploaded++;}catch{failed++;}
  }
  return {uploaded,failed};
}
