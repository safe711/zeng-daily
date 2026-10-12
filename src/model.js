import {subscriptionDefaults,validateSubscription} from './subscription.js';
export const STORAGE_KEY = 'zeng-daily-v1';
export const RITUAL_KINDS=['morning','noon','evening','gratitude'];
export const RITUAL_NAMES={morning:'晨间磕头请安',noon:'午间请安',evening:'晚间磕头请安',gratitude:'晚间谢恩'};
export const MAX_SHOES=20;
export const validMediaId=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function initialState() {
  return {version:4,masterGifts:[],giftSlots:18,anniversaries:[],subscription:subscriptionDefaults(),days:{},tasks:[{id:'shoe',title:'洗鞋',status:'active',confirmed:false,note:'已开展；具体要求尚未确认。',done:false,startDate:'',endDate:'',command:'',dailyReminder:false},{id:'socks',title:'袜子赏赐',status:'possible',confirmed:false,note:'可能的赏赐，尚未发生；不作为已获嘉奖。',done:false,startDate:'',endDate:'',command:'',dailyReminder:false}],shoeRecords:[],records:[],ledger:[],profile:{name:'',notes:''},settings:{hideOnLeave:true,paused:false,morning:'08:00',noon:'',evening:'21:00',gratitude:''}};
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function validateTaskSchedule(task) {
  if (![task.startDate,task.endDate].every(value=>value === '' || validDate(value))) throw Error('任务日期无效');
  if (task.startDate && task.endDate && task.endDate < task.startDate) throw Error('结束日期不能早于起始日期');
  if (typeof task.command !== 'string' || task.command.length > 10000 || typeof task.dailyReminder !== 'boolean') throw Error('任务命令或提醒选项无效');
}
export function taskInDateRange(task,date=dayKey()) {
  return (!task.startDate || date >= task.startDate) && (!task.endDate || date <= task.endDate);
}
export function taskReminders(state,date=dayKey()) {
  if (state.settings.paused) return [];
  return state.tasks.filter(task=>task.status === 'active' && !task.done && task.dailyReminder && taskInDateRange(task,date));
}
export function migrateState(state) {
  if (state?.version === 1 && Array.isArray(state.tasks)) {
    state={...state,version:2,tasks:state.tasks.map(task=>({startDate:'',endDate:'',command:'',dailyReminder:false,...task}))};
  }
  if(state?.version===2 && state.days && typeof state.days==='object' && !Array.isArray(state.days) && state.settings) {
    const days=Object.fromEntries(Object.entries(state.days).map(([date,entry])=>{
      if(!entry || typeof entry!=='object' || Array.isArray(entry))return [date,entry];
      const upgraded={...entry};
      if(upgraded.evening!==undefined){upgraded.legacyEvening=upgraded.evening;delete upgraded.evening;}
      return [date,upgraded];
    }));
    state={...state,version:3,days,settings:{noon:'',gratitude:'',...state.settings}};
  }
  if(state?.version===3)state={...state,version:4,subscription:subscriptionDefaults()};
  if(state?.version===4&&state.shoeRecords===undefined)state={...state,shoeRecords:[]};
  if(state?.version===4)state={masterGifts:[],giftSlots:18,...state};
  return state;
}
export function validateState(state) {
  const string = value => typeof value === 'string' && value.length <= 10000;
  if (!state || state.version !== 4 || !state.days || typeof state.days !== 'object' || Array.isArray(state.days)) throw Error('备份版本或结构无效');
  validateSubscription(state.subscription);
  validateGifts(state);
  if(state.servantProfile!==undefined){const p=state.servantProfile;if(!p||typeof p.duties!=='string'||!p.duties.trim()||p.duties.length>1000||!(p.photoId===null||validMediaId(p.photoId)))throw Error('本人档案信息无效');}

  if(state.anniversaries!==undefined){if(!Array.isArray(state.anniversaries)||state.anniversaries.length>2000)throw Error('天数记录列表无效');const ids=new Set();for(const r of state.anniversaries){if(!r||!validMediaId(r.id)||ids.has(r.id)||typeof r.title!=='string'||!r.title.trim()||r.title.length>200||!validDate(r.startDate)||!['inclusive','elapsed'].includes(r.countMode)||!['already','ordinal','countdown'].includes(r.display)||typeof r.pinned!=='boolean'||r.source!=='daysmatter'||!validDate(r.referenceDate)||!Number.isSafeInteger(r.sharedDays)||r.sharedDays<0||r.sharedDays>3652058||typeof r.sourceText!=='string'||r.sourceText.length>1000||![r.createdAt,r.updatedAt].every(t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t))throw Error('天数记录内容无效');ids.add(r.id);}}

  if(state.identityContract!==undefined){const r=state.identityContract;
    if(!r||!validMediaId(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>40||typeof r.pledge!=='string'||r.pledge!=='本人'+r.name+'，自愿遵守曾家家规，作为狗奴才加入曾家。自此以守护曾家人的利益，提高曾家人的生活为责任，服务曾家，永不背叛。'||!Number.isFinite(Date.parse(r.signedAt))||new Date(r.signedAt).toISOString()!==r.signedAt||!['videoHash','signatureHash'].every(k=>typeof r[k]==='string'&&/^[a-f0-9]{64}$/.test(r[k]))||r.nasPath!=='曾家家奴/固定档案/'+r.id)throw Error('身份契约记录无效');
  }
  for (const [date,entry] of Object.entries(state.days)) {
    if (!validDate(date) || !entry || typeof entry!=='object' || Array.isArray(entry) || ![...RITUAL_KINDS,'legacyEvening'].every(kind => entry[kind] === undefined || string(entry[kind]))) throw Error('日课数据无效');
    if (entry.morningPhotoId!==undefined && (typeof entry.morningPhotoId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(entry.morningPhotoId))) throw Error('日课照片编号无效');
    if (entry.morningPhrase!==undefined && !string(entry.morningPhrase)) throw Error('请安文字无效');
    if(entry.ritualMeta!==undefined) {
      if(!entry.ritualMeta || typeof entry.ritualMeta!=='object' || Array.isArray(entry.ritualMeta))throw Error('礼仪详情无效');
      for(const [kind,meta] of Object.entries(entry.ritualMeta)) {
        if(!RITUAL_KINDS.includes(kind) || !meta || !string(meta.phrase) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(meta.completedAt) || !Number.isFinite(Date.parse(meta.completedAt)) || new Date(meta.completedAt).toISOString()!==meta.completedAt || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(meta.completedTime) || (meta.photoId!==undefined && (typeof meta.photoId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(meta.photoId))))throw Error('礼仪时间或照片关联无效');
        if(entry[kind]===undefined)throw Error('礼仪详情缺少完成记录');
      }
    }
  }
  for (const field of ['tasks','records','ledger']) if (!Array.isArray(state[field]) || state[field].length > 20000) throw Error('备份列表无效');
  const ids = new Set();
  for (const task of state.tasks) {
    if (!task || !string(task.id) || ids.has(task.id) || !string(task.title) || !task.title.trim() || !string(task.note) || !['active','possible','archived'].includes(task.status) || typeof task.confirmed !== 'boolean' || typeof task.done !== 'boolean') throw Error('任务数据无效');
    for(const field of ['publisher','executor'])if(task[field]!==undefined&&(!string(task[field])||task[field].length>100))throw Error('任务发布主子或执行奴才信息无效');
    validateTaskSchedule(task);
    if(task.type!==undefined&&!['shoe','laundry','homework','custom'].includes(task.type))throw Error('任务类型无效');
    for(const field of ['startedAt','completedAt'])if(task[field]!==undefined&&task[field]!==''&&!Number.isFinite(Date.parse(task[field])))throw Error('任务实际时间无效');
    for(const field of ['plannedStart','plannedEnd'])if(task[field]!==undefined&&task[field]!==''&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(task[field]))throw Error('任务计划时间无效');
    if(task.plannedStart&&task.plannedEnd&&task.plannedEnd<task.plannedStart)throw Error('结束时间不能早于开始时间');
    if(task.photoIds!==undefined&&(!Array.isArray(task.photoIds)||task.photoIds.length>32||new Set(task.photoIds).size!==task.photoIds.length||task.photoIds.some(id=>!validMediaId(id))))throw Error('任务照片关联无效');

    ids.add(task.id);
  }
  if(!Array.isArray(state.shoeRecords)||state.shoeRecords.length>2000)throw Error('洗鞋记录列表无效');
  const shoeRecordIds=new Set();const shoeIds=new Set();const shoePhotoIds=new Set();
  const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  for(const record of state.shoeRecords){
    if(!record||!Object.keys(record).every(key=>['id','taskId','taskTitle','date','note','createdAt','updatedAt','savedAt','shoes','taskDetails'].includes(key))||!validMediaId(record.id)||shoeRecordIds.has(record.id)||!ids.has(record.taskId)||!string(record.taskTitle)||!record.taskTitle.trim()||!validDate(record.date)||!string(record.note)||record.note.length>2000||!timestamp(record.createdAt)||!timestamp(record.updatedAt)||record.updatedAt<record.createdAt||!(record.savedAt===''||timestamp(record.savedAt)&&record.savedAt>=record.createdAt&&record.savedAt<=record.updatedAt)||!Array.isArray(record.shoes)||!record.shoes.length||record.shoes.length>MAX_SHOES)throw Error('洗鞋记录结构无效');
    shoeRecordIds.add(record.id);
    for(const shoe of record.shoes){
      if(!shoe||!Object.keys(shoe).every(key=>['id','beforePhotoId','afterPhotoId','beforePhotoIds','afterPhotoIds','completedAt'].includes(key))||!validMediaId(shoe.id)||shoeIds.has(shoe.id))throw Error('鞋子编号无效或重复');
      shoeIds.add(shoe.id);
      if(shoe.completedAt!==undefined&&shoe.completedAt!==''&&!timestamp(shoe.completedAt))throw Error('鞋子完成时间无效');
      for(const phase of ['before','after'])if(shoe[phase+'PhotoIds']!==undefined){const list=shoe[phase+'PhotoIds'];if(!Array.isArray(list)||list.length>8||new Set(list).size!==list.length||list.some(id=>!validMediaId(id))||list.length&&shoe[phase+'PhotoId']!==list[0])throw Error('鞋子多张照片关联无效');for(const id of list.slice(1)){if(shoePhotoIds.has(id))throw Error('照片重复关联');shoePhotoIds.add(id);}}

      for(const field of ['beforePhotoId','afterPhotoId']){
        const id=shoe[field];if(id!==null&&(!validMediaId(id)||shoePhotoIds.has(id)))throw Error('洗鞋照片关联无效或重复');
        if(id!==null)shoePhotoIds.add(id);if(record.savedAt&&id===null)throw Error('已保存洗鞋记录缺少前后照片');
      }
    }
  }
  for (const record of state.records) if (!record || !string(record.text) || !string(record.date)) throw Error('记录无效');
  for (const entry of state.ledger) if (!entry || !Number.isSafeInteger(entry.points) || Math.abs(entry.points)>1000 || !['reward','warning','daily','task'].includes(entry.kind) || !string(entry.text) || !string(entry.date)) throw Error('积分数据无效');
  if (!state.profile || !string(state.profile.name) || !string(state.profile.notes) || !state.settings || typeof state.settings.hideOnLeave !== 'boolean' || typeof state.settings.paused !== 'boolean' || !RITUAL_KINDS.every(kind => state.settings[kind]==='' || /^([01]\d|2[0-3]):[0-5]\d$/.test(state.settings[kind]))) throw Error('设置无效');
  return state;
}
export function parseBackup(text) {
  if (text.length > 5_000_000) throw Error('备份超过 5 MB');
  return structuredClone(validateState(migrateState(JSON.parse(text))));
}
export function points(state) { return state.ledger.reduce((total,entry) => total + entry.points,0); }
export function daily(state,kind,text,date=dayKey()) {
  if (state.settings.paused) throw Error('日课已暂停');
  if (!RITUAL_KINDS.includes(kind) || !text.trim()) throw Error('请填写日课内容');
  const entry = state.days[date] ||= {};
  if (entry[kind] !== undefined) throw Error('今日已记录，可在档案中查看');
  entry[kind] = text.trim();
  state.ledger.push({date,kind:'daily',points:2,text:RITUAL_NAMES[kind]});
}
export function completeTask(state,id,date=dayKey()) {
  if (state.settings.paused) throw Error('日课已暂停');
  const task = state.tasks.find(item=>item.id===id);
  if (!task || task.status !== 'active' || task.done) throw Error('任务不可完成或已完成');
  if (!taskInDateRange(task,date)) throw Error('当前日期不在任务起止日期内，请编辑日期或记录到侍奉记录');
  task.done = true;
  task.completedAt=new Date().toISOString();
  state.records.push({date,text:`完成任务：${task.title}`});
  state.ledger.push({date,kind:'task',points:3,text:task.title});
}
function editableShoeRecord(state,id){
  if(state.settings.paused)throw Error('日课已暂停');
  const record=state.shoeRecords.find(item=>item.id===id);if(!record)throw Error('洗鞋记录不存在');
  return record;
}
export function createShoeRecord(state,taskId,date=dayKey(),now=new Date()){
  if(state.settings.paused)throw Error('日课已暂停');
  const task=state.tasks.find(item=>item.id===taskId);
  if(!task||task.status!=='active')throw Error('请为已开展的洗鞋任务添加记录');
  if(!validDate(date)||date>dayKey(now))throw Error('请选择实际洗鞋日期，不可晚于今天');
  if(state.shoeRecords.length>=2000)throw Error('洗鞋记录已达上限，请先备份');
  const timestamp=now.toISOString();
  const record={id:crypto.randomUUID(),taskId,taskTitle:task.title,date,note:'',createdAt:timestamp,updatedAt:timestamp,savedAt:'',shoes:[{id:crypto.randomUUID(),beforePhotoId:null,afterPhotoId:null}]};
  state.shoeRecords.push(record);return record.id;
}
export function addShoe(state,recordId){
  const record=editableShoeRecord(state,recordId);if(record.shoes.length>=MAX_SHOES)throw Error(`每次记录最多添加 ${MAX_SHOES} 双鞋`);
  record.shoes.push({id:crypto.randomUUID(),beforePhotoId:null,afterPhotoId:null});record.savedAt='';record.updatedAt=new Date().toISOString();
}
export function removeEmptyShoe(state,recordId,shoeId){
  const record=editableShoeRecord(state,recordId);const shoe=record.shoes.find(item=>item.id===shoeId);
  if(!shoe||record.shoes.length<=1||shoe.beforePhotoId||shoe.afterPhotoId)throw Error('仅可移除尚未添加照片的空项，至少保留一双鞋');
  record.shoes=record.shoes.filter(item=>item.id!==shoeId);record.savedAt='';record.updatedAt=new Date().toISOString();
}
export function attachShoePhoto(state,recordId,shoeId,phase,photoId){
  const record=editableShoeRecord(state,recordId);const shoe=record.shoes.find(item=>item.id===shoeId);
  if(!shoe||!['before','after'].includes(phase)||!validMediaId(photoId))throw Error('鞋子或洗前洗后照片编号无效');
  shoe[`${phase}PhotoId`]=photoId;record.savedAt='';record.updatedAt=new Date().toISOString();
}
export function saveShoeRecord(state,recordId,note,now=new Date()){
  const record=editableShoeRecord(state,recordId);
  if(typeof note!=='string'||note.length>2000)throw Error('洗鞋备注不能超过 2000 字');
  if(record.shoes.some(shoe=>!shoe.beforePhotoId||!shoe.afterPhotoId))throw Error('请为每双鞋补齐洗之前、洗之后的照片');
  record.note=note.trim();record.savedAt=now.toISOString();record.updatedAt=record.savedAt;
  const text=`${record.taskTitle} · ${record.shoes.length} 双鞋前后对照照片已保存在本机${record.note?`\n${record.note}`:''}`;
  const previous=state.records.find(item=>item.shoeRecordId===record.id);
  if(previous){previous.date=record.date;previous.text=text;}else state.records.push({date:record.date,text,shoeRecordId:record.id});
}

export const GIFT_ICONS=['socks','shoes','underwear','pen','gift'];
export function validateGifts(state){
 const gifts=state.masterGifts??[],slots=state.giftSlots??18;
 if(!Array.isArray(gifts)||!Number.isSafeInteger(slots)||slots<18||slots>1200||slots%6!==0||gifts.length>=slots)throw Error('赏赐收藏格数无效');
 const ids=new Set(),occupied=new Set();
 const stamp=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
 for(const g of gifts){
  if(!g||!validMediaId(g.id)||ids.has(g.id)||!Number.isSafeInteger(g.slot)||g.slot<0||g.slot>=slots-1||occupied.has(g.slot)||!['master','item'].every(k=>typeof g[k]==='string'&&g[k].trim()&&g[k].length<=100)||!GIFT_ICONS.includes(g.icon)||!validDate(g.date)||typeof g.note!=='string'||g.note.length>2000||!stamp(g.createdAt)||!stamp(g.updatedAt)||g.updatedAt<g.createdAt)throw Error('赏赐收藏内容无效');
  ids.add(g.id);occupied.add(g.slot);
 }
}
export function expandGiftSlots(state){
 if(state.settings.paused)throw Error('日课已暂停');
 validateGifts(state);const slots=state.giftSlots??18;if(slots>=1200)throw Error('收藏格已达上限');state.giftSlots=slots+6;
}
export function saveGift(state,{slot,id,master,item,icon,date,note},now=new Date()){
 if(state.settings.paused)throw Error('日课已暂停');
 validateGifts(state);
 const gifts=state.masterGifts??[],slots=state.giftSlots??18,previous=id?gifts.find(g=>g.id===id):null;
 if(id&&!previous)throw Error('这份赏赐已变化，请重新打开');
 if(previous&&previous.slot!==slot||gifts.some(g=>g.slot===slot&&g.id!==id))throw Error('收藏格已占用');
 const stamp=now.toISOString(),record={id:previous?.id??crypto.randomUUID(),slot,master:master.trim(),item:item.trim(),icon,date,note:note.trim(),createdAt:previous?.createdAt??stamp,updatedAt:stamp};
 const next={...state,masterGifts:previous?gifts.map(g=>g.id===id?record:g):[...gifts,record],giftSlots:slots};
 validateGifts(next);
 if(next.masterGifts.length===slots-1&&slots<1200)next.giftSlots+=6;
 state.masterGifts=next.masterGifts;state.giftSlots=next.giftSlots;return record.id;
}
