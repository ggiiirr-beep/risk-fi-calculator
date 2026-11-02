import {projectGap} from './gap-fi.js?v=20261102-ramp2';
export const rampDefaults={spending:60000,startIncome:0,endIncome:80000,years:5,custom:false,incomes:[],cashStrategy:'first'};
export function rampPeriods(settings){
 const s={...rampDefaults,...settings};
 if(![s.spending,s.startIncome,s.endIncome].every(v=>Number.isFinite(v)&&v>=0)||!Number.isInteger(s.years)||s.years<1||s.years>50)throw Error('Enter nonnegative spending and income, and a ramp of 1–50 whole years.');
 const values=s.custom?s.incomes:Array.from({length:s.years+1},(_,i)=>s.startIncome+(s.endIncome-s.startIncome)*i/s.years);
 if(values.length!==s.years+1||!values.every(v=>Number.isFinite(v)&&v>=0))throw Error('Enter income for the start and each year of your ramp.');
 const periods=s.custom?values.slice(1).map((v,i)=>({action:'ramp',amount:values[i]-s.spending,endAmount:v-s.spending,years:1})):[{action:'ramp',amount:values[0]-s.spending,endAmount:values.at(-1)-s.spending,years:s.years}];
 const net=values.at(-1)-s.spending;periods.push({action:net>0?'contribute':net<0?'withdraw':'even',amount:Math.abs(net),years:null});return periods;
}
export function rampIncome(settings,year){const periods=rampPeriods(settings);let start=0;for(const p of periods){if(p.action!=='ramp')break;if(year<=start+p.years)return settings.spending+p.amount+(p.endAmount-p.amount)*Math.max(0,year-start)/p.years;start+=p.years;}return periods.at(-2).endAmount+settings.spending;}
export function rampCoverage(settings){const periods=rampPeriods(settings);let start=0;for(const p of periods){if(p.action!=='ramp')break;if(p.amount>=0)return start;if(p.endAmount>=0)return start-p.amount*p.years/(p.endAmount-p.amount);start+=p.years;}return null;}
export function projectRamp(plan,settings,options={}){return projectGap({...plan,adjustWithdrawals:true,cashStrategy:settings.cashStrategy||'first'},rampPeriods(settings),options);}
