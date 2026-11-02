import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,project} from './finance.js';
import {assetTotals} from './plan-assets.js';
import {projectGap} from './gap-fi.js';
import {traditionalProjection} from './traditional-fi.js';
import {coastProjection} from './coast-fi.js';
const assets=[{name:'Stocks',type:'stocks',amount:600000,rate:.08},{name:'Bonds',type:'bonds',amount:300000,rate:.03},{name:'Cash',type:'cash',amount:100000,rate:.01}];
const plan={...defaults,assets,...assetTotals(assets),returnMode:'nominal',inflation:0,spending:0,years:5,futureChanges:[],targetOverride:true,target:1e8};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
for(const [name,run] of Object.entries({risk:p=>project(p,{years:5}),gap:p=>projectGap(p,[{action:'even',amount:0,years:null}],{maxYears:5}),traditional:p=>traditionalProjection(p,{years:5,contribution:0}),coast:p=>coastProjection(p,{years:5,contribution:0})}))test(`${name} compounds each shared asset separately`,()=>{const end=run(plan).rows.at(-1);close(end.total,600000*1.08**5+300000*1.03**5+100000*1.01**5);});
test('retirement stops contributions and begins inflation-adjusted FI withdrawals',()=>{
 const p={...plan,assets:undefined,portfolio:100000,cash:0,nominal:0,cashNominal:0,target:100000,fiRate:.04};
 const q=projectGap(p,[{action:'contribute',amount:12000,years:null}],{maxYears:3,stopAtGoal:false,retirementAt:1});
 close(q.rows[1].total,112000);close(q.rows[3].total,104000);close(q.rows[2].contributions,0);close(q.rows[2].withdrawals,4000);assert.equal(q.rows[2].period,'retirement');
});
test('retirement reports depletion instead of extending negative assets',()=>{
 const q=projectGap({...plan,assets:undefined,portfolio:1000,cash:0,nominal:0,target:100000,fiRate:.04},[{action:'even',amount:0,years:null}],{maxYears:60,stopAtGoal:false,retirementAt:0});
 assert.ok(q.shortfall<1);assert.ok(q.rows.at(-1).total>=0);
});
