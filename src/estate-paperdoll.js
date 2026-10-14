import {rasterDollFrame,characterReady,characterAnchor,drawCharacterFrame} from './estate-original-character-renderer.js';
import {dollRig,DOLL_ACTIONS,DOLL_SLOT_BONES} from './estate-doll-rig.js';
export {dollRig,DOLL_ACTIONS,DOLL_SLOT_BONES,characterAnchor,drawCharacterFrame};
export const paperDollReady=characterReady;
export const composeDollFrame=rasterDollFrame;
export function dollWorldPoint(actor,local,{x=actor.x,y=actor.y,scale=1,flip=actor.direction===-1?-1:1,rotation=0}={}){const s=1.35*scale,px=(local.x-33)*s*flip,py=(local.y-56)*s;return{x:Math.round(x+px*Math.cos(rotation)-py*Math.sin(rotation)),y:Math.round(y+px*Math.sin(rotation)+py*Math.cos(rotation))};}
export function equipmentDollFrame(actor,slot,clip,frame){if(!DOLL_SLOT_BONES[slot])throw Error('Unknown equipment slot');return composeDollFrame(actor,clip,frame,{onlySlot:slot});}
