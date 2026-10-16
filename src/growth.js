// Growth qualifications are separate from account roles and loyalty points.
export const GROWTH_ROUTES = {
  dog: {name:'狗奴才', parent:null, service:'普通礼仪、约定候命与生活侍奉'},
  private: {name:'私奴', parent:null, service:'个人用品、日程、偏好整理与约定随侍'},
  disaster: {name:'挡灾奴', parent:null, service:'祠堂剧情与现实生活支援，不代表真实灾祸转移'},
  guard: {name:'看门狗', parent:'dog', service:'约定接待、访客提醒与出入准备，保留正常休息'},
  housework: {name:'家务狗', parent:'dog', service:'清洁、洗衣、洗鞋与整理'},
  tribute: {name:'贡奉狗', parent:'dog', service:'约定物品的准备与交付，不按金额升星'},
  intimate: {name:'性奴', parent:'private', sensitive:true, service:'仅私密身份标签；成长只记录普通非性任务'},
  bathroom: {name:'厕奴', parent:'private', sensitive:true, service:'仅正常浴厕卫生与用品整理'}
};
export const GROWTH_BASE_NAMES = ['入门奴才','初级奴才','正式奴才'];
export const GROWTH_DEFAULT_RULES = {
  junior:{days:1,tasks:1,rules:true}, formal:{days:7,tasks:3,rules:false},
  star2:{tasks:5}, star3:{tasks:10}
};
const copy = value => structuredClone(value);
const fail = message => { throw Object.assign(Error(message),{status:409}); };
const allowed = (condition,message) => { if(!condition)fail(message); };
const nonempty = (value,max=2000) => typeof value==='string' && value.trim().length>0 && value.length<=max;
const stages = ['junior','formal','star2','star3'];
const routeExists = value => typeof value==='string' && Object.hasOwn(GROWTH_ROUTES,value);
const activeStatuses = ['published','confirmed','submitted','improve','deferred'];
export function growthDefaults(legacyIdentity='') {
  return {version:1,base:'entry',route:null,routes:{},rules:copy(GROWTH_DEFAULT_RULES),
    starts:{},rulesConfirmedAt:null,managementConsent:null,services:[],exams:[],history:[],
    legacyIdentity:String(legacyIdentity).slice(0,200),requests:[]};
}
export function validateGrowth(g) {
  if(g===undefined)return;
  const bad=()=>{throw Error('成长档案格式无效');};
  if(!g||g.version!==1||!['entry','junior','formal'].includes(g.base)||
    g.route!==null&&!routeExists(g.route)||!g.routes||Array.isArray(g.routes)||
    !g.rules||!g.starts||Array.isArray(g.starts)||!Array.isArray(g.services)||!Array.isArray(g.exams)||
    !Array.isArray(g.history)||!Array.isArray(g.requests)||typeof g.legacyIdentity!=='string')bad();
  for(const [route,record] of Object.entries(g.routes))if(!routeExists(route)||!record||![1,2,3].includes(record.stars)||!Array.isArray(record.history)||
    record.star2ServiceIds!==undefined&&(!Array.isArray(record.star2ServiceIds)||record.star2ServiceIds.some(id=>typeof id!=='string')))bad();
  if(g.route&&(!Object.hasOwn(g.routes,g.route)||g.base!=='formal'))bad();
  if(g.managementConsent!==null&&(!g.managementConsent||g.managementConsent.scope!=='growth-category'||typeof g.managementConsent.by!=='string'||!Number.isFinite(Date.parse(g.managementConsent.at))))bad();
  if(g.rulesConfirmedAt!==null&&!Number.isFinite(Date.parse(g.rulesConfirmedAt)))bad();
  if(g.requests.some(key=>typeof key!=='string'||key.length>300)||new Set(g.requests).size!==g.requests.length)bad();
  for(const stage of stages){const r=g.rules[stage];if(!r||!Number.isInteger(r.tasks)||r.tasks<0||r.tasks>1000||
    ['junior','formal'].includes(stage)&&(!Number.isInteger(r.days)||r.days<0||r.days>3650||typeof r.rules!=='boolean'))bad();}
  const ids=new Set(),aliases=new Set();
  for(const s of g.services){if(!s||typeof s.id!=='string'||ids.has(s.id)||!Array.isArray(s.aliases)||!s.aliases.length||
    s.aliases.some(a=>typeof a!=='string'||aliases.has(a))||s.route!==null&&!routeExists(s.route)||!Number.isFinite(Date.parse(s.at)))bad();
    ids.add(s.id);s.aliases.forEach(a=>aliases.add(a));}
  const examIds=new Set();
  for(const e of g.exams){if(!e||typeof e.id!=='string'||examIds.has(e.id)||!['junior','formal','star2','star3'].includes(e.stage)||
    ![...activeStatuses,'passed','cancelled','declined','stopped'].includes(e.status)||!Array.isArray(e.history)||!nonempty(e.content)||!nonempty(e.criteria))bad();examIds.add(e.id);}
  if(g.services.length>20000||g.exams.length>5000||g.history.length>20000||g.requests.length>20000)bad();
}
export function growthIdentity(g) {
  if(!g)return '入门奴才';
  return g.route?GROWTH_ROUTES[g.route].name+' '+'★'.repeat(g.routes[g.route].stars):GROWTH_BASE_NAMES[['entry','junior','formal'].indexOf(g.base)];
}
export function growthTarget(g) {
  if(g.base==='entry')return {key:'junior',stage:'junior',route:null,label:'初级奴才'};
  if(g.base==='junior')return {key:'formal',stage:'formal',route:null,label:'正式奴才'};
  if(!g.route)return null;
  const stars=g.routes[g.route].stars;
  return stars===3?null:{key:g.route+':star'+(stars+1),stage:'star'+(stars+1),route:g.route,label:GROWTH_ROUTES[g.route].name+' '+'★'.repeat(stars+1)};
}
export function growthOptions(g) {
  if(g.base!=='formal')return [];
  return Object.keys(GROWTH_ROUTES).filter(id=>!GROWTH_ROUTES[id].parent||g.routes[GROWTH_ROUTES[id].parent]?.stars===3);
}
export function growthProgress(g,state={},target=growthTarget(g)) {
  if(!target)return null;
  const start=g.starts[target.key],rules=start?.rules||g.rules[target.stage];
  const completeDays=Object.entries(state.days||{}).filter(([date,day])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&
    ['morning','noon','evening','gratitude'].every(k=>day?.[k]!==undefined)).length;
  const services=g.services.filter(s=>target.route?s.route===target.route:true),count=services.length;
  // The second star's services cannot also satisfy the next ten services.
  const baseline=target.stage==='star3'?(g.routes[target.route]?.star2Baseline??0):0;
  const baselineIds=target.stage==='star3'?g.routes[target.route]?.star2ServiceIds:null;
  const tasks=baselineIds?services.filter(s=>!baselineIds.includes(s.id)).length:Math.max(0,count-baseline),days=rules.days||0;
  return {target,started:!!start,rules:copy(rules),tasks,days:completeDays,
    ready:!!start&&tasks>=rules.tasks&&completeDays>=days&&(!rules.rules||!!g.rulesConfirmedAt),
    exam:g.exams.findLast(e=>e.key===target.key)||null};
}
function note(g,action,actor,at,data={}) { g.history.push({action,by:actor.id,at,...data}); }
function authority(actor,memberId,owner) {
  allowed(owner||actor.id===memberId,'不能操作其他账号的成长档案');
}
function requireOwner(owner) { allowed(owner,'仅主子账号可以执行此操作'); }
// Only the authenticated server supplies owner, verified source aliases and state.
export function applyGrowth(g,input,{actor,memberId,owner=false,state={},at,id,source=null}) {
  validateGrowth(g);authority(actor,memberId,owner);
  allowed(nonempty(input.requestId,100),'缺少稳定操作编号');
  const requestKey=actor.id+':'+input.requestId;
  if(g.requests.includes(requestKey))return false;
  allowed(g.requests.length<20000,'成长记录已达容量上限，请先归档');
  const action=input.action,target=growthTarget(g),progress=growthProgress(g,state,target);
  const currentExam=()=>{const e=g.exams.find(e=>e.id===input.examId);allowed(!!e,'考核不存在');return e;};
  const onCurrent=e=>allowed(target&&e.key===target.key,'请先返回此考核对应的分类与阶段');
  if(action==='rules-confirm') {
    allowed(!owner,'由执行者本人确认家规');g.rulesConfirmedAt=at;note(g,action,actor,at);
  } else if(action==='management-consent') {
    allowed(!owner,'角色管理范围由本人确认');
    allowed(typeof input.agreed==='boolean','请明确是否同意角色管理范围');
    g.managementConsent=input.agreed?{by:actor.id,at,scope:'growth-category'}:null;
    note(g,action,actor,at,{agreed:input.agreed});
  } else if(action==='configure') {
    requireOwner(owner);allowed(stages.includes(input.stage),'阶段无效');
    const affected=Object.entries(g.starts).some(([key,start])=>start.stage===input.stage);
    allowed(!affected,'这一阶段已经开始，不能追加或更改标准');
    const next={...g.rules[input.stage],...input.rules};
    allowed(Object.keys(next).every(k=>['tasks','days','rules'].includes(k)),'标准字段无效');
    g.rules[input.stage]=next;validateGrowth(g);note(g,action,actor,at,{stage:input.stage,rules:copy(next)});
  } else if(action==='begin') {
    allowed(!!target,'当前没有待开始的晋升阶段');
    if(!g.starts[target.key]){g.starts[target.key]={stage:target.stage,at,rules:copy(g.rules[target.stage])};note(g,action,actor,at,{key:target.key});}
  } else if(action==='choose') {
    allowed(growthOptions(g).includes(input.route),'此分类尚未解锁');
    if(owner){allowed(!!g.managementConsent,'需要执行者事先同意角色管理范围');allowed(nonempty(input.reason,1000),'主子改类需填写原因');}
    allowed(!g.exams.some(e=>activeStatuses.includes(e.status)),'请先完成或取消进行中的考核再改类');
    const previous=g.route;
    if(!g.routes[input.route])g.routes[input.route]={stars:1,selectedAt:at,history:[]};
    g.route=input.route;note(g,action,actor,at,{from:previous,to:input.route,reason:owner?input.reason.trim():'本人选择'});
  } else if(action==='service') {
    requireOwner(owner);allowed(source&&source.aliases?.length&&source.satisfied===true,'仅已完成且评价满意的普通任务可计入');
    const overlap=g.services.filter(e=>e.aliases.some(a=>source.aliases.includes(a)));
    if(overlap.length){
      // Union linked task/duty IDs, even when the link was added after review.
      const keep=overlap[0];keep.aliases=[...new Set([...source.aliases,...overlap.flatMap(e=>e.aliases)])];
      g.services=g.services.filter(e=>!overlap.includes(e)||e===keep);
      if(overlap.length>1)note(g,'service-merged',actor,at,{kept:keep.id,removed:overlap.slice(1).map(e=>e.id)});
    }else{
      allowed(!!progress?.started,'请先开始当前晋升阶段，再记录服务');
      allowed(!input.route||input.route===g.route,'不能把任务记入其他分类');
      g.services.push({id,aliases:[...new Set(source.aliases)],route:g.route,at,by:actor.id,title:source.title.slice(0,200)});
      note(g,action,actor,at,{serviceId:id,route:g.route,title:source.title.slice(0,200)});
    }
  } else if(action==='publish') {
    requireOwner(owner);allowed(progress?.ready,'服务次数或基础条件尚未达到考核门槛');
    allowed(!g.exams.some(e=>activeStatuses.includes(e.status)),'已有进行中的考核');
    allowed(nonempty(input.content)&&nonempty(input.criteria),'请写明普通非性任务内容和通过标准');
    allowed(input.nonsexual===true,'考核仅支持现实普通非性服务');
    allowed(!input.dueAt||Number.isFinite(Date.parse(input.dueAt)),'截止时间无效');
    const e={id,key:target.key,stage:target.stage,route:target.route,label:target.label,
      content:input.content.trim(),criteria:input.criteria.trim(),dueAt:input.dueAt||null,
      status:'published',createdAt:at,rules:copy(progress.rules),history:[{action,by:actor.id,at}]};
    g.exams.push(e);note(g,action,actor,at,{examId:id,label:e.label});
  } else if(['confirm','report','review','retry','defer','cancel','decline','stop'].includes(action)) {
    const e=currentExam();allowed(activeStatuses.includes(e.status),'考核已经结束');
    if(action==='confirm'){
      allowed(!owner&&e.status==='published','由执行者确认已发布的具体考核内容');onCurrent(e);e.status='confirmed';e.confirmedAt=at;
    }else if(action==='report'){
      allowed(!owner&&e.status==='confirmed','先确认具体内容，再提交完成情况');onCurrent(e);
      allowed(nonempty(input.report),'请填写普通非性服务的完成情况');e.report=input.report.trim();e.status='submitted';
    }else if(action==='review'){
      requireOwner(owner);allowed(e.status==='submitted','等待执行者提交后才能评价');onCurrent(e);
      allowed(['pass','improve'].includes(input.result),'评价无效');allowed(nonempty(input.comment,1000),'请填写考核评价');
      if(input.result==='pass')allowed(progress?.ready,'关联记录合并后条件不足，请补齐满意服务再验收');
      e.comment=input.comment.trim();e.status=input.result==='pass'?'passed':'improve';
      if(input.result==='pass'){
        allowed(input.satisfied===true,'必须明确确认“满意，通过”才能晋升');
        if(e.stage==='junior')g.base='junior';else if(e.stage==='formal')g.base='formal';
        else{const record=g.routes[e.route];record.stars=e.stage==='star2'?2:3;
          if(record.stars===2){record.star2ServiceIds=g.services.filter(s=>s.route===e.route).map(s=>s.id);record.star2Baseline=record.star2ServiceIds.length;}
          record.history.push({stars:record.stars,examId:e.id,by:actor.id,at});}
        note(g,'promoted',actor,at,{examId:e.id,identity:growthIdentity(g)});
      }
    }else if(action==='retry'){
      requireOwner(owner);allowed(['improve','deferred'].includes(e.status),'当前考核无需补考或恢复');onCurrent(e);
      e.status='published';delete e.confirmedAt;delete e.report; // Same content and criteria; renewed consent required.
    }else if(action==='defer'){
      allowed(['published','confirmed','submitted','improve'].includes(e.status),'当前考核不能延期');
      allowed(nonempty(input.reason,1000),'请写明延期原因');
      allowed(input.dueAt&&Number.isFinite(Date.parse(input.dueAt))&&Date.parse(input.dueAt)>Date.parse(at),'请选择未来的延期时间');
      e.dueAt=input.dueAt;e.status='deferred';
    }else if(action==='cancel'){
      requireOwner(owner);e.status='cancelled';
    }else{
      allowed(!owner,'由执行者本人拒绝或中止');
      if(action==='decline')allowed(e.status==='published','已确认的考核请使用中止');
      e.status=action==='decline'?'declined':'stopped';
    }
    e.history.push({action,by:actor.id,at,status:e.status,report:action==='report'?e.report:undefined,
      comment:action==='review'?e.comment:undefined,result:input.result,reason:input.reason,dueAt:e.dueAt});
    note(g,action,actor,at,{examId:e.id,status:e.status});
  } else fail('成长操作无效');
  g.requests.push(requestKey);validateGrowth(g);return true;
}
