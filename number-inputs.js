// Keep decimal places and incomplete decimals while grouping whole dollars.
export function formatAmount(value){
 const raw=String(value??'').replace(/,/g,'');
 if(!/^-?\d*(\.\d*)?$/.test(raw))return raw;
 const [whole,fraction]=raw.split('.');
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction===undefined?'':'.'+fraction);
}
export function readNumber(value){
 const raw=String(value).replace(/,/g,'').trim();
 return raw===''?null:Number(raw);
}
export function formatAmountInput(input){
 const before=input.value,caret=input.selectionStart??before.length;
 const count=before.slice(0,caret).replace(/,/g,'').length;
 const formatted=formatAmount(before);
 if(formatted===before)return;
 input.value=formatted;
 let position=0,seen=0;
 while(position<formatted.length&&seen<count){if(formatted[position]!==',')seen++;position++;}
 input.setSelectionRange(position,position);
}
