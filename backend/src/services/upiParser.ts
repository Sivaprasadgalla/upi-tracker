import { AppSource, CategoryType, IParsedUPI, TransactionType } from '../types/index.js';

interface CategoryRule {
  category: CategoryType;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy', 'zomato', 'starbucks', 'mcdonald', 'kfc', 'burger king',
      'domino', 'pizza', 'chai point', 'chaayos', 'cafe', 'restaurant',
      'dhaba', 'biryani', 'bakery', 'eats', 'diner', 'kitchen'
    ]
  },
  {
    category: 'Groceries',
    keywords: [
      'blinkit', 'zepto', 'instamart', 'bigbasket', 'bb daily', 'country delight',
      'nature basket', 'supermarket', 'kirana', 'mart', 'provision', 'dairy',
      'milk', 'fruits', 'vegetables', 'grocery'
    ]
  },
  {
    category: 'Travel & Cab',
    keywords: [
      'uber', 'ola', 'rapido', 'namma yatri', 'irctc', 'makemytrip', 'goibibo',
      'redbus', 'metro', 'petrol', 'fuel', 'hpcl', 'bpcl', 'ioc', 'indian oil',
      'shell', 'fastag', 'toll', 'parking', 'flight', 'airline'
    ]
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'tata cliq',
      'zara', 'h&m', 'decathlon', 'uniqlo', 'retail', 'clothing', 'footwear',
      'electronics', 'croma', 'reliance digital'
    ]
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'electricity', 'bescom', 'tata power', 'airtel', 'jio', 'vi', 'vodafone',
      'broadband', 'act fibernet', 'water', 'gas', 'indane', 'bharat gas',
      'hp gas', 'adani gas', 'dth', 'tata sky', 'sun direct', 'recharge',
      'billdesk', 'bbps'
    ]
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'prime video', 'hotstar', 'disney', 'bookmyshow',
      'pvr', 'inox', 'cinema', 'movie', 'youtube', 'sonyliv', 'zee5', 'steam',
      'playstation'
    ]
  },
  {
    category: 'Health & Medical',
    keywords: [
      'apollo', 'pharmeasy', 'tata 1mg', '1mg', 'medplus', 'netmeds',
      'hospital', 'clinic', 'pharmacy', 'chemist', 'diagnostic', 'pathology',
      'dr.', 'doctor', 'dental'
    ]
  },
  {
    category: 'Investment & Transfers',
    keywords: [
      'zerodha', 'groww', 'angelone', 'upstox', 'kuvera', 'indmoney', 'wazirx',
      'coindcx', 'mutual fund', 'sip', 'sebi', 'investment', 'deposit'
    ]
  }
];

export class UpiParserService {
  /**
   * Main parsing method that accepts raw notification/SMS text,
   * package name/source, and returns structured transaction data.
   */
  public static parse(rawText: string, detectedSource?: AppSource): IParsedUPI | null {
    if (!rawText || rawText.trim().length === 0) {
      return null;
    }

    const cleanText = rawText.replace(/\r?\n|\r/g, ' ').trim();
    const source = detectedSource || this.detectAppSource(cleanText);

    // 1. Extract Amount
    const amount = this.extractAmount(cleanText);
    if (amount === null || amount <= 0) {
      return null;
    }

    // 2. Extract Type (DEBIT vs CREDIT)
    const type = this.extractType(cleanText);

    // 3. Extract Merchant / Beneficiary / Sender
    const merchantName = this.extractMerchant(cleanText, type);

    // 4. Extract UPI ID / VPA if present
    const vpa = this.extractVpa(cleanText);

    // 5. Extract Bank Reference / UTR
    const bankRefNumber = this.extractRefNumber(cleanText);

    // 6. Extract Bank Details
    const { bankName, accountLast4 } = this.extractBankDetails(cleanText);

    // 7. Auto Categorize
    const category = this.categorize(merchantName, cleanText);

    return {
      amount,
      type,
      appSource: source,
      merchantName,
      vpa,
      bankRefNumber,
      bankName,
      accountLast4,
      category,
      rawText: cleanText,
      confidence: 0.95
    };
  }

  /**
   * Identifies UPI App or Bank from notification text or Android package name
   */
  public static detectAppSource(text: string, packageName?: string): AppSource {
    if (packageName) {
      if (packageName.includes('com.google.android.apps.nbu.paisa')) return 'GPAY';
      if (packageName.includes('com.phonepe')) return 'PHONEPE';
      if (packageName.includes('net.one97.paytm')) return 'PAYTM';
      if (packageName.includes('com.dreamplug.androidapp')) return 'CRED';
      if (packageName.includes('amazon')) return 'AMAZON_PAY';
      if (packageName.includes('in.org.npci.upiapp')) return 'BHIM';
    }

    const lower = text.toLowerCase();
    if (lower.includes('google pay') || lower.includes('gpay')) return 'GPAY';
    if (lower.includes('phonepe')) return 'PHONEPE';
    if (lower.includes('paytm')) return 'PAYTM';
    if (lower.includes('cred')) return 'CRED';
    if (lower.includes('amazon pay') || lower.includes('amazonpay')) return 'AMAZON_PAY';
    if (lower.includes('bhim')) return 'BHIM';
    if (lower.includes('hdfc') || lower.includes('sbi') || lower.includes('icici') || lower.includes('axis') || lower.includes('kotak')) {
      return 'BANK_SMS';
    }

    return 'MANUAL';
  }

