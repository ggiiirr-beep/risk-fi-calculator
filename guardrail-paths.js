import {projectGap,solveGapAmount} from './gap-fi.js';
import {solveCoast} from './coast-fi.js';
/** Snapshot each path without changing the shared starting balances. */
export function guardrailPaths(plan,gapPeriods,gapSettings,coast){
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
 return paths;
}
/** Prorate phases crossing an annual simulation checkpoint. */
export function pathYear(a,start,price=1){
 if(!a.pathPeriods)return {factor:1,contribution:0};
 let elapsed=0,factor=0,contribution=0;
 for(const p of a.pathPeriods){const end=elapsed+(p.years??Infinity),overlap=Math.max(0,Math.min(start+1,end)-Math.max(start,elapsed));
  if(p.action==='withdraw')factor+=overlap*p.amount/(a.pathWithdrawalBase||1);
  if(p.action==='contribute')contribution+=overlap*p.amount/(a.pathAdjust===false?price:1);
  elapsed=end;
 }
 return {factor,contribution};
}
export function hasFutureWithdrawals(a,elapsed=0){if(!a.pathPeriods)return true;let end=0;return a.pathPeriods.some(p=>{end+=p.years??Infinity;return end>elapsed&&p.action==='withdraw'&&p.amount>0;});}
