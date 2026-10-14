import fs from 'node:fs';
import assert from 'node:assert/strict';
import {guardrailDefaults,defaultStrategies,marketPaths,buildProbabilityModel,aggregateStrategy,calibrate} from '../guardrails.js';
const reports=[];
for(const goal of ['fi','retirement'])for(const blockYears of [1,5]){
 const a={...guardrailDefaults,goal,fiBasis:'total',portfolio:1100000,initialMode:'plan',initialCash:100000,initialWithdrawal:goal==='fi'?40000:60000,years:goal==='fi'?10:30,fiWithdrawals:60000,endingBalance:goal==='fi'?0:500000,blockYears,floor:0};
 const model=buildProbabilityModel(a),paths=marketPaths(a,25000,a.seed),calibration=calibrate(a,model);
 for(const strategy of defaultStrategies){const small=aggregateStrategy(a,strategy,model,{...paths,count:10000}),large=aggregateStrategy(a,strategy,model,paths);
  assert.ok(Math.abs(small.actualSuccess-large.actualSuccess)<.025);assert.equal(small.initial.cash,100000);assert.equal(large.initial.spending,a.initialWithdrawal);
  for(const path of small.examples)for(let y=0;y<=a.years;y++){assert.ok(path.balances[y]>=0);assert.ok(Math.abs(path.balances[y]-path.investmentBalances[y]-path.cashBalances[y])<.0001);assert.ok(Math.abs(path.nominalBalances[y]-path.balances[y]*path.priceLevels[y])<.0001);}
  reports.push({goal,years:a.years,endingBalance:a.endingBalance,blockYears,strategy:strategy.name,initial:a.initialWithdrawal,success10000:small.actualSuccess,success25000:large.actualSuccess,medianWithdrawals:small.metrics.total.median,meanFloorYears:small.metrics.floorYears.mean,medianLargestCut:small.metrics.maxCut.median,calibrationMean:calibration.meanError,calibrationMax:calibration.maxError});
 }
}
fs.writeFileSync('validation/connected-guardrails.json',JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports,null,2));
