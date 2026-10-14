import {drawCharacterFrame,paperDollReady,dollRig,dollWorldPoint,characterAnchor} from './estate-paperdoll.js';
import {BED_FOOTWEAR_POINT,OWNER_CHAIR_RISE,OWNER_BED_RISE} from './estate-motion.js';
import {ESTATE_CATALOG} from './model.js';
export const estateSpritesReady=paperDollReady;
export const OWNER_ANIMATION_ROWS={idle:[0,8],run:[1,8],stop:[2,4],walk:[3,8],win:[4,2]};
export function ownerSpriteName(pose){return ({walk:'walk',follow:'walk',run:'run',play:'win',give:'win',throw:'win',win:'win',stop:'stop'})[pose]||'idle';}
export function ownerWalkFrame(actor,t){return Math.floor(Number.isFinite(actor.walkTravel)?actor.walkTravel/6:t/140)%8;}
export function ownerDollPose(a,t){if(a.pose==='throw')return {clip:'win',frame:1};if(a.pose==='give')return {clip:'win',frame:0};const clip=['sit','lie','ride'].includes(a.pose)?a.pose:ownerSpriteName(a.pose),frame=clip==='walk'?ownerWalkFrame(a,t):['sit','lie','ride'].includes(clip)?Math.floor(t/600)%2:Math.floor(t/(clip==='run'?90:120))%OWNER_ANIMATION_ROWS[clip][1];return {clip,frame};}
function ownerOrigin(a,t){const lie=a.pose==='lie'&&a.interaction?.site==='bed';return {x:Math.round(a.x-(a.pose==='ride'?10*a.direction:lie?4:a.pose==='sit'&&a.interaction?.site==='desk'?44:0)),y:Math.round(a.y-(a.pose==='ride'?9+Math.sin(t/140)*.6:lie?OWNER_BED_RISE:a.pose==='sit'&&a.interaction?.site==='desk'?OWNER_CHAIR_RISE:0)),flip:lie?-1:a.direction===-1?-1:1};}
export function drawOwnerSprite(c,a,t,scale=1){if(a.role!=='owner'&&a.id!=='ZENG_OWNER_001')return false;const {clip,frame}=ownerDollPose(a,t);return drawCharacterFrame(c,{...a,gender:a.gender||'female'},clip,frame,{...ownerOrigin(a,t),scale});}
export function ownerBedFootwear(actor){if(actor.role!=='owner'||actor.pose!=='lie'||actor.interaction?.site!=='bed'||actor.scene!=='bedroom')return null;const appearance=ESTATE_CATALOG.find(i=>i.id===actor.avatar?.outfit&&i.wholeAppearance);return {shoes:appearance?.footwear||null,socks:appearance?.socks||null,...BED_FOOTWEAR_POINT};}
export function drawBedFootwear(c,actor){const bed=ownerBedFootwear(actor);if(!bed?.shoes)return;const item=ESTATE_CATALOG.find(i=>i.id===bed.shoes&&i.kind==='shoes');if(!item)return;const color=item.style,boots=item.id==='owner-boots'||/靴/.test(item.name),height=boots?13:7,quality=item.quality||0;c.save();c.translate(bed.x,bed.y);const r=(x,y,w,h,s)=>{c.fillStyle=s;c.fillRect(x,y,w,h);};r(-20,0,42,3,'#1b161599');const shoe=x=>{r(x+4,-height-1,7,height+1,'#272126');r(x+5,-height,5,height-2,color);r(x,-5,13,5,'#272126');r(x+1,-4,11,3,color);r(x+1,-1,11,1,quality>=4?'#e3c477':'#ac9574');r(x+5,-height,5,1,'#d8c7a4');if(item.motif===1||item.id==='gold-shoes')r(x+6,-height+3,3,2,'#e6c46d');else if(item.motif===2)for(let n=0;n<3;n++)r(x+6,-height+2+n*2,3,1,'#e6d7b3');else if(item.motif>=3){r(x+7,-height+3,1,3,'#eac77c');r(x+6,-height+4,3,1,'#eac77c');}};shoe(-17);c.save();c.translate(5,-13);c.rotate(Math.PI/2);shoe(0);c.restore();
 c.restore();}


export function ownerLeashPoint(a,t=0){const {clip,frame}=ownerDollPose(a,t);return dollWorldPoint(a,characterAnchor(a,clip,frame,'hand'),{...ownerOrigin(a,t),scale:1.2});}
