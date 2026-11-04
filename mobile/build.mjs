import {cp, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const out = 'mobile-dist';
await rm(out, {recursive:true, force:true});
await mkdir(out, {recursive:true});
// Include shared runtime modules and styles, never tests or the podcast build.
for (const file of await readdir('.')) {
  if ((file.endsWith('.js') && !file.endsWith('.test.js')) || file.endsWith('.css') || ['favicon.svg','calculator.html','privacy.html','terms.html','simulation-method.html'].includes(file)) {
    await cp(file, `${out}/${file}`);
  }
}
await mkdir(`${out}/assets`, {recursive:true});
for (const file of ['fonts','purpose-fi-sun-compass.png','tool-icons.svg']) await cp(`assets/${file}`, `${out}/assets/${file}`, {recursive:true});
await cp('mobile/mobile.css', `${out}/mobile.css`);
execFileSync(process.execPath, ['scripts/generate-routes.mjs', out]);
await build({entryPoints:['mobile/main.js'], outfile:`${out}/mobile.js`, bundle:true, format:'esm', target:'safari15', sourcemap:false});
const header = (await readFile("calculator.html", "utf8")).match(/<header\b[\s\S]*?<\/header>/)[0];
async function adapt(dir) {
  for (const item of await readdir(dir, {withFileTypes:true})) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) { await adapt(path); continue; }
    if (!item.name.endsWith('.html')) continue;
    let html = await readFile(path, 'utf8');
    html = html.replace(/<header\b[\s\S]*?<\/header>/, header);
    html = html.replace('</head>', '<link rel="stylesheet" href="./mobile.css"></head>');
    html = html.replace(/<nav aria-label="Website">[\s\S]*?<\/nav>/, '');
    html = html.replace(/<script type="module" src="\.\/calculator-entry.js[^\"]*"><\/script>/, '<script type="module" src="./mobile.js"></script>');
    html = html.replace(/<script type="module" src="\.\/tool-icons.js[^\"]*"><\/script>/, '');
    html = html.replace('Saving is optional. Without it, entries stay in this tab and are lost on reload.', 'Remember your numbers on this device. No account or syncing.');
    if (path.endsWith('/purpose-fi/privacy/index.html') || path===`${out}/privacy.html`) {
      html = html.replace(/<main[\s\S]*?<\/main>/, await readFile('mobile/privacy.html', 'utf8'));
    }
    await writeFile(path, html);
  }
}
await adapt(out);
await cp(`${out}/calculator.html`, `${out}/index.html`);
console.log('Purpose Fi mobile bundle built from shared calculator source.');
