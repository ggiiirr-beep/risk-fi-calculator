import './scripts/generate-routes.mjs';
import {spawnSync} from 'node:child_process';
const refresh=spawnSync('python3',['scripts/refresh-episodes.py'],{stdio:'inherit',timeout:20000});
if(refresh.error)console.warn('Using existing episode snapshot:',refresh.error.message);
import {mkdir,cp,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const file of ['purpose-fi','privacy.html','terms.html','legal.css','privacy-storage.js','ramp-fi.js','period-flows.js','guardrail-paths.js','CNAME','site-header.css','assets','episodes.json','home.js','home.css','site-shell.css','tool-icons.js','calculator.html','path-comparison.js','scenario-comparison.js','plan-visuals.js','plan-assets.js','future-changes.js','coast-fi.js','bond-history.js','simulation-method.html','traditional-fi.js','gap-fi.js','index.html','app.js','plan-transfer.js','plan-settings.js','withdrawal-scenarios.js','guardrails.js','guardrails-ui.js','guardrails-worker.js','guardrail-history.js','number-inputs.js','finance.js','styles.css','risk-worker.js','favicon.svg'])await cp(file,`dist/${file}`,{recursive:true});await writeFile('dist/.nojekyll','');console.log('Static site built in dist/');
