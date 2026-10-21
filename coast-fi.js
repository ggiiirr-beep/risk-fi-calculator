import {projectGap} from './gap-fi.js';
export function coastProjection(plan,{years=30,contribution=0,coastAt=0}={}){
 if(!Number.isInteger(years)||years<1||years>100||!Number.isFinite(contribution)||contribution<0||!Number.isFinite(coastAt)||coastAt<0)throw Error('Enter a 1–100 year retirement horizon and nonnegative contributions.');
 return projectGap({...plan,coastAt,adjustWithdrawals:true,cashStrategy:'first'},[{action:'contribute',amount:contribution,years:null}],{maxYears:years,stopAtGoal:false});
}
export function solveCoast(plan,{mode='amount',years=30,contribution=40000}={}){
 const run=(portfolio,coastAt=0)=>coastProjection({...plan,portfolio},{years,contribution,coastAt});
 const ok=q=>q.shortfall===null&&q.rows.at(-1).total>=q.target-1e-6;
 if(mode==='retirement'){
  const projection=projectGap({...plan,adjustWithdrawals:true,cashStrategy:'first'},[{action:'even',amount:0,years:null}]);
  if(projection.reached===null||projection.shortfall!==null)throw Error('The current assets do not reach FI within 100 years without regular contributions.');
  return {value:projection.reached,projection};
 }
 if(mode==='amount'){
  const zero=run(0);if(ok(zero))return {value:0,projection:zero};
  let lo=0,hi=Math.max(plan.portfolio,1e6);
  for(let i=0;i<40&&!ok(run(hi));i++)hi*=2;
  if(!ok(run(hi)))throw Error('No funded Coast FI amount was found for this deadline.');
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(ok(run(mid)))hi=mid;else lo=mid;}
  const value=Math.ceil(hi*100)/100;return {value,projection:run(value)};
 }
 if(mode!=='time')throw Error('Choose a Coast FI question.');
 if(!ok(run(plan.portfolio,years)))throw Error('Even contributing until retirement does not reach the FI target.');
 let lo=0,hi=years*12;
 while(lo<hi){const mid=Math.floor((lo+hi)/2);if(ok(run(plan.portfolio,mid/12)))hi=mid;else lo=mid+1;}
 return {value:lo/12,projection:run(plan.portfolio,lo/12)};
}
