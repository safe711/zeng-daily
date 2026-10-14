// Persisted motions shared by the browser and account server. Distances are
// world pixels; both peers advance the same pickup/lead/return itinerary.
export const LEASH_DISTANCE=104;
export const OWNER_CHAIR_RISE=20;
export const OWNER_BED_RISE=52;
export const OWNER_WALK_SPEED=.07;
export const OWNER_ENTRY_SPEED=.10;
export const OWNER_LEAD_SPEED=.08;
const point=p=>({scene:p.scene,x:p.x,y:p.y,direction:p.direction||1});
const duration=(a,b,speed=OWNER_LEAD_SPEED)=>Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)/speed);
export function makeLeadMotion(id,ownerId,targetId,leader,dog,destination,kind,site,startedAt){
 let direction=destination? (destination.x>=dog.x?1:-1):leader.direction||1;if(destination&&(destination.x+direction*LEASH_DISTANCE>600||destination.x+direction*LEASH_DISTANCE<40))direction=-direction;
 const pickup={...point(dog),x:dog.x+direction*28,direction:-direction},spaced={...point(dog),x:dog.x+direction*LEASH_DISTANCE,direction};
 const stages=[{duration:duration(leader,pickup),ownerFrom:point(leader),ownerTo:pickup,dogFrom:point(dog),dogTo:point(dog),phase:'pickup'},{duration:400,ownerFrom:pickup,ownerTo:pickup,dogFrom:point(dog),dogTo:point(dog),phase:'attach'},{duration:duration(pickup,spaced),ownerFrom:pickup,ownerTo:spaced,dogFrom:point(dog),dogTo:{...point(dog),direction},phase:'space'}];
 if(destination){const end={...point(destination),x:destination.x+direction*LEASH_DISTANCE,direction};stages.push({duration:duration(spaced,end),ownerFrom:spaced,ownerTo:end,dogFrom:{...point(dog),direction},dogTo:{...point(destination),direction},phase:'lead'});}
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
 const dog= mix(stage.dogFrom,stage.dogTo),ball=stage.ballCarry&&dog?{...dog,x:dog.x+dog.direction*14,y:dog.y-30}:mix(stage.ballFrom,stage.ballTo);if(ball&&stage.ballArc)ball.y-=Math.sin(Math.PI*k)*stage.ballArc;return {done,phase:stage.phase,attached:m.kind!=='fetch'&&stage.phase!=='pickup',owner:mix(stage.ownerFrom,stage.ownerTo),dog,ball};
}

export function makeGuardMotion(id,ownerId,targetId,leader,dog,destination,startedAt){const order=['courtyard','bedroom','shrine'],stages=[];let p=point(leader),d=point(dog);const ownerStage=(from,to,phase,durationMs)=>stages.push({duration:durationMs??duration(from,to),ownerFrom:from,ownerTo:to,dogFrom:d,dogTo:d,phase});
 while(p.scene!==d.scene){const direction=order.indexOf(d.scene)>order.indexOf(p.scene)?1:-1,edge={...p,x:direction>0?670:-30,direction};ownerStage(p,edge,'pickup');p={scene:order[order.indexOf(p.scene)+direction],x:direction>0?-30:670,y:305,direction};ownerStage(p,p,'pickup',650);}
 const direction=p.scene!==destination.scene?(order.indexOf(destination.scene)>order.indexOf(p.scene)?1:-1):(destination.x>=d.x?1:-1),pickup=makeLeadMotion(id,ownerId,targetId,{...p,direction},d,null,'guard','door',startedAt);stages.push(...pickup.stages);p=pickup.stages.at(-1).ownerTo;
 while(d.scene!==destination.scene){const side=order.indexOf(destination.scene)>order.indexOf(d.scene)?1:-1,end={...p,x:side>0?670:-30,direction:side},dogEnd={...d,x:end.x-side*LEASH_DISTANCE,direction:side};stages.push({duration:duration(p,end),ownerFrom:p,ownerTo:end,dogFrom:d,dogTo:dogEnd,phase:'lead'});p={scene:order[order.indexOf(d.scene)+side],x:side>0?-30:670,y:305,direction:side};d={...p,x:p.x-side*LEASH_DISTANCE};stages.push({duration:650,ownerFrom:p,ownerTo:p,dogFrom:d,dogTo:d,phase:'portal'});}
 const endDirection=destination.x>=d.x?1:-1,end={...point(destination),x:destination.x+endDirection*LEASH_DISTANCE,direction:endDirection};stages.push({duration:duration(p,end),ownerFrom:p,ownerTo:end,dogFrom:d,dogTo:{...point(destination),direction:-1},phase:'lead'});return {id,ownerId,targetId,kind:'guard',site:'door',scene:destination.scene,startedAt,stages};}

