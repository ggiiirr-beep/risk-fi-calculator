import {createProfiles} from './profiles.js';
import {mountProfiles} from './profile-ui.js';
import {configureStorage} from './privacy-storage.js?v=20261103-profiles';
export async function startCalculator(io,{native=false}={}) {
  try {
    const profiles=await createProfiles(io,state=>{
      const status=document.querySelector('#profile-status'),retry=document.querySelector('[data-profile-action=retry]');
      if(status)status.textContent=state==='error'?'Could not save your changes. Keep this page open and retry.':state==='saving'?'Saving…':'Saved automatically.';
      if(retry)retry.hidden=state!=='error';
    });
    configureStorage(profiles);
    await import('./app.js?v=20261103-profiles');
    mountProfiles(profiles,{native});
    await import('./tool-icons.js?v=20261102-unlisted');
    document.documentElement.dataset.appReady='true';
  } catch(error) {
    const main=document.querySelector('main');main.replaceChildren();
    const title=document.createElement('h1');title.textContent='Your calculator could not open';
    const message=document.createElement('p');message.textContent='Your saved data has not been overwritten. '+error.message;
    const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>location.reload();main.append(title,message,retry);
  }
}
