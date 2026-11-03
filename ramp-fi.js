import {projectGap} from './gap-fi.js?v=20261103-consistency';
export const rampDefaults={mode:'time',deadline:20,spending:60000,startIncome:0,endIncome:80000,years:5,custom:false,incomes:[],cashStrategy:'first'};
export function rampPeriods(settings){
 const s={...rampDefaults,...settings};
 if(![s.spending,s.startIncome,s.endIncome].every(v=>Number.isFinite(v)&&v>=0)||!Number.isInteger(s.years)||s.years<1||s.years>50)throw Error('Enter nonnegative spending and income, and a ramp of 1 to 50 whole years.');
 const values=s.custom?s.incomes:Array.from({length:s.years+1},(_,i)=>s.startIncome+(s.endIncome-s.startIncome)*i/s.years);
 if(values.length!==s.years+1||!values.every(v=>Number.isFinite(v)&&v>=0))throw Error('Enter income for the start and each year of your ramp.');
 const periods=s.custom?values.slice(1).map((v,i)=>({action:'ramp',amount:values[i]-s.spending,endAmount:v-s.spending,years:1})):[{action:'ramp',amount:values[0]-s.spending,endAmount:values.at(-1)-s.spending,years:s.years}];
 const net=values.at(-1)-s.spending;periods.push({action:net>0?'contribute':net<0?'withdraw':'even',amount:Math.abs(net),years:null});return periods;
}
export function rampIncome(settings,year){const periods=rampPeriods(settings);let start=0;for(const p of periods){if(p.action!=='ramp')break;if(year<=start+p.years)return settings.spending+p.amount+(p.endAmount-p.amount)*Math.max(0,year-start)/p.years;start+=p.years;}return periods.at(-2).endAmount+settings.spending;}
export function rampCoverage(settings){const periods=rampPeriods(settings);let start=0;for(const p of periods){if(p.action!=='ramp')break;if(p.amount>=0)return start;if(p.endAmount>=0)return start-p.amount*p.years/(p.endAmount-p.amount);start+=p.years;}return null;}
export function projectRamp(plan,settings,options={}){return projectGap({...plan,adjustWithdrawals:true,cashStrategy:settings.cashStrategy||'first'},rampPeriods(settings),options);}

// Shape is a bounded power curve sampled at each annual endpoint.
export function shapedRampIncomes(start,end,years,shape=0){
 if(!Number.isInteger(years)||years<1||years>50||![start,end,shape].every(Number.isFinite)||start<0||end<0||Math.abs(shape)>1)throw Error('Invalid ramp shape inputs.');
 const exponent=4**shape;
 return Array.from({length:years+1},(_,i)=>i===0?start:i===years?end:Math.round(start+(end-start)*(i/years)**exponent));
}

/** Solve one amount; preserve the ramp duration and relative income shape. */
export function solveRamp(plan,settings){
 const {mode,deadline}=settings;
 if(!['income','spending'].includes(mode))throw Error('Choose income or spending to calculate.');
 if(!Number.isInteger(deadline)||deadline<1||deadline>100)throw Error('Choose an FI deadline from 1 to 100 whole years.');
 const original={...settings};
 if(mode==='spending')original.spending=0;
 if(mode==='income')original.endIncome=original.custom&&original.incomes?.length?original.incomes.at(-1):Number.isFinite(original.endIncome)?original.endIncome:Math.max(1,original.startIncome+1);
 rampPeriods(original);
 const values=original.custom?original.incomes:shapedRampIncomes(original.startIncome,original.endIncome,original.years,original.shape||0);
 const span=values.at(-1)-values[0];
 const weights=values.map((value,i)=>Math.abs(span)>1e-9?(value-values[0])/span:i/original.years);
 if(mode==='income'&&weights.some(w=>w<0||w>1))throw Error('To solve income, use a ramp with yearly amounts between its starting and ending income.');
 const run=amount=>{
  const adjusted=mode==='spending'?{...original,spending:amount}:{...original,endIncome:amount,custom:true,incomes:weights.map(w=>original.startIncome+(amount-original.startIncome)*w)};
  return {settings:adjusted,projection:projectRamp(plan,adjusted,{maxYears:deadline,stopAtGoal:false})};
 };
 const meets=r=>r.projection.shortfall===null&&r.projection.rows.at(-1).total>=r.projection.target-1e-7;
 let lo=0,hi=Math.max(1000,original.spending||0,original.endIncome||0);
 const zero=run(0);
 if(mode==='income'&&meets(zero))return {amount:0,...zero};
 if(mode==='spending'&&!meets(zero))throw Error('Even zero spending cannot meet this FI deadline. Adjust your income ramp or deadline.');
 for(let i=0;i<50&&(mode==='income'?!meets(run(hi)):meets(run(hi)));i++)hi*=2;
 if(mode==='income'&&!meets(run(hi)))throw Error('This income ramp cannot fund the plan. Check expenses before income begins.');
 if(mode==='spending'&&meets(run(hi)))throw Error('No finite spending limit was found.');
 for(let i=0;i<65;i++){const mid=(lo+hi)/2,ok=meets(run(mid));if(mode==='income'?!ok:ok)lo=mid;else hi=mid;}
 const amount=mode==='income'?Math.ceil(hi*100)/100:Math.floor(lo*100)/100;
 return {amount,...run(amount)};
}
