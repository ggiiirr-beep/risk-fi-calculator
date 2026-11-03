import {Preferences} from '@capacitor/preferences';
import {configureStorage} from '../privacy-storage.js?v=20261102-privacy';
import {createNativeStorage} from './storage.js';
function storageError() {
  const status = document.querySelector('#storage-status');
  if (status) { status.classList.add('storage-error'); status.textContent = 'Could not save your changes. Keep the app open and try again.'; }
}
try {
  const storage = await createNativeStorage(Preferences, storageError);
  configureStorage(storage, true);
  await import('../app.js');
  await import('../tool-icons.js');
  document.querySelector('.local-badge').textContent = 'Only on this device';
  document.documentElement.dataset.appReady = 'true';
} catch (error) {
  console.error('Purpose Fi could not open', error);
  const main = document.querySelector('main');
  main.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = 'Your calculator could not open';
  const message = document.createElement('p');
  message.textContent = 'Your saved data has not been changed. Close and reopen the app, or try again.';
  const retry = document.createElement('button');
  retry.textContent = 'Try again';
  retry.onclick = () => location.reload();
  main.append(heading, message, retry);
}
