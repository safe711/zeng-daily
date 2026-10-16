import {readFile} from 'node:fs/promises';
// User-authorized login portrait: an existing account name is required, no session issued.
export function createOwnerLoginPortrait({accountExists,load=()=>readFile('/private/profile.jpg'),now=Date.now}){
 const attempts=new Map();return async(req,res,headers={})=>{
  const reply=(status,error)=>{res.writeHead(status,{...headers,'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error}));};
  if(req.method!=='POST'){reply(405,'请求方式无效');req.resume();return;}
  const key=req.socket.remoteAddress||'unknown',time=now();for(const [ip,v]of attempts)if(v.until<time)attempts.delete(ip);
  const entry=attempts.get(key)||{until:time+60000,count:0};entry.count++;attempts.set(key,entry);if(entry.count>20||attempts.size>2000){reply(429,'请稍后重试');req.resume();return;}
  try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1024){reply(413,'请求过大');return;}chunks.push(chunk);}const data=JSON.parse(Buffer.concat(chunks).toString());
   if(typeof data.account!=='string'||data.account.length>80||!accountExists(data.account)){reply(404,'头像暂不可用');return;}
   const image=await load();if(!image.length||image.length>8000000||image[0]!==255||image[1]!==216||image[2]!==255)throw Error('Invalid portrait');
   res.writeHead(200,{...headers,'Content-Type':'image/jpeg','Content-Length':image.length,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(image);
  }catch{reply(503,'头像暂不可用');}
 };
}
