import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduledStrategy,feasibility,checkpoint,guardrailDefaults,marketPaths,buildProbabilityModel,aggregateStrategy,runRetirement,currentGuardrailCheck,validateGuardrails} from './guardrails.js';
const s={name:'Schedule',lower:.4,target:.5,upper:.6,endTarget:.9,schedule:'steady'};
test('schedules meet endpoints; earlier and later bracket steady without moving deadline',()=>{
 for(const schedule of ['steady','early','late']){assert.equal(scheduledStrategy({...s,schedule},0,15).target,.5);assert.equal(scheduledStrategy({...s,schedule},14,15).target,.9);}
 assert.ok(scheduledStrategy({...s,schedule:'early'},7,15).target>.7);
 assert.ok(scheduledStrategy({...s,schedule:'late'},7,15).target<.7);
 assert.equal(scheduledStrategy({...s,schedule:'fixed'},14,15).target,.5);
 assert.equal(scheduledStrategy(s,0,1).target,.5);
 assert.equal(scheduledStrategy({...s,endTarget:1},14,15).upper,1);
 assert.throws(()=>validateGuardrails(guardrailDefaults,[{...s,endTarget:.2}]));
 validateGuardrails(guardrailDefaults,[{...s,schedule:'fixed',endTarget:.2}]);
});
const mock={probability:(i,c,w)=>Math.max(0,Math.min(1,i/100-w/100)),spendingFor:(i,c,h,p,floor)=>({spending:Math.max(floor,i-100*p)})};
test('moving target alone does not reset, crossing lower rail cuts and 100% upper cannot raise',()=>{
 const rails=scheduledStrategy(s,7,15);
 assert.equal(checkpoint(mock,rails,100,0,35,8,0).trigger,null);
 const cut=checkpoint(mock,rails,100,0,45,8,0);assert.equal(cut.trigger,'cut');assert.ok(Math.abs(cut.after-.7)<1e-9);
 assert.equal(checkpoint(mock,{lower:.8,target:.9,upper:1},100,0,0,1,0).trigger,null);
});
test('feasibility distinguishes floor constraint from unreachable zero-withdrawal target',()=>{
 assert.deepEqual(feasibility(mock,100,0,40,5,30,.8),{current:.6,atFloor:.7,zero:1,zeroLimited:false,floorLimited:true});
 const x=feasibility(mock,70,0,40,5,20,.8);assert.equal(x.zeroLimited,true);assert.equal(x.floorLimited,false);
});
test('fixed and zero references preserve starting allocation and reconcile zero reserve transfers',()=>{
 const a={...guardrailDefaults,years:2,reserveYears:2},paths={years:2,count:1,stock:Float64Array.of(1,1),cash:Float64Array.of(.5,.5),positive:Uint8Array.of(1,1)},initial={investment:80,cash:20,spending:10,probability:.5};
 const fixed=runRetirement(a,s,mock,paths,0,initial,'fixed'),zero=runRetirement(a,s,mock,paths,0,initial,'zero');
 assert.deepEqual(fixed.plannedSpending,[10,10]);assert.equal(fixed.cuts,0);assert.equal(fixed.raises,0);
 assert.deepEqual(zero.spending,[0,0]);assert.deepEqual(zero.balances,[100,90,80]);assert.deepEqual(zero.cashBalances,[20,20,20]);assert.equal(zero.total,0);
});
test('current dollar check uses elapsed scheduled rails and floor/zero estimates',()=>{
 const a={...guardrailDefaults,years:15,checkElapsed:7,checkInvestment:100,checkCash:0,checkSpending:35,floor:20},r=currentGuardrailCheck(a,s,mock);
 assert.equal(r.strategy.target,.7);assert.equal(r.decision.trigger,null);assert.equal(r.feasibility.atFloor,.8);assert.equal(r.remaining,8);
});
test('scheduled FI outputs converge with outer count and finer probability estimates',()=>{
 const a={...guardrailDefaults,fiWithdrawals:60000,reserveYears:0,checkCash:0},m=buildProbabilityModel(a),paths=marketPaths(a,25000,a.seed),small={...paths,count:10000},fine=buildProbabilityModel({...a,innerCount:2048});
 for(const schedule of ['steady','early','late']){
  const strategy={...s,schedule},x=aggregateStrategy(a,strategy,m,small),y=aggregateStrategy(a,strategy,m,paths),z=aggregateStrategy(a,strategy,fine,small);
  assert.ok(Math.abs(x.fiSuccessRate-y.fiSuccessRate)<.025);assert.ok(Math.abs(x.fiSuccessRate-z.fiSuccessRate)<.06);
  assert.ok(Math.abs(x.metrics.cuts.mean-z.metrics.cuts.mean)<.6);
  assert.ok(x.metrics.lowest.p10<=x.metrics.lowest.median);assert.ok(x.metrics.floorYears.max<=a.years);
  assert.equal(x.examples[0].targets.at(-1).target,.9);
  const fixed=aggregateStrategy(a,strategy,m,small,{policy:'fixed',initialOverride:x.initial});assert.equal(fixed.metrics.cuts.max,0);assert.equal(fixed.initial,x.initial);
  console.log(JSON.stringify({schedule,success10000:x.fiSuccessRate,success25000:y.fiSuccessRate,finerSuccess:z.fiSuccessRate,cuts:x.metrics.cuts.mean,finerCuts:z.metrics.cuts.mean}));
 }
});
test('floor duration distinguishes consecutive stretches from total years',()=>{
 const a={...guardrailDefaults,years:7,floor:10,reserveYears:0},rails={lower:.4,target:.5,upper:.6,schedule:'fixed'},desired={6:10,5:10,4:20,3:10,2:10,1:10};
 const m={probability:(i,c,w,h)=>w>desired[h]?0:w<desired[h]?1:.5,spendingFor:(i,c,h)=>({spending:desired[h]})};
 const paths={count:1,years:7,stock:Array(7).fill(1),cash:Array(7).fill(1),positive:Array(7).fill(1)};
 const r=runRetirement(a,rails,m,paths,0,{investment:1000,cash:0,spending:20});
 assert.deepEqual(r.plannedSpending,[20,10,10,20,10,10,10]);assert.equal(r.floorYears,5);assert.equal(r.maxFloorRun,3);
});
test('deadline success uses final post-withdrawal investments, excluding cash and earlier target touches',()=>{
 const a={...guardrailDefaults,years:2,fiWithdrawals:4,fiRate:.04,reserveYears:0};
 const m={probability:()=>.5},rails={lower:.4,target:.5,upper:.6,schedule:'fixed'},initial={investment:110,cash:50,spending:5};
 const flat={count:1,years:2,stock:[1,1],cash:[1,1],positive:[1,1]};
 const exact=runRetirement(a,rails,m,flat,0,initial,'fixed');assert.equal(exact.investmentBalances.at(-1),100);assert.equal(exact.fiReached,true);
 const miss=runRetirement(a,rails,m,{...flat,stock:[1,.9]},0,initial,'fixed');assert.ok(miss.investmentBalances[1]>100);assert.ok(miss.balances.at(-1)>100);assert.equal(miss.fiReached,false);
});
