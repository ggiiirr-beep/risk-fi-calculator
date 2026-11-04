// The shared calculator uses the active profile selected during startup.
let backend;
export function configureStorage(storage) { backend=storage; }
export const planStorage={
  getItem:key=>backend.getItem(key),
  setItem:(key,value)=>backend.setItem(key,value),
};
