import {loadOriginalImage} from './estate-original-image-cache.js';
import {shrineAudience} from './estate-shrine-audience.js';
import {drawBedFootwear} from './estate-sprites.js';
import {estatePeriod} from './estate-environment.js';
const originals=new Map(),requested=new Set();
function original(id){if(!requested.has(id)){requested.add(id);loadOriginalImage(new URL('../assets/estate-expansion/'+id+'.png',import.meta.url).href).then(image=>originals.set(id,image)).catch(()=>{});}return originals.get(id);}
// Furniture and NPCs use complete original PNGs; no character repainting or splicing.
export function drawEstateExpansion(c,scene,now,actors=[]){c.save();c.imageSmoothingEnabled=true;const period=estatePeriod(now);c.filter=period==='night'?'brightness(.72)':period==='dusk'?'brightness(.9)':'none';
 if(scene==='bedroom'){const stairs=original('bedroom-staircase');if(stairs)c.drawImage(stairs,0,269,100,91);}
 if(scene==='shrine'){const chair=original('shrine-double-chair');if(chair)c.drawImage(chair,238,163,178,119);if(shrineAudience(now).active){const parents=original('shrine-parents-seated');if(parents){const width=parents.width/2;for(let i=0;i<2;i++)c.drawImage(parents,i*width,0,width,parents.height,i?344:236,175,80,107);}}}
 if(scene==='lounge')for(const [i,actor]of actors.entries()){c.save();c.translate(133+i*23-450,329-297);drawBedFootwear(c,{...actor,role:'owner',pose:'lie',scene:'bedroom',interaction:{site:'bed'}});c.restore();}
 c.restore();}
