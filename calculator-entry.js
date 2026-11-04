import {startCalculator} from './calculator-start.js';
import {browserProfileIO} from './profiles.js';
await startCalculator(browserProfileIO(localStorage));
