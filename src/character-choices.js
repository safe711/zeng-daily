import {defaultAvatar,genderFor} from './familyui.js';
import {characterFrame,prepareCharacter} from './estate-original-character-renderer.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function characterChoices(name,people,{selected,label='选择角色'}={}){
 const options=people.map(p=>({id:p.id,name:p.name,value:p.choiceValue||p.id||p.name,role:p.role||'slave',gender:p.gender||genderFor(p),avatar:p.avatar||p.state?.estate?.avatar}));
 const checked=options.some(p=>p.value===selected)?selected:options[0]?.value;
 return '<fieldset class="character-choices"><legend>'+esc(label)+'</legend><div class="character-choice-grid">'+options.map(p=>'<label class="character-choice"><input type="radio" name="'+esc(name)+'" value="'+esc(p.value)+'" required '+(p.value===checked?'checked':'')+'><span class="character-choice-avatar" data-character-avatar="'+esc(JSON.stringify(p))+'">'+defaultAvatar(p.gender)+'</span><span class="character-choice-name">'+esc(p.name)+'</span></label>').join('')+(options.length?'':'<p class="muted">当前没有可选角色</p>')+'</div></fieldset>';
}
export function mountCharacterChoices(root){
 const paint=async()=>{if(!root.isConnected)return;await Promise.allSettled([...root.querySelectorAll('[data-character-avatar]')].map(async holder=>{const person=JSON.parse(holder.dataset.characterAvatar);if(!person.avatar)return;await prepareCharacter(person,'idle',0);if(!root.isConnected||!holder.isConnected)return;const selected=characterFrame(person,'idle',0);if(!selected)return;const [x,y,w,h]=selected.frame.sourceBounds,size=Math.min(w,h*.52),cv=document.createElement('canvas');cv.width=cv.height=96;const c=cv.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(selected.image,x+(w-size)/2,y,size,size,0,0,96,96);const image=new Image();image.alt='';image.src=cv.toDataURL();holder.replaceChildren(image);}));};paint();
 for(const field of root.querySelectorAll('.character-choices'))if(!field.querySelector('input'))field.closest('form')?.querySelectorAll('button').forEach(b=>b.disabled=true);
}
