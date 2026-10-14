import { StatementParserService } from './services/statementParser.js';

console.log('🧪 Testing StatementParserService...\n');

// 1. PhonePe Statement CSV
const phonePeCsv = `Date,Transaction ID,Description,Type,Amount,Status
14-Oct-2026,T261014123456789,Paid to Swiggy,DEBIT,450.00,SUCCESS
14-Oct-2026,T261014123456790,Received from Ashok Cheemala,CREDIT,2000.00,SUCCESS
13-Oct-2026,T261013123456791,Transfer to Rahul Sharma,DEBIT,150.00,SUCCESS
12-Oct-2026,T261012123456792,Paid to Blinkit,DEBIT,389.00,FAILED`;

const phonePeResults = StatementParserService.parse(phonePeCsv);
console.log(`PhonePe Parsed: ${phonePeResults.length} items (expected 3, 1 failed filtered out)`);
phonePeResults.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.type}] ₹${item.amount} to "${item.merchantName}" (${item.category}) Ref: ${item.bankRefNumber || 'N/A'}`);
});

// 2. Bank Statement CSV (Separate Debit & Credit Columns)
const bankCsv = `Date,Transaction Remarks,Withdrawal Amount (INR),Deposit Amount (INR),Balance (INR)
13-10-2026,UPI/001203174818/ASHOK CHEEMALA/ICICI/987654321,1.00,,5432.00
14-10-2026,UPI/718174864768/CR/ASHOK CHEEMALA/PHONEPE,,2000.00,7432.00
15-10-2026,UPI/998877665544/ZOMATO/HDFC/332211,480.00,,6952.00`;

const bankResults = StatementParserService.parse(bankCsv);
console.log(`\nBank CSV Parsed: ${bankResults.length} items (expected 3)`);
bankResults.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.type}] ₹${item.amount} to "${item.merchantName}" (${item.category}) Ref: ${item.bankRefNumber || 'N/A'}`);
});

// 3. Bulk Bank SMS Paste
const bulkSms = `ICICI Bank Acct XX305 debited for Rs 1.00 on 13-Oct-26; ASHOK CHEEMALA credited. UPI:001203174818. Call 18002662 for dispute.

Dear Customer, Acct XX305 is credited with Rs 2000.00 on 14-Oct-26 from ASHOK CHEEMALA. UPI:718174864768-ICICI Bank.

Sent Rs.550.00 from HDFC Bank A/C **4567 to Zomato on 26-09-26. UPI Ref 426819234571.`;

const smsResults = StatementParserService.parse(bulkSms);
console.log(`\nBulk SMS Parsed: ${smsResults.length} items (expected 3)`);
smsResults.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.type}] ₹${item.amount} to "${item.merchantName}" (${item.category}) Ref: ${item.bankRefNumber || 'N/A'}`);
});

// 4. BHIM PDF Statement Lines
const bhimPdf = `14/10/2026 14:17:21 ICICI Bank XXXXXXXXXX05 xxxxx27588@upi(GALLA SIVA PRASAD) xxxxx78627@ybl(xxxxxxxxRIES) 141721888688 PAY 30.00 DR SUCCESS
13/10/2026 00:12:03 ICICI Bank XXXXXXXXXX05 xxxxx27588@upi(GALLA SIVA PRASAD) xxxxx20228-2@ybl(xxxxxxxxMALA) 001203174818 PAY 1.00 DR SUCCESS
12/10/2026 23:14:09 ICICI Bank XXXXXXXXXX05 xxxxxxxhback@hdfcbank(NPCI BHIM) xxxxx27588@upi() 104236512912 PAY 8.00 CR SUCCESS
12/10/2026 15:27:26 ICICI Bank XXXXXXXXXX05 xxxxx27588@upi(GALLA SIVA PRASAD) xxntra2.payu@hdfcbank(MYNTRA) 152726805297 PAY 438.20 DR SUCCESS
02/10/2026 10:08:42 ICICI Bank XXXXXXXXXX05 xxxxx27588@upi(GALLA SIVA PRASAD) xxxxxxxxnline.gpay@okpayaxis(Meesho) 100842708567 PAY 735.00 DR SUCCESS`;

const bhimResults = StatementParserService.parse(bhimPdf);
console.log(`\nBHIM PDF Parsed: ${bhimResults.length} items (expected 5)`);
bhimResults.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.type}] ₹${item.amount} to "${item.merchantName}" (${item.category}) Ref: ${item.bankRefNumber || 'N/A'}`);
});

console.log('\n🎉 All statement tests executed!');

