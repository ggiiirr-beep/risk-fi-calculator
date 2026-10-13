import {monteCarlo} from './finance.js?v=20261013-1';
self.onmessage=e=>{try{self.postMessage(monteCarlo(e.data.plan,e.data.options));}catch(err){self.postMessage({error:err.message});}};
