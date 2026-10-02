import {monteCarlo} from './finance.js';
self.onmessage=e=>{try{self.postMessage(monteCarlo(e.data.plan,e.data.options));}catch(err){self.postMessage({error:err.message});}};
