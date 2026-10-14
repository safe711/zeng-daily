import {rasterDollFrame,characterReady,characterAnchor} from './estate-original-character-renderer.js';
import {dollRig,DOLL_ACTIONS,DOLL_SLOT_BONES} from './estate-doll-rig.js';
export {dollRig,DOLL_ACTIONS,DOLL_SLOT_BONES,characterAnchor};
export const paperDollReady=characterReady;
export const composeDollFrame=rasterDollFrame;
export function dollWorldPoint(actor,local,{x=actor.x,y=actor.y,scale=1,flip=actor.direction===-1?-1:1}={}){const s=1.35*scale;return{x:Math.round(x+(local.x-33)*s*flip),y:Math.round(y+(local.y-56)*s)};}
export function equipmentDollFrame(actor,slot,clip,frame){if(!DOLL_SLOT_BONES[slot])throw Error('Unknown equipment slot');return composeDollFrame(actor,clip,frame,{onlySlot:slot});}
