import {accountGender} from './model.js';
export const disasterDescription='本订阅允许曾家挡灾奴购买曾仪父母及姥姥的灾祸，赋予挡灾奴为曾家人遮挡灾祸的职责与荣幸。';
export const disasterMembers=[{id:'ZENG-DZ-001',name:'于耕宝',identity:'挡灾奴01号',gender:'male'},{id:'ZENG-DZ-002',name:'杜其香',identity:'挡灾奴02号',gender:'female'}];
export function defaultAvatar(gender='male'){
 const female=gender==='female';
 const hair=female?'<path d="M22 39V30c0-25 36-25 36 0v25H22z" fill="#443c42"/>':'<path d="M23 32V25c0-19 34-22 35 0v9H23z" fill="#353f50"/>';
 const fringe=female?'<path d="M26 27c1-17 27-18 28 2-8-1-14-5-17-10-2 5-6 7-11 8z" fill="#443c42"/>':'<path d="M25 25c4-14 27-15 30 3-10-1-15-6-17-9-3 4-7 6-13 6z" fill="#353f50"/>';
 return '<svg class="avatar-silhouette default-avatar" viewBox="0 0 80 80" role="img" aria-label="'+(female?'女性':'男性')+'默认头像"><circle cx="40" cy="40" r="40" fill="'+(female?'#f2e8ed':'#e5edf5')+'"/>'+hair+'<path d="M12 80v-8c0-14 12-23 28-23s28 9 28 23v8" fill="'+(female?'#aa7896':'#6284aa')+'"/><path d="M34 43h12v12c-3 5-9 5-12 0z" fill="#e6b399"/><ellipse cx="40" cy="31" rx="14" ry="18" fill="#f2c7ad"/>'+fringe+'<g fill="#3e3840"><circle cx="35" cy="32" r="1.25"/><circle cx="45" cy="32" r="1.25"/></g><path d="M36 40q4 3 8 0" fill="none" stroke="#ae7368" stroke-width="1.5" stroke-linecap="round"/><path d="M29 53l11 10 11-10" fill="none" stroke="'+(female?'#ead6e3':'#cbdced')+'" stroke-width="3" stroke-linejoin="round"/></svg>';
}
export const genderFor=accountGender;
export function disasterIcon(){const rows=['...aaaaaaaaaa...','..aaaaaaaaaaaa..','..abbbbbbbbbba..','..abbbbcbbbbba..','..abbbccbbbbba..','..abbccccbbbba..','..abbcccccbbba..','..abbcddccbbba..','..abbcdddcbbba..','...abccddcbba...','....abcccbba....','.....abbbba.....','......aaaa......','.......aa.......'];const colors={a:'#c3a767',b:'#383128',c:'#df9253',d:'#f4d593'};return '<svg class="disaster-pixel-icon" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges">'+rows.flatMap((r,y)=>[...r].map((c,x)=>c==='.'?'':'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+colors[c]+'"/>')).join('')+'</svg>';}
export function disasterSelection(){return '<fieldset class="disaster-selection"><legend>选择本期两位挡灾奴</legend>'+disasterMembers.map(m=>'<label class="check"><input type="checkbox" name="disasterMember" value="'+m.id+'" required>'+m.identity+' · '+m.name+'</label>').join('')+'</fieldset>';}

export const loginAccountId=id=>String(id||'').toUpperCase()==='OWNERTEST'?'ownertest':String(id||'').replace(/^ZENG-DS-(\d+)$/i,'ZENG_DS_$1').toUpperCase();
