import {validDate,validMediaId} from './model.js';
export const safeTaskName=value=>String(value||'任务').normalize('NFKC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/\.\./g,'_').trim().replace(/[. ]+$/g,'').slice(0,48)||'任务';
export const taskFileBase=(date,name)=>date+'-'+safeTaskName(name);
export function taskDirectory(album,date,recordId,name){if(!validDate(date)||!validMediaId(recordId))throw Error('任务日期或记录编号无效');return album+'/'+date.slice(0,7)+'/'+date+'-'+(name?safeTaskName(name)+'-':'')+recordId;}
export const SHOE_ALBUM='洗鞋记录';
export const shoeDirectory=(date,recordId,name)=>taskDirectory(SHOE_ALBUM,date,recordId,name);
export function shoePhotoPath(p){if(!validMediaId(p.shoeId)||!validMediaId(p.id)||!['before','after'].includes(p.phase))throw Error('洗鞋照片编号或前后类别无效');return shoeDirectory(p.date,p.recordId,p.taskName)+'/'+(p.taskName?taskFileBase(p.date,p.taskName)+'-':'')+p.shoeId+'-'+(p.phase==='before'?'洗之前':'洗之后')+'-'+p.id+'.jpg';}
export const shoeReportPath=p=>shoeDirectory(p.date,p.recordId,p.taskName)+'/'+(p.taskName?taskFileBase(p.date,p.taskName)+'-完成图':p.date)+'.png';
export function taskAssetPath(a){if(!validMediaId(a.id)||!['task-photo','task-report'].includes(a.role))throw Error('任务图片关联无效');return taskDirectory('任务记录',a.date,a.recordId,a.taskName)+'/'+(a.taskName?taskFileBase(a.date,a.taskName)+'-':'')+(a.role==='task-photo'?'图片-'+a.id+'.jpg':'任务完成图.png');}
export function shareTaskFile(blob,date,title,platform=globalThis.navigator){const file=new File([blob],taskFileBase(date,title)+'-完成图.png',{type:'image/png'});if(!platform?.share||!platform.canShare?.({files:[file]}))throw Error('此设备无法分享图片，请下载完成截图后在微信发送');return platform.share({title:title+' · 完成记录',files:[file]});}
