import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfiles,browserProfileIO,profilesKey} from './profiles.js';
function memory(legacy={current:{},copies:[]}) {
 const data=new Map();let fail=false;
 return {data,setFail:value=>{fail=value;},read:async k=>data.get(k)??null,
  write:async(k,v,expected)=>{if(fail)throw Error('Storage full');assert.equal(data.get(k)??null,expected);data.set(k,v);},
  legacy:async()=>structuredClone(legacy),clearLegacy:async()=>{legacy={current:{},copies:[]};}};
}
test('profiles autosave independently, select and reopen without a manual update',async()=>{
 const io=memory(),p=await createProfiles(io);
 p.setItem('riskfi-v1','first');await p.create('Current');const first=p.active().id;
 p.setItem('riskfi-guardrails-v1','rules A');await p.create('Part time');const second=p.active().id;
 p.setItem('riskfi-v1','second');p.setItem('riskfi-guardrails-v1','rules B');await p.flush();
 let reopened=await createProfiles(io);assert.equal(reopened.active().id,second);assert.equal(reopened.getItem('riskfi-v1'),'second');
 await reopened.select(first);assert.equal(reopened.getItem('riskfi-v1'),'first');assert.equal(reopened.getItem('riskfi-guardrails-v1'),'rules A');
 await reopened.rename('Original');assert.equal(reopened.active().name,'Original');
 await assert.rejects(reopened.create('part TIME'),/already used/);await assert.rejects(reopened.rename(' '),/name/);
});
test('reset keeps name and other profiles; delete removes one; delete all leaves no numbers/theme',async()=>{
 const io=memory(),p=await createProfiles(io);p.setItem('riskfi-v1','one');await p.rename('One');const one=p.active().id;
 await p.create('Two');p.setItem('riskfi-v1','two');p.setItem('riskfi-theme','dark');await p.flush();
 await p.reset();assert.equal(p.active().name,'Two');assert.equal(p.getItem('riskfi-v1'),null);assert.equal(p.getItem('riskfi-theme'),'dark');
 await p.select(one);assert.equal(p.getItem('riskfi-v1'),'one');await p.deleteCurrent();assert.equal(p.active().name,'Two');assert.equal(p.list().length,1);
 await p.deleteAll();const reopened=await createProfiles(io);assert.equal(reopened.active().name,'Profile 1');assert.equal(reopened.list().length,1);assert.equal(reopened.getItem('riskfi-theme'),null);assert.equal(reopened.getItem('riskfi-v1'),null);
});
test('migration preserves current remembered work and every legacy saved copy, only once',async()=>{
 const io=memory({current:{'riskfi-remember':'yes','riskfi-v1':'working','riskfi-theme':'dark'},copies:[{name:'My profile',plan:'copy',guardrails:'rules'}]});
 const p=await createProfiles(io);assert.equal(p.list().length,2);assert.equal(p.getItem('riskfi-v1'),'working');assert.equal(p.active().name,'My profile (2)');
 await p.select(p.list()[1].id);assert.equal(p.getItem('riskfi-v1'),'copy');assert.equal(p.getItem('riskfi-guardrails-v1'),'rules');
 await p.deleteAll();assert.equal((await createProfiles(io)).active().name,'Profile 1');
});
test('migration cannot clear old data if the new record fails to save',async()=>{
 const io=memory();let cleaned=false;io.clearLegacy=async()=>{cleaned=true;};io.setFail(true);
 await assert.rejects(createProfiles(io));assert.equal(cleaned,false);
});
test('failed autosave blocks switching until retry succeeds; failed reset preserves state',async()=>{
 const io=memory(),p=await createProfiles(io);p.setItem('riskfi-v1','old');await p.create('A');const a=p.active().id;await p.create('B');
 io.setFail(true);p.setItem('riskfi-v1','new');await assert.rejects(p.flush());await assert.rejects(p.select(a));assert.equal(p.active().name,'B');
 io.setFail(false);await p.retry();await p.select(a);assert.equal(p.getItem('riskfi-v1'),'old');
 io.setFail(true);await assert.rejects(p.reset());assert.equal(p.getItem('riskfi-v1'),'old');
});
test('default Profile 1 saves immediately and rapid edits survive reopening',async()=>{
 const io=memory(),p=await createProfiles(io);assert.equal(p.active().name,'Profile 1');p.setItem('riskfi-v1','initial');await p.flush();assert.equal((await createProfiles(io)).getItem('riskfi-v1'),'initial');
 await p.create('A');for(let i=0;i<20;i++)p.setItem('riskfi-v1',String(i));await p.flush();assert.equal((await createProfiles(io)).getItem('riskfi-v1'),'19');
});
test('browser migration and deletion only touch calculator data; stale tabs cannot overwrite',async()=>{
 const data=new Map([['unrelated','keep'],['riskfi-remember','yes'],['riskfi-v1','old']]);
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const a=await createProfiles(browserProfileIO(storage)),b=await createProfiles(browserProfileIO(storage));
 a.setItem('riskfi-v1','new');await a.flush();b.setItem('riskfi-v1','stale');await assert.rejects(b.flush(),/another tab/);
 await a.deleteAll();assert.equal(data.get('unrelated'),'keep');assert.equal(data.has('riskfi-v1'),false);
});

test('empty previous records receive Profile 1; deleting last profile creates fresh defaults',async()=>{
 const io=memory();io.data.set(profilesKey,JSON.stringify({version:1,active:null,profiles:[],theme:'dark'}));
 const p=await createProfiles(io);assert.equal(p.active().name,'Profile 1');assert.equal(p.getItem('riskfi-theme'),'dark');
 p.setItem('riskfi-v1','old');await p.flush();const id=p.active().id;await p.deleteCurrent();
 assert.equal(p.active().name,'Profile 1');assert.notEqual(p.active().id,id);assert.equal(p.getItem('riskfi-v1'),null);
});
