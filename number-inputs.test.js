import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatAmount,readNumber,formatAmountInput} from './number-inputs.js';
test('Amounts group thousands and preserve cents, blanks and incomplete decimals',()=>{
 for(const [input,expected] of [['1000','1,000'],['1234567.50','1,234,567.50'],['12000.','12,000.'],['',''],['-1200','-1,200'],['1,234.5','1,234.5']])assert.equal(formatAmount(input),expected);
 assert.equal(readNumber('1,234,567.50'),1234567.5);assert.equal(readNumber(''),null);assert.ok(Number.isNaN(readNumber('12x')));
});
test('Formatting preserves the editing position inside a number',()=>{
 const input={value:'1234567',selectionStart:4,setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}};
 formatAmountInput(input);assert.equal(input.value,'1,234,567');assert.equal(input.selectionStart,5);
 input.value='1000';input.selectionStart=4;formatAmountInput(input);assert.equal(input.selectionStart,5);
});
