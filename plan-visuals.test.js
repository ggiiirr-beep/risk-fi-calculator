import test from 'node:test';import assert from 'node:assert/strict';
import {fundingParts,planTimeline,fundingChart} from './plan-visuals.js';
import {projectGap} from './gap-fi.js';import {defaults} from './finance.js';
import {guardrailDefaults,runRetirement,aggregateStrategy} from './guardrails.js';
test('funding separates income used, surplus, portfolio withdrawals and shortfall',()=>{
 assert.deepEqual(fundingParts({requested:60000,income:20000,withdrawals:30000}),{portfolio:30000,income:20000,surplus:0,unfunded:10000,expense:0,requested:60000});
 const p=fundingParts({requested:10000,income:30000,withdrawals:5000,expense:5000});assert.equal(p.surplus,20000);assert.equal(p.unfunded,0);
});
test('monthly income attribution does not net surplus against earlier withdrawals',()=>{
 const q=projectGap({...defaults,portfolio:1000000,cash:0,nominal:0,inflation:0,fiWithdrawals:1e6,separateFiWithdrawals:true,futureChanges:[{kind:'income',start:.5,amount:24000,adjust:true}]},[{action:'withdraw',amount:12000,years:null}],{maxYears:1,stopAtGoal:false});
 const parts=fundingParts(q.rows.at(-1));assert.ok(Math.abs(parts.portfolio-6000)<1e-6);assert.ok(Math.abs(parts.income-6000)<1e-6);assert.ok(Math.abs(parts.surplus-6000)<1e-6);
});
test('timeline labels escape names and funding switches dollar basis',()=>{
 const p={age:40,timeEntry:'age',inflation:.1,futureChanges:[{kind:'income',name:'<script>',start:1,end:2}]};const html=planTimeline(p,[{action:'even',label:'Break even',years:null}],3,2);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Age 42'));assert.ok(html.includes('FI first reached'));
 assert.ok(fundingChart(p,[{year:1,requested:100,withdrawals:100}],true).includes('$110'));
});
test('FI arrival records first funded touch separately from deadline outcome',()=>{
 const a={...guardrailDefaults,goal:'fi',fiBasis:'total',years:2,fiWithdrawals:4,fiRate:.04,portfolio:80,reserveYears:0,floor:0};
 const paths={count:3,years:2,stock:new Float64Array([2,.25,.5,.5,2,1]),cash:new Float64Array(6).fill(1),positive:new Uint8Array(6).fill(1),prices:new Float64Array(6).fill(1)};
 const model={probability:()=>.5,spendingFor:()=>({spending:0,probability:.5})},initial={investment:80,cash:0,spending:0},s={name:'A',lower:.2,target:.5,upper:.8};
 const first=runRetirement(a,s,model,paths,0,initial,'fixed');assert.equal(first.firstFI,1);assert.equal(first.fiReached,false);
 const summary=aggregateStrategy(a,s,model,paths,{initialOverride:initial,policy:'fixed'});assert.deepEqual(summary.fiArrivals,{counts:[0,2,0],neverReached:1,total:3});assert.equal(summary.actualSuccess,1/3);
 const now=runRetirement(a,s,model,paths,0,{...initial,investment:120},'fixed');assert.equal(now.firstFI,0);
});
