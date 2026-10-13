import {runGuardrailComparison,runCurrentGuardrailCheck} from './guardrails.js?v=20261013-3';
self.onmessage=e=>{try{const result=(e.data.mode==='check'?runCurrentGuardrailCheck:runGuardrailComparison)(e.data.assumptions,e.data.strategies,{progress:progress=>self.postMessage({progress})});self.postMessage({result});}catch(error){self.postMessage({error:error.message});}};
