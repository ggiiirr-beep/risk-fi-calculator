/** All engine amounts are real, today's dollars. Rates are decimal annual rates. */
export const defaults = {portfolio:1000000,spending:60000,nominal:.09,inflation:.025,real:.06341463414634152,returnMode:'nominal',fiRate:.04,targetOverride:false,target:1500000,years:10,age:35,cash:100000,cashYears:1.6666666667,cashMode:'dollars',cashNominal:.035,cashStrategy:'reserve',cashMinimum:0,income:0,incomeStart:0,incomeEnd:10,timing:'end',poor:.02,strong:.09};
export const realReturn = (nominal,inflation)=>(1+nominal)/(1+inflation)-1;
export const nominalReturn = (real,inflation)=>(1+real)*(1+inflation)-1;
export const toNominal = (amount,inflation,years)=>amount*Math.pow(1+inflation,years);
export const fiTarget = p=>p.targetOverride?p.target:p.spending/p.fiRate;
export const cashAmount = p=>p.cashMode==='years'?p.cashYears*p.spending:p.cash;
export const expectedReturn = p=>p.returnMode==='real'?p.real:realReturn(p.nominal,p.inflation);
export function validate(p){
 if(p.age!=null&&(!Number.isFinite(p.age)||p.age<0))throw Error('Age: enter a nonnegative number or leave it blank.');
 for(const k of ['portfolio','spending',p.cashMode==='years'?'cashYears':'cash','cashMinimum','income','incomeStart','incomeEnd']) if(!Number.isFinite(p[k])||p[k]<0) throw Error(`${k}: enter a nonnegative number.`);
 for(const k of [p.returnMode==='real'?'real':'nominal','inflation','cashNominal']) if(!Number.isFinite(p[k])||p[k]<=-1) throw Error(`${k}: must be greater than −100%.`);
 for(const [key,allowed] of Object.entries({returnMode:['real','nominal'],cashMode:['dollars','years'],cashStrategy:['reserve','first','downturn'],timing:['begin','end']})) if(!allowed.includes(p[key])) throw Error('Invalid '+key+'.');
 if(!Number.isFinite(p.years)||p.years<0||p.years>100)throw Error('Choose a time period between 0 and 100 years.');
 if(!Number.isFinite(p.fiRate)||p.fiRate<=0||p.fiRate>1)throw Error('The FI withdrawal rate must be above 0% and at most 100%.');
 if(p.targetOverride&&(!Number.isFinite(p.target)||p.target<=0))throw Error('Enter a positive custom FI target.');
 if(p.incomeEnd<p.incomeStart)throw Error('Earned income must end after it starts.');
}
export function project(p,{years=p.years,returns,guards=null}={}){
 validate({...p,years});
 let investment=p.portfolio,cash=cashAmount(p),unfunded=0,depleted=false,firstFI=investment>=fiTarget(p)?0:null;
 const target=fiTarget(p),cashRate=realReturn(p.cashNominal,p.inflation),baseReturn=expectedReturn(p);
 const rows=[{year:0,beginning:investment,investment, cash,total:investment+cash,investmentReturn:0,cashInterest:0,investmentWithdrawal:0,cashWithdrawal:0,spending:p.spending,income:0,unfunded:0,actualRate:0,spendingRate:investment>0?p.spending/investment:null,progress:investment/target,target}];
 for(let start=0;start<years-1e-9;start+=1){
  const dt=Math.min(1,years-start),year=start+dt,r=returns?.[start]??baseReturn;
  if(!Number.isFinite(r)||r<=-1)throw Error('Annual returns must be greater than −100%.');
  const beginning=investment,beginCash=cash;
  let annualSpending=p.spending,annualIncome=p.income,stop=false;
  if(guards?.enabled){
   if(investment<guards.reduceBelow)annualSpending*=1-guards.reducePercent;
   if(cash<guards.cashMonths/12*p.spending)annualSpending*=1-guards.cashReducePercent;
   if(investment<guards.incomeBelow)annualIncome+=guards.extraIncome;
   stop=investment<guards.stopBelow;
  }
  const spending=annualSpending*dt;
  const incomeDuration=Math.max(0,Math.min(year,p.incomeEnd)-Math.max(start,p.incomeStart));
  const income=p.income*incomeDuration+(annualIncome-p.income)*dt;
  const need=Math.max(0,spending-income),surplus=Math.max(0,income-spending);
  let cashWithdrawal=0,investmentWithdrawal=0,shortfall=0,investmentReturn=0,cashInterest=0;
  const grow=()=>{investmentReturn=investment*(Math.pow(1+r,dt)-1);cashInterest=cash*(Math.pow(1+cashRate,dt)-1);investment+=investmentReturn;cash+=cashInterest;};
  const withdraw=()=>{
   const useCash=p.cashStrategy==='first'||(p.cashStrategy==='downturn'&&r<0);
   cashWithdrawal=useCash?Math.min(need,Math.max(0,cash-p.cashMinimum)):0;
   cash-=cashWithdrawal;
   investmentWithdrawal=stop?0:Math.min(investment,need-cashWithdrawal);
   investment-=investmentWithdrawal;
   shortfall=Math.max(0,need-cashWithdrawal-investmentWithdrawal);
   investment+=surplus;
  };
  if(p.timing==='begin'){withdraw();grow();}else{grow();withdraw();}
  investment=Math.max(0,investment);cash=Math.max(0,cash);unfunded+=shortfall;
  depleted ||= investment<=1e-7 && (beginning>0||investmentWithdrawal>0||shortfall>0);
  if(firstFI===null&&investment>=target)firstFI=year;
  rows.push({year,beginning,beginCash,investmentReturn,cashInterest,investmentWithdrawal,cashWithdrawal,investment,cash,total:investment+cash,spending,income,unfunded:shortfall,actualRate:beginning>0?investmentWithdrawal/dt/beginning:null,spendingRate:investment>0?annualSpending/investment:null,progress:investment/target,target});
 }
 return {rows,end:rows.at(-1),target,unfunded,depleted,firstFI};
}
function root(fn,lo,hi){
 let fl=fn(lo),fh=fn(hi);
 if(Math.abs(fl)<1e-7)return lo;
 if(Math.abs(fh)<1e-7)return hi;
 if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0)return null;
 for(let i=0;i<85;i++){let mid=(lo+hi)/2,fm=fn(mid);if(Math.abs(fm)<1e-7)return mid;if(fl*fm<=0){hi=mid;fh=fm;}else{lo=mid;fl=fm;}}
 return (lo+hi)/2;
}
export function solve(p,unknown){
 // Work on a copy. The selected unknown is never an input to its own solver.
 p={...p};
 const key={time:'years',date:'years',return:p.returnMode==='real'?'real':'nominal'}[unknown]||unknown;
 if(key in defaults)p[key]=defaults[key];
 if(unknown==='return'){p.returnMode='real';p.real=0;}
 if(unknown==='target'||unknown==='fiRate')p.targetOverride=false;
 validate(p);
 if(unknown==='time'||unknown==='date'){
  const target=fiTarget(p);if(p.portfolio>=target)return {value:0,plan:{...p,years:0}};
  for(let y=1;y<=100;y++){
   const pr=project(p,{years:y});
   if(pr.unfunded>1e-5)return {error:'This plan runs out of spending funds before reaching FI.'};
   if(pr.end.investment>=target){const value=root(t=>project(p,{years:t}).end.investment-target,y-1,y);return {value,plan:{...p,years:value}};}
  }
  return {error:'FI is not reached within 100 years under these assumptions.'};
 }
 if(unknown==='target'){
  const pr=project(p);if(pr.unfunded>1e-5||pr.end.investment<=0)return {error:'There is no positive, fully funded ending portfolio for this plan.'};
  return {value:pr.end.investment,plan:{...p,targetOverride:true,target:pr.end.investment}};
 }
 if(unknown==='fiRate'){
  const pr=project(p);const value=p.spending/pr.end.investment;
  if(pr.unfunded>1e-5||!Number.isFinite(value)||value<=0||value>1)return {error:'No withdrawal rate between 0% and 100% fits this funded plan.'};
  return {value,plan:{...p,fiRate:value,targetOverride:false}};
 }
 const bounds={spending:[0,1e9],portfolio:[0,1e11],return:[-.95,5],income:[0,1e9]};
 if(!bounds[unknown])throw Error('Choose a supported solver.');
 const candidate=x=>unknown==='return'?{...p,returnMode:'real',real:x}:{...p,[unknown]:x};
 const residual=x=>{const q=project(candidate(x));return q.end.investment-q.target-q.unfunded;};
 if(unknown==='income'&&residual(0)>=0)return {value:0,plan:{...p,income:0}};
 if(unknown==='portfolio'&&residual(0)>=0)return {value:0,plan:{...p,portfolio:0}};
 const value=root(residual,...bounds[unknown]);
 if(value===null)return {error:unknown==='income'?'No income solution in the chosen earning window. Check its start and end years.':'No feasible solution within the supported search range. Try a longer horizon or lower spending.'};
 const plan=candidate(value),q=project(plan);
 if(q.unfunded>0.01)return {error:'This plan has an unfunded spending gap before the target date.'};
 return {value,plan};
}
export function seededRandom(seed=7301){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function monteCarlo(p,{count=2000,volatility=.16,seed=7301,guards=null}={}){
 validate(p);if(!Number.isInteger(count)||count<100||count>10000||!Number.isFinite(volatility)||volatility<0||volatility>1)throw Error('Use 100–10,000 simulations and volatility between 0% and 100%.');
 if(guards?.enabled){for(const k of ['reduceBelow','stopBelow','incomeBelow','extraIncome','cashMonths'])if(!Number.isFinite(guards[k])||guards[k]<0)throw Error('Guardrail amounts must be nonnegative.');for(const k of ['reducePercent','cashReducePercent'])if(!Number.isFinite(guards[k])||guards[k]<0||guards[k]>1)throw Error('Spending cuts must be between 0% and 100%.');}
 const rand=seededRandom(seed),mean=expectedReturn(p),sigma=Math.sqrt(Math.log1p(volatility**2/(1+mean)**2)),mu=Math.log1p(mean)-sigma**2/2;
 const outcomes=[];let success=0,depleted=0,gaps=0,touched=0;const bands=Array.from({length:Math.ceil(p.years)+1},()=>[]);
 for(let i=0;i<count;i++){
  const returns=Array.from({length:Math.ceil(p.years)},()=>Math.exp(mu+sigma*Math.sqrt(-2*Math.log(Math.max(1e-12,rand())))*Math.cos(2*Math.PI*rand()))-1);
  const q=project(p,{returns,guards});outcomes.push(q.end.investment);success+=q.end.investment>=q.target&&q.unfunded<.01?1:0;depleted+=q.depleted?1:0;gaps+=q.unfunded>.01?1:0;touched+=q.firstFI!==null?1:0;
  q.rows.forEach((r,k)=>bands[k].push(r.investment));
 }
 const quantile=(a,t)=>{a.sort((x,y)=>x-y);const n=(a.length-1)*t,l=Math.floor(n);return a[l]+(a[Math.ceil(n)]-a[l])*(n-l);};
 return {success:success/count,depleted:depleted/count,gaps:gaps/count,touched:touched/count,p10:quantile(outcomes,.1),median:quantile(outcomes,.5),p90:quantile(outcomes,.9),bands:bands.map((a,i)=>({year:Math.min(i,p.years),p10:quantile(a,.1),median:quantile(a,.5),p90:quantile(a,.9)})),count,seed};
}
/** Rebase an original plan into check-in purchasing power before comparing. */
export function annualCheckIn(originalPlan,current,elapsed){
 if(!Number.isFinite(elapsed)||elapsed<0||elapsed>100)throw Error('The check-in must be within 100 years after the original start.');
 const factor=Math.pow(1+originalPlan.inflation,elapsed),original=project(originalPlan,{years:elapsed}),planned=original.end.investment*factor,delta=planned?current.portfolio/planned-1:current.portfolio>0?1:0,remaining=Math.max(0,originalPlan.years-elapsed);
 const plan={...originalPlan,portfolio:current.portfolio,cash:current.cash,spending:current.spending,cashMode:'dollars',cashMinimum:originalPlan.cashMinimum*factor,years:remaining,target:originalPlan.target*factor,income:originalPlan.income*factor,incomeStart:Math.max(0,originalPlan.incomeStart-elapsed),incomeEnd:Math.max(0,originalPlan.incomeEnd-elapsed)};
 validate(plan);
 return {factor,original,planned,delta,remaining,plan,spending:solve(plan,'spending'),requiredReturn:solve(plan,'return'),time:solve(plan,'time'),status:delta>.05?'Ahead of plan':delta<-.05?'Behind plan':'On track'};
}
