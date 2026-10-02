import {mkdir,cp,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const file of ['index.html','app.js','finance.js','styles.css','risk-worker.js','favicon.svg'])await cp(file,`dist/${file}`,{recursive:true});await writeFile('dist/.nojekyll','');console.log('Static site built in dist/');
