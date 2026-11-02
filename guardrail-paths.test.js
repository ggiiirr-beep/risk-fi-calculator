import test from 'node:test';
import assert from 'node:assert/strict';
import {pathYear,guardrailPaths} from './guardrail-paths.js';
import {defaults} from './finance.js';
import {guardrailDefaults,buildProbabilityModel,scheduledYear,marketPaths,fixedSuccess,runRetirement,initialSpending,runPathAlternatives,validateGuardrails} from './guardrails.js';
const strategy={name:'Test',lower:.2,target:.5,upper:.8};
const base={...guardrailDefaults,goal:'fi',fiBasis:'total',portfolio:100000,initialCash:0,initialMode:'target',years:3,fiWithdrawals:4400,fiRate:.04,stockMean:0,stockVol:0,model:'parametric',inflation:0,cashReturn:0,reserveYears:0,innerCount:512,checkInvestment:100000,checkCash:0,checkSpending:0,checkElapsed:0,futureChanges:[],pathWithdrawalBase:10000,pathAdjust:true,pathPeriods:[{action:'withdraw',amount:10000,years:1},{action:'even',amount:0,years:1},{action:'contribute',amount:20000,years:null}]};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
test('annual phases prorate contributions and withdrawals at fractional boundaries',()=>{
 const a={...base,pathPeriods:[{action:'withdraw',amount:10000,years:.5},{action:'contribute',amount:20000,years:null}]};assert.deepEqual(pathYear(a,0),{factor:.5,contribution:10000});assert.deepEqual(pathYear(a,1),{factor:0,contribution:20000});
});
test('scheduled-year cash flows respect withdraw, break-even and contribution phases',()=>{
 let i=100000;for(let y=0;y<3;y++)i=scheduledYear(base,i,0,10000,1,1,false,y).investment;close(i,110000);
});
test('probability checks and outer simulation agree on scheduled contributions',()=>{
 const model=buildProbabilityModel(base),paths=marketPaths(base,2,123);
 assert.equal(model.probability(100000,0,10000,3),1);assert.equal(model.probability(100000,0,10001,3),0);
 assert.equal(fixedSuccess(base,paths,100000,0,10000,3),1);
 const initial={investment:100000,cash:0,spending:10000,fromPlan:true};const q=runRetirement(base,strategy,model,paths,0,initial,'fixed');close(q.balances.at(-1),110000);assert.deepEqual(q.spending,[10000,0,0]);assert.equal(q.fiReached,true);
});
test('Coast plan cannot invent withdrawals or infinite starting capacity',()=>{
 const a={...base,pathPeriods:[{action:'even',amount:0,years:null}],fiWithdrawals:3600};const model=buildProbabilityModel(a),initial=initialSpending(a,strategy,model);
 assert.equal(initial.spending,0);assert.equal(initial.probability,1);assert.equal(model.spendingFor(100000,0,3,.5).spending,0);
 const q=runRetirement(a,strategy,model,marketPaths(a,1,123),0,initial);assert.deepEqual(q.spending,[0,0,0]);assert.equal(q.raises,0);
});
test('future income offsets scheduled withdrawals and surplus still goes to cash',()=>{
 const a={...base,futureChanges:[{kind:'income',amount:12000,start:0,end:3,adjust:true}]};const q=scheduledYear(a,100000,0,10000,1,1,false,0);close(q.cash,2000);close(q.investment,100000);
});
test('optional alternatives return a contribution solution without editing the plan',()=>{
 const a={...base,years:2,fiWithdrawals:4400,pathPeriods:[{action:'even',amount:0,years:null}]},copy=structuredClone(a),r=runPathAlternatives(a,[strategy]);
 assert.equal(r.probability,0);close(r.rows[0].contribution,5000);assert.equal(r.rows[0].years,null);assert.deepEqual(a,copy);
});
test('path import preserves shared balances and retains saved periods',()=>{
 const plan={...defaults,years:15},periods=[{action:'contribute',amount:40000,years:null}],snapshot=structuredClone(plan);
 const paths=guardrailPaths(plan,periods,{mode:'time',adjust:true},{mode:'amount',years:30,contribution:40000});
 assert.deepEqual(paths.gap.periods,periods);assert.deepEqual(paths.coast.periods,[{action:'even',amount:0,years:null}]);assert.deepEqual(plan,snapshot);
});
test('malformed schedules are rejected',()=>assert.throws(()=>validateGuardrails({...base,pathPeriods:[{action:'contribute',amount:-1,years:null}]},[strategy])));
test('later-date alternative finds first reachable annual deadline',()=>{
 const a={...base,years:2,stockMean:.1,fiWithdrawals:5200,pathPeriods:[{action:'even',amount:0,years:null}]};
 const r=runPathAlternatives(a,[strategy]);assert.equal(r.rows[0].years,3);assert.equal(r.rows[0].dateProbability,1);
});
test('fixed-path success matches outer cash accounting with varying returns and inflation',()=>{
 const a={...base,model:'parametric',stockMean:.06,stockVol:.15,inflation:.03,cashReturn:.02,initialCash:10000,pathAdjust:false,adjustWithdrawals:false,futureChanges:[{kind:'income',amount:2000,start:1,end:3,adjust:false}]};
 const paths=marketPaths(a,30,19),model=buildProbabilityModel(a);let successes=0;
 for(let n=0;n<paths.count;n++)successes+=Number(runRetirement(a,strategy,model,paths,n,{investment:90000,cash:10000,spending:10000,fromPlan:true},'fixed').fiReached);
 close(fixedSuccess(a,paths,90000,10000,10000,3),successes/paths.count);
});
