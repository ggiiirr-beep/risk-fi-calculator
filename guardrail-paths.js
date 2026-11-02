import {rampPeriods} from './ramp-fi.js?v=20261102-ramp2';
import {periodFlows} from './period-flows.js?v=20261102-ramp2';
import {projectGap,solveGapAmount} from './gap-fi.js?v=20261102-ramp2';
import {solveCoast} from './coast-fi.js?v=20261102-ramp2';
/** Snapshot each path without changing the shared starting balances. */
export function guardrailPaths(plan,gapPeriods,gapSettings,coast,ramp){
 const paths={risk:{label:'Risk Fi',periods:null,years:plan.years},traditional:{label:'Traditional Fi',periods:null}};
 try{
  let periods=structuredClone(gapPeriods),years;
  if(gapSettings.mode&&gapSettings.mode!=='time'){const s=solveGapAmount({...plan,adjustWithdrawals:gapSettings.adjust},periods,gapSettings);periods[gapSettings.index].amount=s.amount;years=gapSettings.years;}
  else years=projectGap({...plan,adjustWithdrawals:gapSettings.adjust},periods).reached??plan.years;
  paths.gap={label:'Gap Fi',periods,years:Math.max(1,Math.ceil(years)),adjust:gapSettings.adjust!==false};
 }catch(e){paths.gap={label:'Gap Fi',error:e.message};}
 try{
  const stop=coast.mode==='time'?solveCoast(plan,coast).value:0;
  const years=coast.mode==='retirement'?solveCoast(plan,coast).value:coast.years;
  paths.coast={label:'Coast Fi',years:Math.max(1,Math.ceil(years)),adjust:true,periods:[...(stop>0?[{action:'contribute',amount:coast.contribution,years:stop}]:[]),{action:'even',amount:0,years:null}]};
 }catch(e){paths.coast={label:'Coast Fi',error:e.message};}
 if(ramp)try{const periods=rampPeriods(ramp),years=projectGap({...plan,cashStrategy:ramp.cashStrategy,adjustWithdrawals:true},periods).reached??plan.years;paths.ramp={label:'Ramp Fi',periods,years:Math.max(1,Math.ceil(years)),adjust:true};}catch(e){paths.ramp={label:'Ramp Fi',error:e.message};}
 return paths;
}
/** Prorate phases crossing an annual simulation checkpoint. */
export function pathYear(a,start,price=1){
 if(!a.pathPeriods)return {factor:1,contribution:0};
 let elapsed=0,factor=0,contribution=0;
 for(const p of a.pathPeriods){const end=elapsed+(p.years??Infinity),overlap=Math.max(0,Math.min(start+1,end)-Math.max(start,elapsed));
  const flows=periodFlows(p,Math.max(0,start-elapsed),Math.max(0,start-elapsed)+overlap);factor+=flows.withdrawal/(a.pathWithdrawalBase||1);contribution+=flows.contribution/(a.pathAdjust===false?price:1);
  elapsed=end;
 }
 return {factor,contribution};
}
export function hasFutureWithdrawals(a,elapsed=0){if(!a.pathPeriods)return true;let start=0;return a.pathPeriods.some(p=>{const end=start+(p.years??Infinity),local=Math.max(0,elapsed-start);start=end;if(end<=elapsed)return false;if(p.action==='withdraw')return p.amount>0;if(p.action==='ramp'){const value=p.amount+(p.endAmount-p.amount)*Math.min(local,p.years)/p.years;return Math.min(value,p.endAmount)<0;}return false;});}
