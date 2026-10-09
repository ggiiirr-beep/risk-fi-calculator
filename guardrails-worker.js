import {runGuardrailComparison} from './guardrails.js?v=20261008-1';
self.onmessage=e=>{try{const result=runGuardrailComparison(e.data.assumptions,e.data.strategies,{progress:progress=>self.postMessage({progress})});self.postMessage({result});}catch(error){self.postMessage({error:error.message});}};
