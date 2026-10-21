import {projectGap} from './gap-fi.js';
/** Constant contributions paid monthly at month end, in today's dollars. */
export function traditionalProjection(plan,{contribution=0,years=100,adjust=true,stopAtGoal=true}={}){
 if(!Number.isFinite(contribution)||contribution<0)throw Error('Enter a nonnegative annual contribution.');
 if(!Number.isInteger(years)||years<1||years>100)throw Error('Choose a whole number of years from 1 to 100.');
 return projectGap({...plan,spending:0,withdrawalMode:'dollars',adjustWithdrawals:adjust},[{action:'contribute',amount:contribution,years:null}],{maxYears:years,stopAtGoal});
}
export function contributionNeeded(plan,{years,adjust=true}){
 const run=contribution=>traditionalProjection(plan,{contribution,years,adjust,stopAtGoal:false});
 const meets=q=>q.shortfall===null&&q.rows.at(-1).total>=q.target-1e-7;
 const base=run(0);if(meets(base))return {contribution:0,projection:base};
 let lo=0,hi=1000;for(let i=0;i<50&&!meets(run(hi));i++)hi*=2;
 if(!meets(run(hi)))throw Error('Contributions cannot fund this plan. Check any immediate expenses.');
 for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(meets(run(mid)))hi=mid;else lo=mid;}
 const contribution=Math.ceil(hi*100)/100;return {contribution,projection:run(contribution)};
}
