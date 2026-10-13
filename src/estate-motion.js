// Persisted motions shared by the browser and account server. Distances are
// world pixels; both peers advance the same pickup/lead/return itinerary.
export const LEASH_DISTANCE=58;
const point=p=>({scene:p.scene,x:p.x,y:p.y,direction:p.direction||1});
const duration=(a,b,speed=.06)=>Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)/speed);
export function makeLeadMotion(id,ownerId,targetId,leader,dog,destination,kind,site,startedAt){
 const direction=destination? (destination.x>=dog.x?1:-1):leader.direction||1;
 const pickup={...point(dog),x:dog.x+direction*LEASH_DISTANCE,direction};
 const stages=[{duration:duration(leader,pickup),ownerFrom:point(leader),ownerTo:pickup,dogFrom:point(dog),dogTo:point(dog),phase:'pickup'},{duration:400,ownerFrom:pickup,ownerTo:pickup,dogFrom:point(dog),dogTo:point(dog),phase:'attach'}];
 if(destination){const end={...point(destination),x:destination.x+direction*LEASH_DISTANCE,direction};stages.push({duration:duration(pickup,end),ownerFrom:pickup,ownerTo:end,dogFrom:{...point(dog),direction},dogTo:{...point(destination),direction},phase:'lead'});}
 return {id,ownerId,targetId,kind,site,scene:dog.scene,startedAt,stages};
}
export function makeReturnMotion(id,targetId,dog,startedAt){
 let current=point(dog);const stages=[];const order=['courtyard','bedroom','shrine'];
 while(current.scene!=='courtyard'){const edge={...current,x:-30,direction:-1};stages.push({duration:duration(current,edge,.045),dogFrom:current,dogTo:edge,phase:'return'});current={scene:order[order.indexOf(current.scene)-1],x:670,y:305,direction:-1};}
 const home={scene:'courtyard',x:targetId==='ZENG-DS-003'?490:445,y:305,direction:1};stages.push({duration:duration(current,home,.045),dogFrom:current,dogTo:home,phase:'return'});
 return {id,targetId,kind:'return',site:'kennel',scene:dog.scene,startedAt,stages};
}
export const motionDuration=m=>m.stages.reduce((n,s)=>n+s.duration,0);
export function sampleMotion(m,elapsed){
 let stage=m.stages[m.stages.length-1],remaining=Math.max(0,elapsed),done=true;
 for(const s of m.stages){stage=s;if(remaining<s.duration){done=false;break;}remaining-=s.duration;}
 const k=done?1:Math.min(1,remaining/stage.duration),mix=(a,b)=>a&&b?{...b,x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,direction:b.x===a.x?b.direction:b.x>a.x?1:-1}:null;
 return {done,phase:stage.phase,attached:stage.phase!=='pickup',owner:mix(stage.ownerFrom,stage.ownerTo),dog:mix(stage.dogFrom,stage.dogTo)};
}
