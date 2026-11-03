let backend;
let native = false;
export function configureStorage(storage, isNative = false) { backend = storage; native = isNative; }
const storage = () => backend ?? globalThis.localStorage;
const flush = () => backend?.flush?.();
const consentKey='riskfi-remember';
const dataKeys=['riskfi-v1','riskfi-guardrails-v1','riskfi-theme'];
export function remembers(){try{return storage().getItem(consentKey)==='yes';}catch{return false;}}
export const planStorage={getItem(key){return remembers()?storage().getItem(key):null;},setItem(key,value){if(remembers())storage().setItem(key,value);}};
export function setRemember(value){try{if(value)storage().setItem(consentKey,'yes');else{for(const key of dataKeys)storage().removeItem(key);storage().removeItem(consentKey);}return true;}catch{return false;}}
export function mountStorageControls(){
 const box=document.querySelector('#remember-numbers'),clear=document.querySelector('#clear-saved-data'),status=document.querySelector('#storage-status');
 if(!box)return;
 box.checked=remembers();
 const temporary=native?'Saving is off. Entries remain available until the app reloads.':'Saving is off. Your current entries remain available in this tab.';
 status.textContent=box.checked?'Your numbers are saved on this device.':temporary;
 const failed=()=>{if(native)status.classList.add('storage-error');status.textContent='Could not save or clear your data. Keep this screen open and try again.';};
 box.onchange=async()=>{
  if(!setRemember(box.checked)){box.checked=remembers();failed();return;}
  if(box.checked)window.dispatchEvent(new Event('save-plan-now'));
  try{await flush();status.classList.remove('storage-error');status.textContent=box.checked?'Saved on this device until you clear it.':temporary;}catch{failed();}
 };
 clear.onclick=async()=>{
  if(!setRemember(false)){failed();return;}
  box.checked=false;
  try{await flush();status.classList.remove('storage-error');status.textContent=native?'Saved data cleared. Current entries remain until the app reloads.':'Saved calculator data cleared. Current entries remain in this tab; reload to start fresh.';}catch{failed();}
 };
}
