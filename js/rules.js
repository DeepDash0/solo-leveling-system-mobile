/* Pure game rules; safe for the browser and Node tests. No network or timers. */
(function(root) {
  'use strict';
  const LIMIT_HOURS = 8;
  const RATES = Object.freeze({
    E:{xp:.035,gold:.018,chance:.16},
    D:{xp:.06,gold:.032,chance:.2},
    C:{xp:.10,gold:.05,chance:.25},
    B:{xp:.17,gold:.09,chance:.30},
    A:{xp:.25,gold:.14,chance:.36},
    S:{xp:.38,gold:.20,chance:.42}
  });
  const MAX_SOLDIERS = 12;
  const ids = ['pushups','situps','squats','run'];
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const clamp = (x,a,b)=>Math.min(b,Math.max(a,x));
  function dateDifference(a,b) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a||'') || !/^\d{4}-\d{2}-\d{2}$/.test(b||'')) return Infinity;
    const days=s=>Date.parse(s+'T00:00:00Z')/86400000;
    return days(b)-days(a);
  }
  function nextStreak(current,lastDate,nowDate) {
    const diff=dateDifference(lastDate,nowDate);
    if(diff===0)return clamp(num(current),0,3650);
    return diff===1?clamp(Math.floor(num(current))+1,1,3650):1;
  }
  function targets(base, streak) {
    // User-defined targets are the baseline; increase at most 20%.
    const multiplier=1+Math.min(10,Math.max(0,Math.floor(num(streak))))*.02;
    return Object.fromEntries(ids.map(id=>{
      const original=clamp(num(base?.[id]),id==='run'?.1:1,id==='run'?100:10000);
      const adapted=original*multiplier;
      return [id,id==='run'?Math.round(adapted*10)/10:Math.max(1,Math.round(adapted))];
    }));
  }
  function sanitizeShadows(value,now) {
    const raw=value&&typeof value==='object'?value:{};
    const soldiers=(Array.isArray(raw.soldiers)?raw.soldiers:[]).slice(0,MAX_SOLDIERS)
      .filter(x=>x && typeof x==='object' && RATES[x.rank])
      .map((x,i)=>({id:String(x.id||'shadow-'+i).slice(0,60),
        name:String(x.name||'Shadow Soldier').slice(0,55),rank:x.rank}));
    return {soldiers,lastTick:clamp(Math.floor(num(raw.lastTick)||now),now-LIMIT_HOURS*3600000,now),
      xpCarry:clamp(num(raw.xpCarry),0,.99999),goldCarry:clamp(num(raw.goldCarry),0,.99999)};
  }
  function idleRewards(shadows,atMs) {
    const seconds=clamp((atMs-num(shadows.lastTick))/1000,0,LIMIT_HOURS*3600);
    let xp=clamp(num(shadows.xpCarry),0,.99999),gold=clamp(num(shadows.goldCarry),0,.99999);
    for(const s of shadows.soldiers||[]){
      const rate=RATES[s.rank];if(!rate)continue;
      xp+=rate.xp*seconds;gold+=rate.gold*seconds;
    }
    return {xp:Math.floor(xp),gold:Math.floor(gold),xpCarry:xp%1,goldCarry:gold%1,
      seconds,lastTick:atMs};
  }
  function shadowDrop(rank,count,random=Math.random()) {
    if(count>=MAX_SOLDIERS||!RATES[rank])return false;
    return random<RATES[rank].chance;
  }
  const rules=Object.freeze({RATES,MAX_SOLDIERS,LIMIT_HOURS,targets,dateDifference,
    nextStreak,sanitizeShadows,idleRewards,shadowDrop});
  root.SystemRules=rules;
  if(typeof module!=='undefined'&&module.exports)module.exports=rules;
})(typeof window!=='undefined'?window:globalThis);
