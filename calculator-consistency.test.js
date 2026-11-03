import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,project} from './finance.js';
import {rampDefaults,solveRamp,projectRamp,shapedRampIncomes} from './ramp-fi.js';
import {projectGap} from './gap-fi.js';
import {comparisonProjection} from './projection-policy.js';
import {runScenario,comparisonRows} from './scenario-comparison.js';
import {comparePaths} from './path-comparison.js';
const p={...defaults,portfolio:200000,cash:0,nominal:0,inflation:0,cashNominal:0,targetOverride:true,target:300000,separateFiWithdrawals:true,fiWithdrawals:12000,fiBasis:'total',futureChanges:[]};
const ramp={...rampDefaults,spending:20000,startIncome:0,endIncome:50000,years:2,deadline:5};
const close=(a,b,tol=.1)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('income solver recovers analytically known endpoint and preserves inputs',()=>{
 const input=structuredClone(ramp),r=solveRamp(p,{...ramp,mode:'income'});
 // five years of income: one triangular ramp year + three established years
 close(r.amount,50000);close(r.projection.rows.at(-1).total,300000);assert.equal(r.projection.shortfall,null);assert.deepEqual(ramp,input);
});
test('spending solver recovers known spending and keeps income schedule',()=>{
 const r=solveRamp(p,{...ramp,mode:'spending',spending:NaN});close(r.amount,20000);close(r.projection.rows.at(-1).total,300000);
 assert.ok(projectRamp(p,{...r.settings,spending:r.amount+1},{maxYears:5,stopAtGoal:false}).rows.at(-1).total<300000);
});
test('shaped income solve preserves relative yearly weights',()=>{
 const s={...ramp,mode:'income',years:4,custom:true,incomes:shapedRampIncomes(0,50000,4,-1)};const r=solveRamp(p,s);
 close(r.settings.incomes[2]/r.amount,s.incomes[2]/50000,1e-8);assert.equal(r.settings.years,4);
});
test('solver rejects unfunded opening expenses, impossible spending and invalid deadlines',()=>{
 assert.throws(()=>solveRamp({...p,portfolio:0,futureChanges:[{kind:'expense',amount:1000,start:0,adjust:true}]},{...ramp,mode:'income'}),/cannot fund/);
 assert.throws(()=>solveRamp({...p,target:1e7},{...ramp,mode:'spending'}),/zero spending/);
 assert.throws(()=>solveRamp(p,{...ramp,mode:'income',deadline:0}),/deadline/);
});
test('monthly projections include a partial-year endpoint',()=>{
 const q=projectGap(p,[{action:'contribute',amount:12000,years:null}],{maxYears:1.5,stopAtGoal:false});close(q.rows.at(-1).year,1.5);close(q.rows.at(-1).total,218000);
});
test('lifetime comparison switches contributions to FI withdrawals',()=>{
 const q=comparisonProjection('traditional',p,{contribution:100000,adjust:true},[],3,'life',1);
 close(q.rows.at(-1).total,276000);const before=comparisonProjection('traditional',p,{contribution:100000,adjust:true},[],3,'fi',1);close(before.rows.at(-1).total,300000);
});
test('ramp scenario and standalone solver agree with retirement at deadline',()=>{
 const s={...ramp,mode:'income'};const r=runScenario('ramp','income',{plan:p,settings:s},7,'life');assert.equal(r.error,undefined);close(r.value,50000);close(r.projection.rows.at(-1).total,276000);
});
test('path lifetime rules agree with the same standalone retirement projection',()=>{
 const r=comparePaths(p,{traditional:{contribution:100000,adjust:true}},3,['traditional'],'life')[0];assert.equal(r.error,undefined);close(r.projection.rows.at(-1).total,276000);
});
test('comparison charts retain fractional FI endpoints',()=>{
 const r={plan:p,target:300000,projection:{rows:[{year:0,total:200000},{year:1.5,total:300000}]}};assert.equal(comparisonRows([r],2).at(-1).year,1.5);
});
test('timing audit: annual and monthly withdrawals match at zero growth',()=>{
 const plan={...p,portfolio:1e6,spending:12000};const annual=project(plan,{years:5});const monthly=projectGap(plan,[{action:'withdraw',amount:12000,years:null}],{maxYears:5,stopAtGoal:false});close(annual.end.total,monthly.rows.at(-1).total);
});
test('timing audit: positive growth exposes documented annual vs monthly difference',()=>{
 const plan={...p,portfolio:1e6,spending:12000,nominal:.06};const annual=project(plan,{years:1});const monthly=projectGap(plan,[{action:'withdraw',amount:12000,years:null}],{maxYears:1,stopAtGoal:false});assert.ok(annual.end.total>monthly.rows.at(-1).total);assert.ok(annual.end.total-monthly.rows.at(-1).total<400);
});
