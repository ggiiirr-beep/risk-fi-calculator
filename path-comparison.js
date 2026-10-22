import {project,solve,resolveWithdrawals,fiTarget} from './finance.js';
import {projectGap} from './gap-fi.js';
import {coastProjection} from './coast-fi.js';
import {traditionalProjection} from './traditional-fi.js';
import {futureFlows} from './future-changes.js';
import {baselinePlan} from './plan-settings.js';
export function comparePaths(input,settings,horizon=30){
 const state=structuredClone(input),s=structuredClone(settings),base=baselinePlan(state);
 if(!Number.isInteger(horizon)||horizon<1||horizon>100)throw Error('Use a chart horizon from 1 to 100 years.');
 return ['plan','gap','coast','traditional'].map(key=>{try{
  let p={...base},arrival=null,projection,through;
  if(key==='plan'){
   p={...state,...s.risk};p=resolveWithdrawals(p);const solved=solve(p,'time');if(solved.error)throw Error(solved.error);arrival=solved.value;
   projection=project(p,{years:horizon});through=project(p,{years:arrival});
  }else if(key==='gap'){
   p={...base,...s.gap,adjustWithdrawals:s.gap.adjust};through=projectGap(p,s.periods);arrival=through.reached;projection=projectGap(p,s.periods,{maxYears:horizon,stopAtGoal:false});
  }else if(key==='traditional'){
   through=traditionalProjection(p,{...s.traditional,years:100});arrival=through.reached;projection=traditionalProjection(p,{...s.traditional,years:horizon,stopAtGoal:false});
  }else{
   through=projectGap({...p,coastAt:s.coast.coastAt,adjustWithdrawals:true,cashStrategy:'first'},[{action:'contribute',amount:s.coast.contribution,years:null}]);arrival=through.reached;projection=coastProjection(p,{...s.coast,years:horizon});
  }
  if(arrival===null||through.shortfall!=null&&through.shortfall<=arrival||through.unfunded>.01)throw Error('FI is not reached with all withdrawals funded within 100 years.');
  const contributions=through.rows.reduce((sum,r)=>sum+(r.contributions||0),0),withdrawals=futureFlows(p.futureChanges,0,0,p.inflation).expense+through.rows.reduce((sum,r)=>sum+(r.withdrawals??((r.investmentWithdrawal||0)+(r.cashWithdrawal||0))),0);
  return {key,plan:p,value:arrival,target:fiTarget(p),projection,contributions,withdrawals};
 }catch(e){return {key,error:e.message};}});
}
