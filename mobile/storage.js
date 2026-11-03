// One native preference contains the complete small plan snapshot. This keeps
// save/clear operations ordered and avoids partial snapshots across app exits.
export async function createNativeStorage(preferences, onError = () => {}) {
  const key = 'purpose-fi-local-plan';
  const {value} = await preferences.get({key});
  const data = value === null ? {} : JSON.parse(value);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Invalid saved plan');
  let pending = Promise.resolve();
  function save() {
    const value = JSON.stringify(data);
    pending = pending.catch(() => {}).then(() => preferences.set({key, value}));
    pending.catch(onError);
  }
  return {
    getItem: key => data[key] ?? null,
    setItem(key, value) { data[key] = String(value); save(); },
    removeItem(key) { delete data[key]; save(); },
    flush: () => pending,
  };
}
