import {STORAGE_KEY, initialState, parseBackup, validateState} from './model.js';
export function readState(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? initialState() : parseBackup(raw);
}
export function writeState(state,storage = localStorage) {
  storage.setItem(STORAGE_KEY,JSON.stringify(validateState(state)));
}
