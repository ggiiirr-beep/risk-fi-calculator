import {Preferences} from '@capacitor/preferences';
import {startCalculator} from '../calculator-start.js';
await startCalculator({
  read:async key=>(await Preferences.get({key})).value,
  write:async(key,value)=>Preferences.set({key,value}),
  async legacy() {
    const current=JSON.parse((await Preferences.get({key:'purpose-fi-local-plan'})).value||'{}');
    const copies=JSON.parse((await Preferences.get({key:'purpose-fi-saved-sets'})).value||'[]');
    if(!current||typeof current!=='object'||!Array.isArray(copies)||copies.some(p=>typeof p.name!=='string'||typeof p.plan!=='string'||typeof p.guardrails!=='string'))throw Error('Existing saved numbers could not be read.');
    return {current,copies};
  },
  async clearLegacy() {
    await Preferences.remove({key:'purpose-fi-local-plan'});
    await Preferences.remove({key:'purpose-fi-saved-sets'});
  },
},{native:true});
