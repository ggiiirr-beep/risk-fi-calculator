function ask({title,message,label,value='',confirm='Confirm',destructive=false}) {
  return new Promise(resolve=>{
    const previous=document.activeElement,overlay=document.createElement('div');overlay.className='profile-dialog-backdrop';
    overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" aria-describedby="profile-dialog-message" class="profile-dialog"><h2 id="profile-dialog-title"></h2><p id="profile-dialog-message"></p><form><label for="profile-dialog-name"></label><input id="profile-dialog-name" maxlength="60" required><div class="profile-dialog-actions"><button type="button">Cancel</button><button type="submit"></button></div></form></section>';
    overlay.querySelector('h2').textContent=title;overlay.querySelector('p').textContent=message;
    const input=overlay.querySelector('input'),caption=overlay.querySelector('label'),form=overlay.querySelector('form'),cancel=overlay.querySelector('[type=button]'),submit=overlay.querySelector('[type=submit]');
    input.value=value;caption.textContent=label||'';input.hidden=caption.hidden=!label;input.required=!!label;
    submit.textContent=confirm;if(destructive)submit.className='destructive';
    const finish=result=>{overlay.remove();previous?.focus();resolve(result);};
    cancel.onclick=()=>finish(null);form.onsubmit=event=>{event.preventDefault();finish(label?input.value:true);};
    overlay.onkeydown=event=>{
      if(event.key==='Escape'){event.preventDefault();finish(null);}
      if(event.key==='Tab') {const items=label?[input,cancel,submit]:[cancel,submit],index=items.indexOf(document.activeElement);event.preventDefault();items[(index+(event.shiftKey?-1:1)+items.length)%items.length].focus();}
    };
    document.body.append(overlay);(label?input:cancel).focus();
  });
}
export function mountProfiles(profiles,{reload=()=>location.reload(),native=false}={}) {
  const host=document.querySelector('#profile-controls');
  host.innerHTML='<div class="profile-row"><label for="profile-select">Profile</label><select id="profile-select"></select><button type="button" data-profile-action="new">New profile</button><details class="profile-menu"><summary>Manage profiles ▾</summary><div class="profile-menu-items"><button type="button" data-profile-action="rename">Rename this profile</button><button type="button" data-profile-action="reset">Reset this profile</button><button type="button" data-profile-action="delete">Delete this profile</button><button type="button" data-profile-action="all" class="destructive">Delete all profiles and data</button></div></details></div><p id="profile-status" role="status"></p><button type="button" data-profile-action="retry" hidden>Retry saving</button>';
  const select=host.querySelector('select'),status=host.querySelector('[role=status]'),menu=host.querySelector('details');
  function refresh() {
    select.replaceChildren(new Option('Unsaved numbers',''));
    for(const p of profiles.list())select.add(new Option(p.name,p.id));
    select.value=profiles.active()?.id||'';
    select.options[0].disabled=!!profiles.active();
    for(const action of ['rename','reset','delete'])host.querySelector(`[data-profile-action=${action}]`).disabled=!profiles.active();
    status.textContent=profiles.active()?`Changes save automatically ${native?'on this device':'in this browser'}.`:'Create a profile to save your numbers automatically.';
  }
  refresh();let busy=false;
  document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}});
  async function run(operation,restart=true) {
    if(busy)return;busy=true;document.querySelector('main').inert=true;
    try {await operation();if(restart)reload();else refresh();}
    catch(error){select.value=profiles.active()?.id||'';status.textContent=error.message;host.querySelector('[data-profile-action=retry]').hidden=false;}
    finally{document.querySelector('main').inert=false;busy=false;}
  }
  select.onchange=()=>{if(!select.value)return;window.dispatchEvent(new Event('save-plan-now'));run(()=>profiles.select(select.value));};
  host.onclick=async event=>{
    const action=event.target.closest('[data-profile-action]')?.dataset.profileAction;if(!action||busy)return;
    menu.open=false;
    if(action==='retry'){await run(()=>profiles.retry(),false);return;}
    const active=profiles.active();
    if(action==='new'||action==='rename') {
      const name=await ask({title:action==='new'?'New profile':'Rename profile',message:action==='new'?'Start a separate profile using the numbers and settings currently on screen.':'Your numbers and settings will stay the same.',label:'Profile name',value:action==='rename'?active.name:'',confirm:action==='new'?'Create profile':'Rename'});
      if(name===null)return;
      window.dispatchEvent(new Event('save-plan-now'));
      await run(()=>action==='new'?profiles.create(name):profiles.rename(name),action==='new');return;
    }
    const options={
      reset:{title:'Reset this profile?',message:`Restore all numbers and calculator settings in “${active?.name}” to defaults? Its name and your other profiles will stay.`,confirm:'Reset profile'},
      delete:{title:'Delete this profile?',message:`Permanently delete “${active?.name}” and its numbers and settings? Your other profiles will stay. This cannot be undone.`,confirm:'Delete profile'},
      all:{title:'Delete all profiles and data?',message:`Permanently delete every profile, all saved numbers and settings, and your current entries ${native?'in this app':'in this browser'}? This cannot be undone. Nothing on another device or browser will be affected.`,confirm:'Delete everything'},
    };
    if(!options[action])return;
    if(await ask({...options[action],destructive:true})===null)return;
    await run(()=>({reset:()=>profiles.reset(),delete:()=>profiles.deleteCurrent(),all:()=>profiles.deleteAll()})[action]());
  };
}