export function makeRideMotion(id,ownerId,targetId,leader,dog,startedAt){const d=point(dog),near={...d,x:d.x-d.direction*12};return {id,ownerId,targetId,kind:'ride',scene:d.scene,startedAt,stages:[{duration:duration(leader,near),ownerFrom:point(leader),ownerTo:near,dogFrom:d,dogTo:d,phase:'pickup'},{duration:550,ownerFrom:near,ownerTo:d,dogFrom:d,dogTo:d,phase:'mount'}]};}

export const BED_FOOTWEAR_POINT={x:450,y:309};
export function estateShoeTarget(leader,site=null){const shoe=site==='bed'&&leader.scene==='bedroom'?{...BED_FOOTWEAR_POINT}:site==='desk'?{x:leader.x-24,y:leader.y-OWNER_CHAIR_RISE}:{x:leader.x,y:leader.y};return {shoe:{...shoe,scene:leader.scene,itemId:leader.avatar?.shoes||null},dog:{scene:leader.scene,x:shoe.x-27,y:shoe.y,direction:1}};}

// A slack leash leaves the dog where it is, including when the owner turns.
export function leashTrailPoint(trail,leader,dog){
 trail.length=0;
 if(dog.scene!==leader.scene)return {...point(leader),x:leader.x-leader.direction*LEASH_DISTANCE};
 const dx=leader.x-dog.x,dy=leader.y-dog.y,distance=Math.hypot(dx,dy);
 if(distance<=LEASH_DISTANCE)return point(dog);
 const step=(distance-LEASH_DISTANCE)/distance;
 return {scene:dog.scene,x:dog.x+dx*step,y:dog.y+dy*step,direction:Math.abs(dx)>.1?(dx>0?1:-1):dog.direction||1};
}

export function makeFetchMotion(id,ownerId,targetId,leader,dog,ballItemId,startedAt){const direction=dog.x<=320?1:-1,near={...point(dog),x:Math.max(40,Math.min(600,dog.x-direction*28)),direction},waiting={...point(dog),direction},hand={scene:dog.scene,x:near.x+direction*14,y:near.y-32},landing={scene:dog.scene,x:Math.max(50,Math.min(590,dog.x+direction*190)),y:305},carryEnd={...waiting,x:near.x+direction*24,y:near.y,direction:-direction};return {id,ownerId,targetId,kind:'fetch',ballItemId,scene:dog.scene,startedAt,stages:[{duration:duration(leader,near),ownerFrom:point(leader),ownerTo:near,dogFrom:point(dog),dogTo:waiting,phase:'pickup'},{duration:450,ownerFrom:near,ownerTo:near,dogFrom:waiting,dogTo:waiting,ballFrom:hand,ballTo:hand,phase:'throw'},{duration:700,ownerFrom:near,ownerTo:near,dogFrom:waiting,dogTo:waiting,ballFrom:hand,ballTo:landing,ballArc:55,phase:'flight'},{duration:duration(waiting,{...landing,direction},.12),ownerFrom:near,ownerTo:near,dogFrom:waiting,dogTo:{...landing,direction},ballFrom:landing,ballTo:landing,phase:'chase'},{duration:350,ownerFrom:near,ownerTo:near,dogFrom:{...landing,direction},dogTo:{...landing,direction:-direction},ballFrom:landing,ballTo:landing,phase:'collect'},{duration:duration(landing,carryEnd,.12),ownerFrom:near,ownerTo:near,dogFrom:{...landing,direction:-direction},dogTo:carryEnd,ballCarry:true,phase:'retrieve'},{duration:750,ownerFrom:near,ownerTo:near,dogFrom:carryEnd,dogTo:carryEnd,ballFrom:{scene:dog.scene,x:carryEnd.x-direction*12,y:carryEnd.y-30},ballTo:hand,phase:'handover'}]};}
