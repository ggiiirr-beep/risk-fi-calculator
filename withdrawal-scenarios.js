import {cashAmount,traditionalWithdrawals,resolveWithdrawals,project,solve} from './finance.js';
/** Change only Risk FI withdrawals; retain the actual starting cash and FI goal. */
export function compareWithdrawals(plan,values){
 const percentage=plan.withdrawalMode!=='dollars';
 if(values.length!==3||values.some(v=>!Number.isFinite(v)||v<0||(percentage&&v>1)))throw Error(percentage?'Enter three withdrawal rates between 0% and 100%.':'Enter three nonnegative annual withdrawal amounts.');
 const fixed={...plan,cashMode:'dollars',cash:cashAmount(plan),separateFiWithdrawals:true,fiWithdrawals:traditionalWithdrawals(plan)};
 const scenarios=values.map(value=>{const p=resolveWithdrawals({...fixed,...(percentage?{withdrawalRate:value}:{spending:value})}),arrival=solve(p,'time');return {plan:p,arrival,projection:project(p)};});
 const horizon=Math.min(100,Math.max(plan.years,...scenarios.map(s=>s.arrival.error?0:s.arrival.value)));
 return {horizon,scenarios:scenarios.map(s=>({...s,full:project(s.plan,{years:horizon})}))};
}
