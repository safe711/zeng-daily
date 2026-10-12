import {validDate,validMediaId} from './model.js';
export const safeTaskName=value=>String(value||'任务').normalize('NFKC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/\.\./g,'_').trim().replace(/[. ]+$/g,'').slice(0,48)||'任务';
export const taskFileBase=(date,name)=>date+'-'+safeTaskName(name);
export function taskDirectory(album,date,recordId,name){if(!validDate(date)||!validMediaId(recordId))throw Error('任务日期或记录编号无效');return album+'/'+date.slice(0,7)+'/'+date+'-'+(name?safeTaskName(name)+'-':'')+recordId;}
export const SHOE_ALBUM='洗鞋记录';
export const shoeDirectory=(date,recordId,name)=>taskDirectory(SHOE_ALBUM,date,recordId,name);
export function shoePhotoPath(p){if(!validMediaId(p.shoeId)||!validMediaId(p.id)||!['before','after'].includes(p.phase))throw Error('洗鞋照片编号或前后类别无效');return shoeDirectory(p.date,p.recordId,p.taskName)+'/'+(p.taskName?taskFileBase(p.date,p.taskName)+'-':'')+p.shoeId+'-'+(p.phase==='before'?'洗之前':'洗之后')+'-'+p.id+'.jpg';}
export const shoeReportPath=p=>shoeDirectory(p.date,p.recordId,p.taskName)+'/'+(p.taskName?taskFileBase(p.date,p.taskName)+'-完成图':p.date)+'.png';
export function taskAssetPath(a){if(!validMediaId(a.id)||!['task-photo','task-report'].includes(a.role))throw Error('任务图片关联无效');return taskDirectory('任务记录',a.date,a.recordId,a.taskName)+'/'+(a.taskName?taskFileBase(a.date,a.taskName)+'-':'')+(a.role==='task-photo'?'图片-'+a.id+'.jpg':'任务完成图.png');}
export function shareTaskFile(blob,date,title,platform=globalThis.navigator,kind='完成图'){const file=new File([blob],taskFileBase(date,title)+'-'+kind+'.png',{type:'image/png'});if(!platform?.share||!platform.canShare?.({files:[file]}))throw Error('此设备无法分享图片，请下载完成截图后在微信发送');return platform.share({title:title+' · 任务记录',files:[file]});}

// Keep detailed PNG output within existing upload limits and bounded canvas memory.
export function prepareTaskCanvas(surface,logicalHeight){
 if(!Number.isFinite(logicalHeight)||logicalHeight<=0)throw Error('截图尺寸无效');
 const ratio=logicalHeight/820,width=Math.min(2400,Math.floor(Math.sqrt(12000000/ratio)),Math.floor(16383/ratio));
 if(width<820)throw Error('本次图片过多，请分成多个任务分享');
 surface.width=width;surface.height=Math.ceil(logicalHeight*width/820);return width/820;
}
export async function encodeTaskImage(surface,{canvas=()=>document.createElement('canvas')}={}){
 let current=surface,scratch;
 for(let attempt=0;attempt<5;attempt++){
  const blob=await new Promise(r=>current.toBlob(r,'image/png'));
  if(!blob||blob.type!=='image/png'||!blob.size)throw Error('任务截图生成失败');
  if(blob.size<=8000000)return blob;
  const width=Math.floor(current.width*Math.min(.85,Math.sqrt(7200000/blob.size)));
  if(width<820)break;
  scratch??=canvas();scratch.width=width;scratch.height=Math.round(surface.height*width/surface.width);
  const ctx=scratch.getContext('2d');if(!ctx)throw Error('任务截图生成失败');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(surface,0,0,scratch.width,scratch.height);current=scratch;
 }
 throw Error('截图超过 8 MB，请减少照片或分成多个任务分享');
}
