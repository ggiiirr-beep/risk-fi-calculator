import {bondShare} from './plan-assets.js';
import {cashAmount,expectedReturn,nominalReturn,fiTarget} from './finance.js?v=20261021-3';
// Transfer a solved plan explicitly: guardrails use total wealth, not investments alone.
export function guardrailPlanInputs(plan){
 const cash=cashAmount(plan),years=Math.max(1,Math.ceil(plan.years)),target=fiTarget(plan);
 if(![plan.portfolio,cash,plan.spending,plan.years,plan.fiRate,target,plan.inflation,plan.cashNominal,expectedReturn(plan)].every(Number.isFinite)||plan.portfolio<0||cash<0||plan.spending<0||years<1||years>60)throw Error('Complete a plan with a horizon of 1–60 years before using it here.');
 return {bondWeight:bondShare(plan),futureChanges:plan.futureChanges||[],goal:'fi',fiBasis:'total',initialMode:'plan',initialCash:cash,initialWithdrawal:plan.spending,adjustWithdrawals:plan.adjustWithdrawals!==false,sourceAge:plan.age,sourceTimeEntry:plan.timeEntry,sourceWithdrawalMode:plan.withdrawalMode,sourceYears:plan.years,portfolio:plan.portfolio+cash,years,fiYears:years,fiWithdrawals:target*plan.fiRate,fiRate:plan.fiRate,stockMean:nominalReturn(expectedReturn(plan),plan.inflation),inflation:plan.inflation,cashReturn:plan.cashNominal,checkInvestment:plan.portfolio,checkCash:cash,checkSpending:plan.spending,checkElapsed:0,checkInflationTotal:null,checkDollarBasis:'current'};
}

// Editing the connected snapshot makes it an explicit plan, not another solve.
export function editConnectedPlan(plan,key,value){
 if(!Number.isFinite(value))throw Error('Enter a number.');
 const cash=cashAmount(plan),total=plan.portfolio+cash;
 const next={...plan,cashMode:'dollars',cash};
 if(['portfolio','initialCash','initialWithdrawal','fiWithdrawals','target','years'].includes(key)&&value<0)throw Error('Enter zero or more.');
 if(key==='portfolio'){if(value<cash)throw Error('Total assets must include your cash reserve.');next.portfolio=value-cash;}
 else if(key==='initialCash'){if(value>total)throw Error('Cash cannot exceed total assets.');next.cash=value;next.portfolio=total-value;}
 else if(key==='initialWithdrawal'){next.spending=value;next.withdrawalMode='dollars';}
 else if(key==='target'){next.fiWithdrawals=value*plan.fiRate;next.separateFiWithdrawals=true;next.targetOverride=false;}
 else if(key==='fiWithdrawals'){next.fiWithdrawals=value;next.separateFiWithdrawals=true;}
 else if(key==='years'){if(value<=0||value>60)throw Error('Enter more than zero and up to 60 years.');next.years=value;}
 else if(key==='fiRate'){if(value<=0||value>1)throw Error('Enter a withdrawal rate above 0% and at most 100%.');next.fiRate=value;}
 else if(['stockMean','inflation','cashReturn'].includes(key)){if(value<=-1||value>1)throw Error('Enter a rate above −100% and at most 100%.');next[{stockMean:'nominal',inflation:'inflation',cashReturn:'cashNominal'}[key]]=value;next.returnMode='nominal';}
 else throw Error('Unknown shared plan field.');
 return next;
}
