/** Integrate annual net cash flow over part of a period. Positive = contribution. */
export function periodFlows(p,start,end){
 if(end<=start)return {withdrawal:0,contribution:0};
 if(p.action!=='ramp')return {withdrawal:p.action==='withdraw'?p.amount*(end-start):0,contribution:p.action==='contribute'?p.amount*(end-start):0};
 const slope=(p.endAmount-p.amount)/p.years,value=t=>p.amount+slope*t;
 const points=[start,end],zero=slope===0?null:-p.amount/slope;if(zero>start&&zero<end)points.splice(1,0,zero);
 let withdrawal=0,contribution=0;for(let i=1;i<points.length;i++){const lo=points[i-1],hi=points[i],amount=(value(lo)+value(hi))/2*(hi-lo);if(amount<0)withdrawal-=amount;else contribution+=amount;}
 return {withdrawal,contribution};
}
export function validatePeriod(p){
 if(!['withdraw','even','contribute','ramp'].includes(p.action)||!Number.isFinite(p.amount)||(p.action!=='ramp'&&p.amount<0))throw Error('Enter valid annual amounts for each period.');
 if(p.action==='ramp'&&(!Number.isFinite(p.endAmount)||!Number.isFinite(p.years)||p.years<=0))throw Error('A ramp needs starting and ending amounts and a fixed number of years.');
}
export function withdrawalBase(periods){for(const p of periods){if(p.action==='withdraw'&&p.amount>0)return p.amount;if(p.action==='ramp'&&Math.min(p.amount,p.endAmount)<0)return Math.max(0,-p.amount,-p.endAmount);}return 1;}
