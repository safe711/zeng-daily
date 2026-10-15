import https from 'node:https';

const allowedOrigins=['https://zenglegacy.cn','https://www.zenglegacy.cn','https://safe711.github.io'];
const accountPath=/^\/api\/account\/[A-Za-z0-9%/_-]+$/;
const legacyPath=/^\/api\/(?:nas\/(?:status|pair|photos|reports|shoes\/(?:photos|reports)|tasks\/(?:photos|reports))|private\/(?:profile-photo|contract|identity))$/;
// Only the existing account/NAS namespaces bypass the separate private-site gate.
// Their authentication, authorization and CORS checks remain on the account server.
export function createAccountProxy({hostname='lan-backup',port=4180,servername='api.zenglegacy.cn',requestImpl=https.request}={}){
 return function proxyAccount(request,response){
  const url=new URL(request.url,'http://localhost');
  if(!accountPath.test(url.pathname)&&!legacyPath.test(url.pathname))return false;
  const origin=request.headers.origin;
  const failure=(status,message)=>{if(response.headersSent){response.destroy();return;}response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(allowedOrigins.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'X-Content-Type-Options':'nosniff'});response.end(JSON.stringify({error:message}));request.resume();};
  if(!allowedOrigins.includes(origin)){failure(403,'请求来源不匹配');return true;}
  const headers={...request.headers,host:'api.zenglegacy.cn:4180'};
  delete headers.cookie;delete headers.connection;
  const upstream=requestImpl({hostname,port,servername,method:request.method,path:url.pathname+url.search,headers,timeout:180000},result=>{
   response.writeHead(result.statusCode,{...result.headers,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});result.pipe(response);result.on('error',()=>response.destroy());
  });
  upstream.on('timeout',()=>upstream.destroy(Error('upstream timeout')));
  upstream.on('error',()=>failure(502,'账号服务器暂时不可达，请稍后重试'));
  request.on('aborted',()=>upstream.destroy());response.on('close',()=>{if(!response.writableEnded)upstream.destroy();});
  request.pipe(upstream);return true;
 };
}
