import {cashAmount,expectedReturn,realReturn,fiTarget} from './finance.js';
export const gapDefaults=()=>[{action:'withdraw',amount:60000,years:2},{action:'even',amount:0,years:2},{action:'contribute',amount:40000,years:null}];
/** Monthly end-of-period flows; all balances and flows in today's dollars. */
export function projectGap(plan,periods,{maxYears=100,stopAtGoal=true}={}){
 if(!periods.length||periods.at(-1).years!==null)throw Error('End your timeline with an Until FI period.');
 let duration=0;
 for(const [i,p] of periods.entries()){
  if(!['withdraw','even','contribute'].includes(p.action)||!Number.isFinite(p.amount)||p.amount<0)throw Error('Enter a nonnegative annual amount for each period.');
  if(p.years===null){if(i!==periods.length-1)throw Error('Until FI must be the last period.');}
  else {if(!Number.isInteger(p.years)||p.years<1||p.years>100)throw Error('Period lengths must be whole years from 1 to 100.');duration+=p.years;}
 }
 if(duration>=maxYears)throw Error('Fixed periods must total less than 100 years.');
 let investment=plan.portfolio,cash=cashAmount(plan),target=fiTarget(plan),r=expectedReturn(plan),cr=realReturn(plan.cashNominal,plan.inflation);
 if(![investment,cash,target,r,cr,plan.inflation].every(Number.isFinite)||investment<0||cash<0||target<=0||r<=-1||cr<=-1)throw Error('Enter valid assets, returns and an FI goal in Your numbers.');
 const rows=[{year:0,investment,cash,total:investment+cash,target,withdrawals:0,contributions:0,period:0,nominalWithdrawals:0,nominalContributions:0}], boundaries=[];
 let elapsed=0;periods.forEach(p=>{elapsed+=p.years??Infinity;boundaries.push(elapsed);});
 let reached=investment+cash>=target?0:null,shortfall=null,withdrawals=0,contributions=0,nominalWithdrawals=0,nominalContributions=0;
 for(let month=1;(!stopAtGoal||reached===null)&&month<=maxYears*12;month++){
  const start=(month-1)/12,year=month/12,index=boundaries.findIndex(end=>start<end),p=periods[index];
  investment*=Math.pow(1+r,1/12);cash*=Math.pow(1+cr,1/12);
  const amount=p.amount/12/(plan.adjustWithdrawals===false?Math.pow(1+plan.inflation,year):1);
  if(p.action==='contribute'){investment+=amount;contributions+=amount;nominalContributions+=amount*Math.pow(1+plan.inflation,year);}
  if(p.action==='withdraw'){
   let need=amount;
   const useCash=plan.cashStrategy==='first'||(plan.cashStrategy==='downturn'&&r<0);
   if(useCash){const paid=Math.min(need,Math.max(0,cash-(plan.cashMinimum||0)));cash-=paid;need-=paid;}
   const paid=Math.min(need,investment);investment-=paid;need-=paid;withdrawals+=amount-need;nominalWithdrawals+=(amount-need)*Math.pow(1+plan.inflation,year);
   if(need>1e-7)shortfall=year;
  }
  if(reached===null&&investment+cash>=target-1e-7)reached=year;
  if(month%12===0||(stopAtGoal&&reached!==null)||shortfall!==null){rows.push({year,investment,cash,total:investment+cash,target,withdrawals,contributions,nominalWithdrawals,nominalContributions,period:index});withdrawals=0;contributions=0;nominalWithdrawals=0;nominalContributions=0;}
  if(shortfall!==null)break;
 }
 return {rows,reached,shortfall,target,boundaries:boundaries.filter(Number.isFinite)};
}
