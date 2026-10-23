/* Local static web server, bound to loopback; exposed privately through Tailscale Serve. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=4186;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
'.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
'.png':'image/png','.ico':'image/x-icon','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
http.createServer((req,res)=>{
 let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end();return}
 let relative;try{relative=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return}
 if(relative==='/'||relative==='')relative='/index.html';
 if(relative.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return}
 const file=path.resolve(root,'.'+relative);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
 fs.stat(file,(err,st)=>{
  if(err||!st.isFile()){res.writeHead(404);res.end('Not found');return}
  res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');
  res.setHeader('Cache-Control','no-cache');res.setHeader('X-Content-Type-Options','nosniff');
  res.writeHead(200,{'Content-Length':st.size});
  if(req.method==='HEAD'){res.end();return}
  fs.createReadStream(file).pipe(res);
 });
}).listen(port,'127.0.0.1',()=>console.log('THE SYSTEM PC2: http://127.0.0.1:'+port));