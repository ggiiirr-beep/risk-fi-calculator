import {project} from './finance.js?v=20261102-ramp2';
import {projectGap} from './gap-fi.js?v=20261103-consistency';
import {rampPeriods} from './ramp-fi.js?v=20261103-consistency';
/** The same retirement transition for a calculator and its comparisons. */
export function comparisonProjection(source,plan,settings,periods,horizon,mode,retirementAt){
 const end=mode==='fi'?Math.min(horizon,retirementAt??horizon):horizon;
 if(source==='plan')return project(plan,{years:end,transitionAt:mode==='life'?retirementAt:null});
 let p={...plan},flows=periods;
 if(source==='gap')p={...p,...settings,adjustWithdrawals:settings.adjust};
 if(source==='ramp'){p={...p,adjustWithdrawals:true,cashStrategy:settings.cashStrategy};flows=rampPeriods(settings);}
 if(source==='traditional'){p={...p,adjustWithdrawals:settings.adjust};flows=[{action:'contribute',amount:settings.contribution,years:null}];}
 if(source==='coast'){p={...p,coastAt:settings.coastAt||0,adjustWithdrawals:true,cashStrategy:'first'};flows=[{action:'contribute',amount:settings.contribution||0,years:null}];}
 return projectGap(p,flows,{maxYears:end,stopAtGoal:false,retirementAt:mode==='life'?retirementAt:null});
}
