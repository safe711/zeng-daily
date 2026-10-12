import {STORAGE_KEY, initialState, parseBackup, validateState} from './model.js';
let storageAccount=null;try{const s=JSON.parse(globalThis.localStorage?.getItem('daily-account-session'));if(s?.expires>Date.now()&&/^(?:ZENG-(?:DS|DZ)-\d{3}|ZENG_OWNER_\d{3})$/.test(s.profile?.id))storageAccount=s.profile.id;}catch{}
export function setStorageAccount(id){if(id!==null&&!/^(?:ZENG-(?:DS|DZ)-\d{3}|ZENG_OWNER_\d{3})$/.test(id))throw Error('账号编号无效');storageAccount=id;}
const stateKey=()=>storageAccount?STORAGE_KEY+':'+storageAccount:STORAGE_KEY;
export function readState(storage = localStorage) {
  const raw = storage.getItem(stateKey());
  return raw === null ? initialState() : parseBackup(raw);
}
export function writeState(state,storage = localStorage) {
  storage.setItem(stateKey(),JSON.stringify(validateState(state)));
  globalThis.dispatchEvent?.(new Event('daily-state-saved'));
}
