const key = 'purpose-fi-saved-sets';
export async function createSavedSets(preferences) {
  const {value} = await preferences.get({key});
  let sets = value === null ? [] : JSON.parse(value);
  if (!Array.isArray(sets) || sets.some(s => typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.plan !== 'string' || typeof s.guardrails !== 'string')) throw Error('Saved sets could not be read.');
  const name = value => {
    const text = value.trim();
    if (!text || text.length > 60) throw Error('Enter a name between 1 and 60 characters.');
    return text;
  };
  async function commit(next) {
    await preferences.set({key, value:JSON.stringify(next)});
    sets = next;
  }
  function find(id) {
    const set = sets.find(s => s.id === id);
    if (!set) throw Error('Choose a saved set first.');
    return set;
  }
  return {
    list: () => sets.map(s => ({...s})),
    get: id => ({...find(id)}),
    async save(label, snapshot, id) {
      if (id) find(id);
      const item = {id:id || crypto.randomUUID(),name:name(label),...snapshot};
      if (sets.some(s => s.id !== item.id && s.name.toLocaleLowerCase() === item.name.toLocaleLowerCase())) throw Error('That name is already used. Choose another name.');
      await commit(id ? sets.map(s => s.id === id ? item : s) : [...sets,item]);
      return item.id;
    },
    async rename(id,label) { const item=find(id); return this.save(label,{plan:item.plan,guardrails:item.guardrails},id); },
    async remove(id) { find(id); await commit(sets.filter(s => s.id !== id)); },
  };
}

export async function mountSavedSets({preferences,storage,capture,reload=()=>location.reload()}) {
  const host=document.createElement('details');host.className='saved-sets panel';
  host.innerHTML='<summary>Saved sets of numbers</summary><div class="saved-sets-content"><p>Keep named copies of your numbers and calculator settings on this device. Changes do not update a saved copy until you choose Update selected. Saved copies stay here even when Remember Numbers is off. Loading a copy turns it on.</p><label for="saved-set-name">Name</label><input id="saved-set-name" maxlength="60" placeholder="For example, Work part-time"><button type="button" data-action="save">Save new copy</button><label for="saved-set-list">Saved copies</label><select id="saved-set-list"><option value="">Choose a saved set</option></select><div class="saved-set-actions"><button type="button" data-action="load">Load selected</button><button type="button" data-action="update">Update selected</button><button type="button" data-action="rename">Rename selected</button><button type="button" data-action="delete">Delete selected</button></div><p role="status" class="saved-set-status"></p></div>';
  document.querySelector('.page-heading').after(host);
  const status=host.querySelector('[role=status]'),input=host.querySelector('input'),select=host.querySelector('select');
  let library;
  function refresh(id=select.value) {
    select.replaceChildren(new Option('Choose a saved set',''));
    for(const set of library.list())select.add(new Option(set.name,set.id));
    select.value=id;
    for(const b of host.querySelectorAll('button'))b.disabled=b.dataset.action!=='save'&&!select.value;
  }
  try {library=await createSavedSets(preferences);refresh();}
  catch {status.textContent='Saved copies could not be opened. Your data has not been changed. Reopen the app to try again.';for(const el of host.querySelectorAll('button,input,select'))el.disabled=true;return;}
  select.onchange=()=>{if(select.value)input.value=library.get(select.value).name;refresh();};
  let busy=false;
  host.addEventListener('click',async event=>{
    const action=event.target.closest('button')?.dataset.action;if(!action||busy)return;
    const id=select.value;
    if(['load','update','delete'].includes(action)) {
      const message={load:'Replace the numbers currently on screen with this saved copy? Save a new copy first if you want to keep your current numbers.',update:'Replace the selected saved copy with your current numbers and settings?',delete:'Delete this saved copy from this device? Your current numbers will stay on screen.'}[action];
      if(!window.confirm(message))return;
    }
    busy=true;for(const el of host.querySelectorAll('button,input,select'))el.disabled=true;
    status.textContent='Saving…';
    try {
      if(action==='save') {const id=await library.save(input.value,capture());refresh(id);status.textContent='Saved a new copy on this device.';}
      if(action==='update') {await library.save(library.get(id).name,capture(),id);status.textContent='Saved copy updated.';}
      if(action==='rename') {await library.rename(id,input.value);status.textContent='Saved copy renamed.';}
      if(action==='delete') {await library.remove(id);select.value='';status.textContent='Saved copy deleted. Your current numbers are unchanged.';}
      if(action==='load') {
        const set=library.get(id);
        document.querySelector('main').inert=true;
        await storage.replaceItems({'riskfi-v1':set.plan,'riskfi-guardrails-v1':set.guardrails,'riskfi-remember':'yes'});
        reload();return;
      }
    } catch(error) {status.textContent=error.message || 'Could not save the change. Try again.';}
    finally {document.querySelector('main').inert=false;busy=false;for(const el of host.querySelectorAll('input,select'))el.disabled=false;refresh();}
  });
}
