import {drawBrandFooter,SHARE_FOOTER_HEIGHT} from './branding.js';
import {dayKey,RITUAL_KINDS,RITUAL_NAMES} from './model.js';
import {ritualEvidence} from './ritual.js';
export function ritualReport(state,date=dayKey(),account=null) {
  const day=state.days[date] || {};
  const entries=RITUAL_KINDS.map(kind=>{
    const evidence=ritualEvidence(day,kind);
    return {kind,title:RITUAL_NAMES[kind],completed:day[kind]!==undefined,phrase:day[kind]!==undefined?(evidence.phrase||day[kind]):'尚未完成',completedTime:day[kind]!==undefined?(evidence.completedTime||'时间未记录（旧数据）'):'—',photoId:evidence.photoId||null};
  });
  return {date,account:account?{id:String(account.id||''),name:String(account.name||'')}:null,entries,completed:entries.filter(entry=>entry.completed).length,allComplete:entries.every(entry=>entry.completed)};
}
export function reportText(report) {
  return `ZENG LEGACY · ${report.date}\n${report.account?'奴隶编号：'+report.account.id+' · 名称：'+report.account.name+'\n':''}每日礼仪 ${report.completed} / ${RITUAL_KINDS.length}\n\n`+report.entries.map(entry=>`${entry.title}\n${entry.phrase}\n完成时间：${entry.completedTime}`).join('\n\n');
}
function wrapText(context,text,width) {
  const lines=[];
  for(const paragraph of text.split('\n')){
    let line='';
    for(const character of paragraph){
      if(line && context.measureText(line+character).width>width){lines.push(line);line=character;}else line+=character;
    }
    lines.push(line);
  }
  return lines;
}
async function loadImage(blob) {
  const url=URL.createObjectURL(blob);
  try{
    return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('照片无法解码'));image.src=url;});
  }finally{URL.revokeObjectURL(url);}
}
export async function buildShareCard(report,getPhoto) {
  const canvas=document.createElement('canvas');canvas.width=820;
  const context=canvas.getContext('2d');if(!context)throw Error('此浏览器无法生成分享卡');
  context.font='22px system-ui, sans-serif';
  const blocks=await Promise.all(report.entries.map(async entry=>{
    let image=null;
    let photoStatus=entry.completed?'照片未留存':'待拍照';
    if(entry.photoId){
      const photo=await getPhoto(entry.photoId);
      if(photo?.blob instanceof Blob && photo.date===report.date && photo.kind===entry.kind){
        try{image=await loadImage(photo.blob);photoStatus='打卡照片';}catch{photoStatus='照片无法读取';}
      }
    }
    const text=entry.phrase.length>600?`${entry.phrase.slice(0,600)}…（余文见分享文本）`:entry.phrase;
    const lines=wrapText(context,text,536);
    return {...entry,image,photoStatus,lines,height:Math.max(220,124+lines.length*34)};
  }));
  const accountLines=report.account?wrapText(context,'奴隶编号：'+report.account.id+' · 名称：'+report.account.name,740):[];const headerHeight=140+accountLines.length*32;canvas.height=headerHeight+blocks.reduce((sum,block)=>sum+block.height+20,0)+SHARE_FOOTER_HEIGHT;
  context.fillStyle='#131313';context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle='#e4cfaa';context.font='bold 34px system-ui, sans-serif';context.fillText('ZENG LEGACY · 每日礼仪',40,62);
  context.fillStyle='#aaaab4';context.font='21px system-ui, sans-serif';context.fillText(`${report.date}    已完成 ${report.completed} / ${RITUAL_KINDS.length}`,40,105);
  context.fillStyle='#d4cbb7';context.font='21px system-ui, sans-serif';accountLines.forEach((line,i)=>context.fillText(line,40,140+i*32));
  let top=headerHeight;
  for(const block of blocks){
    context.fillStyle='#242731';context.fillRect(30,top,760,block.height);
    context.fillStyle='#f0f0f2';context.font='bold 25px system-ui, sans-serif';context.fillText(block.title,50,top+40);
    context.fillStyle='#b69a60';context.font='19px system-ui, sans-serif';context.fillText(`完成时间：${block.completedTime}`,50,top+73);
    context.fillStyle='#e4dfd3';context.font='22px system-ui, sans-serif';
    block.lines.forEach((line,index)=>context.fillText(line,50,top+114+index*34));
    const imageLeft=624;const imageTop=top+40;const size=136;
    context.fillStyle='#17191f';context.fillRect(imageLeft,imageTop,size,size);
    if(block.image){
      const ratio=Math.min(size/block.image.naturalWidth,size/block.image.naturalHeight);const width=block.image.naturalWidth*ratio;const height=block.image.naturalHeight*ratio;
      context.drawImage(block.image,imageLeft+(size-width)/2,imageTop+(size-height)/2,width,height);
    }
    context.fillStyle='#aaaab4';context.font='17px system-ui, sans-serif';context.fillText(block.photoStatus,imageLeft,imageTop+size+27);
    top+=block.height+20;
  }
  await drawBrandFooter(context,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('分享卡生成失败');
  return {report,text:reportText(report),file:new File([blob],`daily-ritual-${report.date}.png`,{type:'image/png'})};
}
export function sharePrepared(prepared,platform=navigator) {
  if(!prepared.report.allComplete)throw Error('请先完成今日四项礼仪');
  if(!platform.share || !platform.canShare?.({files:[prepared.file]}))throw Error('此设备不支持图片分享，请下载分享卡后在微信发送');
  return platform.share({title:`每日礼仪 · ${prepared.report.date}`,text:prepared.text,files:[prepared.file]});
}
