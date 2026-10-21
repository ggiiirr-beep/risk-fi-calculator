/** Shared asset ledger. Aggregated legacy fields remain editable summaries. */
export function assetRows(p){return p.assets?.length?p.assets:[{type:'stocks',name:'Market',amount:p.portfolio,rate:p.returnMode==='real'?(1+p.real)*(1+p.inflation)-1:p.nominal},{type:'cash',name:'Cash',amount:p.cash,rate:p.cashNominal}];}
export function assetTotals(rows){
 const group=type=>rows.filter(a=>(a.type==='cash')===type),sum=a=>a.reduce((s,v)=>s+v.amount,0),avg=a=>sum(a)>0?a.reduce((s,v)=>s+v.amount*v.rate,0)/sum(a):(a[0]?.rate??0);
 const investments=group(false),cash=group(true);
 return {portfolio:sum(investments),cash:sum(cash),nominal:avg(investments),cashNominal:avg(cash)};
}
export function validateAssets(rows){for(const a of rows)if(!['stocks','bonds','cash'].includes(a.type)||!Number.isFinite(a.amount)||a.amount<0||!Number.isFinite(a.rate)||a.rate<=-1)throw Error('Each asset needs a nonnegative amount and a return above −100%.');}
export function createLedger(p){
 const rows=assetRows(p).map(a=>({...a}));validateAssets(rows);
 const original=assetTotals(rows);
 for(const isCash of [false,true]){
  const group=rows.filter(a=>(a.type==='cash')===isCash),key=isCash?'cash':'portfolio',total=p[key]??original[key],rate=isCash?p.cashNominal:(p.returnMode==='real'?(1+p.real)*(1+p.inflation)-1:p.nominal),oldRate=isCash?original.cashNominal:original.nominal;
  if(!group.length){rows.push({type:isCash?'cash':'stocks',name:isCash?'Cash':'Market',amount:total,rate});continue;}
  for(const a of group){a.amount=original[key]>0?a.amount*total/original[key]:a===group[0]?total:0;a.rate=(1+a.rate)*(1+rate)/(1+oldRate)-1;}
 }
 return rows;
}
export function ledgerTotal(rows,cash=false){return rows.filter(a=>(a.type==='cash')===cash).reduce((s,a)=>s+a.amount,0);}
export function growLedger(rows,inflation,dt,override){let investmentReturn=0,cashInterest=0;for(const a of rows){const r=a.type!=='cash'&&override!==undefined?override:(1+a.rate)/(1+inflation)-1,gain=a.amount*((1+r)**dt-1);a.amount+=gain;if(a.type==='cash')cashInterest+=gain;else investmentReturn+=gain;}return {investmentReturn,cashInterest};}
export function changeLedger(rows,amount,cash=false){
 const group=rows.filter(a=>(a.type==='cash')===cash),total=ledgerTotal(rows,cash),actual=Math.max(-total,amount);
 if(!group.length){if(actual>0)rows.push({type:cash?'cash':'stocks',name:cash?'Cash':'Market',amount:actual,rate:0});return actual;}
 for(const a of group)a.amount=Math.max(0,a.amount+actual*(total>0?a.amount/total:1/group.length));return actual;
}
export function syncAssets(p){if(p.assets?.length&&[p.portfolio,p.cash,p.nominal,p.cashNominal,p.inflation].every(Number.isFinite)&&p.portfolio>=0&&p.cash>=0){try{p.assets=createLedger(p);}catch{ /* Keep incomplete entries for normal form validation. */ }}return p;}
export function bondShare(p){const rows=assetRows(p),invest=rows.filter(a=>a.type!=='cash'),total=invest.reduce((s,a)=>s+a.amount,0);return total?invest.filter(a=>a.type==='bonds').reduce((s,a)=>s+a.amount,0)/total:0;}
