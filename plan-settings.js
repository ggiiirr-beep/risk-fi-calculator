import {nominalReturn} from './finance.js';
// Retire hidden settings without changing a saved return or custom FI balance.
export function simplifyPlan(plan){
 return {...plan,timeEntry:plan.timeEntry==='age'?'age':'years',
  nominal:plan.returnMode==='real'?nominalReturn(plan.real,plan.inflation):plan.nominal,
  returnMode:'nominal',separateFiWithdrawals:true,fiWithdrawals:plan.targetOverride?plan.target*plan.fiRate:plan.separateFiWithdrawals?plan.fiWithdrawals:plan.spending,
  targetOverride:false,income:0,incomeStart:0,incomeEnd:0,timing:'end'};
}
export function yearsToAge(age,target){
 if(!Number.isFinite(age)||age<0||age>120||!Number.isFinite(target)||target<age) return null;
 return target-age;
}
