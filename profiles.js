// One atomic record owns profiles, their selected identity, and device preferences.
export const profilesKey = 'purpose-fi-profiles';
const planKeys = ['riskfi-v1','riskfi-guardrails-v1'];
const clone = value => JSON.parse(JSON.stringify(value));
const empty = () => ({version:1,active:null,profiles:[],theme:null});
export async function createProfiles(io, onStatus = () => {}) {
  let raw = await io.read(profilesKey), state;
  const uniqueName = (value, items, id) => {
    const name = value.trim();
    if (!name || name.length > 60) throw Error('Use a name between 1 and 60 characters.');
    if (items.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) throw Error('That profile name is already used.');
    return name;
  };
  if (raw !== null) {
    state=JSON.parse(raw);
    if (state.version!==1 || !Array.isArray(state.profiles) || state.profiles.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||!p.data||typeof p.data!=='object') || (state.active!==null&&!state.profiles.some(p=>p.id===state.active))) throw Error('Your saved profiles could not be read. They have not been changed.');
  } else {
    state=empty();
    const legacy=await io.legacy();
    for(const copy of legacy.copies || []) {
      let name=copy.name, suffix=2;
      while(state.profiles.some(p=>p.name.toLowerCase()===name.toLowerCase()))name=`${copy.name} (${suffix++})`;
      state.profiles.push({id:crypto.randomUUID(),name,data:{'riskfi-v1':copy.plan,'riskfi-guardrails-v1':copy.guardrails}});
    }
    state.theme=legacy.current['riskfi-theme'] || null;
    if (legacy.current['riskfi-remember']==='yes') {
      let name='My profile',suffix=2;
      while(state.profiles.some(p=>p.name===name))name=`My profile (${suffix++})`;
      const id=crypto.randomUUID();
      state.profiles.unshift({id,name,data:Object.fromEntries(planKeys.filter(k=>legacy.current[k]!=null).map(k=>[k,legacy.current[k]]))});
      state.active=id;
    }
    // Commit before cleanup; an empty record also prevents deleted legacy data returning.
    const next=JSON.stringify(state);await io.write(profilesKey,next,null);raw=next;
  }
  await io.clearLegacy();
  let draft={},pending=Promise.resolve(),revision=0;
  const current=()=>state.profiles.find(p=>p.id===state.active);
  function queue(snapshot) {
    const seq=++revision;
    onStatus('saving');
    pending=pending.catch(()=>{}).then(async()=>{
      const next=JSON.stringify(snapshot);
      await io.write(profilesKey,next,raw);raw=next;
      if(seq===revision)onStatus('saved');
    });
    pending.catch(()=>onStatus('error'));
    return pending;
  }
  async function change(edit) {
    // Never switch away from a profile whose last autosave failed.
    await pending;
    const next=clone(state);edit(next);
    await queue(next);state=next;draft={};
  }
  return {
    list:()=>state.profiles.map(({id,name})=>({id,name})),
    active:()=>current()?{id:current().id,name:current().name}:null,
    getItem(key) {return key==='riskfi-theme'?state.theme:(current()?.data || draft)[key]??null;},
    setItem(key,value) {
      if (key==='riskfi-theme') {state.theme=String(value);queue(clone(state));return;}
      if (!planKeys.includes(key))throw Error('Unknown profile value');
      (current()?.data || draft)[key]=String(value);
      if(current())queue(clone(state));
    },
    flush:()=>pending,
    retry:()=>queue(clone(state)),
    async create(name) {
      const data=clone(current()?.data || draft),id=crypto.randomUUID();
      await change(next=>{next.profiles.push({id,name:uniqueName(name,next.profiles),data});next.active=id;});
    },
    async select(id) {await change(next=>{if(!next.profiles.some(p=>p.id===id))throw Error('Profile no longer exists.');next.active=id;});},
    async rename(name) {await change(next=>{const p=next.profiles.find(p=>p.id===next.active);if(!p)throw Error('Choose a profile first.');p.name=uniqueName(name,next.profiles,p.id);});},
    async reset() {await change(next=>{const p=next.profiles.find(p=>p.id===next.active);if(!p)throw Error('Choose a profile first.');p.data={};});},
    async deleteCurrent() {await change(next=>{next.profiles=next.profiles.filter(p=>p.id!==next.active);next.active=next.profiles[0]?.id??null;});},
    async deleteAll() {await change(next=>Object.assign(next,empty()));},
  };
}

export function browserProfileIO(storage) {
  return {
    read:async key=>storage.getItem(key),
    async write(key,value,expected) {
      const save=()=>{if(storage.getItem(key)!==expected)throw Error('Profiles changed in another tab. Reopen this page before editing.');storage.setItem(key,value);};
      if(typeof window!=='undefined' && globalThis.navigator?.locks)await navigator.locks.request('purpose-fi-profiles',save);else save();
    },
    async legacy() {return {current:Object.fromEntries(['riskfi-remember',...planKeys,'riskfi-theme'].map(k=>[k,storage.getItem(k)])),copies:[]};},
    async clearLegacy() {for(const key of ['riskfi-remember',...planKeys,'riskfi-theme'])storage.removeItem(key);},
  };
}
