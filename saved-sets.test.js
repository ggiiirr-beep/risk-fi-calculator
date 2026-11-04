import test from 'node:test';
import assert from 'node:assert/strict';
import {createSavedSets} from './mobile/plans.js';
import {createNativeStorage} from './mobile/storage.js';
function memory(){const data=new Map();return {data,get:async({key})=>({value:data.get(key)??null}),set:async({key,value})=>data.set(key,value)};}
const snapshot=n=>({plan:JSON.stringify({state:{portfolio:n},ramp:{years:7}}),guardrails:JSON.stringify({strategies:[{confidence:.8}]})});
test('named copies survive reopening, remain independent, and support rename/update/delete',async()=>{
 const prefs=memory();let sets=await createSavedSets(prefs);
 const a=await sets.save('Current plan',snapshot(100));const b=await sets.save('Part-time',snapshot(200));
 sets=await createSavedSets(prefs);assert.equal(sets.list().length,2);
 await sets.save('Current plan',snapshot(300),a);assert.deepEqual(sets.get(b),{id:b,name:'Part-time',...snapshot(200)});
 await sets.rename(b,'Sabbatical');assert.equal(sets.get(b).plan,snapshot(200).plan);
 await sets.remove(a);sets=await createSavedSets(prefs);assert.equal(sets.list().length,1);assert.equal(sets.get(b).name,'Sabbatical');
 await assert.rejects(sets.save(' sabbatical ',snapshot(400)),/already used/);
 await assert.rejects(sets.save('  ',snapshot(400)),/name/);
});
test('failed saves and deletes preserve the last durable library',async()=>{
 const prefs=memory();const sets=await createSavedSets(prefs);const id=await sets.save('Keep',snapshot(100));
 prefs.set=async()=>{throw Error('Storage full');};
 await assert.rejects(sets.save('Keep',snapshot(200),id));assert.equal(sets.get(id).plan,snapshot(100).plan);
 await assert.rejects(sets.remove(id));assert.equal(sets.list().length,1);
});
test('loading replaces current calculator settings atomically and preserves saved copies/theme',async()=>{
 const prefs=memory(),sets=await createSavedSets(prefs),storage=await createNativeStorage(prefs);
 const id=await sets.save('Load this',snapshot(777));storage.setItem('riskfi-theme','dark');await storage.flush();
 const set=sets.get(id);await storage.replaceItems({'riskfi-v1':set.plan,'riskfi-guardrails-v1':set.guardrails,'riskfi-remember':'yes'});
 const reopened=await createNativeStorage(prefs);assert.equal(reopened.getItem('riskfi-v1'),set.plan);assert.equal(reopened.getItem('riskfi-guardrails-v1'),set.guardrails);assert.equal(reopened.getItem('riskfi-theme'),'dark');
 prefs.set=async()=>{throw Error('Storage full');};await assert.rejects(reopened.replaceItems({'riskfi-v1':'bad'}));assert.equal(reopened.getItem('riskfi-v1'),set.plan);
 assert.equal((await createSavedSets(prefs)).list().length,1);
});
