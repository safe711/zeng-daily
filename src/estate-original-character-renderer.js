import {ORIGINAL_CHARACTER_ASSETS as ASSETS} from './estate-character-originals.js';
import {loadOriginalImage} from './estate-original-image-cache.js';
import {ESTATE_CATALOG} from './model.js';
import {isDisasterActor} from './estate-world.js';
const images={},frameClips=new WeakMap();
const owner=a=>a.role==='owner'||a.id==='ZENG_OWNER_001';
const moving=clip=>['walk','run','stop'].includes(clip);
export const characterReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(ASSETS).map(async([id,asset])=>{
 images[id]=await loadOriginalImage(new URL('../'+asset.file.replace(/^\.\//,''),import.meta.url).href+'?original='+asset.hash);
}));
// Select an authored original sequence. Never repaint, recolour or splice its character.
export function characterSelection(a,clip,k=0){
 const male=a.gender==='male',g=male?'male':'female',photo=owner(a)&&!male&&a.avatar?.outfit==='model-outfit-01';
 if(clip==='bark')return{id:g+'-friendly-bark',index:k%2};
 if(isDisasterActor(a))return{id:g+'-prison',index:['bow','kneel','sniff'].includes(clip)?6+(clip==='kneel'?0:clip==='sniff'?3:k%5):clip==='crawl'?12+k%6:clip==='guard'?18+k%4:k%4};
 if(!owner(a)&&['bow','kneel','sniff','guard','crawl'].includes(clip)){
  if(!male)return{id:'female-prison',index:clip==='crawl'?12+k%6:clip==='guard'?18+k%4:6+(clip==='kneel'?0:clip==='sniff'?3:k%5)};
  return{id:clip==='crawl'?'male-prison':clip==='guard'?'male-guard':'male-bow',index:clip==='crawl'?12+k%6:clip==='guard'?k%4:clip==='kneel'?0:clip==='sniff'?3:k%5};
 }
 if(photo){
  if(moving(clip))return{id:'owner-outfit-walk',index:k%8};
  if(clip==='lie')return{id:'owner-supine',index:2+k%2};
  return{id:'owner-normal',index:['sit','ride'].includes(clip)?4+k%2:clip==='win'?14+k%2:12+k%2};
 }
 // Other outfit originals were authored for the female model only: do not fake a male by tinting her hair.
 const outfit=ESTATE_CATALOG.find(v=>v.id===a.avatar?.outfit);
 if(!male&&outfit?.asset&&ASSETS[outfit.asset])return{id:outfit.asset,index:moving(clip)?k%8:['sit','ride'].includes(clip)?8+k%2:clip==='lie'?10+k%2:clip==='win'?14+k%2:12+k%2};
 if(moving(clip))return{id:male?'male-base-walk':a.avatar?.hair==='long'?'female-black-walk':'female-orange-walk',index:k%8};
 if(male)return{id:'male-normal',index:['sit','ride'].includes(clip)?k%2:clip==='lie'?2+k%2:clip==='win'?6+k%2:4+k%2};
 if(clip==='lie')return{id:'owner-supine',index:k%2};
 return{id:'owner-normal',index:['sit','ride'].includes(clip)?k%2:clip==='win'?10+k%2:8+k%2};
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
 c.restore();return true;
}
export function characterAnchor(a,clip,k,point='neck'){
 const selected=characterSelection(a,clip,k),asset=ASSETS[selected.id],frame=asset.frames[selected.index%asset.frames.length];
 return frame?.[point]||{x:33,y:29};
}
// Compatibility metadata, never a program-painted body.
export const rasterDollFrame=characterFrame;
