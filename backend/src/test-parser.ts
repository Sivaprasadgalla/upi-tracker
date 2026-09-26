import { UpiParserService } from './services/upiParser.js';

const testCases = [
  {
    name: 'Google Pay - Food Delivery (Swiggy)',
    text: 'Paid ₹450 to Swiggy using HDFC Bank account **1234. UPI Ref: 426819234567',
    expectedAmount: 450,
    expectedCategory: 'Food & Dining',
    expectedType: 'DEBIT'
  },
  {
    name: 'PhonePe - Grocery (Blinkit)',
    text: 'Debited ₹389.00 from A/C XX4567 to Blinkit India successfully. Ref 426819234568',
    expectedAmount: 389,
    expectedCategory: 'Groceries',
    expectedType: 'DEBIT'
  },
  {
    name: 'Paytm - Cab / Travel (Uber)',
    text: 'Paid ₹265 to Uber India at 09:15 AM. VPA: uber@icici. UTR: 426819234569',
    expectedAmount: 265,
    expectedCategory: 'Travel & Cab',
    expectedType: 'DEBIT'
  },
  {
    name: 'CRED - E-Commerce Shopping (Amazon)',
    text: 'Cred: ₹2,499 debited for Amazon India UPI order. Ref 426819234570',
    expectedAmount: 2499,
    expectedCategory: 'Shopping',
    expectedType: 'DEBIT'
  },
  {
    name: 'HDFC Bank SMS - Food (Zomato)',
    text: 'Sent Rs.550.00 from HDFC Bank A/C **4567 to Zomato on 26-09-26. UPI Ref 426819234571.',
    expectedAmount: 550,
    expectedCategory: 'Food & Dining',
    expectedType: 'DEBIT'
  },
  {
    name: 'SBI Bank SMS - Electricity / Utility',
    text: 'Dear SBI User, A/C 9876 debited by Rs 1,420.00 on 26Sep26 transfer to Bescom Electricity Ref No 426819234572.',
    expectedAmount: 1420,
    expectedCategory: 'Bills & Utilities',
    expectedType: 'DEBIT'
  },
  {
    name: 'PhonePe - Credit / Money Received',
    text: 'Received ₹1,500 from Rahul Sharma on PhonePe. Ref: 426819234573',
    expectedAmount: 1500,
    expectedType: 'CREDIT'
  }
];

console.log('🧪 Starting UPI Regex Parser Test Suite...\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = UpiParserService.parse(tc.text);

  if (!result) {
    console.error(`❌ FAILED: ${tc.name} -> Result is null`);
    failed++;
    continue;
  }

  const amountMatch = result.amount === tc.expectedAmount;
  const typeMatch = result.type === tc.expectedType;
  const categoryMatch = !tc.expectedCategory || result.category === tc.expectedCategory;

  if (amountMatch && typeMatch && categoryMatch) {
    console.log(`✅ PASSED: ${tc.name}`);
    console.log(`   Amount: ₹${result.amount} | Type: ${result.type} | Category: ${result.category} | Merchant: "${result.merchantName}" | Ref: ${result.bankRefNumber || 'N/A'}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${tc.name}`);
    console.error(`   Expected: Amount=${tc.expectedAmount}, Type=${tc.expectedType}, Category=${tc.expectedCategory}`);
    console.error(`   Received: Amount=${result.amount}, Type=${result.type}, Category=${result.category}`);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`Summary: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All UPI parsing tests passed with 100% accuracy!');
}
