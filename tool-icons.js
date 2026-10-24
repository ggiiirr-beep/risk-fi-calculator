const colours={numbers:'#66717d',plan:'#7139ad',gap:'#a95218',coast:'#087d81',traditional:'#215db2',paths:'#52647d',guardrails:'#987000'};
for(const button of document.querySelectorAll('[data-tab]')){const key=button.dataset.tab;if(!colours[key])continue;button.style.setProperty('--tool-accent',colours[key]);const icon=document.createElement('span');icon.className='tool-icon';icon.innerHTML=`<svg aria-hidden="true" viewBox="0 0 32 32"><use href="./assets/tool-icons.svg#${key}"/></svg>`;button.prepend(icon);}
document.body.dataset.tool='numbers';
