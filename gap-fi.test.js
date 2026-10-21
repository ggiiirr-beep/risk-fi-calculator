import test from 'node:test';
import assert from 'node:assert/strict';
import {projectGap} from './gap-fi.js';
import {defaults} from './finance.js';
const p={...defaults,portfolio:100000,cash:0,nominal:0,inflation:0,cashNominal:0,separateFiWithdrawals:true,fiWithdrawals:8000,fiRate:.04};
test('GapFi stages reconcile and contributions continue until FI',()=>{const q=projectGap(p,[{action:'withdraw',amount:12000,years:2},{action:'even',amount:0,years:2},{action:'contribute',amount:24000,years:null}]);assert.equal(q.rows[2].total,76000);assert.equal(q.rows[4].total,76000);assert.equal(q.reached,9+2/12);assert.equal(q.rows.at(-1).total,200000);});
test('GapFi includes cash, reports shortfalls and bounded nonarrival',()=>{assert.equal(projectGap({...p,cash:100000},[{action:'even',amount:0,years:null}]).reached,0);assert.equal(projectGap(p,[{action:'withdraw',amount:120000,years:null}]).shortfall,11/12);assert.equal(projectGap(p,[{action:'even',amount:0,years:null}]).reached,null);});
test('GapFi validates terminal periods and durations',()=>{assert.throws(()=>projectGap(p,[{action:'even',amount:0,years:2}]));assert.throws(()=>projectGap(p,[{action:'even',amount:0,years:null},{action:'even',amount:0,years:null}]));});
test('inflation-adjusted flows preserve purchasing power; fixed nominal contributions shrink',()=>{const periods=[{action:'contribute',amount:12000,years:null}],base={...p,nominal:.1,inflation:.1,cashNominal:.1};const real=projectGap(base,periods),fixed=projectGap({...base,adjustWithdrawals:false},periods);assert.ok(fixed.reached>real.reached);assert.equal(real.rows[1].contributions,12000);});
test('future-dollar totals add monthly flows rather than inflating the annual total at year end',()=>{const q=projectGap({...p,nominal:.12,inflation:.12,adjustWithdrawals:false},[{action:'contribute',amount:12000,years:null}]);assert.ok(Math.abs(q.rows[1].nominalContributions-12000)<1e-7);assert.ok(q.rows[1].contributions<12000);});

import {solveGapAmount} from './gap-fi.js';
test('GapFi solves one contribution period and leaves source periods unchanged',()=>{
 const phases=[{action:'withdraw',amount:10000,years:2},{action:'contribute',amount:999,years:null}],saved=JSON.stringify(phases);
 const q=solveGapAmount(p,phases,{mode:'contribute',index:1,years:12});
 assert.ok(Math.abs(q.amount-12000)<.02);assert.ok(q.projection.rows.at(-1).total>=200000-1e-6);assert.equal(JSON.stringify(phases),saved);
});
test('GapFi solves maximum withdrawals while funding every month',()=>{
 const phases=[{action:'withdraw',amount:1,years:2},{action:'contribute',amount:20000,years:null}];
 const q=solveGapAmount(p,phases,{mode:'withdraw',index:0,years:10});assert.ok(Math.abs(q.amount-30000)<.02);assert.equal(q.projection.shortfall,null);
});
test('GapFi rejects impossible deadlines and phases after the deadline',()=>{
 assert.throws(()=>solveGapAmount(p,[{action:'withdraw',amount:1,years:null}],{mode:'withdraw',index:0,years:10}),/zero withdrawals/);
 assert.throws(()=>solveGapAmount(p,[{action:'withdraw',amount:200000,years:2},{action:'contribute',amount:1,years:null}],{mode:'contribute',index:1,years:10}),/cannot restore/);
 assert.throws(()=>solveGapAmount(p,[{action:'even',amount:0,years:2},{action:'contribute',amount:1,years:null}],{mode:'contribute',index:1,years:2}),/starts/);
});
test('GapFi can solve before later periods start and respects fixed nominal flows',()=>{
 const phases=[{action:'contribute',amount:0,years:20},{action:'even',amount:0,years:null}];
 const q=solveGapAmount(p,phases,{mode:'contribute',index:0,years:10});assert.ok(Math.abs(q.amount-10000)<.02);
 const base={...p,nominal:.05,inflation:.05,cashNominal:.05};
 const real=solveGapAmount(base,phases,{mode:'contribute',index:0,years:10});
 const fixed=solveGapAmount({...base,adjustWithdrawals:false},phases,{mode:'contribute',index:0,years:10});assert.ok(fixed.amount>real.amount);assert.ok(fixed.projection.rows.at(-1).total>=fixed.projection.target);
});
