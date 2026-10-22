import {solve,project,fiTarget,resolveWithdrawals} from './finance.js';
import {projectGap,solveGapAmount} from './gap-fi.js';
import {traditionalProjection,contributionNeeded} from './traditional-fi.js';
import {solveCoast,coastProjection} from './coast-fi.js';
export const comparisonQuestions={plan:{time:'When will I reach FI?',spending:'Withdrawal amount',portfolio:'Investment needed',return:'Return needed'},gap:{time:'When will I reach FI?',withdraw:'Withdrawal amount',contribute:'Contribution amount'},traditional:{time:'When will I reach FI?',contribution:'Contributions needed'},coast:{amount:'Investments needed to coast now',time:'When can I stop contributing?',retirement:'FI date without contributions',arrival:'FI date with a chosen coast date'}};
export function runScenario(source,question,scenario,horizon=30){
 try{
 const c=structuredClone(scenario);let p=c.plan,settings=c.settings||{},periods=c.periods||[],value,kind='money',projection;
 if(!Number.isInteger(horizon)||horizon<1||horizon>100)throw Error('Chart horizon must be 1–100 whole years.');
 if(!comparisonQuestions[source]?.[question])throw Error('Choose a comparison question.');
 for(const key of ['portfolio','cash','nominal','inflation'])if(!(source==='plan'&&((question==='portfolio'&&key==='portfolio')||(question==='return'&&key==='nominal')))&&!Number.isFinite(p[key]))throw Error('Enter valid starting assets and return assumptions.');
 if(source==='plan'){
  const s=solve(p,question);if(s.error)throw Error(s.error);p=resolveWithdrawals(s.plan);value=s.value;kind=question==='time'?'time':question==='return'?'realReturn':'money';projection=project(p,{years:horizon});
 }else if(source==='gap'){
  p={...p,...settings,adjustWithdrawals:settings.adjust};
  if(question==='time'){const q=projectGap(p,periods);if(q.reached===null||q.shortfall!==null)throw Error(q.shortfall!==null?'Withdrawals cannot be funded before FI.':'FI is not reached within 100 years.');value=q.reached;kind='time';}
  else{const s=solveGapAmount(p,periods,{mode:question,index:settings.index,years:settings.years});value=s.amount;periods[settings.index].amount=value;}
  projection=projectGap(p,periods,{maxYears:horizon,stopAtGoal:false});
 }else if(source==='traditional'){
  let contribution=settings.contribution;
  if(question==='contribution'){const s=contributionNeeded(p,settings);contribution=s.contribution;value=contribution;}
  else{const q=traditionalProjection(p,{...settings,years:100});if(q.reached===null||q.shortfall!==null)throw Error('FI is not reached with all withdrawals funded within 100 years.');value=q.reached;kind='time';}
  projection=traditionalProjection(p,{...settings,contribution,years:horizon,stopAtGoal:false});
 }else{
  if(question==='arrival'){
   if(!Number.isFinite(settings.coastAt)||settings.coastAt<0||settings.coastAt>100)throw Error('Enter a contribution stop date within 0–100 years.');
   const q=coastProjection(p,{...settings,years:100,coastAt:settings.coastAt||0});if(q.reached===null||q.shortfall!==null&&q.shortfall<=q.reached)throw Error('FI is not reached before a funding shortfall within 100 years.');value=q.reached;kind='time';projection=coastProjection(p,{...settings,years:horizon,coastAt:settings.coastAt||0});
  }else{
   const s=solveCoast(p,{...settings,mode:question});value=s.value;kind=question==='amount'?'money':'time';
   if(question==='amount')p.portfolio=value;
   projection=coastProjection(p,{years:horizon,contribution:question==='time'?settings.contribution:0,coastAt:question==='time'?value:0});
  }
 }
 return {value,kind,plan:p,projection,target:fiTarget(p)};
 }catch(e){return {error:e.message};}
}
export function comparisonRows(results,horizon,nominal=false){
 return Array.from({length:horizon+1},(_,year)=>{const row={year};results.forEach((r,i)=>{if(r.error)return;const rows=r.projection.rows;const exact=rows.find(p=>Math.abs(p.year-year)<1e-7);if(exact)row['s'+i]=exact.total*(nominal?(1+r.plan.inflation)**year:1);});const valid=results.find(r=>!r.error);if(valid)row.target=valid.target*(nominal?(1+valid.plan.inflation)**year:1);return row;});
}
