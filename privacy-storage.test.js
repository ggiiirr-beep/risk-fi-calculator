import test from 'node:test';
import assert from 'node:assert/strict';
import {planStorage,remembers,setRemember} from './privacy-storage.js';
test('saving requires opt-in and clearing is scoped to calculator data',()=>{
 const data=new Map([['unrelated','keep'],['riskfi-v1','old plan']]);
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 assert.equal(remembers(),false);
 assert.equal(planStorage.getItem('riskfi-v1'),null);
 planStorage.setItem('riskfi-theme','dark');assert.equal(data.has('riskfi-theme'),false);
 assert.equal(setRemember(true),true);
 planStorage.setItem('riskfi-v1','new plan');assert.equal(planStorage.getItem('riskfi-v1'),'new plan');
 planStorage.setItem('riskfi-guardrails-v1','guardrails');
 assert.equal(setRemember(false),true);
 assert.deepEqual([...data],[['unrelated','keep']]);
});
test('unavailable storage does not enable saving',()=>{
 globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 assert.equal(remembers(),false);assert.equal(setRemember(true),false);assert.equal(planStorage.getItem('riskfi-v1'),null);
});
