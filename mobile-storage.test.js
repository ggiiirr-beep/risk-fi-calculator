import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeStorage} from './mobile/storage.js';
test('native plan survives reopening and clear operations cannot be overtaken by earlier writes', async () => {
 let saved=null;
 const preferences={get:async()=>({value:saved}),set:async({value})=>{await new Promise(r=>setTimeout(r,2));saved=value;}};
 const storage=await createNativeStorage(preferences);
 storage.setItem('riskfi-remember','yes');storage.setItem('riskfi-v1','plan A');storage.setItem('riskfi-v1','plan B');
 await storage.flush();
 assert.equal((await createNativeStorage(preferences)).getItem('riskfi-v1'),'plan B');
 storage.removeItem('riskfi-v1');storage.removeItem('riskfi-remember');
 await storage.flush();
 assert.equal((await createNativeStorage(preferences)).getItem('riskfi-v1'),null);
});
test('native storage fails visibly on load/save errors and can retry a save', async()=>{
 await assert.rejects(createNativeStorage({get:async()=>({value:'broken JSON'})}));
 let fail=true,errors=0,saved;
 const storage=await createNativeStorage({get:async()=>({value:null}),set:async({value})=>{if(fail)throw Error('full');saved=value;}},()=>errors++);
 storage.setItem('riskfi-v1','plan');await assert.rejects(storage.flush());assert.equal(errors,1);
 fail=false;storage.setItem('riskfi-v1','retry');await storage.flush();assert.equal(JSON.parse(saved)['riskfi-v1'],'retry');
});
test('shared calculator storage uses native persistence and keeps saving optional', async()=>{
 const {configureStorage,planStorage,setRemember,remembers}=await import('./privacy-storage.js');
 let saved=null;
 const preferences={get:async()=>({value:saved}),set:async({value})=>{saved=value;}};
 const storage=await createNativeStorage(preferences);configureStorage(storage,true);
 assert.equal(remembers(),false);
 planStorage.setItem('riskfi-v1','not saved');await storage.flush();assert.equal(saved,null);
 setRemember(true);planStorage.setItem('riskfi-v1','native plan');await storage.flush();
 const reopened=await createNativeStorage(preferences);configureStorage(reopened,true);
 assert.equal(remembers(),true);assert.equal(planStorage.getItem('riskfi-v1'),'native plan');
 setRemember(false);await reopened.flush();
 assert.equal((await createNativeStorage(preferences)).getItem('riskfi-v1'),null);
 configureStorage(undefined,false);
});
