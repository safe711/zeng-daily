import {loadOriginalImage} from './estate-original-image-cache.js';
import {WEATHER_WINDOWS} from './estate-weather.js';
import {SCENE_ORIGINAL_ASSETS} from './estate-scene-originals.js';

export const SEASON_WEATHER={spring:['sunny','cloudy','rain'],summer:['sunny','cloudy','rain','thunderstorm'],autumn:['sunny','cloudy','drizzle'],winter:['sunny','cloudy','snow','blizzard']};
export const SEASON_NAMES={spring:'春天',summer:'夏天',autumn:'秋天',winter:'冬天'};
export const PERIOD_NAMES={morning:'早上',noon:'中午',dusk:'傍晚',night:'深夜'};
const monthClock=new Intl.DateTimeFormat('en',{timeZone:'Asia/Hong_Kong',month:'numeric'}),hourClock=new Intl.DateTimeFormat('en',{timeZone:'Asia/Hong_Kong',hour:'numeric',hourCycle:'h23'});
export function estateSeason(now=Date.now()){const month=Number(monthClock.format(now));return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';}
export function estatePeriod(now=Date.now()){const hour=Number(hourClock.format(now));return hour>=5&&hour<11?'morning':hour>=11&&hour<16?'noon':hour>=16&&hour<20?'dusk':'night';}
const images=new Map(),loading=new Set(),retryAfter=new Map();
function requestPainting(id){if(images.has(id)||loading.has(id)||Date.now()<(retryAfter.get(id)||0))return;const asset=SCENE_ORIGINAL_ASSETS[id];if(!asset)return;loading.add(id);loadOriginalImage(new URL('../'+asset.file,import.meta.url).href+'?original='+asset.hash).then(im=>images.set(id,im)).catch(()=>retryAfter.set(id,Date.now()+30000)).finally(()=>loading.delete(id));}
export function environmentId(season,weather,period){return `courtyard-${season}-${weather}-${period}`;}
export function drawEstateExterior(c,scene,{season,weather,period}){if(scene!=='courtyard'){const indoorId=`${scene}-${weather==='sunny'?'clear':'overcast'}-${period}`;requestPainting(indoorId);const indoor=images.get(indoorId);if(indoor)c.drawImage(indoor,0,0,640,360);}
 const id=environmentId(season,weather,period);requestPainting(id);const image=images.get(id);if(!image)return false;
 if(scene==='courtyard'){c.save();c.imageSmoothingEnabled=true;c.drawImage(image,0,0,640,360);c.restore();}else drawEstateWindowView(c,scene,image);return true;}
export function drawEstateWindowView(c,scene,image){c.save();c.imageSmoothingEnabled=true;c.beginPath();for(const poly of WEATHER_WINDOWS[scene]||[]){c.moveTo(...poly[0]);for(const point of poly.slice(1))c.lineTo(...point);c.closePath();}c.clip();
 // Show distant sky, trees and rooftops through each window, keeping indoor frames intact.
 const views=['bedroom','lounge'].includes(scene)?[[271,68,76,125],[585,76,43,111]]:[[621,96,19,76]];
 for(const[x,y,w,h]of views){const sh=image.height*.40,sw=sh*w/h,sx=Math.min(image.width-sw,image.width*.76-sw/2);c.drawImage(image,sx,image.height*.02,sw,sh,x,y,w,h);}
 c.restore();}
