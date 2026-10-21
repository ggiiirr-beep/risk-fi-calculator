import {projectGap} from './gap-fi.js';
/** Constant contributions paid monthly at month end, in today's dollars. */
export function traditionalProjection(plan,{contribution=0,years=100,adjust=true,stopAtGoal=true}={}){
 if(!Number.isFinite(contribution)||contribution<0)throw Error('Enter a nonnegative annual contribution.');
 if(!Number.isInteger(years)||years<1||years>100)throw Error('Choose a whole number of years from 1 to 100.');
 return projectGap({...plan,spending:0,withdrawalMode:'dollars',adjustWithdrawals:adjust},[{action:'contribute',amount:contribution,years:null}],{maxYears:years,stopAtGoal});
}
export function contributionNeeded(plan,{years,adjust=true}){
 const base=traditionalProjection(plan,{years,adjust,stopAtGoal:false});
 const unit=traditionalProjection(plan,{contribution:1000,years,adjust,stopAtGoal:false});
 const gain=(unit.rows.at(-1).total-base.rows.at(-1).total)/1000;
 const missing=base.target-base.rows.at(-1).total;
 if(missing<=0)return {contribution:0,projection:base};
 if(!Number.isFinite(gain)||gain<=0)throw Error('A contribution solution could not be calculated.');
 const contribution=Math.ceil(missing/gain*100-1e-6)/100;
 return {contribution,projection:traditionalProjection(plan,{contribution,years,adjust,stopAtGoal:false})};
}
