import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {historicalYears} from '../guardrail-history.js';
import {seededRandom} from '../finance.js';
import {guardrailDefaults,buildProbabilityModel,marketPaths,aggregateStrategy,initialSpending,runRetirement} from '../guardrails.js';
const a={...guardrailDefaults,portfolio:1100000,fiWithdrawals:60000,years:10,stockMean:.09,checkElapsed:0,count:10000};
const base={name:'Validation',lower:.2,target:.3,upper:.4,endTarget:.9};
const variants=['fixed','steady','early','late'].map(schedule=>({...base,name:schedule,schedule}));
const model=buildProbabilityModel(a),mean=j=>historicalYears.reduce((s,r)=>s+r[j],0)/historicalYears.length;
const stockScale=(1+a.stockMean)/(1+mean(1)),priceScale=(1+a.inflation)/(1+mean(2));
function pack(rows,count){const stock=[],cash=[],positive=[];for(const row of rows){const g=(1+row[1])*stockScale,p=(1+row[2])*priceScale;stock.push(g/p);cash.push((1+a.cashReturn)/p);positive.push(Number(g>1));}return {stock,cash,positive,count,years:a.years};}
// Five consecutive years per block; no wraparound. Permutation retains each path's
// exact observations and changes only their ordering, to isolate sequence effects.
const random=seededRandom(98173),rows=[];
for(let n=0;n<a.count;n++)for(let y=0;y<a.years;){const start=Math.floor(random()*(historicalYears.length-4));for(let j=0;j<5&&y<a.years;j++,y++)rows.push(historicalYears[start+j]);}
const shuffled=rows.slice(),shuffle=seededRandom(71381);
for(let n=0;n<a.count;n++)for(let y=a.years-1;y>0;y--){const j=Math.floor(shuffle()*(y+1)),k=n*a.years;[shuffled[k+y],shuffled[k+j]]=[shuffled[k+j],shuffled[k+y]];}
const paths={iid:marketPaths(a,a.count,a.seed),fiveYearBlocks:pack(rows,a.count),sameObservationsShuffled:pack(shuffled,a.count)};
for(let n=0;n<a.count;n++){assert.deepEqual(rows.slice(n*a.years,(n+1)*a.years).map(r=>r[0]).sort(),shuffled.slice(n*a.years,(n+1)*a.years).map(r=>r[0]).sort());}
const summary=[];
for(const floor of [0,20000,40000])for(const [sampling,markets] of Object.entries(paths))for(const strategy of variants){const r=aggregateStrategy({...a,floor},strategy,model,markets,{keepPaths:0});summary.push({floor,sampling,schedule:strategy.schedule,success:r.fiSuccessRate,initial:r.initial.spending,totalMedian:r.metrics.total.median,cutsMean:r.metrics.cuts.mean,largestCutMedian:r.metrics.maxCut.median,floorYearsMean:r.metrics.floorYears.mean,floorStreakP90:r.metrics.maxFloorRun.p90,unattainable:r.unattainableRate});}
// Independent nominal-dollar ledger: no retirementYear or financial engine helper.
const traces=[];
for(const start of [1929,1966,2000,2007])for(const floor of [0,20000,40000])for(const strategy of variants){
 const records=historicalYears.filter(r=>r[0]>=start&&r[0]<start+a.years),markets=pack(records,1),b={...a,floor},initial=initialSpending(b,strategy,model),run=runRetirement(b,strategy,model,markets,0,initial);
 let investments=initial.investment,cash=initial.cash,prices=1,total=0;const ledger=[];
 for(let y=0;y<a.years;y++){
  const [year,stock,inflation]=records[y],gross=(1+stock)*stockScale;prices*=(1+inflation)*priceScale;investments*=gross;cash*=1+a.cashReturn;
  const withdrawal=run.plannedSpending[y]*prices;let unpaid=withdrawal;
  if(gross<=1){const used=Math.min(cash,unpaid);cash-=used;unpaid-=used;}
  const fromInvestments=Math.min(investments,unpaid);investments-=fromInvestments;unpaid-=fromInvestments;
  const extraCash=Math.min(cash,unpaid);cash-=extraCash;unpaid-=extraCash;
  if(gross>1){const transfer=Math.min(investments,Math.max(0,a.reserveYears*withdrawal-cash));investments-=transfer;cash+=transfer;}
  const close=(x,z)=>assert.ok(Math.abs(x-z)<.00001,`${start}/${floor}/${strategy.schedule}/${y}: ${x} != ${z}`);
  close(investments/prices,run.investmentBalances[y+1]);close(cash/prices,run.cashBalances[y+1]);close((withdrawal-unpaid)/prices,run.spending[y]);total+=(withdrawal-unpaid)/prices;
  const t=y/(a.years-1),weight={fixed:0,steady:t,early:1-(1-t)**2,late:t*t}[strategy.schedule];
  close(run.targets[y].target,.3+.6*weight);
  ledger.push({year,yearsRemaining:a.years-y,target:run.targets[y].target,probability:run.probabilities[y],plannedReal:run.plannedSpending[y],paidReal:run.spending[y],investmentsReal:investments/prices,cashReal:cash/prices});
 }
 assert.ok(Math.abs(total-run.total)<.00001);
 const floorFlags=run.spending.map(w=>w<=floor+.01),streaks=floorFlags.map((_,i)=>{let n=0;while(i+n<floorFlags.length&&floorFlags[i+n])n++;return n;});assert.equal(run.maxFloorRun,Math.max(...streaks));
 traces.push({start,floor,schedule:strategy.schedule,success:run.fiReached,largestCut:run.maxCut,maxFloorRun:run.maxFloorRun,ledger});
}
const report={assumptions:a,base,stockScale,priceScale,note:'Sensitivity study, not a new forecast. Probability model remains IID while outer ordering changes. Historical traces use centered gross returns/inflation, not literal historical replay. Floors are illustrative.',summary,traces};
await mkdir(new URL('../validation/',import.meta.url),{recursive:true});
await writeFile(new URL('../validation/guardrails-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({traces:traces.length,ledgerYears:traces.length*a.years,summary},null,2));
