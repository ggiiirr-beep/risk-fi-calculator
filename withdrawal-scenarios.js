import {cashAmount,traditionalWithdrawals,resolveWithdrawals,project,solve} from './finance.js';
/** Change only Risk FI withdrawals; retain the actual starting cash and FI goal. */
export function compareWithdrawals(plan,values,question='time'){
 const percentage=plan.withdrawalMode!=='dollars';
 if(values.length!==3||values.some(v=>!Number.isFinite(v)||v<0||(percentage&&v>1)))throw Error(percentage?'Enter three withdrawal rates between 0% and 100%.':'Enter three nonnegative annual withdrawal amounts.');
 const fixed={...plan,cashMode:'dollars',cash:cashAmount(plan),separateFiWithdrawals:true,fiWithdrawals:traditionalWithdrawals(plan)};
 const scenarios=values.map(value=>{
  let p=resolveWithdrawals({...fixed,...(percentage?{withdrawalRate:value}:{spending:value})});
  const solution=['portfolio','return'].includes(question)?solve(p,question):null;
  if(solution?.error)return {plan:p,error:solution.error,solution};
  if(solution)p=resolveWithdrawals(solution.plan);
  const arrival=solve(p,'time'),projection=project(p);
  return {plan:p,arrival,projection,solution,onTrack:projection.end.total>=projection.target-.01&&projection.unfunded<.01};
 });
 const horizon=['portfolio','return','projection'].includes(question)?plan.years:Math.min(100,Math.max(plan.years,...scenarios.map(s=>s.arrival?.error||!s.arrival?0:s.arrival.value)));
 return {horizon,question,scenarios:scenarios.map(s=>s.error?s:{...s,full:project(s.plan,{years:horizon})})};
}

/** Vary real returns while solving the selected question on a fixed cash/goal basis. */
export function compareReturns(plan,rates,question='time'){
 if(rates.length!==3||rates.some(v=>!Number.isFinite(v)||v<=-1))throw Error('Enter three real returns above −100%.');
 const fixed={...plan,cashMode:'dollars',cash:cashAmount(plan),separateFiWithdrawals:true,fiWithdrawals:traditionalWithdrawals(plan)};
 const scenarios=rates.map(real=>{
  let p={...fixed,returnMode:'real',real};
  const solution=['spending','portfolio'].includes(question)?solve(p,question):null;
  if(solution?.error)return {plan:p,error:solution.error,solution};
  if(solution)p=resolveWithdrawals(solution.plan);
  const arrival=solve(p,'time'),projection=project(p);
  return {plan:p,solution,arrival,projection,onTrack:projection.end.total>=projection.target-.01&&projection.unfunded<.01};
 });
 const horizon=['spending','portfolio','projection'].includes(question)?plan.years:Math.min(100,Math.max(plan.years,...scenarios.map(s=>s.arrival?.error||!s.arrival?0:s.arrival.value)));
 return {horizon,scenarios:scenarios.map(s=>s.error?s:{...s,full:project(s.plan,{years:horizon})})};
}
