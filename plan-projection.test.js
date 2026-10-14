import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,project,solve,lifetimeProjection,toNominal} from './finance.js';
import {simplifyPlan} from './plan-settings.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
const base=()=>simplifyPlan({...defaults,portfolio:1000000,cash:200000,separateFiWithdrawals:true,fiWithdrawals:60000,spending:20000,years:10});
test('cash counts once toward main FI and its solved deadline',()=>{
 const p=base(),s=solve(p,'time');assert.ok(!s.error);near(project(p,{years:s.value}).end.total,1500000);
 const done={...p,portfolio:1300000};near(solve(done,'time').value,0);
 const withdrawals=solve(p,'spending');assert.ok(!withdrawals.error);near(project(withdrawals.plan).end.total,1500000);
});
test('fixed nominal withdrawals lose purchasing power; inflation-adjusted withdrawals retain it',()=>{
 const p=base();for(const r of project({...p,adjustWithdrawals:false}).rows.slice(1))near(toNominal(r.spending,p.inflation,r.year),p.spending);
 for(const r of project(p).rows.slice(1))near(r.spending,p.spending);
 const annual=project({...p,withdrawalMode:'annual',adjustWithdrawals:false});for(const r of annual.rows.slice(1))near(r.spending,r.beginning*p.withdrawalRate);
});
test('lifetime table includes fractional arrival, final year and correct post-FI withdrawals',()=>{
 const p=base(),q=lifetimeProjection(p),cross=q.rows.find(r=>Math.abs(r.year-q.transitionAt)<1e-8);
 assert.ok(cross);near(cross.total,q.target);near(q.end.year,q.transitionAt+30);
 let previous=0;for(const r of q.rows.slice(1)){const dt=r.year-previous;near(r.spending,(r.phase==='Traditional FI'?p.fiWithdrawals:p.spending)*dt);near(r.total,r.beginning+r.beginCash+r.investmentReturn+r.cashInterest-r.investmentWithdrawal-r.cashWithdrawal);previous=r.year;}
});
test('post-FI fixed dollars start at inflation-adjusted FI withdrawal amount',()=>{
 const p={...base(),adjustWithdrawals:false},q=lifetimeProjection(p);let previous=0;
 for(const r of q.rows.slice(1)){if(r.phase==='Traditional FI')near(toNominal(r.spending/(r.year-previous),p.inflation,r.year),toNominal(p.fiWithdrawals,p.inflation,q.transitionAt));previous=r.year;}
});
test('post-FI depletion is reported; horizon cap and invalid extension are explicit',()=>{
 const p={...base(),portfolio:1500000,cash:0,nominal:0,afterFIYears:100};const q=lifetimeProjection(p);assert.ok(q.unfunded>0);assert.ok(q.rows.every(r=>r.cash>=0&&r.investment>=0));
 assert.equal(lifetimeProjection({...base(),afterFIYears:100}).capped,true);
 assert.throws(()=>lifetimeProjection({...base(),afterFIYears:-1}));
});
