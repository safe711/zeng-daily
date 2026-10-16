import {randomUUID} from 'node:crypto';
import {estateEtiquette,validateEtiquetteDates} from '../src/estate-etiquette.js';
export function createEtiquetteManagement({getJournal,save,now,owners,position,isOnline,requireOwner,canView}){
  const dates=()=>getJournal().estateEtiquetteDates||[],current=()=>estateEtiquette(now(),dates());
  const celebration=()=>getJournal().estateEtiquetteCelebration||null;
  async function updateArrivals(user){
    const day=new Date(now()+8*3600000).toISOString().slice(0,10),state=current();let next=null;
    for(const owner of owners().filter(o=>o.id===user.id||isOnline(o.id))){const scene=position(owner).scene,old=getJournal().estateEtiquetteOwners?.[owner.id];if(old?.scene===scene&&old.date===day)continue;
      next??=structuredClone(getJournal());next.estateEtiquetteOwners??={};next.estateEtiquetteOwners[owner.id]={scene,date:day};
      if(scene==='courtyard'&&state?.spring)next.estateEtiquetteCelebration={id:randomUUID(),ownerId:owner.id,date:state.date,startedAt:now(),endsAt:now()+20000};
    }
    if(next)await save(next);
  }
  async function handle(action,req,user,{json,send}){
    if(action!=='control/estate-etiquette')return false;if(!canView(user))throw Object.assign(Error('此账号没有府邸权限'),{status:403});
    const view=()=>({event:current(),dates:structuredClone(dates()),celebration:celebration(),canManage:user.role==='owner'});
    if(req.method==='GET'){send(200,view());return true;}
    requireOwner(user);if(req.method!=='POST')throw Object.assign(Error('礼仪请求方式无效'),{status:405});
    const q=await json(req,8000);if(typeof q.requestId!=='string'||!q.requestId||q.requestId.length>100)throw Object.assign(Error('缺少操作编号'),{status:400});
    const key=user.id+':'+q.requestId;if((getJournal().estateEtiquetteRequests||[]).includes(key)){send(200,view());return true;}
    const next=structuredClone(getJournal());next.estateEtiquetteDates??=[];
    if(q.action==='save'){
      if(q.id&&!next.estateEtiquetteDates.some(d=>d.id===q.id))throw Object.assign(Error('礼仪日期不存在'),{status:404});
      const item={id:q.id||randomUUID(),kind:q.kind,calendar:q.calendar,label:typeof q.label==='string'?q.label.trim():q.label,month:q.month,day:q.day};
      next.estateEtiquetteDates=next.estateEtiquetteDates.filter(d=>d.id!==item.id);next.estateEtiquetteDates.push(item);
    }else if(q.action==='delete'){
      if(!next.estateEtiquetteDates.some(d=>d.id===q.id))throw Object.assign(Error('礼仪日期不存在'),{status:404});next.estateEtiquetteDates=next.estateEtiquetteDates.filter(d=>d.id!==q.id);
    }else throw Object.assign(Error('礼仪日期操作无效'),{status:400});
    try{validateEtiquetteDates(next.estateEtiquetteDates);}catch(e){throw Object.assign(e,{status:400});}
    next.estateEtiquetteRequests=[...(next.estateEtiquetteRequests||[]),key].slice(-1000);await save(next);send(200,view());return true;
  }
  return {handle,current,dates,celebration,updateArrivals};
}
