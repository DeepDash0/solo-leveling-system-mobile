/* Lightweight canvas particles: no dependencies, pause offscreen, respect reduced motion. */
(function(){
'use strict';
const canvas=document.createElement('canvas');canvas.id='energyCanvas';canvas.setAttribute('aria-hidden','true');
document.body.prepend(canvas);
const ctx=canvas.getContext('2d',{alpha:true});
if(!ctx)return;
let w=0,h=0,dpr=1,ambient=[],burst=[],frame=0,running=false,last=0;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const make=(x,y,vx,vy,color,size,life)=>({x,y,vx,vy,color,size,life,maxLife:life});
function resize(){
 dpr=Math.min(window.devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
 ambient=Array.from({length:Math.min(55,Math.max(16,Math.floor(w*h/24000)))},()=>make(
 Math.random()*w,Math.random()*h,(Math.random()-.5)*.15,-.11-Math.random()*.14,
 Math.random()>.82?'#b9a3ff':'#5ce2ff',Math.random()*1.8+.6,1000));
}
function pause(){running=false}
function start(){if(running||document.hidden||motion.matches)return;running=true;last=performance.now();frame=requestAnimationFrame(tick)}
function tick(t){
 if(!running)return;
 let delta=Math.min(40,t-last);last=t;
 ctx.clearRect(0,0,w,h);
 const scale=delta/16.7;
 for(const p of ambient){
  p.x+=p.vx*scale;p.y+=p.vy*scale;
  if(p.y<0){p.y=h;p.x=Math.random()*w}
  if(p.x>w)p.x=0;if(p.x<0)p.x=w;
  ctx.globalAlpha=.18+Math.sin(t*.0004+p.x)*.12;
  ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);
 }
 burst=burst.filter(p=>p.life>0);
 for(const p of burst){
  p.life-=delta;p.x+=p.vx*scale;p.y+=p.vy*scale;p.vy+=.027*scale;
  const fade=Math.max(0,p.life/p.maxLife);
  ctx.globalAlpha=fade*.9;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size*2.4);
 }
 ctx.globalAlpha=1;
 frame=requestAnimationFrame(tick);
}
function explosion(color,count=72){
 if(motion.matches||document.hidden||count===0)return;
 const x=w*.5,y=h*.47;
 for(let i=0;i<Math.min(120,count);i++){
  const a=Math.random()*Math.PI*2,v=1.1+Math.random()*7;
  burst.push(make(x,y,Math.cos(a)*v,Math.sin(a)*v,color,.8+Math.random()*3.5,480+Math.random()*850));
 }
 start();
}
window.SystemParticles=Object.freeze({burst:explosion});
window.addEventListener('resize',()=>{resize();if(!running)start()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);pause()}else start()});
if(motion.addEventListener)motion.addEventListener('change',()=>{if(motion.matches){cancelAnimationFrame(frame);pause();ctx.clearRect(0,0,w,h)}else start()});
resize();start();
})();