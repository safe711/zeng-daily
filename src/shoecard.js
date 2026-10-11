import {MAX_SHOES} from './model.js';
import {decodeShoeImage} from './shoes.js';
function wrap(context,text,width){
  const lines=[];
  for(const paragraph of text.split('\n')){let line='';for(const character of paragraph){if(line&&context.measureText(line+character).width>width){lines.push(line);line=character;}else line+=character;}lines.push(line);}
  return lines;
}
export async function requireShoePhotos(record,read){
  if(!record.shoes.length||record.shoes.length>MAX_SHOES)throw Error('鞋子数量无效');
  const pairs=[];
  for(const shoe of record.shoes){
    const photos=[];
    for(const phase of ['before','after']){
      const id=shoe[`${phase}PhotoId`];const photo=id?await read(id):null;
      if(!photo||photo.recordId!==record.id||photo.date!==record.date||photo.shoeId!==shoe.id||photo.phase!==phase||!(photo.blob instanceof Blob)||photo.blob.type!=='image/jpeg'||!photo.blob.size||photo.blob.size>8_000_000)throw Error('有洗前或洗后照片未留存在本机，请重新选择');
      photos.push(photo);
    }
    pairs.push(photos);
  }
  return pairs;
}
export async function buildShoeCard(record,read,{canvas=()=>document.createElement('canvas'),decode=decodeShoeImage}={}){
  if(!record.savedAt)throw Error('请先保存洗鞋记录');
  const pairs=await requireShoePhotos(record,read);const surface=canvas();surface.width=820;
  const context=surface.getContext('2d');if(!context)throw Error('无法生成洗鞋记录截图');
  context.font='21px system-ui, sans-serif';const text=record.note.length>400?`${record.note.slice(0,400)}…（完整备注见本机记录）`:record.note;const wrapped=wrap(context,text||'无补充备注',720);const notes=wrapped.length>12?[...wrapped.slice(0,11),'…（完整备注见本机记录）']:wrapped;const heading=200+notes.length*30;
  surface.height=heading+record.shoes.length*250+30;if(surface.height>8192)throw Error('备注过长，截图超出尺寸限制，请缩短备注');
  context.fillStyle='#131313';context.fillRect(0,0,surface.width,surface.height);
  context.fillStyle='#e4cfaa';context.font='bold 32px system-ui, sans-serif';context.fillText(`${record.taskTitle.slice(0,28)} · 前后对照`,40,55);
  context.fillStyle='#aaaab4';context.font='20px system-ui, sans-serif';context.fillText(`${record.date} · ${record.shoes.length} 双鞋`,40,93);
  context.fillText(`记录保存于 ${record.savedAt.slice(0,10)} ${record.savedAt.slice(11,19)} UTC`,40,126);
  context.fillStyle='#e4dfd3';context.font='21px system-ui, sans-serif';notes.forEach((line,index)=>context.fillText(line,40,162+index*30));
  for(let index=0;index<pairs.length;index++){
    const top=heading+index*250;context.fillStyle='#242731';context.fillRect(30,top,760,230);
    context.fillStyle='#e4cfaa';context.font='bold 24px system-ui, sans-serif';context.fillText(`鞋子 ${index+1}`,50,top+34);
    for(let position=0;position<2;position++){
      const left=position===0?85:475;const decoded=await decode(pairs[index][position].blob);
      try{
        if(!decoded.width||!decoded.height)throw Error('洗鞋照片无法解码');
        context.fillStyle='#17191f';context.fillRect(left,top+68,260,140);const scale=Math.min(260/decoded.width,140/decoded.height);const width=decoded.width*scale;const height=decoded.height*scale;
        context.drawImage(decoded.image,left+(260-width)/2,top+68+(140-height)/2,width,height);
      }finally{decoded.close();}
      context.fillStyle='#e4dfd3';context.font='18px system-ui, sans-serif';context.fillText(position===0?'洗之前':'洗之后',left,top+58);
    }
  }
  const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));if(!blob||blob.type!=='image/png'||!blob.size||blob.size>8_000_000)throw Error('截图生成失败或超过 8 MB，请减少本次鞋子数量');
  return {record:structuredClone(record),file:new File([blob],`${record.date}-${record.id}.png`,{type:'image/png'})};
}
