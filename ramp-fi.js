import {projectGap} from './gap-fi.js';
export const rampDefaults={spending:60000,startIncome:0,endIncome:80000,years:5,custom:false,incomes:[],cashStrategy:'first'};
export function rampPeriods(settings){
 const s={...rampDefaults,...settings};
 if(![s.spending,s.startIncome,s.endIncome].every(v=>Number.isFinite(v)&&v>=0)||!Number.isInteger(s.years)||s.years<1||s.years>50)throw Error('Enter nonnegative spending and income, and a ramp of 1–50 whole years.');
 const values=s.custom?s.incomes:Array.from({length:s.years+1},(_,i)=>s.startIncome+(s.endIncome-s.startIncome)*i/s.years);
 if(values.length!==s.years+1||!values.every(v=>Number.isFinite(v)&&v>=0))throw Error('Enter income for the start and each year of your ramp.');
 const periods=values.slice(1).map((v,i)=>({action:'ramp',amount:values[i]-s.spending,endAmount:v-s.spending,years:1}));
 const net=values.at(-1)-s.spending;periods.push({action:net>0?'contribute':net<0?'withdraw':'even',amount:Math.abs(net),years:null});return periods;
}
export function rampIncome(settings,year){const periods=rampPeriods(settings),i=Math.min(settings.years-1,Math.floor(year));if(year>=settings.years)return periods.at(-2).endAmount+settings.spending;const p=periods[i];return settings.spending+p.amount+(p.endAmount-p.amount)*(year-i);}
export function rampCoverage(settings){const periods=rampPeriods(settings);if(periods[0].amount>=0)return 0;for(let i=0;i<settings.years;i++){const p=periods[i];if(p.amount<0&&p.endAmount>=0)return i-p.amount/(p.endAmount-p.amount);if(p.amount>=0)return i;}return null;}
export function projectRamp(plan,settings,options={}){return projectGap({...plan,adjustWithdrawals:true,cashStrategy:settings.cashStrategy||'first'},rampPeriods(settings),options);}
