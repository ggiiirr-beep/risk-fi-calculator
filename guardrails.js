import {bondYears} from './bond-history.js';
import {validateChanges,futureFlows} from './future-changes.js';
import {historicalYears,historySource} from './guardrail-history.js';
import {seededRandom} from './finance.js';

export const guardrailDefaults={portfolio:1000000,goal:'fi',fiBasis:'investment',endingBalance:0,blockYears:1,adjustWithdrawals:true,initialMode:'target',initialCash:null,initialWithdrawal:null,years:15,fiYears:15,retirementYears:50,fiWithdrawals:100000,fiRate:.04,stockMean:.11,stockVol:.18,inflation:.025,cashReturn:.035,reserveYears:2,floor:0,count:10000,innerCount:1024,seed:7301,model:'bootstrap',compareNoCash:false,checkInvestment:900000,checkCash:100000,checkSpending:40000,checkElapsed:0,checkInflationTotal:null,checkDollarBasis:'current'};
export const guardrailFiTarget=a=>a.fiWithdrawals/a.fiRate;
export const guardrailGoalTarget=a=>a.goal==='fi'?guardrailFiTarget(a):(a.endingBalance??0);
const goalAssets=(a,i,c)=>a.goal!=='fi'||a.fiBasis==='total'?i+c:i;
export const defaultStrategies=[{name:'Aggressive',lower:.2,target:.3,upper:.4,schedule:'fixed',endTarget:.9},{name:'Conservative',lower:.7,target:.8,upper:.9,schedule:'fixed',endTarget:.9}];
// Targets move at annual checkpoints; the deadline itself records the outcome.
export function scheduledStrategy(strategy,elapsed,years){
 const schedule=strategy.schedule||'fixed',t=years<=1?0:Math.max(0,Math.min(1,elapsed/(years-1)));
 const weight={fixed:0,steady:t,early:1-(1-t)**2,late:t*t}[schedule];
 const target=strategy.target+((strategy.endTarget??strategy.target)-strategy.target)*weight;
 return {...strategy,target,lower:Math.max(0,target-(strategy.target-strategy.lower)),upper:Math.min(1,target+(strategy.upper-strategy.target))};
}
export function feasibility(model,investment,cash,planned,years,floor,target){
 const current=model.probability(investment,cash,planned,years),atFloor=model.probability(investment,cash,floor,years),zero=model.probability(investment,cash,0,years);
 return {current,atFloor,zero,zeroLimited:zero+1e-8<target,floorLimited:zero+1e-8>=target&&atFloor+1e-8<target};
}
export function validateGuardrails(a,strategies=defaultStrategies){
 validateChanges(a.futureChanges);if(!Number.isFinite(a.bondWeight??0)||(a.bondWeight??0)<0||(a.bondWeight??0)>1)throw Error('Bond allocation must be between 0% and 100%.');
 for(const k of ['portfolio','years','stockMean','stockVol','inflation','cashReturn','reserveYears','floor','count','innerCount','seed'])if(!Number.isFinite(a[k]))throw Error('Enter a number for '+k+'.');
 if(!Number.isFinite(a.endingBalance??0)||(a.endingBalance??0)<0||(a.endingBalance??0)>1e12)throw Error('Ending balance must be between $0 and $1 trillion, in today’s dollars.');
 if(![1,3,5,10].includes(a.blockYears??1))throw Error('Choose 1, 3, 5 or 10 years per historical block.');
 if(a.initialMode==='plan'&&(!Number.isFinite(a.initialWithdrawal)||a.initialWithdrawal<0||a.initialWithdrawal<a.floor||!Number.isFinite(a.initialCash)||a.initialCash<0||a.initialCash>a.portfolio))throw Error('Starting withdrawals must meet the floor and starting cash must fit within total assets.');
 if(a.initialCash!=null&&(!Number.isFinite(a.initialCash)||a.initialCash<0||a.initialCash>a.portfolio))throw Error('Starting cash must fit within total assets.');
 if(a.volatilityMode!=null&&!['historical','custom'].includes(a.volatilityMode))throw Error('Choose historical or custom volatility.');
 if(a.portfolio<=0||a.portfolio>1e12)throw Error('Starting portfolio must be above $0 and at most $1 trillion.');
 if(!Number.isInteger(a.years)||a.years<1||a.years>60)throw Error('Use a retirement duration of 1–60 whole years.');
 if(a.stockMean<=-.9||a.stockMean>1||a.stockVol<0||a.stockVol>1||a.inflation<=-.5||a.inflation>.5||a.cashReturn<=-.5||a.cashReturn>.5)throw Error('Check your return, volatility, and inflation assumptions.');
 if(a.reserveYears<0||a.reserveYears>5||a.floor<0||a.floor>a.portfolio)throw Error('Use 0–5 reserve years and a withdrawal floor between $0 and the starting portfolio.');
 if(!Number.isInteger(a.count)||a.count<10000||a.count>100000)throw Error('Use 10,000–100,000 outer scenarios.');
 if(![512,1024,2048,4096].includes(a.innerCount))throw Error('Choose a supported probability sample size.');
 if(!Number.isInteger(a.seed)||a.seed<0||a.seed>4294967295)throw Error('Seed must be a whole number between 0 and 4,294,967,295.');
 if(!['bootstrap','historical','parametric'].includes(a.model))throw Error('Choose a supported market model.');
 for(const k of ['checkInvestment','checkCash','checkSpending','checkElapsed'])if(!Number.isFinite(a[k])||a[k]<0)throw Error('Enter nonnegative numbers for the current guardrail check.');
 if(!Number.isInteger(a.checkElapsed)||a.checkElapsed>=a.years)throw Error('Years elapsed must be a whole number smaller than the selected horizon.');
 if(a.checkInvestment+a.checkCash>1e12||a.checkSpending>1e12)throw Error('Current guardrail check amounts must be at most $1 trillion.');
 if(a.checkInflationTotal!=null&&(!Number.isFinite(a.checkInflationTotal)||a.checkInflationTotal<=-1))throw Error('Total inflation must be a number greater than −100%.');
 if(!['fi','retirement'].includes(a.goal))throw Error('Choose a guardrail goal.');
 if(a.goal==='fi'&&(!Number.isFinite(a.fiWithdrawals)||a.fiWithdrawals<=0||!Number.isFinite(a.fiRate)||a.fiRate<=0||a.fiRate>1||guardrailFiTarget(a)>1e12))throw Error('Enter positive Traditional FI withdrawals and a withdrawal rate above 0% and at most 100% (target at most $1 trillion).');
 for(const s of strategies){if(!['fixed','steady','early','late'].includes(s.schedule||'fixed')||!Number.isFinite(s.endTarget??s.target)||((s.schedule||'fixed')!=='fixed'&&(s.endTarget??s.target)<s.target)||(s.endTarget??s.target)<0||(s.endTarget??s.target)>1)throw Error(s.name+': ending target must be between the starting target and 100%.');}
 for(const s of strategies)if(![s.lower,s.target,s.upper].every(Number.isFinite)||s.lower<0||s.upper>1||!(s.lower<s.target&&s.target<s.upper))throw Error(s.name+': use lower < target < upper, between 0% and 100%.');
}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
export function quantileSorted(a,p){const x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i);}
export function stats(values){const a=Array.from(values).sort((a,b)=>a-b);return {mean:mean(a),p10:quantileSorted(a,.1),median:quantileSorted(a,.5),p90:quantileSorted(a,.9),max:a.at(-1)};}
const historicMean=mean(historicalYears.map(r=>r[1])),historicInflation=mean(historicalYears.map(r=>r[2]));
// Positive gross-return power transform: calibrate full-dataset arithmetic mean and volatility.
export function adjustedHistoricalGross(a){
 const gross=historicalYears.map(r=>1+r[1]),m=a.model==='bootstrap'?1+a.stockMean:1+historicMean;
 if(a.volatilityMode!=='custom')return gross.map(g=>g*(a.model==='bootstrap'?m/(1+historicMean):1));
 const at=b=>{const v=gross.map(g=>g**b),avg=mean(v);return v.map(g=>g*m/avg);};
 let lo=0,hi=1;const sd=v=>Math.sqrt(mean(v.map(g=>(g-m)**2)));
 while(sd(at(hi))<a.stockVol&&hi<64)hi*=2;
 if(sd(at(hi))+1e-10<a.stockVol)throw Error('Custom volatility cannot be matched with this return assumption. Lower volatility or raise the expected return.');
 for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(sd(at(mid))<a.stockVol)lo=mid;else hi=mid;}
 return at((lo+hi)/2);
}
// Separate streams are used for outer paths, probability construction, and validation.
export function marketPaths(a,count,seed){
 const random=seededRandom(seed),stock=new Float64Array(count*a.years),cash=new Float64Array(stock.length),positive=new Uint8Array(stock.length),pricesPath=new Float64Array(stock.length),historyIndex=new Int16Array(stock.length).fill(-1);
 let blockStart=0;const block=a.blockYears??1,adjusted=a.model==='parametric'?null:adjustedHistoricalGross(a);
 const sigma=Math.sqrt(Math.log1p(a.stockVol**2/(1+a.stockMean)**2)),mu=Math.log1p(a.stockMean)-sigma*sigma/2;
 for(let i=0;i<stock.length;i++){
  let gross,prices;
  if(a.model==='parametric'){gross=Math.exp(mu+sigma*Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random()));prices=1+a.inflation;}
  else{const year=i%a.years;if(year%block===0)blockStart=Math.floor(random()*(historicalYears.length-block+1));const index=blockStart+year%block;historyIndex[i]=index;const r=historicalYears[index];gross=adjusted[index]*(1-(a.bondWeight||0))+(1+bondYears[index][1])*(a.bondWeight||0);prices=1+r[2];if(a.model==='bootstrap'){prices*=(1+a.inflation)/(1+historicInflation);}}
  pricesPath[i]=prices;stock[i]=gross/prices;cash[i]=(1+a.cashReturn)/prices;positive[i]=gross>1?1:0;
 }
 return {stock,cash,positive,prices:pricesPath,historyIndex,years:a.years,count,seed};
}
// End-year cash flows. Returns occur once, then withdrawals, then cash replenishment.
export function retirementYear(investment,cash,spending,stockGrowth,cashGrowth,positive,reserveYears,reserveSpending=spending){
 const grownInvestment=investment*stockGrowth,grownCash=cash*cashGrowth;
 investment=grownInvestment;cash=grownCash;
 let need=spending,cashWithdrawal=0,investmentWithdrawal=0;
 if(!positive){cashWithdrawal=Math.min(cash,need);cash-=cashWithdrawal;need-=cashWithdrawal;}
 investmentWithdrawal=Math.min(investment,need);investment-=investmentWithdrawal;need-=investmentWithdrawal;
 if(need>0){const extra=Math.min(cash,need);cash-=extra;cashWithdrawal+=extra;need-=extra;}
 let replenished=0;
 if(positive&&reserveYears>0){replenished=Math.min(investment,Math.max(0,reserveYears*reserveSpending-cash));investment-=replenished;cash+=replenished;}
 return {investment,cash,paid:spending-need,shortfall:need,replenished,investmentWithdrawal,cashWithdrawal,grownInvestment,grownCash};
}
export function fixedSuccess(a,paths,investment,cash,spending,years,targetWealth=guardrailGoalTarget(a)){
 if(a.futureChanges?.some(e=>e.enabled!==false))return scheduledSuccess(a,paths,investment,cash,spending,years,targetWealth,a.currentPrice||1);
 let successes=0;
 for(let n=0;n<paths.count;n++){
  let i=investment,c=cash,ok=true,price=1;
  for(let y=0;y<years;y++){const k=n*paths.years+y;price*=paths.prices?.[k]??1;const withdrawal=a.adjustWithdrawals===false?spending/price:spending,r=retirementYear(i,c,withdrawal,paths.stock[k],paths.cash[k],paths.positive[k],a.reserveYears);i=r.investment;c=r.cash;if(r.shortfall>1e-10||i+c<=1e-12){ok=false;break;}}
  successes+=ok&&goalAssets(a,i,c)>=targetWealth?1:0;
 }
 return successes/paths.count;
}
// A simulation-built probability surface over remaining years, cash fraction and spending/assets.
// Every cell assumes NO later guardrail adjustments. It shares no paths with the outer retirements.
export function buildProbabilityModel(a,{progress=()=>{},rateSteps=160,cashSteps=10}={}){
 if(a.futureChanges?.some(e=>e.enabled!==false))return scheduledProbabilityModel(a,{progress});
 const paths=marketPaths(a,a.innerCount,(a.seed^0x9e3779b9)>>>0),rates=[0];
 for(let j=0;j<rateSteps;j++)rates.push(Math.exp(Math.log(.0001)+j/(rateSteps-1)*Math.log(10000)));
 const fractions=a.reserveYears===0&&!(a.checkCash>0)&&!(a.initialCash>0)?[0]:Array.from({length:cashSteps+1},(_,i)=>i/cashSteps),R=rates.length,C=fractions.length;
 const isFI=a.goal==='fi'||(a.endingBalance??0)>0,targets=isFI?[0,...Array.from({length:321},(_,j)=>Math.exp(Math.log(.0001)+j/320*Math.log(1e8)))]:[0],T=targets.length;
 const targetBracket=x=>{let l=0,u=T-1;while(u-l>1){const m=(l+u)>>1;if(targets[m]<=x)l=m;else u=m;}return [l,u,Math.max(0,Math.min(1,(x-targets[l])/(targets[u]-targets[l])))];};
 const fiTable=isFI?new Float32Array((a.years+1)*C*R*T):null;
 const table=new Float32Array((a.years+1)*C*R),at=(h,c,r)=>(h*C+c)*R+r;
 for(let c=0;c<C;c++){
  for(let r=0;r<R;r++){
   const failures=new Uint32Array(a.years+1),hist=isFI?new Uint32Array((a.years+1)*T):null,w=rates[r];
   for(let n=0;n<paths.count;n++){
    let investment=1-fractions[c],cash=fractions[c],price=1;
    for(let y=0;y<a.years;y++){
     const k=n*a.years+y;price*=paths.prices[k];const withdrawal=a.adjustWithdrawals===false?w/price:w,res=retirementYear(investment,cash,withdrawal,paths.stock[k],paths.cash[k],paths.positive[k],a.reserveYears);
     investment=res.investment;cash=res.cash;
     if(res.shortfall>1e-10||investment+cash<=1e-12){failures[y+1]++;break;}
     if(isFI){const wealth=goalAssets(a,investment,cash),bin=wealth>=targets[T-1]?T-1:targetBracket(wealth)[0];hist[(y+1)*T+bin]++;}
    }
   }
   let failed=0;table[at(0,c,r)]=1;
   for(let h=1;h<=a.years;h++){failed+=failures[h];table[at(h,c,r)]=1-failed/paths.count;
    if(isFI){let above=0;for(let t=T-1;t>=0;t--){above+=hist[h*T+t];fiTable[at(h,c,r)*T+t]=above/paths.count;}}
   }
  }
  progress({stage:'probability',fraction:(c+1)/C});
 }
 // Monte Carlo noise and cash-policy effects can create tiny reversals; enforce a monotone envelope.
 let maxCorrection=0;
 for(let h=1;h<=a.years;h++)for(let c=0;c<C;c++)for(let r=1;r<R;r++){const index=at(h,c,r),old=table[index];table[index]=Math.min(old,table[index-1]);maxCorrection=Math.max(maxCorrection,old-table[index]);}
 if(isFI)for(let h=1;h<=a.years;h++)for(let c=0;c<C;c++)for(let r=1;r<R;r++)for(let t=0;t<T;t++){const k=at(h,c,r)*T+t,old=fiTable[k];fiTable[k]=Math.min(old,fiTable[k-T]);maxCorrection=Math.max(maxCorrection,old-fiTable[k]);}
 const bracket=(array,x)=>{let l=0,u=array.length-1;while(u-l>1){const m=(l+u)>>1;if(array[m]<=x)l=m;else u=m;}return [l,u,(x-array[l])/(array[u]-array[l])];};
 const curve=(years,cashFraction,r,targetRatio=0)=>{
  const h=Math.max(0,Math.min(a.years,Math.round(years)));
  const cell=c=>{if(!isFI)return table[at(h,c,r)];if(targetRatio>targets[T-1])return 0;const [l,u,t]=targetBracket(targetRatio),k=at(h,c,r)*T;return fiTable[k+l]*(1-t)+fiTable[k+u]*t;};
  if(C===1)return cell(0);const v=Math.max(0,Math.min(1,cashFraction))*cashSteps,l=Math.min(C-2,Math.floor(v)),t=v-l;return cell(l)*(1-t)+cell(l+1)*t;
 };
 // Interpolating a probability surface invents probabilities across sharp terminal
 // thresholds. Use the actual independent samples for the last decision instead.
 const deterministic=a.model==='parametric'&&a.stockVol===0;
 const directPaths={...paths,count:1};
 let terminalKey='',terminalCapacity=[],terminalSorted=false;
 const terminal=(investment,cash,targetWealth)=>{
  const key=[investment,cash,targetWealth].join('/');
  if(key!==terminalKey){
   terminalKey=key;terminalCapacity=[];terminalSorted=false;
   for(let n=0;n<paths.count;n++){
    const k=n*a.years,wealth=investment*paths.stock[k]+cash*paths.cash[k];
    // Exact exhaustion is a failure, consistently with the outer ledger.
    const capacity=Math.min(wealth-Math.max(1e-9,wealth*1e-12),wealth-targetWealth);
    terminalCapacity.push(capacity*(a.adjustWithdrawals===false?paths.prices[k]:1));
   }
  }
  return terminalCapacity;
 };
 const exactTerminal=years=>years===1&&(a.goal!=='fi'||a.fiBasis==='total');
 const probability=(investment,cash,spending,years,targetWealth=guardrailGoalTarget(a))=>{
  const assets=investment+cash;if(assets<=0)return 0;if(years<=0)return isFI?Number(goalAssets(a,investment,cash)>=targetWealth):1;
  if(!Number.isFinite(spending)||spending<0||spending/assets>1+1e-12)return 0;
  if(deterministic)return fixedSuccess(a,directPaths,investment,cash,spending,years,targetWealth);
  if(exactTerminal(years)){
   const capacities=terminal(investment,cash,targetWealth);
   if(!terminalSorted){let successes=0;for(const capacity of capacities)successes+=Number(capacity>=spending);return successes/capacities.length;}
   let l=0,u=capacities.length;
   while(l<u){const m=(l+u)>>1;if(capacities[m]<spending)l=m+1;else u=m;}
   return (capacities.length-l)/capacities.length;
  }
  const ratio=isFI?targetWealth/assets:0;
  const rate=spending/assets;if(rate<0||!Number.isFinite(rate))return 0;if(rate>1+1e-12)return 0; // Outside the spending/wealth limit: explicitly infeasible, never clamp optimistically.
  if(rate>=rates.at(-1))return curve(years,cash/assets,R-1,ratio);
  const [l,u,t]=bracket(rates,rate);return curve(years,cash/assets,l,ratio)*(1-t)+curve(years,cash/assets,u,ratio)*t;
 };
 const spendingFor=(investment,cash,years,target,floor=0,targetWealth=guardrailGoalTarget(a))=>{
  const assets=investment+cash;if(assets<=0)return {spending:floor,probability:0,limited:true};
  if(deterministic||exactTerminal(years)){
   const zero=probability(investment,cash,floor,years,targetWealth);
   if(zero<target)return {spending:floor,probability:zero,limited:true};
   let spending;
   if(deterministic){let lo=floor,hi=assets;for(let j=0;j<52;j++){const mid=(lo+hi)/2;if(probability(investment,cash,mid,years,targetWealth)>=target)lo=mid;else hi=mid;}spending=lo;}
   else {const capacities=terminal(investment,cash,targetWealth);if(!terminalSorted){capacities.sort((x,y)=>x-y);terminalSorted=true;}const index=Math.max(0,Math.min(capacities.length-1,capacities.length-Math.ceil(target*capacities.length)));spending=Math.max(floor,Math.min(assets,capacities[index]));}
   const p=probability(investment,cash,spending,years,targetWealth);
   return {spending,probability:p,limited:Math.abs(p-target)>.015};
  }
  const fraction=cash/assets,ratio=isFI?targetWealth/assets:0;let l=0,u=R-1;
  if(probability(investment,cash,floor,years,targetWealth)<target)return {spending:floor,probability:probability(investment,cash,floor,years,targetWealth),limited:true};
  while(u-l>1){const m=(l+u)>>1;if(curve(years,fraction,m,ratio)>=target)l=m;else u=m;}
  const pl=curve(years,fraction,l,ratio),pu=curve(years,fraction,u,ratio),t=pl===pu?0:Math.max(0,Math.min(1,(pl-target)/(pl-pu)));
  const spending=Math.max(floor,Math.min(assets,assets*(rates[l]+t*(rates[u]-rates[l])))),p=probability(investment,cash,spending,years,targetWealth);
  return {spending,probability:p,limited:Math.abs(p-target)>.015};
 };
 return {probability,spendingFor,paths,rates,fractions,maxCorrection,targetRatioMax:targets.at(-1)};
}
export function initialSpending(a,strategy,model){
 model.setContext?.(1);
 if(a.initialMode==='target'&&a.initialCash!=null){
  const cash=a.initialCash,investment=a.portfolio-cash,zeroProbability=model.probability(investment,cash,0,a.years),fit=model.spendingFor(investment,cash,a.years,strategy.target,a.floor);
  const unreachable=zeroProbability<strategy.target,spending=unreachable?0:fit.spending,probability=model.probability(investment,cash,spending,a.years);
  return {cash,investment,spending,probability,zeroProbability,unreachable,limited:unreachable||Math.abs(probability-strategy.target)>.015};
 }

 if(a.initialMode==='plan'){
  const cash=a.initialCash,investment=a.portfolio-cash,spending=a.initialWithdrawal,probability=model.probability(investment,cash,spending,a.years),zeroProbability=model.probability(investment,cash,0,a.years);
  return {cash,investment,spending,probability,zeroProbability,unreachable:zeroProbability<strategy.target,limited:false,fromPlan:true};
 }
 const limit=a.portfolio/Math.max(1,a.reserveYears),allocation=w=>Math.min(a.portfolio,a.reserveYears*w);
 const zeroProbability=model.probability(a.portfolio,0,0,a.years);
 let l=0,u=limit;
 for(let j=0;j<40;j++){const m=(l+u)/2,c=allocation(m),p=model.probability(a.portfolio-c,c,m,a.years);if(p>=strategy.target)l=m;else u=m;}
 const spending=Math.max(a.floor,zeroProbability<strategy.target?0:(l+u)/2),cash=allocation(spending),probability=model.probability(a.portfolio-cash,cash,spending,a.years);
 return {spending,cash,investment:a.portfolio-cash,probability,zeroProbability,unreachable:zeroProbability<strategy.target,limited:Math.abs(probability-strategy.target)>.015||spending>limit};
}
export function checkpoint(model,strategy,investment,cash,planned,years,floor){
 const before=model.probability(investment,cash,planned,years);
 const trigger=before<strategy.lower?'cut':before>strategy.upper?'raise':null;
 if(!trigger)return {spending:planned,before,after:before,trigger,limited:false};
 const solved=model.spendingFor(investment,cash,years,strategy.target,floor);
 // Numerical interpolation must never turn a lower-rail trigger into a raise, or vice versa.
 const spending=trigger==='cut'?Math.min(planned,solved.spending):Math.max(planned,solved.spending),after=model.probability(investment,cash,spending,years);
 return {spending,before,after,trigger,limited:Math.abs(after-strategy.target)>.015};
}
export function runRetirement(a,strategy,model,paths,index,initial=initialSpending(a,strategy,model),policy='guardrails'){
 let investment=initial.investment,cash=initial.cash,planned=policy==='zero'?0:initial.spending,depleted=false,shortfall=false;
 let priceLevel=1;const nominalSpending=[],nominalBalances=[investment+cash],nominalCash=[cash],nominalInvestment=[investment],priceLevels=[1],decisions=[];
 const spending=[],plannedSpending=[],balances=[investment+cash],cashBalances=[cash],investmentBalances=[investment],probabilities=[],adjustments=[],targets=[],feasibilities=[];
 let floorYears=0,floorRun=0,maxFloorRun=0,floorLimited=0,zeroLimited=0;
 let cuts=0,raises=0,cutDollars=0,cutPercent=0,maxCut=0,maxCutDollars=0,total=0,below=0,afterBelow=0,runBelow=0,maxRunBelow=0,belowInitialRun=0,maxBelowInitialRun=0,lowest=initial.spending,limited=initial.limited?1:0,tail=0,firstCut=null,firstShortfall=null;
 for(let y=0;y<a.years;y++){
  model.setContext?.(priceLevel);
  const rails=scheduledStrategy(strategy,y,a.years),remaining=a.years-y,old=planned,fit=feasibility(model,investment,cash,planned,remaining,a.floor,rails.target);
  targets.push({lower:rails.lower,target:rails.target,upper:rails.upper});feasibilities.push(fit);floorLimited+=Number(fit.floorLimited);zeroLimited+=Number(fit.zeroLimited);
  const decision=(y===0&&!initial.fromPlan)||policy!=='guardrails'?{spending:planned,before:fit.current,after:fit.current,trigger:null,limited:false}:checkpoint(model,rails,investment,cash,planned,remaining,a.floor);
  decisions.push(decision.trigger);planned=decision.spending;probabilities.push(decision.before);
  if(decision.before<rails.lower){below++;runBelow++;maxRunBelow=Math.max(maxRunBelow,runBelow);}else runBelow=0;
  if(decision.after<rails.lower)afterBelow++;
  if(decision.before<=1/a.innerCount||decision.before>=1-1/a.innerCount)tail++;
  if(decision.limited)limited++;
  let change=0;
  if(planned<old-1e-6){cuts++;change=(old-planned)/old;cutPercent+=change;cutDollars+=old-planned;maxCut=Math.max(maxCut,change);maxCutDollars=Math.max(maxCutDollars,old-planned);if(firstCut===null)firstCut=y+1;}
  if(planned>old+1e-6)raises++;
  const k=index*a.years+y,paidPlan=a.adjustWithdrawals===false?planned/(paths.prices?.[k]??1):planned,r=scheduledYear(a,investment,cash,paidPlan,paths.stock[k],paths.cash[k],paths.positive[k],y,priceLevel*(paths.prices?.[k]??1),policy==='zero'?initial.spending:paidPlan);
  priceLevel*=paths.prices?.[k]??1;priceLevels.push(priceLevel);nominalSpending.push(r.paid*priceLevel);nominalBalances.push((r.investment+r.cash)*priceLevel);nominalCash.push(r.cash*priceLevel);nominalInvestment.push(r.investment*priceLevel);
  if(r.paid<=a.floor+.01){floorYears++;floorRun++;maxFloorRun=Math.max(maxFloorRun,floorRun);}else floorRun=0;
  investment=r.investment;cash=r.cash;depleted ||= investment+cash<=1e-12;shortfall ||= r.shortfall>.01;if(r.shortfall>.01&&firstShortfall===null)firstShortfall=y+1;total+=r.paid;lowest=Math.min(lowest,r.paid);
  if(r.paid<initial.spending-.01){belowInitialRun++;maxBelowInitialRun=Math.max(maxBelowInitialRun,belowInitialRun);}else belowInitialRun=0;
  spending.push(r.paid);plannedSpending.push(planned);balances.push(investment+cash);cashBalances.push(cash);investmentBalances.push(investment);adjustments.push(change);
  if(a.adjustWithdrawals===false&&policy!=='zero')planned=policy==='guardrails'?Math.max(a.floor,paidPlan):paidPlan;
 }
 const changes=spending.slice(1).map((v,i)=>spending[i]>0?(v/spending[i]-1):0),avgChange=mean(changes)||0,volatility=changes.length?Math.sqrt(mean(changes.map(v=>(v-avgChange)**2))):0;
 return {nominalSpending,nominalBalances,nominalCash,nominalInvestment,priceLevels,decisions,lowest,maxFloorRun,floorYears,floorLimited,zeroLimited,targets,feasibilities,spending,plannedSpending,balances,cashBalances,investmentBalances,probabilities,adjustments,cuts,raises,cutDollars,cutPercent,maxCut,maxCutDollars,total,below,afterBelow,maxRunBelow,maxBelowInitialRun,decline:initial.spending?1-lowest/initial.spending:0,limited,tail,firstCut,firstShortfall,volatility,depleted,shortfall,fiReached:!shortfall&&(!depleted||a.futureChanges?.some(e=>e.enabled!==false))&&goalAssets(a,investment,cash)>=guardrailGoalTarget(a)};
}
export function aggregateStrategy(a,strategy,model,paths,{progress=()=>{},keepPaths=12,policy='guardrails',initialOverride=null}={}){
 const initial=initialOverride||initialSpending(a,strategy,model),fields=['lowest','maxFloorRun','floorYears','floorLimited','zeroLimited','cuts','raises','maxCut','maxCutDollars','total','below','afterBelow','maxRunBelow','maxBelowInitialRun','decline','limited','tail','volatility'],samples=Object.fromEntries(fields.map(f=>[f,new Float64Array(paths.count)]));
 const spending=Array.from({length:a.years},()=>new Float64Array(paths.count)),balances=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),cash=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),investment=Array.from({length:a.years+1},()=>new Float64Array(paths.count));
 const nominalWithdrawals=Array.from({length:a.years},()=>new Float64Array(paths.count)),nominalAssets=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),nominalCash=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),nominalInvestment=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),nominalTargets=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),nominalTotals=new Float64Array(paths.count);
 let anyUnattainable=0,fiReached=0,depleted=0,shortfalls=0,earlyShortfalls=0,cutDollars=0,cutPercent=0,cutTotal=0;const firstCut=[0,0,0],examples=[];
 for(let n=0;n<paths.count;n++){
  const r=runRetirement(a,strategy,model,paths,n,initial,policy);for(const f of fields)samples[f][n]=r[f];
  for(let y=0;y<a.years;y++){spending[y][n]=r.spending[y];nominalWithdrawals[y][n]=r.nominalSpending[y];nominalTotals[n]+=r.nominalSpending[y];}for(let y=0;y<=a.years;y++){balances[y][n]=r.balances[y];cash[y][n]=r.cashBalances[y];investment[y][n]=r.investmentBalances[y];nominalAssets[y][n]=r.nominalBalances[y];nominalCash[y][n]=r.nominalCash[y];nominalInvestment[y][n]=r.nominalInvestment[y];nominalTargets[y][n]=guardrailGoalTarget(a)*r.priceLevels[y];}
  anyUnattainable+=r.zeroLimited>0||r.floorLimited>0?1:0;fiReached+=r.fiReached?1:0;depleted+=r.depleted?1:0;shortfalls+=r.shortfall?1:0;earlyShortfalls+=r.firstShortfall!==null&&r.firstShortfall<=Math.max(0,a.years-10)?1:0;cutDollars+=r.cutDollars;cutPercent+=r.cutPercent;cutTotal+=r.cuts;
  [5,10,20].forEach((h,i)=>{if(r.firstCut!==null&&r.firstCut<=h)firstCut[i]++;});
  if(n<keepPaths)examples.push({index:n,...r});
  if(n%100===99)progress({stage:'outer',fraction:(n+1)/paths.count});
 }
 const zeroDurations=Array.from(samples.floorYears).filter(v=>v>0),anyCut=Array.from(samples.cuts).filter(v=>v>0).length;
 const metrics=Object.fromEntries(fields.map(f=>[f,stats(samples[f])])),histogram=Array.from({length:10},(_,i)=>({lower:i/10,upper:(i+1)/10,count:0}));
 for(const value of samples.maxCut)histogram[Math.min(9,Math.floor(value*10))].count++;
 return {nominal:{total:stats(nominalTotals),spending:nominalWithdrawals.map((v,i)=>({year:i+1,...stats(v)})),balances:nominalAssets.map((v,i)=>({year:i,...stats(v),cash:stats(nominalCash[i]),investment:stats(nominalInvestment[i]),target:stats(nominalTargets[i])}))},anyCutRate:anyCut/paths.count,anyZeroRate:zeroDurations.length/paths.count,zeroYearsWhenAffected:zeroDurations.length?stats(zeroDurations):null,policy,unattainableRate:anyUnattainable/paths.count,strategy,initial,metrics,fiSuccessRate:fiReached/paths.count,fiMissRate:1-fiReached/paths.count,averageAnnual:metrics.total.mean/a.years,averageCut:cutTotal?cutPercent/cutTotal:0,averageCutDollars:cutTotal?cutDollars/cutTotal:0,depletionRate:depleted/paths.count,shortfallRate:shortfalls/paths.count,earlyShortfallRate:earlyShortfalls/paths.count,actualSuccess:fiReached/paths.count,fundedRate:1-shortfalls/paths.count,firstCut:firstCut.map(n=>n/paths.count),histogram,spending:spending.map((v,i)=>({year:i+1,...stats(v)})),balances:balances.map((v,i)=>({year:i,...stats(v),cash:stats(cash[i]),investment:stats(investment[i])})),examples};
}
export function calibrate(a,model){
 if(a.futureChanges?.some(e=>e.enabled!==false))return scheduledCalibration(a,model);
 const validation=marketPaths(a,2048,(a.seed^0x85ebca6b)>>>0),checks=[];
 for(const years of [...new Set([1,Math.min(5,a.years),Math.min(10,a.years),Math.min(25,a.years),a.years])])for(const fraction of a.reserveYears===0&&!(a.checkCash>0)&&!(a.initialCash>0)?[0]:[0,.15,.4])for(const target of [.1,.3,.8,.95])for(const targetWealth of a.goal==='fi'||(a.endingBalance??0)>0?[...new Set([.5,1,guardrailGoalTarget(a)/a.portfolio,5])]:[0]){
  const solved=model.spendingFor(1-fraction,fraction,years,target,0,targetWealth),observed=fixedSuccess(a,validation,1-fraction,fraction,solved.spending,years,targetWealth);
  checks.push({years,cashFraction:fraction,target,targetRatio:targetWealth,estimated:solved.probability,observed,error:Math.abs(observed-solved.probability)});
 }
 return {count:validation.count,checks,meanError:mean(checks.map(c=>c.error)),maxError:Math.max(...checks.map(c=>c.error)),maxMonotonicCorrection:model.maxCorrection,innerMargin95:1.96*Math.sqrt(.25/a.innerCount)};
}
// Dollar investment thresholds hold today's cash and real annual withdrawals fixed.
export function currentGuardrailCheck(a,strategy,model){
 model.setContext?.(a.checkInflationTotal==null?(1+a.inflation)**a.checkElapsed:1+a.checkInflationTotal);
 strategy=scheduledStrategy(strategy,a.checkElapsed,a.years);
 const investment=a.checkInvestment,cash=a.checkCash,planned=a.checkSpending,remaining=a.years-a.checkElapsed;
 if(planned<a.floor)return {strategy,error:'Current withdrawals are below the minimum withdrawal floor. Adjust either amount to calculate this check.'};
 const probability=i=>model.probability(i,cash,planned,remaining);
 const balanceFor=target=>{
  if(probability(0)>=target)return {investment:0,probability:probability(0),limited:false};
  let l=0,u=Math.max(1,a.portfolio,investment,planned, guardrailGoalTarget(a));
  u=Math.min(1e12,u);while(probability(u)<target&&u<1e12)u=Math.min(1e12,u*2);
  if(probability(u)<target)return {investment:null,probability:probability(u),limited:true};
  for(let j=0;j<48;j++){const m=(l+u)/2;if(probability(m)<target)l=m;else u=m;}
  return {investment:u,probability:probability(u),limited:Math.abs(probability(u)-target)>.015};
 };
 const decision=checkpoint(model,strategy,investment,cash,planned,remaining,a.floor),target=model.spendingFor(investment,cash,remaining,strategy.target,a.floor);
 return {strategy,investment,cash,planned,remaining,elapsed:a.checkElapsed,probability:probability(investment),lower:balanceFor(strategy.lower),upper:balanceFor(strategy.upper),decision,target,feasibility:feasibility(model,investment,cash,planned,remaining,a.floor,strategy.target),zeroProbability:model.probability(investment,cash,0,remaining)};
}
export function runGuardrailComparison(input,strategies=defaultStrategies,{progress=()=>{}}={}){
 const a={...guardrailDefaults,...input};validateGuardrails(a,strategies);
 const started=Date.now(),paths=marketPaths(a,a.count,a.seed),model=buildProbabilityModel(a,{progress}),calibration=calibrate(a,model),results=[];
 const sweep=a.includeSweep===false?[]:Array.from({length:8},(_,i)=>{const target=(i+2)/10;return {name:Math.round(target*100)+'% target',target,lower:Math.max(0,target-.1),upper:Math.min(1,target+.1)};});
 const cache=new Map(),key=s=>[s.lower,s.target,s.upper,s.endTarget??s.target,s.schedule||'fixed'].join(':');
 for(const [index,s]of [...strategies,...sweep].entries()){
  let result=cache.get(key(s));if(!result){result=aggregateStrategy(a,s,model,paths,{progress:p=>progress({...p,label:s.name,index,total:strategies.length+sweep.length})});cache.set(key(s),result);}results.push({...result,strategy:s});
 }
 const references=strategies.map((s,i)=>({name:s.name,fixed:aggregateStrategy(a,s,model,paths,{keepPaths:0,policy:'fixed',initialOverride:results[i].initial}),zero:aggregateStrategy(a,s,model,paths,{keepPaths:0,policy:'zero',initialOverride:results[i].initial})}));
 let noCash=null,noCashCalibration=null;
 if(a.compareNoCash&&(a.reserveYears>0||(a.initialCash??0)>0)){const b={...a,reserveYears:0,checkCash:0,initialCash:0},other=buildProbabilityModel(b,{progress});noCashCalibration=calibrate(b,other);noCash=strategies.map(s=>aggregateStrategy(b,s,other,paths,{progress:p=>progress({...p,label:s.name+' · no cash'})}));}
 return {starting:startingTable(a,strategies,model),references,currentDollarFactor:1,assumptions:a,currentChecks:strategies.map(s=>currentGuardrailCheck(a,s,model)),source:historySource,historicalMean:historicMean,historicalInflation:historicInflation,calibration,noCashCalibration,results:results.slice(0,strategies.length),sweep:results.slice(strategies.length).map(r=>({target:r.strategy.target,initial:r.initial.spending,annual:r.averageAnnual,cuts:r.metrics.cuts.mean,maxCut:r.metrics.maxCut.median,depletion:r.depletionRate,fiSuccess:r.fiSuccessRate,fiMiss:r.fiMissRate})),noCash,elapsedMs:Date.now()-started,pathSeed:paths.seed,probabilitySeed:(a.seed^0x9e3779b9)>>>0,validationSeed:(a.seed^0x85ebca6b)>>>0};
}

