import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailDefaults,defaultStrategies,currentDollarInputs,runCurrentGuardrailCheck,currentGuardrailCheck,buildProbabilityModel,runScheduleComparison} from './guardrails.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('current dollars use compounded inflation or an explicit cumulative override',()=>{
 const a={...guardrailDefaults,checkElapsed:5,checkInvestment:1000000,checkSpending:50000};const x=currentDollarInputs(a);close(x.factor,1.025**5);close(x.real.checkInvestment,1000000/x.factor);assert.equal(x.real.fiWithdrawals,a.fiWithdrawals);assert.equal(x.real.floor,a.floor);
 const y=currentDollarInputs({...a,checkInflationTotal:.2});close(y.factor,1.2);close(y.real.checkSpending,50000/1.2);
 close(currentDollarInputs({...a,checkInflationTotal:-.1}).factor,.9);
 assert.throws(()=>currentDollarInputs({...a,checkInflationTotal:-1}));
});
test('probabilities match real-dollar checks; every displayed amount returns to current dollars',()=>{
 const a={...guardrailDefaults,years:5,checkElapsed:2,checkInflationTotal:.2,checkInvestment:1800000,checkCash:120000,checkSpending:48000,floor:10000,innerCount:512};
 const {real,factor}=currentDollarInputs(a),model=buildProbabilityModel(real),output=runCurrentGuardrailCheck(a);
 assert.equal(output.currentDollarFactor,1.2);
 for(let i=0;i<2;i++){const expected=currentGuardrailCheck(real,defaultStrategies[i],model),actual=output.currentChecks[i];close(actual.probability,expected.probability);close(actual.target.spending,expected.target.spending*factor);close(actual.decision.spending,expected.decision.spending*factor);close(actual.planned,48000);close(actual.cash,120000);close(actual.lower.investment,expected.lower.investment*factor);close(actual.upper.investment,expected.upper.investment*factor);}
});
test('four-schedule comparison shares exact initial conditions and fixed remains fixed',()=>{
 const a={...guardrailDefaults,fiWithdrawals:60000,reserveYears:0,checkCash:0},s={...defaultStrategies[0],target:.5,lower:.4,upper:.6,endTarget:.9,name:'Strategy A'};
 const r=runScheduleComparison(a,[s]);assert.equal(r.kind,'schedules');assert.equal(r.results.length,4);
 for(const x of r.results){assert.deepEqual(x.initial,r.results[0].initial);assert.equal(x.examples[0].balances[1],r.results[0].examples[0].balances[1]);assert.equal(x.examples[0].spending[0],r.results[0].examples[0].spending[0]);assert.ok(Number.isFinite(x.fiSuccessRate));}
 assert.equal(r.results[0].examples[0].targets.at(-1).target,.5);for(const x of r.results.slice(1))assert.equal(x.examples[0].targets.at(-1).target,.9);
 assert.ok(r.calibration.maxError<.08);
});
