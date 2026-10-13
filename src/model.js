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
  for(const payment of state.subscription.payments)if(payment.disasterMemberIds!==undefined&&(!Array.isArray(payment.disasterMemberIds)||payment.disasterMemberIds.length!==2||new Set(payment.disasterMemberIds).size!==2||payment.disasterMemberIds.some(id=>!['ZENG-DZ-001','ZENG-DZ-002'].includes(id))))throw Error('请选择两位挡灾奴');
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
  validateAchievements(state);refreshAchievements(state);validateEstate(state.estate);
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

export const ACHIEVEMENT_CATEGORIES=['连续守礼','累计守礼','侍奉任务','主子赏赐','主子评价'];
export const ACHIEVEMENT_RANKS=['普通','精良','稀有','史诗','传说','至尊'];
const achievementSeries=[
 ['streak',0,['初识奴规','一月守礼','恪守本分','百日门槛','半载不怠','终岁忠勤'],[7,30,60,90,180,365],['七日守礼，初入规矩之门。','三十日礼仪不断，初显勤谨。','六十日持之以恒，渐成习惯。','九十日连续守礼，迈向百日之境。','半载礼仪未曾中断，勤勉可鉴。','整整一年守礼不辍，荣登年度功勋。'],['calendar','chain','knot','gate','flame','phoenix']],
 ['total',1,['奴籍初记','十日勤礼','三十日修习','百日奉礼','半年勤侍','岁月为证','千日守候','三年如一','五载奉礼','十载不忘'],[1,10,30,100,180,365,1000,1095,1825,3650],['第一日礼仪完成，奴籍功勋正式启录。','十日礼仪积累，勤勉初见。','累计三十日，礼仪修习渐入正轨。','百日积累，留下百次守礼印记。','累计半载，日课功勋渐渐厚。','三百六十五日的坚持，皆有记录。','千日礼仪积累，铸就珍贵功勋。','三年之数，守礼之志历久弥坚。','五载礼仪记载，成就非凡资历。','十载岁月凝为功勋，登临最高荣誉。'],['scroll','pages','book','clock','hourglass','sun','bell','rings','palace','eternity']],
 ['task',2,['初领主命','五令奉行','十令不怠','勤侍之奴','百令奉行','二百令勤侍','五百令奉行','千令功勋'],[1,5,10,25,100,200,500,1000],['首次接受并完成主子布置的角色任务。','五项任务完成，初显执行能力。','十项任务记录，行动有始有终。','二十五次任务完成，勤勉有迹可循。','百项任务达成，获记百令功勋。','两百次任务积累，表现稳健。','五百次任务完成，成就卓著。','千项任务达成，荣获千令勋章。'],['seal','dossier','tools','shield','banner','tower','scepter','dragon']],
 ['gift',3,['初蒙赏赐','五度蒙赏','十次恩赏','恩赏累累','百赏荣录','珍藏之奴'],[1,5,10,25,100,200],['首次获得主子给予的角色赏赐。','五次赏赐记录，值得珍藏。','十度蒙赏，荣誉渐丰。','二十五次赏赐，累积珍贵回忆。','百次赏赐载入奴籍荣誉册。','两百次赏赐，成就珍藏级荣誉。'],['gift','bouquet','gem','chest','crown','treasure']],
 ['good',4,['初获嘉许','五次称许','十度嘉奖','勤侍有功','百次嘉许','荣誉满籍'],[1,5,10,25,100,200],['首次获得主子肯定，留下第一枚嘉许印记。','五度受到肯定，表现获得认可。','十次好评，荣誉持续积累。','二十五次嘉许，勤勉表现有目共睹。','百次好评，荣登嘉许功勋榜。','两百次好评，获得最高级嘉许徽章。'],['star','ribbon','laurel','radiance','wings','trophy']],
 ['neutral',4,['初受审视','尚有不足','十次自省','勤省己过','百次磨砺'],[1,5,10,25,100],['首次获得中等评价，记录改进方向。','五次中评，提醒继续完善表现。','十次中评，积累值得反思的经验。','二十五次中评，记录成长与调整。','百次中评记录，见证漫长的磨砺历程。'],['eye','mirror','balance','hammer','mountain']],
 ['bad',4,['初受训诫','五次警醒','十次记过','二十五次反省','百次训诫录'],[1,5,10,25,100],['首次获得差评，留下警醒记录。','五次差评，提醒重视不足。','十次差评记录，提示改进表现。','二十五次差评，汇集需要改进的经历。','百次差评记录，形成完整的反省档案。'],['warning','bolt','crack','thorn','chains']]
];
export const ACHIEVEMENTS=achievementSeries.flatMap(([series,category,names,thresholds,descriptions,motifs])=>names.map((name,i)=>({id:series+'-'+thresholds[i],series,category,name,threshold:thresholds[i],description:descriptions[i],motif:motifs[i],stage:i,rank:ACHIEVEMENT_RANKS[Math.round(i*5/(names.length-1))],condition:(series==='streak'?'连续完成每日全部礼仪':series==='total'?'累计完成每日全部礼仪':series==='task'?'完成侍奉任务':series==='gift'?'获得主子赏赐':({good:'获得好评',neutral:'获得中评',bad:'获得差评'})[series])+thresholds[i]+(['streak','total'].includes(series)?'天':'次')})));
const achievementDate=t=>t&&Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t)):null;
export function achievementStats(state,now=new Date()){
 const today=achievementDate(now.toISOString()),events=new Map((state.achievementEvents||[]).filter(e=>!['good','neutral','bad'].includes(e.series)).map(e=>[e.key,e]));
 const add=(key,series,date,at)=>{if(!validDate(date)||date>today)return;const event={key,series,date,at:at&&Number.isFinite(Date.parse(at))?new Date(at).toISOString():null};const old=events.get(key);if(!old)events.set(key,event);else if(!old.at&&event.at)events.set(key,event);};
 for(const [date,entry]of Object.entries(state.days||{}))if(RITUAL_KINDS.every(k=>!!entry[k])){const times=RITUAL_KINDS.map(k=>entry.ritualMeta?.[k]?.completedAt);add('day:'+date,'total',date,times.every(Boolean)?times.sort().at(-1):null);}
 const ledgerCounts=new Map();for(const e of state.ledger||[])if(e.kind==='task'){const key=e.date+':'+e.text;ledgerCounts.set(key,(ledgerCounts.get(key)||0)+1);}
 const matched=new Map();for(const task of state.tasks||[])if(task.done){const date=achievementDate(task.completedAt)||state.ledger.find(e=>e.kind==='task'&&e.text===task.title)?.date,key=date+':'+task.title,n=(matched.get(key)||0)+1;matched.set(key,n);add(n<=(ledgerCounts.get(key)||0)?'task-ledger:'+key+':'+n:'task:'+task.id,'task',date,task.completedAt);}
 const duplicate=new Map();for(const e of state.ledger||[])if(e.kind==='task'){const key=e.date+':'+e.text,n=(duplicate.get(key)||0)+1;duplicate.set(key,n);add('task-ledger:'+key+':'+n,'task',e.date,null);}
 for(const gift of state.masterGifts||[])add('gift:'+gift.id,'gift',gift.date,gift.createdAt||null);
 for(const review of state.ownerReviews||[]){const series=({satisfied:'good',neutral:'neutral',angry:'bad'})[review.rating];if(series)add('review:'+(review.eventId||review.key||review.context+':'+review.date+':'+review.taskId),series,achievementDate(review.createdAt)||review.date,review.createdAt);}
 const all=[...events.values()].map(e=>({...e,series:e.series.trim()})).sort((a,b)=>a.date.localeCompare(b.date)||(a.at||'').localeCompare(b.at||'')||a.key.localeCompare(b.key));
 const totals=all.filter(e=>e.series==='total'),runs=[];let run=0,previous='';for(const e of totals){const gap=previous?(Date.parse(e.date+'T12:00:00Z')-Date.parse(previous+'T12:00:00Z'))/86400000:0;run=gap===1?run+1:1;runs.push({...e,count:run});previous=e.date;}
 const elapsed=previous?(Date.parse(today+'T12:00:00Z')-Date.parse(previous+'T12:00:00Z'))/86400000:Infinity;
 const progress={streak:elapsed<=1?run:0};for(const series of ['total','task','gift','good','neutral','bad'])progress[series]=all.filter(e=>e.series===series).length;
 return {events:all,runs,progress};
}
export function refreshAchievements(state,now=new Date()){
 const stats=achievementStats(state,now);state.achievements||={};state.achievementEvents=stats.events;
 for(const a of ACHIEVEMENTS){const reactive=['good','neutral','bad'].includes(a.series),old=state.achievements[a.id];if(old&&!reactive)continue;const hit=a.series==='streak'?stats.runs.find(e=>e.count>=a.threshold):stats.events.filter(e=>e.series===a.series)[a.threshold-1];if(hit)state.achievements[a.id]={date:hit.date,at:hit.at,observedAt:old?.observedAt||now.toISOString(),memoryId:old?.memoryId||null};else if(reactive)delete state.achievements[a.id];}
 return stats;
}
export function mergeAchievementHistory(state,previous){const incoming=state.achievements||{};state.achievements={...incoming};for(const [id,record]of Object.entries(previous?.achievements||{}))state.achievements[id]={...record,memoryId:incoming[id]?.memoryId||record.memoryId||null};const events=new Map((previous?.achievementEvents||[]).map(e=>[e.key,e]));for(const e of state.achievementEvents||[])if(!events.has(e.key)||!events.get(e.key).at)events.set(e.key,e);state.achievementEvents=[...events.values()];return state;}
export function validateAchievements(state){
 if(state.achievements!==undefined){if(!state.achievements||Array.isArray(state.achievements)||typeof state.achievements!=='object')throw Error('成就记录无效');for(const [id,r]of Object.entries(state.achievements)){if(!ACHIEVEMENTS.some(a=>a.id===id)||!r||!validDate(r.date)||!(r.at===null||typeof r.at==='string'&&Number.isFinite(Date.parse(r.at)))||typeof r.observedAt!=='string'||!Number.isFinite(Date.parse(r.observedAt))||!(r.memoryId===null||r.memoryId===undefined||validMediaId(r.memoryId)))throw Error('成就达成记录无效');}}
 if(state.achievementEvents!==undefined){if(!Array.isArray(state.achievementEvents)||state.achievementEvents.length>50000)throw Error('成就事件记录无效');const keys=new Set();for(const e of state.achievementEvents){if(!e||typeof e.key!=='string'||e.key.length>1000||keys.has(e.key)||!['total','task','gift','good','neutral','bad'].includes(e.series)||!validDate(e.date)||!(e.at===null||typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))))throw Error('成就事件内容无效');keys.add(e.key);}}
}

