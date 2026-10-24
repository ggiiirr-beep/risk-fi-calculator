import {monteCarlo} from './finance.js?v=20261023-1';
self.onmessage=e=>{try{self.postMessage(monteCarlo(e.data.plan,e.data.options));}catch(err){self.postMessage({error:err.message});}};