export function runCurrentGuardrailCheck(input,strategies=defaultStrategies,{progress=()=>{}}={}){
 const entered={...guardrailDefaults,...input};validateGuardrails({...entered,initialMode:'target'},strategies);
 const {factor,real:a}=currentDollarInputs(entered),started=Date.now(),model=buildProbabilityModel(a,{progress});
 const currentChecks=strategies.map(s=>{const c=currentGuardrailCheck(a,s,model);if(c.error)return c;return {...c,investment:c.investment*factor,cash:c.cash*factor,planned:c.planned*factor,lower:{...c.lower,investment:c.lower.investment===null?null:c.lower.investment*factor},upper:{...c.upper,investment:c.upper.investment===null?null:c.upper.investment*factor},decision:{...c.decision,spending:c.decision.spending*factor},target:{...c.target,spending:c.target.spending*factor}};});
 return {assumptions:entered,currentChecks,currentDollarFactor:factor,elapsedMs:Date.now()-started};
}

export function currentDollarInputs(input){
 const a={...guardrailDefaults,...input};
 const factor=a.checkInflationTotal==null?(1+a.inflation)**a.checkElapsed:1+a.checkInflationTotal;
 if(!Number.isFinite(factor)||factor<=0)throw Error('Inflation since starting must leave a positive price level.');
 return {factor,real:{...a,checkInvestment:a.checkInvestment/factor,checkCash:a.checkCash/factor,checkSpending:a.checkSpending/factor}};
}
export function runScheduleComparison(input,strategies=defaultStrategies,{progress=()=>{}}={}){
 const a={...guardrailDefaults,...input},base=strategies[0];
 const variants=['fixed','steady','early','late'].map((schedule,i)=>({...base,schedule,name:['Fixed','Steady increase','Increase earlier','Increase later'][i]}));
 validateGuardrails(a,variants);
 const started=Date.now(),paths=marketPaths(a,a.count,a.seed),model=buildProbabilityModel(a,{progress}),initial=initialSpending(a,base,model);
 const results=variants.map(s=>aggregateStrategy(a,s,model,paths,{initialOverride:initial,progress:p=>progress({...p,label:s.name})}));
 return {kind:'schedules',assumptions:a,base,results,calibration:calibrate(a,model),elapsedMs:Date.now()-started,pathSeed:paths.seed};
}

