import {loadOriginalImage} from './estate-original-image-cache.js';
import {shrineAudience} from './estate-shrine-audience.js';
import {drawBedFootwear} from './estate-sprites.js';
import {estatePeriod} from './estate-environment.js';
const originals=new Map();
const shrineOriginals=['shrine-parents-pajamas-sofa-v1'];
function original(id){let state=originals.get(id);if(!state){state={image:null,pending:false,retryAt:0};originals.set(id,state);}if(!state.image&&!state.pending&&Date.now()>=state.retryAt){state.pending=true;loadOriginalImage(new URL('../assets/estate-expansion/'+id+'.png',import.meta.url).href).then(image=>{state.image=image;state.pending=false;state.retryAt=0;},()=>{state.pending=false;state.retryAt=Date.now()+2000;});}return state.image;}
export function prepareEstateExpansion(scene){if(scene==='shrine')for(const id of shrineOriginals)original(id);}
export function estateExpansionStatus(){return Object.fromEntries(shrineOriginals.map(id=>{const state=originals.get(id);return[id,{ready:!!state?.image,loading:!!state?.pending,retryAt:state?.retryAt||0}];}));}
// Furniture and NPCs use complete original PNGs; no character repainting or splicing.
export function drawEstateExpansion(c,scene,now,actors=[],manualAudience=null){prepareEstateExpansion(scene);c.save();c.imageSmoothingEnabled=true;const period=estatePeriod(now);c.filter=period==='night'?'brightness(.72)':period==='dusk'?'brightness(.9)':'none';
 if(scene==='shrine'&&shrineAudience(now,manualAudience).active){const parents=original('shrine-parents-pajamas-sofa-v1');if(parents)c.drawImage(parents,238,163,178,119);}
 if(scene==='lounge')for(const [i,actor]of actors.entries()){c.save();c.translate(133+i*23-450,329-297);drawBedFootwear(c,{...actor,role:'owner',pose:'lie',scene:'bedroom',interaction:{site:'bed'}});c.restore();}
 c.restore();}
