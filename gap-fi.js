import {createLedger,ledgerTotal,growLedger,changeLedger} from './plan-assets.js';
import {validateChanges,futureFlows} from './future-changes.js';
import {cashAmount,expectedReturn,realReturn,fiTarget} from './finance.js';
export const gapDefaults=()=>[{action:'withdraw',amount:60000,years:2},{action:'even',amount:0,years:2},{action:'contribute',amount:40000,years:null}];
/** Monthly end-of-period flows; all balances and flows in today's dollars. */
export function projectGap(plan,periods,{maxYears=100,stopAtGoal=true}={}){
 validateChanges(plan.futureChanges);
 if(!periods.length||periods.at(-1).years!==null)throw Error('End your timeline with an Until FI period.');
 let duration=0;
 for(const [i,p] of periods.entries()){
  if(!['withdraw','even','contribute'].includes(p.action)||!Number.isFinite(p.amount)||p.amount<0)throw Error('Enter a nonnegative annual amount for each period.');
  if(p.years===null){if(i!==periods.length-1)throw Error('Until FI must be the last period.');}
  else {if(!Number.isInteger(p.years)||p.years<1||p.years>100)throw Error('Period lengths must be whole years from 1 to 100.');duration+=p.years;}
 }
 if(duration>=100)throw Error('Fixed periods must total less than 100 years.');
 let investment=plan.portfolio,cash=cashAmount(plan),target=fiTarget(plan),r=expectedReturn(plan),cr=realReturn(plan.cashNominal,plan.inflation);
 if(![investment,cash,target,r,cr,plan.inflation].every(Number.isFinite)||investment<0||cash<0||target<=0||r<=-1||cr<=-1)throw Error('Enter valid assets, returns and an FI goal in Your numbers.');
 const ledger=createLedger({...plan,cash});
 const opening=futureFlows(plan.futureChanges,0,0,plan.inflation);changeLedger(ledger,opening.addition);const openingCash=plan.cashStrategy==='first'||(plan.cashStrategy==='downturn'&&r<0)?Math.min(opening.expense,Math.max(0,cash-(plan.cashMinimum||0))):0;changeLedger(ledger,-openingCash,true);const openingPaid=openingCash-changeLedger(ledger,-(opening.expense-openingCash));investment=ledgerTotal(ledger);cash=ledgerTotal(ledger,true);
 const rows=[{year:0,investment,cash,total:investment+cash,target,withdrawals:0,contributions:0,period:0,nominalWithdrawals:0,nominalContributions:0}], boundaries=[];
 let elapsed=0;periods.forEach(p=>{elapsed+=p.years??Infinity;boundaries.push(elapsed);});
 let reached=investment+cash>=target?0:null,shortfall=openingPaid<opening.expense-1e-7?0:null,withdrawals=0,contributions=0,nominalWithdrawals=0,nominalContributions=0,periodIncome=0,periodRequested=0,periodExpense=0,periodIncomeUsed=0,periodSurplus=0,nominalIncomeUsed=0,nominalSurplus=0,nominalRequested=0,nominalExpense=0;
 for(let month=1;(!stopAtGoal||reached===null)&&month<=maxYears*12&&shortfall===null;month++){
  const start=(month-1)/12,year=month/12,index=boundaries.findIndex(end=>start<end),p=periods[index];
  growLedger(ledger,plan.inflation,1/12);const flows=futureFlows(plan.futureChanges,start,year,plan.inflation);changeLedger(ledger,flows.addition);
  investment=ledgerTotal(ledger);cash=ledgerTotal(ledger,true);
  const amount=(start>=(plan.coastAt??Infinity)?0:p.amount)/12/(plan.adjustWithdrawals===false?Math.pow(1+plan.inflation,year):1);
  if(p.action==='contribute'){changeLedger(ledger,amount);investment=ledgerTotal(ledger);contributions+=amount;nominalContributions+=amount*Math.pow(1+plan.inflation,year);}
  periodIncome+=flows.income;periodExpense+=flows.expense;
  const requested=p.action==='withdraw'?amount:0,net=Math.max(0,requested-flows.income)+flows.expense;
  periodRequested+=requested;periodIncomeUsed+=Math.min(requested,flows.income);const surplus=Math.max(0,flows.income-requested);periodSurplus+=surplus;const flowPrice=(1+plan.inflation)**year;nominalIncomeUsed+=Math.min(requested,flows.income)*flowPrice;nominalSurplus+=surplus*flowPrice;nominalRequested+=requested*flowPrice;nominalExpense+=flows.expense*flowPrice;changeLedger(ledger,surplus,true);cash=ledgerTotal(ledger,true);
  if(net>0){
   let need=net;
   const useCash=plan.cashStrategy==='first'||(plan.cashStrategy==='downturn'&&r<0);
   if(useCash){const paid=Math.min(need,Math.max(0,cash-(plan.cashMinimum||0)));changeLedger(ledger,-paid,true);cash=ledgerTotal(ledger,true);need-=paid;}
   const paid=Math.min(need,investment);changeLedger(ledger,-paid);investment=ledgerTotal(ledger);need-=paid;withdrawals+=net-need;nominalWithdrawals+=(net-need)*Math.pow(1+plan.inflation,year);
   if(need>1e-7)shortfall=year;
  }
  if(reached===null&&investment+cash>=target-1e-7)reached=year;
  if(month%12===0||(stopAtGoal&&reached!==null)||shortfall!==null){rows.push({year,investment,cash,total:investment+cash,target,withdrawals,contributions,nominalWithdrawals,nominalContributions,income:periodIncome,incomeUsed:periodIncomeUsed,nominalIncomeUsed,nominalSurplus,nominalRequested,nominalExpense,surplus:periodSurplus,requested:periodRequested,expense:periodExpense,period:index});withdrawals=0;contributions=0;nominalWithdrawals=0;nominalContributions=0;periodIncome=0;periodRequested=0;periodExpense=0;periodIncomeUsed=0;periodSurplus=0;nominalIncomeUsed=0;nominalSurplus=0;nominalRequested=0;nominalExpense=0;}
  if(shortfall!==null)break;
 }
 return {rows,reached,shortfall,target,boundaries:boundaries.filter(Number.isFinite)};
}