function startingTable(a,strategies,model){
 const targets=[...new Set([.1,.2,.3,.4,.5,.6,.7,.8,.9,...strategies.map(s=>s.target)])].sort((a,b)=>a-b);
 return targets.map(target=>({target,...initialSpending({...a,initialMode:'target'}, {target},model)}));
}
export function runStartingWithdrawals(input,strategies=defaultStrategies,{progress=()=>{}}={}){
 const a={...guardrailDefaults,...input,initialMode:'target',floor:0};validateGuardrails(a,strategies);
 const started=Date.now(),model=buildProbabilityModel(a,{progress});
 return {kind:'starting',assumptions:a,starting:startingTable(a,strategies,model),calibration:calibrate(a,model),elapsedMs:Date.now()-started};
}

/** Scheduled flows use the same cash ledger for forward estimates and outer paths. */
export function scheduledYear(a,investment,cash,planned,stockGrowth,cashGrowth,positive,elapsed,price=1,reservePlanned=planned){
 if(!a.futureChanges?.some(e=>e.enabled!==false))return retirementYear(investment,cash,planned,stockGrowth,cashGrowth,positive,a.reserveYears,reservePlanned);
 if(elapsed===0){const opening=futureFlows(a.futureChanges,0,0,a.inflation);investment+=opening.addition;let need=opening.expense,paid=Math.min(investment,need);investment-=paid;need-=paid;paid=Math.min(cash,need);cash-=paid;need-=paid;if(need>1e-8)return {investment,cash,paid:0,shortfall:need,replenished:0};}
 const f=futureFlows(a.futureChanges,elapsed,elapsed+1,a.inflation,price),net=Math.max(0,planned-f.income),surplus=Math.max(0,f.income-planned);
 // Additions and surplus arrive at year end, so they do not receive that year's return.
 const result=retirementYear(investment*stockGrowth+f.addition,cash*cashGrowth+surplus,net+f.expense,1,1,positive,a.reserveYears,Math.max(0,reservePlanned-f.income));
 return {...result,income:f.income,addition:f.addition,surplus,expense:f.expense};
}
function scheduledFlowSamples(a,paths,years,currentPrice){
 const elapsed=a.years-years,flows=new Float64Array(paths.count*years*5);
 for(let n=0;n<paths.count;n++){let price=currentPrice;for(let y=0;y<years;y++){
  const k=n*paths.years+y,t=(n*years+y)*5;price*=paths.prices[k];
  const f=futureFlows(a.futureChanges,elapsed+y,elapsed+y+1,a.inflation,price);
  flows[t]=f.income;flows[t+1]=f.addition;flows[t+2]=f.expense;flows[t+3]=price/currentPrice;flows[t+4]=price;
 }}return flows;
}
function scheduledSuccess(a,paths,investment,cash,spending,years,target,currentPrice=1,samples=null){
 const elapsed=a.years-years,f=samples||scheduledFlowSamples(a,paths,years,currentPrice),opening=elapsed===0?futureFlows(a.futureChanges,0,0,a.inflation):{addition:0,expense:0};
 let successes=0;const count=a.model==='parametric'&&a.stockVol===0?1:paths.count;
 for(let n=0;n<count;n++){
  let i=investment+opening.addition,c=cash,ok=true;
  let need=opening.expense,paid=Math.min(i,need);i-=paid;need-=paid;paid=Math.min(c,need);c-=paid;need-=paid;if(need>1e-8)continue;
  for(let y=0;y<years;y++){
   const k=n*paths.years+y,t=(n*years+y)*5,planned=a.adjustWithdrawals===false?spending/f[t+3]:spending,net=Math.max(0,planned-f[t]);
   i=i*paths.stock[k]+f[t+1];c=c*paths.cash[k]+Math.max(0,f[t]-planned);need=net+f[t+2];
   if(!paths.positive[k]){paid=Math.min(c,need);c-=paid;need-=paid;}
   paid=Math.min(i,need);i-=paid;need-=paid;paid=Math.min(c,need);c-=paid;need-=paid;
   if(need>.01){ok=false;break;}
   if(paths.positive[k]&&a.reserveYears>0){const refill=Math.min(i,Math.max(0,a.reserveYears*net-c));i-=refill;c+=refill;}
  }
  successes+=Number(ok&&goalAssets(a,i,c)>=target);
 }return successes/count;
}
function scheduledProbabilityModel(a,{progress=()=>{}}={}){
 const paths=marketPaths(a,a.innerCount,(a.seed^0x9e3779b9)>>>0),cache=new Map();let currentPrice=1,lastKey='',lastValue;
 const nominalEvents=a.futureChanges.some(e=>e.enabled!==false&&e.adjust===false);
 const probability=(investment,cash,spending,years,target=guardrailGoalTarget(a))=>{
  if(years<=0)return Number(goalAssets(a,investment,cash)>=target);if(!Number.isFinite(spending)||spending<0)return 0;
  const key=[investment,cash,spending,years,target,currentPrice].join('/');if(key===lastKey)return lastValue;
  const sampleKey=years+'/'+(nominalEvents?currentPrice:1);
  let flows=cache.get(sampleKey);if(!flows){flows=scheduledFlowSamples(a,paths,years,currentPrice);if(cache.size>a.years+2)cache.clear();cache.set(sampleKey,flows);}
  lastKey=key;lastValue=scheduledSuccess(a,paths,investment,cash,spending,years,target,currentPrice,flows);return lastValue;
 };
 const spendingFor=(investment,cash,years,target,floor=0,targetWealth=guardrailGoalTarget(a))=>{
  const zero=probability(investment,cash,floor,years,targetWealth);if(zero<target)return {spending:floor,probability:zero,limited:true};
  let lo=floor,hi=Math.max(floor,investment+cash,1);while(hi<1e12&&probability(investment,cash,hi,years,targetWealth)>=target)hi=Math.min(1e12,hi*2);for(let j=0;j<48&&hi-lo>.005;j++){const m=(lo+hi)/2;if(probability(investment,cash,m,years,targetWealth)>=target)lo=m;else hi=m;}
  const p=probability(investment,cash,lo,years,targetWealth);return {spending:lo,probability:p,limited:Math.abs(p-target)>.015};
 };
 progress({stage:'probability',fraction:1});
 return {probability,spendingFor,paths,maxCorrection:0,targetRatioMax:Infinity,setContext:price=>{currentPrice=price;}};
}
function scheduledCalibration(a,model){
 model.setContext?.(1);const validation=marketPaths(a,2048,(a.seed^0x85ebca6b)>>>0),cash=a.initialCash??0,investment=a.portfolio-cash,checks=[];
 for(const years of [...new Set([1,Math.min(5,a.years),a.years])])for(const target of [.3,.8]){
  const fit=model.spendingFor(investment,cash,years,target),observed=fixedSuccess(a,validation,investment,cash,fit.spending,years);
  checks.push({years,target,estimated:fit.probability,observed,error:Math.abs(fit.probability-observed)});
 }
 return {checks,meanError:mean(checks.map(c=>c.error)),maxError:Math.max(...checks.map(c=>c.error)),maxCorrection:0};
}