export const ESTATE_SCENES=['bedroom','courtyard','shrine'];
export const ESTATE_SCENE_NAMES={bedroom:'主子卧室',courtyard:'曾家前院',shrine:'曾家祠堂'};
const estateItems=[
 ['plain','素色侍从服',100,'slave','top','#b3ac91'],['linen','粗布短衣',120,'slave','top','#867252'],['black-collar','黑金项圈装饰',180,'slave','collar','#252323'],['crest','曾家纹章服',350,'slave','top','#487777'],['silk','锦缎礼服',800,'owner','top','#893c42'],['gold-suit','典藏金纹套装',2000,'owner','top','#a17a32'],
 ['bench','木凳',80,'both','furniture','courtyard'],['mat','草席',100,'both','furniture','courtyard'],['box','木质收纳箱',150,'both','furniture','courtyard'],['stone-lamp','石雕灯座',250,'both','furniture','courtyard'],['post','雕花木桩',300,'both','furniture','courtyard'],['cushion','锦纹软垫',400,'both','furniture','courtyard'],['flowers','花圃',450,'both','furniture','courtyard'],['lion','庭院石狮',1200,'both','furniture','courtyard'],
 ['shelf','木质书架',150,'owner','furniture','bedroom'],['lamp','琉璃宫灯',250,'owner','furniture','bedroom'],['desk','紫檀书案',500,'owner','furniture','bedroom'],['screen','山水屏风',700,'owner','furniture','bedroom'],['bed','雕花大床',1500,'owner','furniture','bedroom'],['cabinet','金漆展示柜',1800,'owner','furniture','bedroom'],
 ['leash','装饰牵引绳',100,'both','prop','rope'],['station-mark','门口系留标记',150,'both','prop','marker'],['ball','礼物玩具球',120,'both','prop','ball'],['gift-shoes','虚拟鞋履收藏',250,'both','prop','shoes'],['tray','专属礼物托盘',300,'both','furniture','courtyard'],['gold-effect','金纹互动特效',800,'both','effect','#eec770'],
 ['plate','供盘',80,'both','furniture','shrine'],['candle','烛台',120,'both','furniture','shrine'],['incense','香炉',200,'both','furniture','shrine'],['prayer-mat','祈愿蒲团',250,'both','furniture','shrine'],['lantern','朱红灯笼',300,'both','furniture','shrine'],['halo','红色祈愿光环',600,'both','effect','#be6265'],['altar','古纹祭坛',1500,'both','furniture','shrine'],
 ['bone','像素骨头',20,'both','food','bone'],['fish','像素鱼骨',20,'both','food','fish'],['rice','像素剩饭碗',20,'both','food','rice'],['prayer-incense','祈愿香火',50,'both','food','incense'],['festival','节庆供品盒',120,'both','food','festival'],['charm','金色祈愿符',200,'both','food','charm'],
 ['owner-base','主子常服',0,'owner','top','#984c39'],['slave-base','奴才常服',0,'slave','top','#9a8b68'],['dark-pants','墨色下装',60,'both','bottom','#3d4053'],['brocade-pants','锦纹下装',160,'owner','bottom','#783b44'],['cloth-shoes','布鞋',60,'both','shoes','#453b34'],['gold-shoes','金纹履',220,'owner','shoes','#c5a456'],['hair-short','短发',0,'both','hair','short'],['hair-long','长发',0,'both','hair','long'],['hair-brown','栗色发色',80,'both','hairColor','#7a4832'],['jade-pin','翡翠簪',150,'owner','head','#589e86'],['crown','金冠',400,'owner','head','#e4b85b'],['book-hand','手持书卷',100,'both','hand','book'],
 ['red-collar','朱红织锦项圈',100,'slave','collar','#b83e42'],['blue-collar','青蓝菱纹项圈',140,'slave','collar','#438ba2'],['pink-collar','粉绒蝴蝶结项圈',160,'slave','collar','#d18eae'],['leather-collar','棕皮铆钉项圈',170,'slave','collar','#805537'],['jade-collar','翡翠珠链项圈',260,'slave','collar','#5da28b'],['bell-collar','金铃编绳项圈',220,'slave','collar','#d7b865'],['bone-collar','骨牌格纹项圈',200,'slave','collar','#6b719c'],['royal-collar','典藏金纹项圈',600,'slave','collar','#453364']
];
export const ESTATE_CATALOG=estateItems.map(([id,name,cost,role,kind,style])=>({id,name,cost,role,kind,style}));
export function estateDefaults(role='slave'){return {version:1,owned:{'owner-base':role==='owner'?1:0,'slave-base':role==='owner'?0:1,'hair-short':1,'hair-long':1,bone:3},spent:0,transactions:[],layout:[],gifts:[],allowInteraction:false,avatar:{skin:'#e7b891',hair:role==='owner'?'long':'short',hairColor:'#45312b',expression:'calm',top:role==='owner'?'owner-base':'slave-base',bottom:null,shoes:null,head:null,hand:null,collar:null},privacy:{showNumber:true,showGiftNote:false}};}
export function estateBalance(state,estate=state.estate||estateDefaults()){const bonus=Object.keys(state.achievements||{}).map(id=>ACHIEVEMENTS.find(a=>a.id===id)).filter(a=>a&&!['neutral','bad'].includes(a.series)).reduce((n,a)=>n+[5,10,20,35,60,100][ACHIEVEMENT_RANKS.indexOf(a.rank)],0);return {earned:points(state),bonus,spent:estate.spent,available:Math.max(0,points(state)+bonus-estate.spent)};}
export function validateEstate(e){if(e===undefined)return;if(!e||e.version!==1||!e.owned||typeof e.owned!=='object'||Array.isArray(e.owned)||!Number.isSafeInteger(e.spent)||e.spent<0||e.spent>100000000||typeof e.allowInteraction!=='boolean'||!Array.isArray(e.transactions)||e.transactions.length>5000||!Array.isArray(e.layout)||e.layout.length>30||!Array.isArray(e.gifts)||e.gifts.length>2000)throw Error('府邸存档无效');for(const [id,n]of Object.entries(e.owned))if(!ESTATE_CATALOG.some(i=>i.id===id)||!Number.isSafeInteger(n)||n<0||n>99999)throw Error('府邸收藏无效');const a=e.avatar;if(!a||!['skin','hair','hairColor','expression','top','bottom','shoes','head','hand','collar'].every(k=>k in a)||!/^#[a-f0-9]{6}$/i.test(a.skin)||!/^#[a-f0-9]{6}$/i.test(a.hairColor)||!['short','long'].includes(a.hair)||!['calm','smile','serious'].includes(a.expression))throw Error('纸娃娃配置无效');for(const key of ['top','bottom','shoes','head','hand','collar'])if(a[key]!==null&&(!ESTATE_CATALOG.some(i=>i.id===a[key]&&i.kind===key)||!e.owned[a[key]]))throw Error('未拥有此装扮');const ids=new Set();for(const p of e.layout){if(!ESTATE_CATALOG.some(i=>i.id===p.itemId&&['furniture','prop'].includes(i.kind))||!e.owned[p.itemId]||ids.has(p.itemId)||!ESTATE_SCENES.includes(p.scene)||!Number.isInteger(p.x)||p.x<40||p.x>600||!Number.isInteger(p.y)||p.y<225||p.y>320||![0,1].includes(p.turn))throw Error('家具布局无效');ids.add(p.itemId);}for(const t of e.transactions)if(!t||typeof t.requestId!=='string'||t.requestId.length>100||!ESTATE_CATALOG.some(i=>i.id===t.itemId)||!Number.isSafeInteger(t.cost)||t.cost<0||!Number.isFinite(Date.parse(t.at)))throw Error('府邸交易流水无效');for(const g of e.gifts)if(!g||typeof g.id!=='string'||!ESTATE_CATALOG.some(i=>i.id===g.itemId)||typeof g.by!=='string'||typeof g.note!=='string'||g.note.length>200||!Number.isFinite(Date.parse(g.at)))throw Error('府邸赠礼无效');if(!e.privacy||typeof e.privacy.showNumber!=='boolean'||typeof e.privacy.showGiftNote!=='boolean')throw Error('府邸留影设置无效');}
export function purchaseEstateItem(state,estate,id,requestId,role,now=new Date()){const item=ESTATE_CATALOG.find(i=>i.id===id);if(!item||typeof requestId!=='string'||!requestId||requestId.length>100)throw Error('商品或交易编号无效');if(estate.transactions.some(t=>t.requestId===requestId))return false;if(role!=='owner'&&item.role==='owner')throw Error('此商品为主子专用');if(estate.owned[id]&&item.kind!=='food')return false;if(estateBalance(state,estate).available<item.cost)throw Error('可用忠诚积分不足');if(estate.transactions.length>=5000)throw Error('交易记录已满');estate.spent+=item.cost;estate.owned[id]=(estate.owned[id]||0)+1;estate.transactions.push({requestId,itemId:id,cost:item.cost,at:now.toISOString()});validateEstate(estate);return true;}
