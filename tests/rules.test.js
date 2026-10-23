const assert=require('node:assert/strict');
const {test}=require('node:test');
const rules=require('../js/rules.js');
test('legacy quest targets do not change until new day',()=>{
 const base={pushups:20,situps:25,squats:30,run:1.5};
 assert.deepEqual(rules.targets(base,0),base);
 const raised=rules.targets(base,11);
 assert.equal(raised.pushups,24);
 assert.equal(raised.run,1.8);
});
test('streak only advances once per new calendar day',()=>{
 assert.equal(rules.nextStreak(4,'2026-10-22','2026-10-23'),5);
 assert.equal(rules.nextStreak(4,'2026-10-23','2026-10-23'),4);
 assert.equal(rules.nextStreak(4,'2026-10-20','2026-10-23'),1);
 assert.equal(rules.dateDifference('2026-10-31','2026-11-01'),1);
});
test('validates and clamps corrupt shadow saves',()=>{
 const now=Date.now();
 const state=rules.sanitizeShadows({lastTick:-50,xpCarry:75,goldCarry:-20,
  soldiers:[{id:'x',name:'Knight',rank:'A'}, {rank:'BAD'}]},now);
 assert.equal(state.soldiers.length,1);
 assert.equal(state.xpCarry,.99999);
 assert.equal(state.goldCarry,0);
 assert.ok(state.lastTick>=now-8*3600000);
});
test('idle rewards are deterministic, capped, and fractional',()=>{
 const now=Date.now();
 const shadow=rules.sanitizeShadows({soldiers:[{name:'Knight',rank:'A',id:'a'}],lastTick:now-3600*1000},now);
 const oneHour=rules.idleRewards(shadow,now);
 assert.equal(oneHour.xp,900);
 assert.equal(oneHour.gold,504);
 const huge=rules.idleRewards({...shadow,lastTick:now-15*3600*1000},now);
 assert.ok(huge.xp<=.25*8*3600);
 const negative=rules.idleRewards({...shadow,lastTick:now+500},now);
 assert.equal(negative.xp,0);
});
test('extraction obeys probability and army limit',()=>{
 assert.equal(rules.shadowDrop('S',0,.1),true);
 assert.equal(rules.shadowDrop('E',0,.99),false);
 assert.equal(rules.shadowDrop('S',12,0),false);
 assert.equal(rules.shadowDrop('Z',0,0),false);
});
