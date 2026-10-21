export function validateChanges(changes=[]){for(const e of changes){if(e.enabled===false)continue;if(!['income','add','expense'].includes(e.kind)||!Number.isFinite(e.amount)||e.amount<0||!Number.isFinite(e.start)||e.start<0||e.start>100||e.kind==='income'&&e.end!=null&&(!Number.isFinite(e.end)||e.end<=e.start||e.end>100))throw Error('Check future-change amounts, start years and end years.');}}
/** Flows expressed in the plan's starting purchasing power; event at zero occurs immediately. */
export function futureFlows(changes=[],start,end,inflation=0,price=null){
 let income=0,addition=0,expense=0;
 for(const e of changes){
  if(e.enabled===false)continue;
  if(e.kind==='income'){
   const lo=Math.max(start,e.start),hi=Math.min(end,e.end??Infinity);
   if(hi>lo){const factor=e.adjust!==false?1:price??(1+inflation)**((lo+hi)/2);income+=e.amount*(hi-lo)/factor;}
  }else if((e.start>start&&e.start<=end)||(start===0&&end===0&&e.start===0)){
   const value=e.amount/(e.adjust!==false?1:price??(1+inflation)**e.start);if(e.kind==='add')addition+=value;else expense+=value;
  }
 }
 return {income,addition,expense};
}
export function changeBoundaries(changes=[],start,end){return changes.flatMap(e=>[e.start,e.end]).filter(x=>Number.isFinite(x)&&x>start+1e-9&&x<end-1e-9);}
