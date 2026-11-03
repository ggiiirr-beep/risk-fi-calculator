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

// Shared policy content retains calculator identity when opened from its tools.
const calculatorHeader=shell.match(/<header\b[\s\S]*?<\/header>/)[0];
for(const [slug,source] of [['privacy','privacy.html'],['terms','terms.html'],['simulation-method','simulation-method.html']]){
 let html=await readFile(source,'utf8');
 html=html.replace('<head>','<head><base href="../../">');
 html=html.replace(/<title>([\s\S]*?)<\/title>/,(_,title)=>'<title>'+title.replace(/: From Paychecks to Purpose|: Risk FI/,'')+' — Purpose Fi Calculator</title>');
 if(html.includes('<header'))html=html.replace(/<header\b[\s\S]*?<\/header>/,calculatorHeader);
 else html=html.replace(/<body([^>]*)>/,'<body$1>'+calculatorHeader).replace('</head>','<link rel="stylesheet" href="./site-header.css?v=20261102-phone-nav"></head>');
 for(const [from,to] of [['privacy.html','purpose-fi/privacy/'],['terms.html','purpose-fi/terms/'],['simulation-method.html','purpose-fi/simulation-method/']])html=html.replaceAll('./'+from,'./'+to);
 const dir='purpose-fi/'+slug;await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);
}
