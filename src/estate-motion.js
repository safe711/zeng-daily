// Persisted motions shared by the browser and account server. Distances are
// world pixels; both peers advance the same pickup/lead/return itinerary.
export const LEASH_DISTANCE=104;
export const OWNER_CHAIR_RISE=20;
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
 if(elapsed>=motionDuration(m)-.001)done=true;const k=done?1:Math.min(1,remaining/stage.duration),mix=(a,b)=>a&&b?{...b,x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,direction:k>=1?b.direction:b.x===a.x?b.direction:b.x>a.x?1:-1}:null;
 return {done,phase:stage.phase,attached:stage.phase!=='pickup',owner:mix(stage.ownerFrom,stage.ownerTo),dog:mix(stage.dogFrom,stage.dogTo)};
}

export function makeGuardMotion(id,ownerId,targetId,leader,dog,destination,startedAt){const order=['courtyard','bedroom','shrine'],stages=[];let p=point(leader),d=point(dog);const ownerStage=(from,to,phase,durationMs)=>stages.push({duration:durationMs??duration(from,to),ownerFrom:from,ownerTo:to,dogFrom:d,dogTo:d,phase});
 while(p.scene!==d.scene){const direction=order.indexOf(d.scene)>order.indexOf(p.scene)?1:-1,edge={...p,x:direction>0?670:-30,direction};ownerStage(p,edge,'pickup');p={scene:order[order.indexOf(p.scene)+direction],x:direction>0?-30:670,y:305,direction};ownerStage(p,p,'pickup',650);}
 const direction=p.scene!==destination.scene?(order.indexOf(destination.scene)>order.indexOf(p.scene)?1:-1):(destination.x>=d.x?1:-1),pickup=makeLeadMotion(id,ownerId,targetId,{...p,direction},d,null,'guard','door',startedAt);stages.push(...pickup.stages);p=pickup.stages.at(-1).ownerTo;
 while(d.scene!==destination.scene){const side=order.indexOf(destination.scene)>order.indexOf(d.scene)?1:-1,end={...p,x:side>0?670:-30,direction:side},dogEnd={...d,x:end.x-side*LEASH_DISTANCE,direction:side};stages.push({duration:duration(p,end),ownerFrom:p,ownerTo:end,dogFrom:d,dogTo:dogEnd,phase:'lead'});p={scene:order[order.indexOf(d.scene)+side],x:side>0?-30:670,y:305,direction:side};d={...p,x:p.x-side*LEASH_DISTANCE};stages.push({duration:650,ownerFrom:p,ownerTo:p,dogFrom:d,dogTo:d,phase:'portal'});}
 const endDirection=destination.x>=d.x?1:-1,end={...point(destination),x:destination.x+endDirection*LEASH_DISTANCE,direction:endDirection};stages.push({duration:duration(p,end),ownerFrom:p,ownerTo:end,dogFrom:d,dogTo:{...point(destination),direction:-1},phase:'lead'});return {id,ownerId,targetId,kind:'guard',site:'door',scene:destination.scene,startedAt,stages};}

export function makeRideMotion(id,ownerId,targetId,leader,dog,startedAt){const d=point(dog),near={...d,x:d.x-d.direction*12};return {id,ownerId,targetId,kind:'ride',scene:d.scene,startedAt,stages:[{duration:duration(leader,near),ownerFrom:point(leader),ownerTo:near,dogFrom:d,dogTo:d,phase:'pickup'},{duration:550,ownerFrom:near,ownerTo:d,dogFrom:d,dogTo:d,phase:'mount'}]};}

export const BED_FOOTWEAR_POINT={x:580,y:316};
export function estateShoeTarget(leader,site=null){const shoe=site==='bed'&&leader.scene==='bedroom'?{...BED_FOOTWEAR_POINT}:site==='desk'?{x:leader.x-44,y:leader.y-OWNER_CHAIR_RISE}:{x:leader.x,y:leader.y};return {shoe:{...shoe,scene:leader.scene,itemId:leader.avatar?.shoes||null},dog:{scene:leader.scene,x:shoe.x-27,y:shoe.y,direction:1}};}

// Follow the owner's walked path, with one full character of clear space.
export function leashTrailPoint(trail,leader,dog){
 if(!trail.length||trail.at(-1).scene!==leader.scene){trail.length=0;trail.push({...point(leader),x:leader.x-leader.direction*LEASH_DISTANCE});trail.push(point(leader));}
 const last=trail.at(-1);if(Math.hypot(leader.x-last.x,leader.y-last.y)>.1)trail.push(point(leader));
 let remaining=LEASH_DISTANCE;
 for(let i=trail.length-1;i>0;i--){const a=trail[i-1],b=trail[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length>=remaining&&length>0){const k=remaining/length;const result={scene:leader.scene,x:b.x+(a.x-b.x)*k,y:b.y+(a.y-b.y)*k,direction:Math.abs(b.x-a.x)>.1?(b.x>a.x?1:-1):b.direction};if(i>1)trail.splice(0,i-1);return result;}remaining-=length;}
 const first=trail[0];return {...first,x:first.x-first.direction*remaining};
}
