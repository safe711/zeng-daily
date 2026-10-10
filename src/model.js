import {subscriptionDefaults,validateSubscription} from './subscription.js';
export const STORAGE_KEY = 'zeng-daily-v1';
export const RITUAL_KINDS=['morning','noon','evening','gratitude'];
export const RITUAL_NAMES={morning:'晨间磕头请安',noon:'午间请安',evening:'晚间磕头请安',gratitude:'晚间谢恩'};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function initialState() {
  return {version:4,subscription:subscriptionDefaults(),days:{},tasks:[{id:'shoe',title:'洗鞋',status:'active',confirmed:false,note:'已开展；具体要求尚未确认。',done:false,startDate:'',endDate:'',command:'',dailyReminder:false},{id:'socks',title:'袜子赏赐',status:'possible',confirmed:false,note:'可能的赏赐，尚未发生；不作为已获嘉奖。',done:false,startDate:'',endDate:'',command:'',dailyReminder:false}],records:[],ledger:[],profile:{name:'',notes:''},settings:{hideOnLeave:true,paused:false,morning:'08:00',noon:'',evening:'21:00',gratitude:''}};
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
  return state;
}
export function validateState(state) {
  const string = value => typeof value === 'string' && value.length <= 10000;
  if (!state || state.version !== 4 || !state.days || typeof state.days !== 'object' || Array.isArray(state.days)) throw Error('备份版本或结构无效');
  validateSubscription(state.subscription);
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
    validateTaskSchedule(task);
    ids.add(task.id);
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
  state.records.push({date,text:`完成任务：${task.title}`});
  state.ledger.push({date,kind:'task',points:3,text:task.title});
}
