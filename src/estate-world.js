export const ESTATE_MAP_ORDER=['courtyard','bedroom','shrine','lounge','gallery'];
export const isDisasterActor=p=>p?.type==='挡灾奴'||/^ZENG-DZ-/.test(p?.id||'');
export const estateHome=p=>isDisasterActor(p)?'shrine':'courtyard';
export function estatePosition(p){if(isDisasterActor(p))return {scene:'shrine',x:p.number==='02'||p.id==='ZENG-DZ-002'?490:165,y:305,direction:p.number==='02'||p.id==='ZENG-DZ-002'?-1:1,at:0};return {scene:'courtyard',x:p.role==='owner'?330:p.id==='ZENG-DS-003'?490:150,y:305,direction:1,at:0};}
export function validEstatePosition(p,actor){return !!p&&ESTATE_MAP_ORDER.includes(p.scene)&&Number.isFinite(p.x)&&p.x>=-35&&p.x<=675&&Number.isFinite(p.y)&&p.y>=276&&p.y<=330&&[-1,1].includes(p.direction)&&(!isDisasterActor(actor))&&(actor.role==='owner'||p.scene==='courtyard');}
export function estateActionAllowed(user,kind,scene,site,targetId=user.id){if(user.role==='owner')return true;if(targetId!==user.id)return false;if(isDisasterActor(user))return kind==='bow'&&scene==='shrine'&&site==='prayer';return scene==='courtyard'&&((kind==='station'&&site==='kennel')||(kind==='feed'&&site==='bowl')||kind==='bow');}
export function estateWalkTarget(site,kind,actor){if(isDisasterActor(actor))return estatePosition(actor);return {scene:site.scene,x:Math.min(600,Math.max(40,site.x+(kind==='bow'?0:24))),y:Math.max(282,Math.min(326,site.y+32)),direction:1};}
