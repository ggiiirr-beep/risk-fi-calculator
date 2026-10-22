const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const number=v=>Number(v.toFixed(2)).toLocaleString('en-US');
const when=(p,y)=>p.timeEntry==='age'?'Age '+number(p.age+y):'Year '+number(y);
export function planTimeline(p,phases,end,arrival){
 end=Math.max(0,end);let cursor=0;
 const spans=phases.map(phase=>{const start=cursor;cursor=Math.min(end,cursor+(phase.years??end));return {...phase,start,end:cursor};}).filter(x=>x.end>x.start);
 const events=(p.futureChanges||[]).filter(e=>e.enabled!==false&&e.start<=end).map(e=>({year:e.start,label:e.name?.trim()||({income:'Income starts',add:'One-time addition',expense:'One-time expense'}[e.kind])}));
 for(const e of p.futureChanges||[])if(e.enabled!==false&&e.kind==='income'&&e.end!=null&&e.end<=end)events.push({year:e.end,label:(e.name?.trim()||'Income')+' ends'});
 if(arrival!=null&&arrival<=end)events.push({year:arrival,label:'FI first reached'});events.sort((a,b)=>a.year-b.year);
 return `<section class="panel content-panel"><h2>Your plan timeline</h2><div class="plan-timeline">${spans.map(s=>`<div class="timeline-phase ${esc(s.action)}" style="flex:${s.end-s.start}"><strong>${esc(s.label)}</strong><span>${when(p,s.start)}–${when(p,s.end)}</span></div>`).join('')||'<p>Your projection starts at the FI target.</p>'}</div>${events.length?`<ul class="timeline-events">${events.map(e=>`<li><strong>${when(p,e.year)}</strong> ${esc(e.label)}</li>`).join('')}</ul>`:''}<p class="chart-caption">${arrival==null?'FI is not reached within this projection.':'FI first reached at '+when(p,arrival)+'.'} Event amounts follow your inflation settings.</p></section>`;
}
export function fundingParts(row){
 const requested=row.requested??row.spending??0,income=row.income??0,expense=row.expense??0;
 const paid=row.withdrawals??((row.investmentWithdrawal||0)+(row.cashWithdrawal||0));
 const incomeUsed=row.incomeUsed??Math.min(requested,income),surplus=row.surplus??Math.max(0,income-requested),unfunded=row.unfunded??Math.max(0,requested-incomeUsed+expense-paid);
 return {portfolio:paid,income:incomeUsed,surplus,unfunded,expense,requested};
}
export function fundingChart(p,rows,nominal=false){
 const data=rows.filter(r=>r.year>0).map(r=>{const f=nominal?(1+p.inflation)**r.year:1,parts=fundingParts(r);const values=Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,v*f]));if(nominal&&r.nominalIncomeUsed!=null){Object.assign(values,{portfolio:r.nominalWithdrawals,income:r.nominalIncomeUsed,surplus:r.nominalSurplus,requested:r.nominalRequested,expense:r.nominalExpense});values.unfunded=Math.max(0,values.requested-values.income+values.expense-values.portfolio);}return {year:r.year,...values};});
 if(!data.length||!data.some(r=>r.portfolio+r.income+r.surplus+r.unfunded>0))return '';
 const max=Math.max(1,...data.map(r=>r.portfolio+r.income+r.unfunded),...data.map(r=>r.surplus));
 return `<section class="panel content-panel"><h2>Where your money comes from</h2><p>Portfolio withdrawals and income used toward your planned amount. Surplus income goes to cash.</p><div class="funding-legend"><span class="portfolio">Portfolio withdrawals</span><span class="income">Income used</span><span class="surplus">Surplus to cash</span><span class="unfunded">Unfunded</span></div><div class="funding-scroll" tabindex="0" aria-label="Funding by period; scroll horizontally for later years"><div class="funding-columns">${data.map(r=>{const description=`${when(p,r.year)}: portfolio ${money(r.portfolio)}, income used ${money(r.income)}, surplus to cash ${money(r.surplus)}, unfunded ${money(r.unfunded)}`;return `<div class="funding-column" tabindex="0" aria-label="${esc(description)}"><div class="funding-bars" title="${esc(description)}"><div class="funding-stack">${['portfolio','income','unfunded'].map(k=>`<span class="${k}" style="height:${r[k]/max*150}px"></span>`).join('')}</div><span class="surplus surplus-bar" style="height:${r.surplus/max*150}px"></span></div><span>${when(p,r.year)}</span><div class="funding-tip">${esc(description)}</div></div>`;}).join('')}</div></div><p class="chart-caption">${nominal?'Future dollars when paid':'Today’s dollars'} · totals per displayed period; partial years are prorated. One-time expenses are included in portfolio withdrawals. Regular contributions and one-time additions are separate from income.</p></section>`;
}
