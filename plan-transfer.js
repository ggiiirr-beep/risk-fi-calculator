import {cashAmount,expectedReturn,nominalReturn,fiTarget} from './finance.js?v=20261014-6';
// Transfer a solved plan explicitly: guardrails use total wealth, not investments alone.
export function guardrailPlanInputs(plan){
 const cash=cashAmount(plan),years=Math.max(1,Math.ceil(plan.years)),target=fiTarget(plan);
 if(![plan.portfolio,cash,plan.spending,plan.years,plan.fiRate,target,plan.inflation,plan.cashNominal,expectedReturn(plan)].every(Number.isFinite)||plan.portfolio<0||cash<0||plan.spending<0||years<1||years>60)throw Error('Complete a plan with a horizon of 1–60 years before using it here.');
 return {goal:'fi',fiBasis:'total',initialMode:'plan',initialCash:cash,initialWithdrawal:plan.spending,adjustWithdrawals:plan.adjustWithdrawals!==false,sourceWithdrawalMode:plan.withdrawalMode,sourceYears:plan.years,portfolio:plan.portfolio+cash,years,fiYears:years,fiWithdrawals:target*plan.fiRate,fiRate:plan.fiRate,stockMean:nominalReturn(expectedReturn(plan),plan.inflation),inflation:plan.inflation,cashReturn:plan.cashNominal,checkInvestment:plan.portfolio,checkCash:cash,checkSpending:plan.spending,checkElapsed:0,checkInflationTotal:null,checkDollarBasis:'current'};
}
