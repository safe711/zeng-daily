import {loadOriginalImage} from './estate-original-image-cache.js';
import {shrineAudience} from './estate-shrine-audience.js';
import {drawBedFootwear} from './estate-sprites.js';
import {estatePeriod} from './estate-environment.js';
const originals=new Map();
const PARENTS_SCALE=.7;
const shrineOriginals=['shrine-parents-pajamas-sofa-v1'];
function original(id){let state=originals.get(id);if(!state){state={image:null,pending:false,retryAt:0};originals.set(id,state);}if(!state.image&&!state.pending&&Date.now()>=state.retryAt){state.pending=true;loadOriginalImage(new URL('../assets/estate-expansion/'+id+'.png',import.meta.url).href).then(image=>{state.image=image;state.pending=false;state.retryAt=0;},()=>{state.pending=false;state.retryAt=Date.now()+2000;});}return state.image;}
export function prepareEstateExpansion(scene){if(scene==='shrine')for(const id of shrineOriginals)original(id);}
export function estateExpansionStatus(){return Object.fromEntries(shrineOriginals.map(id=>{const state=originals.get(id);return[id,{ready:!!state?.image,loading:!!state?.pending,retryAt:state?.retryAt||0}];}));}
// Furniture and NPCs use complete original PNGs; no character repainting or splicing.
export function drawEstateExpansion(c,scene,now,actors=[],manualAudience=null){prepareEstateExpansion(scene);c.save();c.imageSmoothingEnabled=true;const period=estatePeriod(now);c.filter=period==='night'?'brightness(.72)':period==='dusk'?'brightness(.9)':'none';
 if(scene==='shrine'&&shrineAudience(now,manualAudience).active){const parents=original('shrine-parents-pajamas-sofa-v1');if(parents){const x=327-89*PARENTS_SCALE,y=290-119*PARENTS_SCALE,w=178*PARENTS_SCALE;c.drawImage(parents,x,y,w,119*PARENTS_SCALE);c.save();c.font='7px system-ui';c.textAlign='center';c.lineWidth=2.5;c.strokeStyle='#30251b';c.fillStyle='#f6e3bc';for(const [title,dx]of [['曾仪父亲',.38],['曾仪母亲',.62]]){c.strokeText(title,x+w*dx,y-3);c.fillText(title,x+w*dx,y-3);}c.restore();}}
 if(scene==='lounge')for(const [i,actor]of actors.entries()){c.save();c.translate(133+i*23-450,329-297);drawBedFootwear(c,{...actor,role:'owner',pose:'lie',scene:'bedroom',interaction:{site:'bed'}});c.restore();}
 c.restore();}
