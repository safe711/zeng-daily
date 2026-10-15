// Knee contact points measured on the original prison atlases, in source pixels.
const CONTACTS={male:[[124,717],[312,717],[504,717],[711,717],[941,717]],female:[[128,697],[330,697],[510,697],[718,697],[939,697]]};
export function anchorBowKnees(assets,base){
 for(const gender of ['male','female'])for(const id of [gender+'-prison',gender+'-shoeless']){
  const asset=assets[id],original=base[gender+'-prison'];if(!asset||!original)continue;
  const ratio=asset.width/original.width,first=asset.frames[6],contact=CONTACTS[gender][0],knee={x:contact[0]*ratio*first.scale+first.offset[0],y:contact[1]*ratio*first.scale+first.offset[1]};
  asset.frames=asset.frames.map((frame,index)=>{if(index<6||index>10)return frame;const[x,y]=CONTACTS[gender][index-6],dx=knee.x-(x*ratio*frame.scale+frame.offset[0]),dy=knee.y-(y*ratio*frame.scale+frame.offset[1]),shift=p=>p?{x:p.x+dx,y:p.y+dy}:p;return{...frame,offset:[frame.offset[0]+dx,frame.offset[1]+dy],knee:{...knee},sourceKnee:[x*ratio,y*ratio],head:shift(frame.head),neck:shift(frame.neck),hand:shift(frame.hand)};});
 }
 return assets;
}
