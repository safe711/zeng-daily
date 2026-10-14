import {goodsIcon} from './estate-goods.js';
import {ORIGINAL_CHARACTER_ASSETS as ASSETS} from './estate-character-originals.js';
import {loadOriginalImage} from './estate-original-image-cache.js';
import {ESTATE_CATALOG} from './model.js';
import {isDisasterActor} from './estate-world.js';
const images={},frameClips=new WeakMap(),collars=new Map();function collarImage(item){if(!collars.has(item.id)){const image=new Image();image.src=goodsIcon(item);collars.set(item.id,image);}const image=collars.get(item.id);return image.complete&&image.naturalWidth?image:null;}
const owner=a=>a.role==='owner'||a.id==='ZENG_OWNER_001';
const moving=clip=>['walk','run','stop'].includes(clip);
export const characterReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(ASSETS).map(async([id,asset])=>{
 images[id]=await loadOriginalImage(new URL('../'+asset.file.replace(/^\.\//,''),import.meta.url).href+'?original='+asset.hash);
}));
// Select an authored original sequence. Never repaint, recolour or splice its character.
export function characterSelection(a,clip,k=0){
 const look=ESTATE_CATALOG.find(i=>i.id===a.avatar?.outfit&&i.wholeAppearance),g=look?.gender||a.gender||(owner(a)?'female':'male'),male=g==='male';
 const prison=!owner(a)||look?.id?.startsWith('appearance-prison-');
 if(prison){if(clip==='bark')return{id:g+'-friendly-bark',index:k%2};const id=g+'-prison';return{id,index:['bow','kneel','sniff'].includes(clip)?6+(clip==='kneel'?0:clip==='sniff'?3:k%5):clip==='crawl'?12+k%6:clip==='guard'?18+k%4:moving(clip)?4+k%2:k%4};}
 const normalClip=['sit','ride','lie','win'].includes(clip)?clip:'idle';
 if(look?.id==='model-outfit-01'){if(moving(clip))return{id:'owner-outfit-walk',index:k%8};if(normalClip==='lie')return{id:'owner-supine',index:2+k%2};return{id:'owner-normal',index:['sit','ride'].includes(normalClip)?4+k%2:normalClip==='win'?14+k%2:12+k%2};}
 if(look?.asset&&ASSETS[look.asset])return{id:look.asset,index:moving(clip)?k%8:['sit','ride'].includes(normalClip)?8+k%2:normalClip==='lie'?10+k%2:normalClip==='win'?14+k%2:12+k%2};
 if(male){if(moving(clip))return{id:'male-base-walk',index:k%8};return{id:'male-normal',index:['sit','ride'].includes(normalClip)?k%2:normalClip==='lie'?2+k%2:normalClip==='win'?6+k%2:4+k%2};}
 if(look?.id==='appearance-female-orange'){if(moving(clip))return{id:'female-orange-walk',index:k%8};if(normalClip==='lie')return{id:'owner-supine',index:k%2};return{id:'owner-normal',index:['sit','ride'].includes(normalClip)?k%2:normalClip==='win'?10+k%2:8+k%2};}
 if(moving(clip))return{id:'female-black-walk',index:k%8};
 return{id:'female-black-normal',index:['sit','ride'].includes(normalClip)?2+k%2:normalClip==='lie'?4+k%2:normalClip==='win'?6+k%2:k%2};
}
export function characterFrame(a,clip='idle',k=0){
 const selected=characterSelection(a,clip,k),asset=ASSETS[selected.id],image=images[selected.id];
 if(!asset||!image)return null;
 const index=((selected.index%asset.frames.length)+asset.frames.length)%asset.frames.length;
 return{image,asset:selected.id,index,frame:asset.frames[index]};
}
export function drawCharacterFrame(c,a,clip='idle',k=0,{x=a.x,y=a.y,scale=1,flip=a.direction===-1?-1:1}={}){
 const selected=characterFrame(a,clip,k);if(!selected)return false;
 const {image,frame}=selected,[sx,sy,w,h]=frame.sourceBounds,[dx,dy]=frame.offset,s=1.35*scale;
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(x,y);c.scale(flip*s,s);
 // Some atlas figures overlap their neighbour's rectangular cell. Clip only the selected original figure.
 if(frame.sourceClip){let path=frameClips.get(frame);if(!path){path=new Path2D();for(const [px,py,pw,ph]of frame.sourceClip)path.rect(px*frame.scale+dx-33,py*frame.scale+dy-56,pw*frame.scale,ph*frame.scale);frameClips.set(frame,path);}c.clip(path);}
 // Sample the original PNG directly into the final scene. No small atlas or intermediate bitmap.
 c.drawImage(image,sx,sy,w,h,sx*frame.scale+dx-33,sy*frame.scale+dy-56,w*frame.scale,h*frame.scale);
 if(!owner(a)&&a.avatar?.collar&&a.avatar.collar!=='black-collar'&&frame.collarVisible!==false){const item=ESTATE_CATALOG.find(i=>i.id===a.avatar.collar&&i.kind==='collar'),image=item&&collarImage(item),p=frame.neck;if(image&&p)c.drawImage(image,12,32,104,76,p.x-33-4,p.y-56-2,8,5);}
 c.restore();return true;
}
export function characterAnchor(a,clip,k,point='neck'){
 const selected=characterSelection(a,clip,k),asset=ASSETS[selected.id],frame=asset.frames[selected.index%asset.frames.length];
 return frame?.[point]||{x:33,y:29};
}
// Compatibility metadata, never a program-painted body.
export const rasterDollFrame=characterFrame;

const appearanceThumbnails=new Map();export function appearanceThumbnail(item){if(!item?.wholeAppearance)return null;if(appearanceThumbnails.has(item.id))return appearanceThumbnails.get(item.id);const f=characterFrame({role:item.role==='slave'?'slave':'owner',gender:item.gender,avatar:{outfit:item.id}},'idle',0);if(!f)return null;const cv=document.createElement('canvas');cv.width=cv.height=160;const c=cv.getContext('2d'),[x,y,w,h]=f.frame.sourceBounds,scale=144/Math.max(w,h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(f.image,x,y,w,h,(160-w*scale)/2,(160-h*scale)/2,w*scale,h*scale);const result=cv.toDataURL();appearanceThumbnails.set(item.id,result);return result;}
