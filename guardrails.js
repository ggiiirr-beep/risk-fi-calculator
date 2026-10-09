import {historicalYears,historySource} from './guardrail-history.js';
import {seededRandom} from './finance.js';

export const guardrailDefaults={portfolio:1000000,years:50,stockMean:.11,stockVol:.18,inflation:.025,cashReturn:.035,reserveYears:2,floor:0,count:10000,innerCount:1024,seed:7301,model:'bootstrap',compareNoCash:false};
export const defaultStrategies=[{name:'Aggressive',lower:.2,target:.3,upper:.4},{name:'Conservative',lower:.7,target:.8,upper:.9}];
export function validateGuardrails(a,strategies=defaultStrategies){
 for(const k of ['portfolio','years','stockMean','stockVol','inflation','cashReturn','reserveYears','floor','count','innerCount','seed'])if(!Number.isFinite(a[k]))throw Error('Enter a number for '+k+'.');
 if(a.portfolio<=0||a.portfolio>1e12)throw Error('Starting portfolio must be above $0 and at most $1 trillion.');
 if(!Number.isInteger(a.years)||a.years<1||a.years>60)throw Error('Use a retirement duration of 1–60 whole years.');
 if(a.stockMean<=-.9||a.stockMean>1||a.stockVol<0||a.stockVol>1||a.inflation<=-.5||a.inflation>.5||a.cashReturn<=-.5||a.cashReturn>.5)throw Error('Check your return, volatility, and inflation assumptions.');
 if(a.reserveYears<0||a.reserveYears>5||a.floor<0||a.floor>a.portfolio)throw Error('Use 0–5 reserve years and a spending floor between $0 and the starting portfolio.');
 if(!Number.isInteger(a.count)||a.count<10000||a.count>100000)throw Error('Use 10,000–100,000 outer scenarios.');
 if(![512,1024,2048,4096].includes(a.innerCount))throw Error('Choose a supported probability sample size.');
 if(!Number.isInteger(a.seed)||a.seed<0||a.seed>4294967295)throw Error('Seed must be a whole number between 0 and 4,294,967,295.');
 if(!['bootstrap','historical','parametric'].includes(a.model))throw Error('Choose a supported market model.');
 for(const s of strategies)if(![s.lower,s.target,s.upper].every(Number.isFinite)||s.lower<0||s.upper>1||!(s.lower<s.target&&s.target<s.upper))throw Error(s.name+': use lower < target < upper, between 0% and 100%.');
}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
export function quantileSorted(a,p){const x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i);}
export function stats(values){const a=Array.from(values).sort((a,b)=>a-b);return {mean:mean(a),p10:quantileSorted(a,.1),median:quantileSorted(a,.5),p90:quantileSorted(a,.9),max:a.at(-1)};}
const historicMean=mean(historicalYears.map(r=>r[1])),historicInflation=mean(historicalYears.map(r=>r[2]));
// Separate streams are used for outer paths, probability construction, and validation.
export function marketPaths(a,count,seed){
 const random=seededRandom(seed),stock=new Float64Array(count*a.years),cash=new Float64Array(stock.length),positive=new Uint8Array(stock.length);
 const sigma=Math.sqrt(Math.log1p(a.stockVol**2/(1+a.stockMean)**2)),mu=Math.log1p(a.stockMean)-sigma*sigma/2;
 for(let i=0;i<stock.length;i++){
  let gross,prices;
  if(a.model==='parametric'){gross=Math.exp(mu+sigma*Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random()));prices=1+a.inflation;}
  else{const r=historicalYears[Math.floor(random()*historicalYears.length)];gross=1+r[1];prices=1+r[2];if(a.model==='bootstrap'){gross*=(1+a.stockMean)/(1+historicMean);prices*=(1+a.inflation)/(1+historicInflation);}}
  stock[i]=gross/prices;cash[i]=(1+a.cashReturn)/prices;positive[i]=gross>1?1:0;
 }
 return {stock,cash,positive,years:a.years,count,seed};
}
// End-year cash flows. Returns occur once, then withdrawals, then cash replenishment.
export function retirementYear(investment,cash,spending,stockGrowth,cashGrowth,positive,reserveYears){
 const grownInvestment=investment*stockGrowth,grownCash=cash*cashGrowth;
 investment=grownInvestment;cash=grownCash;
 let need=spending,cashWithdrawal=0,investmentWithdrawal=0;
 if(!positive){cashWithdrawal=Math.min(cash,need);cash-=cashWithdrawal;need-=cashWithdrawal;}
 investmentWithdrawal=Math.min(investment,need);investment-=investmentWithdrawal;need-=investmentWithdrawal;
 if(need>0){const extra=Math.min(cash,need);cash-=extra;cashWithdrawal+=extra;need-=extra;}
 let replenished=0;
 if(positive&&reserveYears>0){replenished=Math.min(investment,Math.max(0,reserveYears*spending-cash));investment-=replenished;cash+=replenished;}
 return {investment,cash,paid:spending-need,shortfall:need,replenished,investmentWithdrawal,cashWithdrawal,grownInvestment,grownCash};
}
export function fixedSuccess(a,paths,investment,cash,spending,years){
 let successes=0;
 for(let n=0;n<paths.count;n++){
  let i=investment,c=cash,ok=true;
  for(let y=0;y<years;y++){const k=n*paths.years+y,r=retirementYear(i,c,spending,paths.stock[k],paths.cash[k],paths.positive[k],a.reserveYears);i=r.investment;c=r.cash;if(r.shortfall>1e-10||i+c<=1e-12){ok=false;break;}}
  successes+=ok?1:0;
 }
 return successes/paths.count;
}
// A simulation-built probability surface over remaining years, cash fraction and spending/assets.
// Every cell assumes NO later guardrail adjustments. It shares no paths with the outer retirements.
export function buildProbabilityModel(a,{progress=()=>{},rateSteps=160,cashSteps=10}={}){
 const paths=marketPaths(a,a.innerCount,(a.seed^0x9e3779b9)>>>0),rates=[0];
 for(let j=0;j<rateSteps;j++)rates.push(Math.exp(Math.log(.0001)+j/(rateSteps-1)*Math.log(10000)));
 const fractions=a.reserveYears===0?[0]:Array.from({length:cashSteps+1},(_,i)=>i/cashSteps),R=rates.length,C=fractions.length;
 const table=new Float32Array((a.years+1)*C*R),at=(h,c,r)=>(h*C+c)*R+r;
 for(let c=0;c<C;c++){
  for(let r=0;r<R;r++){
   const failures=new Uint32Array(a.years+1),w=rates[r];
   for(let n=0;n<paths.count;n++){
    let investment=1-fractions[c],cash=fractions[c];
    for(let y=0;y<a.years;y++){
     const k=n*a.years+y,res=retirementYear(investment,cash,w,paths.stock[k],paths.cash[k],paths.positive[k],a.reserveYears);
     investment=res.investment;cash=res.cash;
     if(res.shortfall>1e-10||investment+cash<=1e-12){failures[y+1]++;break;}
    }
   }
   let failed=0;table[at(0,c,r)]=1;
   for(let h=1;h<=a.years;h++){failed+=failures[h];table[at(h,c,r)]=1-failed/paths.count;}
  }
  progress({stage:'probability',fraction:(c+1)/C});
 }
 // Monte Carlo noise and cash-policy effects can create tiny reversals; enforce a monotone envelope.
 let maxCorrection=0;
 for(let h=1;h<=a.years;h++)for(let c=0;c<C;c++)for(let r=1;r<R;r++){const index=at(h,c,r),old=table[index];table[index]=Math.min(old,table[index-1]);maxCorrection=Math.max(maxCorrection,old-table[index]);}
 const bracket=(array,x)=>{let l=0,u=array.length-1;while(u-l>1){const m=(l+u)>>1;if(array[m]<=x)l=m;else u=m;}return [l,u,(x-array[l])/(array[u]-array[l])];};
 const curve=(years,cashFraction,r)=>{const h=Math.max(0,Math.min(a.years,Math.round(years)));if(C===1)return table[at(h,0,r)];const v=Math.max(0,Math.min(1,cashFraction))*cashSteps,l=Math.min(C-2,Math.floor(v)),t=v-l;return table[at(h,l,r)]*(1-t)+table[at(h,l+1,r)]*t;};
 const probability=(investment,cash,spending,years)=>{
  const assets=investment+cash;if(assets<=0)return 0;if(years<=0)return 1;
  const rate=spending/assets;if(rate<0||!Number.isFinite(rate))return 0;if(rate>1+1e-12)return 0; // Outside the spending/wealth limit: explicitly infeasible, never clamp optimistically.
  if(rate>=rates.at(-1))return curve(years,cash/assets,R-1);
  const [l,u,t]=bracket(rates,rate);return curve(years,cash/assets,l)*(1-t)+curve(years,cash/assets,u)*t;
 };
 const spendingFor=(investment,cash,years,target,floor=0)=>{
  const assets=investment+cash;if(assets<=0)return {spending:floor,probability:0,limited:true};
  const fraction=cash/assets;let l=0,u=R-1;
  while(u-l>1){const m=(l+u)>>1;if(curve(years,fraction,m)>=target)l=m;else u=m;}
  const pl=curve(years,fraction,l),pu=curve(years,fraction,u),t=pl===pu?0:Math.max(0,Math.min(1,(pl-target)/(pl-pu)));
  const spending=Math.max(floor,Math.min(assets,assets*(rates[l]+t*(rates[u]-rates[l])))),p=probability(investment,cash,spending,years);
  return {spending,probability:p,limited:Math.abs(p-target)>.015};
 };
 return {probability,spendingFor,paths,rates,fractions,maxCorrection};
}
export function initialSpending(a,strategy,model){
 const limit=a.portfolio/Math.max(1,a.reserveYears),allocation=w=>Math.min(a.portfolio,a.reserveYears*w);
 let l=0,u=limit;
 for(let j=0;j<40;j++){const m=(l+u)/2,c=allocation(m),p=model.probability(a.portfolio-c,c,m,a.years);if(p>=strategy.target)l=m;else u=m;}
 const spending=Math.max(a.floor,(l+u)/2),cash=allocation(spending),probability=model.probability(a.portfolio-cash,cash,spending,a.years);
 return {spending,cash,investment:a.portfolio-cash,probability,limited:Math.abs(probability-strategy.target)>.015||spending>limit};
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
export function runRetirement(a,strategy,model,paths,index,initial=initialSpending(a,strategy,model)){
 let investment=initial.investment,cash=initial.cash,planned=initial.spending,depleted=false,shortfall=false;
 const spending=[],plannedSpending=[],balances=[investment+cash],cashBalances=[cash],investmentBalances=[investment],probabilities=[],adjustments=[];
 let cuts=0,raises=0,cutDollars=0,cutPercent=0,maxCut=0,maxCutDollars=0,total=0,below=0,afterBelow=0,runBelow=0,maxRunBelow=0,belowInitialRun=0,maxBelowInitialRun=0,lowest=initial.spending,limited=initial.limited?1:0,tail=0,firstCut=null,firstShortfall=null;
 for(let y=0;y<a.years;y++){
  const remaining=a.years-y,old=planned,decision=y===0?{spending:planned,before:initial.probability,after:initial.probability,trigger:null,limited:false}:checkpoint(model,strategy,investment,cash,planned,remaining,a.floor);
  planned=decision.spending;probabilities.push(decision.before);
  if(decision.before<strategy.lower){below++;runBelow++;maxRunBelow=Math.max(maxRunBelow,runBelow);}else runBelow=0;
  if(decision.after<strategy.lower)afterBelow++;
  if(decision.before<=1/a.innerCount||decision.before>=1-1/a.innerCount)tail++;
  if(decision.limited)limited++;
  let change=0;
  if(planned<old-1e-6){cuts++;change=(old-planned)/old;cutPercent+=change;cutDollars+=old-planned;maxCut=Math.max(maxCut,change);maxCutDollars=Math.max(maxCutDollars,old-planned);if(firstCut===null)firstCut=y+1;}
  if(planned>old+1e-6)raises++;
  const k=index*a.years+y,r=retirementYear(investment,cash,planned,paths.stock[k],paths.cash[k],paths.positive[k],a.reserveYears);
  investment=r.investment;cash=r.cash;depleted ||= investment+cash<=.01;shortfall ||= r.shortfall>.01;if(r.shortfall>.01&&firstShortfall===null)firstShortfall=y+1;total+=r.paid;lowest=Math.min(lowest,r.paid);
  if(r.paid<initial.spending-.01){belowInitialRun++;maxBelowInitialRun=Math.max(maxBelowInitialRun,belowInitialRun);}else belowInitialRun=0;
  spending.push(r.paid);plannedSpending.push(planned);balances.push(investment+cash);cashBalances.push(cash);investmentBalances.push(investment);adjustments.push(change);
 }
 const changes=spending.slice(1).map((v,i)=>spending[i]>0?(v/spending[i]-1):0),avgChange=mean(changes)||0,volatility=changes.length?Math.sqrt(mean(changes.map(v=>(v-avgChange)**2))):0;
 return {spending,plannedSpending,balances,cashBalances,investmentBalances,probabilities,adjustments,cuts,raises,cutDollars,cutPercent,maxCut,maxCutDollars,total,below,afterBelow,maxRunBelow,maxBelowInitialRun,decline:initial.spending?1-lowest/initial.spending:0,limited,tail,firstCut,firstShortfall,volatility,depleted,shortfall};
}
export function aggregateStrategy(a,strategy,model,paths,{progress=()=>{},keepPaths=12}={}){
 const initial=initialSpending(a,strategy,model),fields=['cuts','raises','maxCut','maxCutDollars','total','below','afterBelow','maxRunBelow','maxBelowInitialRun','decline','limited','tail','volatility'],samples=Object.fromEntries(fields.map(f=>[f,new Float64Array(paths.count)]));
 const spending=Array.from({length:a.years},()=>new Float64Array(paths.count)),balances=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),cash=Array.from({length:a.years+1},()=>new Float64Array(paths.count)),investment=Array.from({length:a.years+1},()=>new Float64Array(paths.count));
 let depleted=0,shortfalls=0,earlyShortfalls=0,cutDollars=0,cutPercent=0,cutTotal=0;const firstCut=[0,0,0],examples=[];
 for(let n=0;n<paths.count;n++){
  const r=runRetirement(a,strategy,model,paths,n,initial);for(const f of fields)samples[f][n]=r[f];
  for(let y=0;y<a.years;y++)spending[y][n]=r.spending[y];for(let y=0;y<=a.years;y++){balances[y][n]=r.balances[y];cash[y][n]=r.cashBalances[y];investment[y][n]=r.investmentBalances[y];}
  depleted+=r.depleted?1:0;shortfalls+=r.shortfall?1:0;earlyShortfalls+=r.firstShortfall!==null&&r.firstShortfall<=Math.max(0,a.years-10)?1:0;cutDollars+=r.cutDollars;cutPercent+=r.cutPercent;cutTotal+=r.cuts;
  [5,10,20].forEach((h,i)=>{if(r.firstCut!==null&&r.firstCut<=h)firstCut[i]++;});
  if(n<keepPaths)examples.push({index:n,...r});
  if(n%1000===999)progress({stage:'outer',fraction:(n+1)/paths.count});
 }
 const metrics=Object.fromEntries(fields.map(f=>[f,stats(samples[f])])),histogram=Array.from({length:10},(_,i)=>({lower:i/10,upper:(i+1)/10,count:0}));
 for(const value of samples.maxCut)histogram[Math.min(9,Math.floor(value*10))].count++;
 return {strategy,initial,metrics,averageAnnual:metrics.total.mean/a.years,averageCut:cutTotal?cutPercent/cutTotal:0,averageCutDollars:cutTotal?cutDollars/cutTotal:0,depletionRate:depleted/paths.count,shortfallRate:shortfalls/paths.count,earlyShortfallRate:earlyShortfalls/paths.count,actualSuccess:1-shortfalls/paths.count,firstCut:firstCut.map(n=>n/paths.count),histogram,spending:spending.map((v,i)=>({year:i+1,...stats(v)})),balances:balances.map((v,i)=>({year:i,...stats(v),cash:stats(cash[i]),investment:stats(investment[i])})),examples};
}
export function calibrate(a,model){
 const validation=marketPaths(a,2048,(a.seed^0x85ebca6b)>>>0),checks=[];
 for(const years of [...new Set([1,Math.min(5,a.years),Math.min(10,a.years),Math.min(25,a.years),a.years])])for(const fraction of a.reserveYears===0?[0]:[0,.15,.4])for(const target of [.1,.3,.8,.95]){
  const solved=model.spendingFor(1-fraction,fraction,years,target),observed=fixedSuccess(a,validation,1-fraction,fraction,solved.spending,years);
  checks.push({years,cashFraction:fraction,target,estimated:solved.probability,observed,error:Math.abs(observed-solved.probability)});
 }
 return {count:validation.count,checks,meanError:mean(checks.map(c=>c.error)),maxError:Math.max(...checks.map(c=>c.error)),maxMonotonicCorrection:model.maxCorrection,innerMargin95:1.96*Math.sqrt(.25/a.innerCount)};
}
export function runGuardrailComparison(input,strategies=defaultStrategies,{progress=()=>{}}={}){
 const a={...guardrailDefaults,...input};validateGuardrails(a,strategies);
 const started=Date.now(),paths=marketPaths(a,a.count,a.seed),model=buildProbabilityModel(a,{progress}),calibration=calibrate(a,model),results=[];
 const sweep=Array.from({length:8},(_,i)=>{const target=(i+2)/10;return {name:Math.round(target*100)+'% target',target,lower:Math.max(0,target-.1),upper:Math.min(1,target+.1)};});
 const cache=new Map(),key=s=>[s.lower,s.target,s.upper].map(v=>v.toFixed(10)).join(':');
 for(const [index,s]of [...strategies,...sweep].entries()){
  let result=cache.get(key(s));if(!result){result=aggregateStrategy(a,s,model,paths,{progress:p=>progress({...p,label:s.name,index,total:strategies.length+sweep.length})});cache.set(key(s),result);}results.push({...result,strategy:s});
 }
 let noCash=null,noCashCalibration=null;
 if(a.compareNoCash&&a.reserveYears>0){const b={...a,reserveYears:0},other=buildProbabilityModel(b,{progress});noCashCalibration=calibrate(b,other);noCash=strategies.map(s=>aggregateStrategy(b,s,other,paths,{progress:p=>progress({...p,label:s.name+' · no cash'})}));}
 return {assumptions:a,source:historySource,historicalMean:historicMean,historicalInflation:historicInflation,calibration,noCashCalibration,results:results.slice(0,strategies.length),sweep:results.slice(strategies.length).map(r=>({target:r.strategy.target,initial:r.initial.spending,annual:r.averageAnnual,cuts:r.metrics.cuts.mean,maxCut:r.metrics.maxCut.median,depletion:r.depletionRate})),noCash,elapsedMs:Date.now()-started,pathSeed:paths.seed,probabilitySeed:(a.seed^0x9e3779b9)>>>0,validationSeed:(a.seed^0x85ebca6b)>>>0};
}
