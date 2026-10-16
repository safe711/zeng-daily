import {accountGender} from './model.js';
export const disasterDescription='本订阅允许曾家挡灾奴购买曾仪父母及姥姥的灾祸，赋予挡灾奴为曾家人遮挡灾祸的职责与荣幸。';
export const disasterMembers=[{id:'ZENG-DZ-001',name:'于耕宝',identity:'挡灾奴01号',gender:'male'},{id:'ZENG-DZ-002',name:'杜其香',identity:'挡灾奴02号',gender:'female'}];
const DEFAULT_AVATAR_SHEET=new URL('../assets/avatars/elder-front-approved-sheet-v1.png',import.meta.url).href;
export function defaultAvatar(gender='male'){const female=gender==='female';return '<svg class="avatar-silhouette default-avatar approved-default-avatar" viewBox="'+(female?'900 34 839 819':'35 34 838 819')+'" role="img" aria-label="'+(female?'女性':'男性')+'默认头像"><image href="'+DEFAULT_AVATAR_SHEET+'" x="0" y="0" width="1774" height="887"/></svg>';}

export const genderFor=accountGender;
export function disasterIcon(){const rows=['...aaaaaaaaaa...','..aaaaaaaaaaaa..','..abbbbbbbbbba..','..abbbbcbbbbba..','..abbbccbbbbba..','..abbccccbbbba..','..abbcccccbbba..','..abbcddccbbba..','..abbcdddcbbba..','...abccddcbba...','....abcccbba....','.....abbbba.....','......aaaa......','.......aa.......'];const colors={a:'#c3a767',b:'#383128',c:'#df9253',d:'#f4d593'};return '<svg class="disaster-pixel-icon" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges">'+rows.flatMap((r,y)=>[...r].map((c,x)=>c==='.'?'':'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+colors[c]+'"/>')).join('')+'</svg>';}
export function disasterSelection(){return '<fieldset class="disaster-selection"><legend>选择本期两位挡灾奴</legend>'+disasterMembers.map(m=>'<label class="check"><input type="checkbox" name="disasterMember" value="'+m.id+'" required>'+m.identity+' · '+m.name+'</label>').join('')+'</fieldset>';}

export const loginAccountId=id=>String(id||'').toUpperCase()==='OWNERTEST'?'ownertest':String(id||'').replace(/^ZENG-DS-(\d+)$/i,'ZENG_DS_$1').toUpperCase();
