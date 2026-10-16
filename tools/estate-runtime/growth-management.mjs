import {randomUUID} from 'node:crypto';
import {growthDefaults,applyGrowth,growthIdentity} from '../src/growth.js';

// The account service owns this data. Browser backups are read-only projections.
export function createGrowthManagement({getJournal,save,raw,member,requireOwner,event,now}) {
  const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
  function project(id,state) {
    const existing=getJournal().growth?.[id];
    return structuredClone(existing||growthDefaults(member(id)?.identity||''));
  }
  function sources(id,state) {
    return {
      tasks:(state.tasks||[]).filter(t=>t.done&&(!t.severity||t.severity==='normal')).map(t=>({
        id:t.id,title:t.title,linkedDutyId:t.linkedDutyId||null,serviceEventId:t.serviceEventId||null
      })),
      duties:(getJournal().estateDuties||[]).filter(d=>d.memberId===id&&d.status==='accepted').map(d=>({
        id:d.id,title:d.title,linkedTaskId:d.taskId||d.linkedTaskId||null,serviceEventId:d.serviceEventId||null
      }))
    };
  }
  async function view(id) {
    const state=await raw(id),g=project(id,state);
    // Do not disclose photos, contracts, NAS configuration or other accounts.
    return {member:{id,name:member(id).name,legacyIdentity:member(id).identity},growth:g,
      state:{days:state.days||{}},sources:sources(id,state),identity:growthIdentity(g),revision:getJournal().revision};
  }
  function verifiedSource(id,q,state) {
    const available=sources(id,state),aliases=[],titles=[];
    const task=q.taskId?available.tasks.find(t=>t.id===q.taskId):null;
    const duty=q.dutyId?available.duties.find(d=>d.id===q.dutyId):null;
    if(q.taskId&&!task||q.dutyId&&!duty||!task&&!duty)fail(400,'请选择此账号已完成的普通任务或已验收差事');
    for(const t of task?[task]:[]){aliases.push('task:'+t.id);titles.push(t.title);if(t.serviceEventId)aliases.push('event:'+t.serviceEventId);
      if(t.linkedDutyId){const linked=available.duties.find(d=>d.id===t.linkedDutyId);if(!linked)fail(400,'关联差事尚未验收');aliases.push('duty:'+linked.id);}}
    for(const d of duty?[duty]:[]){aliases.push('duty:'+d.id);titles.push(d.title);if(d.serviceEventId)aliases.push('event:'+d.serviceEventId);
      if(d.linkedTaskId){const linked=available.tasks.find(t=>t.id===d.linkedTaskId);if(!linked)fail(400,'关联任务尚未完成');aliases.push('task:'+linked.id);}}
    if(q.nonsexual!==true||q.satisfied!==true)fail(400,'仅记录已完成并评价满意的普通非性服务');
    return {aliases:[...new Set(aliases)],title:titles.join(' / '),satisfied:true};
  }
  async function handle(action,req,user,{json,send}) {
    const match=/^control\/growth\/([A-Za-z0-9_-]+)$/.exec(action);
    if(!match)return false;
    const id=match[1],m=member(id);if(!m)fail(404,'成长档案不存在');
    const owner=user.role==='owner';if(owner)requireOwner(user);else if(user.id!==id)fail(403,'只能查看和操作本人成长档案');
    if(req.method==='GET'){send(200,await view(id));return true;}
    if(req.method!=='POST')fail(405,'成长请求方式无效');
    const q=await json(req,12000),state=await raw(id),next=structuredClone(getJournal());
    next.growth??={};const g=next.growth[id]??=project(id,state);
    const source=q.action==='service'?verifiedSource(id,q,state):null;
    const changed=applyGrowth(g,q,{actor:user,memberId:id,owner,state,source,at:new Date(now()).toISOString(),id:randomUUID()});
    if(changed){
      const last=g.history.at(-1),title=q.action==='choose'?'成长分类已变更：'+growthIdentity(g):
        last?.action==='promoted'?'晋升通过：'+growthIdentity(g):'成长档案已更新：'+growthIdentity(g);
      event(next,id,'growth',{title,action:q.action,identity:growthIdentity(g)});
      await save(next,id);
    }
    send(200,await view(id));return true;
  }
  return {project,handle};
}
