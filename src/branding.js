export const BRAND_LINE='曾家狗奴才专用，致力于一生服务曾家。';
let logoPromise;
export const SHARE_FOOTER_HEIGHT=340;
export async function drawBrandFooter(context,width,height){
 let logo=null;if(typeof Image!=='undefined'){logoPromise??=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('应用 Logo 加载失败，请联网更新后重试'));image.src=new URL('../assets/share-logo-v3.png',import.meta.url).href;});logo=await logoPromise;}
 const previous={alpha:context.globalAlpha,font:context.font,fill:context.fillStyle};const top=height-305;
 const centered=(text,y,font,alpha)=>{context.font=font;context.globalAlpha=alpha;context.fillStyle='#b0aaa0';context.fillText(text,(width-context.measureText(text).width)/2,y);};
 const logoWidth=260,logoHeight=logoWidth*(logo?.naturalHeight&&logo?.naturalWidth?logo.naturalHeight/logo.naturalWidth:.48);context.globalAlpha=.7;if(logo)context.drawImage(logo,(width-logoWidth)/2,top,logoWidth,logoHeight);
 centered('— 曾氏传承 —',top+logoHeight+35,'22px system-ui, sans-serif',.55);
 centered('尊卑有序 · 忠诚为誓 · 荣耀永续',top+logoHeight+70,'18px system-ui, sans-serif',.45);
 context.globalAlpha=.18;context.fillStyle='#b0aaa0';context.fillRect(width*.18,top+logoHeight+94,width*.64,1);
 centered('曾家奴才专用，致力于一生服务曾家',top+logoHeight+130,'19px system-ui, sans-serif',.4);
 context.globalAlpha=previous.alpha;context.font=previous.font;context.fillStyle=previous.fill;
}

// Identity is supplied by the signed-in server profile, never by editable biography.
export function accountBrandLine(profile){
 if(!profile)return '曾氏传承 · 传承不息，荣耀永续。';
 const identity=String(profile.identity||'');
 const role=profile.role;
 if((role==='master'||role==='owner'))return '曾家主子专用，传承家风，管理家族事务。';
 if(role==='servant'||role==='slave'||(!role&&/奴|仆|侍从|近侍|奉侍/.test(identity))){
  return /狗奴/.test(identity)?BRAND_LINE:'曾家奴才专用，致力于一生服务曾家。';
 }
 if(!role&&/主子|主人|主家/.test(identity))return '曾家主子专用，传承家风，管理家族事务。';
 return '曾氏传承 · 传承不息，荣耀永续。';
}