  /**
   * Extracts amount with Indian currency formats:
   * ₹450, Rs. 1,200.50, INR 350.00, Rs 50
   */
  private static extractAmount(text: string): number | null {
    const patterns = [
      /(?:(?:rs\.?|inr|₹)\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
      /(?:debited|credited|paid|sent|received|transfer of)\s+(?:by\s+)?(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rawNum = match[1].replace(/,/g, '');
        const parsed = parseFloat(rawNum);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Distinguishes debit vs credit
   */
  private static extractType(text: string): TransactionType {
    const lower = text.toLowerCase();
    if (
      lower.includes('received') ||
      lower.includes('credited') ||
      lower.includes('deposit') ||
      lower.includes('refund') ||
      lower.includes('cashback')
    ) {
      return 'CREDIT';
    }
    return 'DEBIT';
  }

  /**
   * Extracts merchant or counterparty name
   */
  private static extractMerchant(text: string, type: TransactionType): string {
    // Strip currency symbols and numeric amounts: e.g. "Paid ₹450 to Swiggy" -> "Paid to Swiggy"
    let clean = text
      .replace(/(?:₹|rs\.?|inr)\s*[0-9,]+(?:\.[0-9]{1,2})?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (type === 'DEBIT') {
      const debitPatterns = [
        /(?:paid to|sent to|transfer to|transferred to|towards|to)\s+([A-Za-z0-9\s.&'-]{2,35}?)(?=\s+(?:on|using|via|successfully|ref|upi|from|\*\*|\.|$))/i,
        /(?:debited for|for)\s+([A-Za-z0-9\s.&'-]{2,35}?)(?=\s+(?:order|on|using|via|successfully|ref|upi|\.|$))/i,
        /(?:info:\s*upi\/)([A-Za-z0-9\s.&'-]{2,30})/i,
        /(?:to\s+vpa\s+)([A-Za-z0-9@._-]{3,35})/i,
        /(?:paid\s+)([A-Za-z0-9\s.&'-]{2,30}?)(?=\s+(?:at|successfully|on|using))/i
      ];

      for (const pattern of debitPatterns) {
        const match = clean.match(pattern);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val.length > 1 && !['a/c', 'account', 'bank', 'upi', 'user'].includes(val.toLowerCase())) {
            return this.cleanMerchantName(val);
          }
        }
      }
    } else {
      // Patterns for Credits: "received from X", "sent by X"
      const creditPatterns = [
        /(?:received from|sent by|credited by|transfer from|from)\s+([A-Za-z0-9\s.&'-]{2,35}?)(?=\s+(?:via|using|on|in|ref|\.|$))/i
      ];
      for (const pattern of creditPatterns) {
        const match = clean.match(pattern);
        if (match && match[1]) {
          return this.cleanMerchantName(match[1].trim());
        }
      }
    }

    return 'UPI Merchant';
  }

  /**
   * Extracts VPA / UPI ID like swiggy@icici or user@okaxis
   */
  private static extractVpa(text: string): string | undefined {
    const vpaRegex = /[a-zA-Z0-9.\-_]{2,40}@[a-zA-Z]{2,20}/;
    const match = text.match(vpaRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extracts 12-digit UPI Reference Number / UTR
   */
  private static extractRefNumber(text: string): string | undefined {
    const refPatterns = [
      /(?:ref(?:\s+no\.?|erence)?|utr|rrn|txn\s+id)[:\s#]*([0-9]{8,14})/i,
      /(?:upi\/[A-Za-z0-9]+\/)([0-9]{8,14})/i
    ];

    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return undefined;
  }

  /**
   * Extracts Bank Name and Last 4 digits of Account
   */
  private static extractBankDetails(text: string): { bankName?: string; accountLast4?: string } {
    let bankName: string | undefined;
    let accountLast4: string | undefined;

    const lower = text.toLowerCase();
    if (lower.includes('hdfc')) bankName = 'HDFC Bank';
    else if (lower.includes('sbi')) bankName = 'SBI Bank';
    else if (lower.includes('icici')) bankName = 'ICICI Bank';
    else if (lower.includes('axis')) bankName = 'Axis Bank';
    else if (lower.includes('kotak')) bankName = 'Kotak Bank';
    else if (lower.includes('pnb')) bankName = 'PNB Bank';
    else if (lower.includes('paytm payments bank')) bankName = 'Paytm Bank';

    const acctMatch = text.match(/(?:a\/c|acct|ac|ending with|a\/c no\.?)\s*(?:[x*]+)?([0-9]{3,4})/i);
    if (acctMatch && acctMatch[1]) {
      accountLast4 = acctMatch[1];
    }

    return { bankName, accountLast4 };
  }

  /**
   * Auto categorizes based on merchant name and full text
   */
  private static categorize(merchant: string, fullText: string): CategoryType {
    const searchString = `${merchant} ${fullText}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (searchString.includes(kw)) {
          return rule.category;
        }
      }
    }

    return 'Other';
  }

  private static cleanMerchantName(name: string): string {
    return name
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
