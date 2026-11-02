import {readFile,writeFile,mkdir} from 'node:fs/promises';
const shell=await readFile('calculator.html','utf8');
const paths=['','your-numbers','risk-fi','gap-fi','ramp-fi','coast-fi','traditional-fi','compare-paths','help','risk-based-guardrails',...['risk-fi','gap-fi','ramp-fi','coast-fi','traditional-fi'].map(p=>p+'/compare')];
for(const slug of paths){
 const dir='purpose-fi'+(slug?'/'+slug:'');
 const base='../'.repeat(dir.split('/').length);
 let html=shell.replace('<base href="./">','<base href="'+base+'">');
 if(slug==='risk-based-guardrails')html=html.replace('<head>','<head><meta name="robots" content="noindex, nofollow">');
 await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);
}
