import {drawCharacterFrame,paperDollReady,dollRig,dollWorldPoint,characterAnchor} from './estate-paperdoll.js';
import {isDisasterActor} from './estate-world.js';
import {characterFrame} from './estate-original-character-renderer.js';
export const SLAVE_ANIMATIONS={idle:[0,8,120],run:[1,8,90],stop:[2,4,120],walk:[3,8,90],win:[4,2,120]};
export const slaveSpritesReady=paperDollReady;
export const BOW_KNEE_ANCHOR={x:33,y:55};
export const RIDING_SLAVE_SCALE=.8;
export const DISASTER_SLAVE_SCALE=.85;
export const slaveSpriteScale=(actor,scale=1)=>scale*(isDisasterActor(actor)?DISASTER_SLAVE_SCALE:1)*(['carry','carry-crawl'].includes(actor.pose)?RIDING_SLAVE_SCALE:1);
export function slaveAnimation(pose,t,actor={}){if(pose==='sniff-kneel'||pose==='sniff-prone')return {row:12,frame:pose==='sniff-kneel'?3:4,name:pose};if(pose==='carry'||pose==='carry-crawl')return {row:13,frame:pose==='carry'?0:Math.floor(t/140)%6,name:pose};if(pose==='guard')return {row:15,frame:[0,1,1,3,2,2,3,0][Math.floor(t/240)%8],name:'guard'};if(pose==='bark')return {row:14,frame:Math.floor(t/220)%2,name:'bark'};if(pose==='fetch-crawl')return {row:13,frame:Math.floor(t/95)%6,name:'fetch-crawl'};if(['crawl','walk','follow','run'].includes(pose))return {row:13,frame:Math.floor(t/(pose==='run'?95:140))%6,name:'crawl'};if(pose==='stop')return {row:12,frame:0,name:'kneel'};let name=({walk:'walk',follow:'walk',run:'run',play:'win',win:'win',give:'win',stop:'stop'})[pose]||'idle';const kneel=['kneel','pray','stationed','feeding','rest'].includes(pose),bow=['bow','prostrate'].includes(pose);if(kneel)return{row:12,frame:0,name:'kneel'};if(bow)return{row:12,frame:[0,1,2,3,4,3,2,1,0][Math.floor(t/180)%9],name:isDisasterActor(actor)?'disaster-bow':'bow'};const [row,count,speed]=SLAVE_ANIMATIONS[name];return{row,frame:Math.floor(t/speed)%count,name};}
export function slaveDollPose(actor,t){if(actor.pose==='basin-hold')return{clip:'basin',frame:Math.floor(t/350)%4};if(actor.pose==='massage')return{clip:'massage',frame:Math.floor(t/220)%4};if(['carry','carry-crawl'].includes(actor.pose))return {clip:'carry',frame:actor.pose==='carry'?0:Math.floor(t/180)%4};if(['sniff-kneel','sniff-prone'].includes(actor.pose))return {clip:'sniff',frame:Math.floor(t/180)%2};const a=slaveAnimation(actor.pose,t,actor);return {clip:a.row===12?'bow':a.row===13?'crawl':a.row===14?'bark':a.row===15?'guard':a.name,frame:a.frame};}
function origin(actor){return {x:actor.pose==='massage'?actor.x+(actor.gender==='female'?20:7):actor.x,y:actor.y,flip:actor.direction===-1?-1:1};}
export function drawSlaveSprite(c,actor,t,scale=1){if(actor.role==='owner'||actor.id==='ZENG_OWNER_001')return false;const {clip,frame}=slaveDollPose(actor,t),o=origin(actor);return drawCharacterFrame(c,{...actor,gender:actor.gender||'male'},clip,frame,{x:Math.round(o.x),y:Math.round(o.y),flip:o.flip,scale:slaveSpriteScale(actor,scale)});}
export function slaveNeckPoint(actor,t,scale=1){const clock=actor.audiencePhase==='bow'?actor.audienceClock:actor.greeting&&['prostrate','bark'].includes(actor.pose)?Math.max(0,t-actor.greeting.at):t;const {clip,frame}=slaveDollPose(actor,clock);return dollWorldPoint(actor,characterAnchor(actor,clip,frame,'neck'),{...origin(actor),scale:slaveSpriteScale(actor,scale)});}
export function drawGuardAlert(c,actor,t,scale=1){
 if(actor.pose!=='guard'&&actor.interaction?.kind!=='guard')return;
 const clock=actor.greeting&&['prostrate','bark'].includes(actor.pose)?Math.max(0,t-actor.greeting.at):t;
 const {clip,frame}=slaveDollPose(actor,clock),source=characterFrame(actor,clip,frame)?.frame,anchor=characterAnchor(actor,clip,frame,'head');
 const top=source?{x:anchor.x,y:source.sourceBounds[1]*source.scale+source.offset[1]}:anchor;
 const head=dollWorldPoint(actor,top,{...origin(actor),scale}),pulse=(Math.sin(t/300)+1)/2;
 c.save();c.translate(head.x,head.y-12*scale);c.scale(scale,scale);
 c.shadowColor='#ffdc78';c.shadowBlur=7+pulse*4;c.fillStyle='#ffe49c';c.strokeStyle='#483621';c.lineWidth=1.5;
 c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(0,-10,10,0);c.quadraticCurveTo(0,10,-10,0);c.closePath();c.fill();c.stroke();
 c.shadowBlur=0;c.fillStyle='#483621';c.beginPath();c.ellipse(0,0,2.7,3.8,0,0,Math.PI*2);c.fill();
 for(const angle of [-.9,-.45,0,.45,.9]){const dx=Math.sin(angle),dy=-Math.cos(angle),near=10+pulse,far=near+5+pulse*2;c.beginPath();c.moveTo(dx*near,dy*near);c.lineTo(dx*far,dy*far);c.strokeStyle='#483621';c.lineWidth=4;c.stroke();c.strokeStyle='#ffdf86';c.lineWidth=2;c.stroke();}
 c.restore();
}
export function drawSniffEffect(c,a,t){if(!a.sniffTarget||!['sniff-prone','sniff-kneel'].includes(a.pose))return;const p=a.sniffTarget,k=(t%900)/900;c.save();c.strokeStyle='#ecddba';c.lineWidth=1.5;for(let n=0;n<2;n++){c.beginPath();const x=p.x-2+n*5,y=p.y-8-k*8;c.moveTo(x,y+4);c.lineTo(x+2,y+2);c.lineTo(x,y);c.stroke();}c.restore();}
