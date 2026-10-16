export const GALLERY_PANEL_WIDTH=640;
export const GALLERY_PANEL_SLOTS=10;
export const GALLERY_MIN_PANELS=3;
// First panel: nine portraits and one landscape, clear of the doorway and floor.
export const GALLERY_FRAMES=[
  [116,59,42,75],[200,58,42,75],[284,61,42,75],[368,57,96,72],[512,58,42,75],
  [126,162,36,64],[216,161,36,64],[306,163,37,64],[396,161,36,64],[486,162,36,64]
].map(([x,y,w,h])=>Object.freeze({x,y,w,h}));
// Second wall is all portraits; two wider portrait openings suit 3:4 originals.
export const GALLERY_SECOND_FRAMES=GALLERY_FRAMES.map((f,i)=>Object.freeze(i===3?{...f,x:389,w:54}:i===8?{...f,x:390,w:48}:f));
export function gallerySlots(photos){
  const occupied=new Set(),placed=[];
  for(const photo of photos){let slot=photo.wallSlot;if(!Number.isInteger(slot)||slot<0||occupied.has(slot)){slot=0;while(occupied.has(slot))slot++;}
    occupied.add(slot);placed.push({...photo,wallSlot:slot});}
  return placed;
}
export function galleryPanelCount(photos){return Math.max(GALLERY_MIN_PANELS,Math.ceil((Math.max(-1,...photos.map(p=>p.wallSlot??-1))+1)/GALLERY_PANEL_SLOTS));}
export function galleryFrame(slot){const panel=Math.floor(slot/GALLERY_PANEL_SLOTS),f=(panel===1?GALLERY_SECOND_FRAMES:GALLERY_FRAMES)[slot%GALLERY_PANEL_SLOTS];return {...f,x:f.x+panel*GALLERY_PANEL_WIDTH};}
export function galleryCamera(transition,time){if(!transition)return 0;const p=Math.min(1,Math.max(0,(time-transition.at)/650)),ease=p*p*(3-2*p);return transition.from+(transition.to-transition.from)*ease;}
export function photoContain(width,height,frame,inset=4){const scale=Math.min((frame.w-inset*2)/width,(frame.h-inset*2)/height),w=width*scale,h=height*scale;return {x:frame.x+(frame.w-w)/2,y:frame.y+(frame.h-h)/2,w,h};}