/** Solve one phase's annual amount, holding all other phases fixed. */
export function solveGapAmount(plan,periods,{mode,index,years}){
 if(!['withdraw','contribute'].includes(mode)||periods[index]?.action!==mode)throw Error('Choose a matching period to calculate.');
 if(!Number.isInteger(years)||years<1||years>100)throw Error('Choose an FI deadline from 1 to 100 whole years.');
 const start=periods.slice(0,index).reduce((sum,p)=>sum+(p.years??Infinity),0);
 if(start>=years)throw Error('The selected period starts at or after your FI deadline.');
 const run=amount=>projectGap(plan,periods.map((p,i)=>i===index?{...p,amount}:p),{maxYears:years,stopAtGoal:false});
 const meets=q=>q.shortfall===null&&q.rows.at(-1).total>=q.target-1e-7;
 let low=0,high=Math.max(1000,plan.portfolio),zero=run(0);
 if(mode==='withdraw'&&!meets(zero))throw Error('Even zero withdrawals in this period cannot meet the deadline. Adjust another period or the deadline.');
 if(mode==='contribute'&&meets(zero))return {amount:0,projection:zero};
 for(let i=0;i<60&&(mode==='contribute'?!meets(run(high)):meets(run(high)));i++)high*=2;
 if(mode==='contribute'&&!meets(run(high)))throw Error('This contribution period cannot restore the plan. Check withdrawals before it starts.');
 if(mode==='withdraw'&&meets(run(high)))throw Error('No finite withdrawal limit was found for this period.');
 for(let i=0;i<80;i++){const mid=(low+high)/2,ok=meets(run(mid));if(mode==='withdraw'?ok:!ok)low=mid;else high=mid;}
 const amount=mode==='withdraw'?Math.floor(low*100)/100:Math.ceil(high*100)/100;
 return {amount,projection:run(amount)};
}
