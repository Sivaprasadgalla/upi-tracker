import { AppSource, CategoryType, IParsedUPI, TransactionType } from '../types/index.js';
import { UpiParserService } from './upiParser.js';

export interface IParsedStatementItem {
  amount: number;
  type: TransactionType;
  appSource: AppSource;
  merchantName: string;
  vpa?: string;
  bankRefNumber?: string;
  bankName?: string;
  accountLast4?: string;
  category: CategoryType;
  transactionDate: Date;
  rawText: string;
}

export class StatementParserService {
  /**
   * Main entry point: Parses CSV, Excel text, or Bulk SMS messages
   */
  public static parse(content: string): IParsedStatementItem[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    const trimmed = content.trim();

    // Check if input is a series of Bank/UPI SMS messages
    if (this.isBulkSms(trimmed)) {
      return this.parseBulkSms(trimmed);
    }

    // Check if CSV / Delimited Table
    if (this.isCsvTable(trimmed)) {
      const csvItems = this.parseCsv(trimmed);
      if (csvItems.length > 0) return csvItems;
    }

    // Check if Multi-line Bank Table Statement (ICICI, HDFC, SBI Savings PDF)
    if (this.isBankMultiLineTable(trimmed)) {
      const bankItems = this.parseBankMultiLineTable(trimmed);
      if (bankItems.length > 0) return bankItems;
    }

    // Otherwise treat as PDF statement text (BHIM, Bank PDF statements)
    return this.parsePdfLines(trimmed);
  }

  /**
   * Checks if content is CSV / Delimited Table
   */
  private static isCsvTable(text: string): boolean {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return false;
    const firstLine = lines[0];
    return firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';');
  }

  /**
   * Heuristic to determine if the text is multiple SMS messages rather than a CSV table
   */
  private static isBulkSms(text: string): boolean {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return false;

    // Check for standard CSV header
    const firstLine = lines[0].toLowerCase();
    if (
      firstLine.includes(',') &&
      (firstLine.includes('date') || firstLine.includes('amount') || firstLine.includes('details') || firstLine.includes('remarks'))
    ) {
      return false;
    }

    // If lines frequently mention bank terms, treat as SMS
    const smsKeywords = ['debited', 'credited', 'acct', 'a/c', 'upi ref', 'utr', 'paid rs', 'sent rs'];
    let smsMatches = 0;
    for (const line of lines.slice(0, 5)) {
      const lower = line.toLowerCase();
      if (smsKeywords.some((kw) => lower.includes(kw))) {
        smsMatches++;
      }
    }

    return smsMatches >= 1;
  }

  /**
   * Parses multiple SMS messages separated by newlines or blank lines
   */
  private static parseBulkSms(text: string): IParsedStatementItem[] {
    // Split messages by blank lines or by "Dear" / "ICICI" / "HDFC" / "SBI" / "Sent" / "Paid" / "Received"
    const rawChunks = text.split(/(?=(?:Dear\s+Customer|Dear\s+SBI|ICICI\s+Bank|HDFC\s+Bank|Axis\s+Bank|SBI|Paid\s+[₹Rs]|Received\s+[₹Rs]|Debited\s+[₹Rs]))/i);
    const results: IParsedStatementItem[] = [];

    for (const chunk of rawChunks) {
      const trimmed = chunk.trim();
      if (trimmed.length < 15) continue;

      const parsed: IParsedUPI | null = UpiParserService.parse(trimmed);
      if (parsed) {
        // Attempt to extract date from SMS or fallback to now
        const dateMatch = trimmed.match(/(\d{1,2}[-/][A-Za-z0-9]{2,4}[-/]\d{2,4})/);
        let txDate = new Date();
        if (dateMatch) {
          const parsedDate = this.parseDate(dateMatch[1]);
          if (parsedDate) txDate = parsedDate;
        }

        results.push({
          amount: parsed.amount,
          type: parsed.type,
          appSource: parsed.appSource,
          merchantName: parsed.merchantName,
          vpa: parsed.vpa,
          bankRefNumber: parsed.bankRefNumber,
          bankName: parsed.bankName,
          accountLast4: parsed.accountLast4,
          category: parsed.category,
          transactionDate: txDate,
          rawText: parsed.rawText
        });
      }
    }

    return results;
  }

  /**
   * Parses CSV / TSV statements from PhonePe, Paytm, Google Pay, and Indian Banks
   */
  private static parseCsv(csvText: string): IParsedStatementItem[] {
    const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length < 2) return [];

    // Detect delimiter: comma, tab, or semicolon
    const firstLine = rawLines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    // Parse header to map columns
    const headers = this.parseCsvLine(rawLines[0], delimiter).map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
    
    let dateIdx = -1;
    let descIdx = -1;
    let amountIdx = -1;
    let debitIdx = -1;
    let creditIdx = -1;
    let typeIdx = -1;
    let utrIdx = -1;
    let statusIdx = -1;

    headers.forEach((h, i) => {
      if (/date|time|txn\s*date|transaction\s*date|value\s*date/.test(h) && dateIdx === -1) dateIdx = i;
      else if (/description|details|narration|remarks|particulars|counterparty|payee/.test(h) && descIdx === -1) descIdx = i;
      else if (/withdrawal|debit\s*amount|dr/.test(h)) debitIdx = i;
      else if (/deposit|credit\s*amount|cr/.test(h)) creditIdx = i;
      else if (/^amount$|amount\s*\(inr\)|transaction\s*amount/.test(h) && amountIdx === -1) amountIdx = i;
      else if (/type|txn\s*type|dr\/cr|cr\/dr/.test(h) && typeIdx === -1) typeIdx = i;
      else if (/utr|ref|rrn|txn\s*id|transaction\s*id|reference/.test(h) && utrIdx === -1) utrIdx = i;
      else if (/status|state/.test(h) && statusIdx === -1) statusIdx = i;
    });

    // Fallback index detection if header names were generic
    if (dateIdx === -1) dateIdx = 0;
    if (descIdx === -1 && headers.length > 1) descIdx = 1;
    if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
      amountIdx = headers.length > 2 ? 2 : 1;
    }

    const items: IParsedStatementItem[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;

      const cols = this.parseCsvLine(line, delimiter);
      if (cols.length <= Math.max(dateIdx, descIdx)) continue;

      // Check status if available (skip FAILED / DECLINED)
      if (statusIdx !== -1 && cols[statusIdx]) {
        const st = cols[statusIdx].toLowerCase();
        if (st.includes('fail') || st.includes('decline') || st.includes('reject') || st.includes('cancelled')) {
          continue;
        }
      }

      // Determine Amount & TransactionType (Debit vs Credit)
      let amount = 0;
      let type: TransactionType = 'DEBIT';

      if (debitIdx !== -1 && creditIdx !== -1) {
        const debitVal = this.cleanNumeric(cols[debitIdx]);
        const creditVal = this.cleanNumeric(cols[creditIdx]);
        if (debitVal > 0) {
          amount = debitVal;
          type = 'DEBIT';
        } else if (creditVal > 0) {
          amount = creditVal;
          type = 'CREDIT';
        } else {
          continue; // Zero or empty row
        }
      } else if (amountIdx !== -1) {
        amount = this.cleanNumeric(cols[amountIdx]);
        if (amount <= 0) continue;

        if (typeIdx !== -1 && cols[typeIdx]) {
          const typeStr = cols[typeIdx].toUpperCase();
          if (typeStr.includes('CR') || typeStr.includes('CREDIT') || typeStr.includes('DEPOSIT')) {
            type = 'CREDIT';
          } else {
            type = 'DEBIT';
          }
        } else {
          // Check if description has credit indicators
          const desc = cols[descIdx] || '';
          if (/(?:received|credited|deposit|cashback|refund)/i.test(desc)) {
            type = 'CREDIT';
          } else {
            type = 'DEBIT';
          }
        }
      }

      if (amount <= 0) continue;

      // Parse Date
      const dateStr = cols[dateIdx] || '';
      const txDate = this.parseDate(dateStr) || new Date();

      // Parse Merchant / Counterparty
      const rawDesc = cols[descIdx] || 'UPI Transfer';
      const merchantName = this.extractMerchantFromStatement(rawDesc, type);

      // Parse UTR / Ref Number
      let utr: string | undefined = undefined;
      if (utrIdx !== -1 && cols[utrIdx]) {
        const cleanUtr = cols[utrIdx].replace(/[^0-9A-Za-z]/g, '');
        if (cleanUtr.length >= 8) utr = cleanUtr;
      }
      if (!utr) {
        const utrMatch = rawDesc.match(/(?:upi\/|utr[:\s]*|ref[:\s]*)([0-9]{8,14})/i);
        if (utrMatch) utr = utrMatch[1];
      }

      // Detect VPA
      const vpaMatch = rawDesc.match(/([a-zA-Z0-9.\-_]{2,40}@[a-zA-Z]{2,20})/);
      const vpa = vpaMatch ? vpaMatch[1] : undefined;

      // Detect Source
      let source: AppSource = 'BANK_SMS';
      const descLower = rawDesc.toLowerCase();
      if (descLower.includes('phonepe') || /@ybl|@ibl|@axl/i.test(rawDesc)) source = 'PHONEPE';
      else if (descLower.includes('google pay') || descLower.includes('gpay') || /@ok/i.test(rawDesc)) source = 'GPAY';
      else if (descLower.includes('paytm') || /@paytm/i.test(rawDesc)) source = 'PAYTM';
      else if (descLower.includes('cred')) source = 'CRED';

      // Auto-categorize
      const category = (UpiParserService as any).categorize(merchantName, rawDesc);

      items.push({
        amount,
        type,
        appSource: source,
        merchantName,
        vpa,
        bankRefNumber: utr,
        category,
        transactionDate: txDate,
        rawText: line
      });
    }

    return items;
  }

  /**
   * Helper to parse CSV lines with quoted strings and embedded commas
   */
  private static parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Cleans currency symbols, commas, and parses floats
   */
  private static cleanNumeric(val?: string): number {
    if (!val) return 0;
    const cleaned = val.replace(/[₹RsINR,\s'"]/gi, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  }

  /**
   * Flexible Date Parser for DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD
   */
  private static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const clean = dateStr.trim().replace(/['"]/g, '');

    // Standard ISO format
    const isoParsed = Date.parse(clean);
    if (!isNaN(isoParsed) && clean.includes('-') && clean.length >= 10 && clean.indexOf('-') === 4) {
      return new Date(clean);
    }

    // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      let year = parseInt(dmy[3], 10);
      if (year < 100) year += 2000;
      const hours = dmy[4] ? parseInt(dmy[4], 10) : 12;
      const minutes = dmy[5] ? parseInt(dmy[5], 10) : 0;
      const seconds = dmy[6] ? parseInt(dmy[6], 10) : 0;
      return new Date(year, month, day, hours, minutes, seconds);
    }

    // Match DD-MMM-YYYY (e.g., 14-Oct-2026 or 14-Oct-26)
    const dMmmY = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})/);
    if (dMmmY) {
      const day = parseInt(dMmmY[1], 10);
      const monthStr = dMmmY[2].toLowerCase();
      const months: { [k: string]: number } = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const month = months[monthStr] !== undefined ? months[monthStr] : 0;
      let year = parseInt(dMmmY[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day, 12, 0, 0);
    }

    const fallback = new Date(clean);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  /**
   * Cleans banking remarks to extract the real business/person name
   * E.g. "UPI/001203174818/ASHOK CHEEMALA/ICICI/..." -> "ASHOK CHEEMALA"
   * E.g. "Paid to Swiggy India" -> "Swiggy India"
   */
  private static extractMerchantFromStatement(desc: string, type: TransactionType): string {
    let clean = desc.replace(/['"]/g, '').trim();

    // Check for Bank Statement UPI format: UPI/UTR/NAME/BANK or UPI-NAME-BANK
    if (clean.toUpperCase().startsWith('UPI/') || clean.toUpperCase().includes('/UPI/')) {
      const parts = clean.split('/');
      // In UPI/UTR/NAME or UPI/NAME, find the part with letters (the merchant/person)
      for (const part of parts) {
        const pTrim = part.trim();
        if (
          pTrim.length >= 3 &&
          !/^[0-9]+$/.test(pTrim) &&
          !['UPI', 'CR', 'DR', 'NA', 'REV'].includes(pTrim.toUpperCase()) &&
          !['ICICI', 'HDFC', 'SBI', 'AXIS', 'YESB', 'PAYTM', 'KOTAK'].includes(pTrim.toUpperCase())
        ) {
          return (UpiParserService as any).cleanMerchantName(pTrim);
        }
      }
    }

    // PhonePe & Paytm standard styles: "Paid to X", "Payment to X", "Received from X", "Transfer to X"
    const nameMatch = clean.match(/(?:paid to|payment to|sent to|transfer to|received from|transfer from|from)\s+([A-Za-z0-9\s.&'-]{2,40})/i);
    if (nameMatch && nameMatch[1]) {
      return (UpiParserService as any).cleanMerchantName(nameMatch[1].trim());
    }

    // If description is just the merchant name directly
    if (clean.length > 2 && clean.length < 35 && !clean.includes('/')) {
      return (UpiParserService as any).cleanMerchantName(clean);
    }

    return type === 'DEBIT' ? 'UPI Merchant' : 'UPI Counterparty';
  }

  /**
   * Parses line-by-line text extracted from BHIM and Bank PDF statements
   */
  private static parsePdfLines(text: string): IParsedStatementItem[] {
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const items: IParsedStatementItem[] = [];

    for (const line of rawLines) {
      // Must contain a date and a numeric amount
      const dateMatch = line.match(/(\d{1,2}[-/.][A-Za-z0-9]{2,4}[-/.][0-9]{2,4})/);
      const amountMatch = line.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (!dateMatch || !amountMatch) continue;

      // Extract amount
      const allNums = line.match(/(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)|(?:\s+|^)([0-9,]+\.[0-9]{2})(?:\s+|$)/i);
      let amount = 0;
      if (allNums) {
        amount = this.cleanNumeric(allNums[1] || allNums[2]);
      } else {
        amount = this.cleanNumeric(amountMatch[1]);
      }
      if (amount <= 0) continue;

      // Skip status failed / declined / cancelled
      if (/(?:fail|decline|reject|cancelled)/i.test(line)) continue;

      // Determine Type (DEBIT vs CREDIT)
      let type: TransactionType = 'DEBIT';
      if (/(?:credit|credited|received|deposit|cr\b|\+\s*[₹Rs])/i.test(line)) {
        type = 'CREDIT';
      } else if (/(?:debit|debited|paid|sent|transfer|dr\b|-\s*[₹Rs])/i.test(line)) {
        type = 'DEBIT';
      }

      // Parse Date
      const txDate = this.parseDate(dateMatch[1]) || new Date();

      // Extract UTR / Ref Number
      let utr: string | undefined = undefined;
      const utrMatch = line.match(/(?:upi[:\s/-]*|utr[:\s#]*|ref[:\s#]*)([0-9]{8,14})/i) || line.match(/\b([0-9]{12})\b/);
      if (utrMatch) utr = utrMatch[1];

      // Check for BHIM handles with counterparty names: handle@bank(Name)
      const bhimHandles = [...line.matchAll(/([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)\(([^)]*)\)/g)];
      let merchantName = '';
      let vpa: string | undefined = undefined;

      if (bhimHandles.length > 0) {
        // If DEBIT: Counterparty is Receiver (handle 1)
        // If CREDIT: Counterparty is Sender (handle 0)
        const targetHandle = type === 'CREDIT' ? bhimHandles[0] : (bhimHandles[1] || bhimHandles[0]);
        if (targetHandle) {
          vpa = targetHandle[1];
          let rawName = targetHandle[2]?.trim();
          if (rawName && rawName.length > 0) {
            const cleanedMask = rawName.replace(/^x+/i, '').trim();
            merchantName = cleanedMask.length > 1 ? cleanedMask : rawName;
          }
        }
      }

      if (!merchantName || merchantName.length === 0) {
        let cleanDesc = line
          .replace(dateMatch[0], '')
          .replace(/(?:₹|rs\.?|inr)?\s*[0-9,]+(?:\.[0-9]{1,2})?/gi, '')
          .replace(/(?:success|completed|pending|failed|debit|credit|dr|cr)/gi, '')
          .replace(/\b[0-9]{8,14}\b/g, '')
          .replace(/(?:upi[:\s/-]*|utr[:\s#]*|ref[:\s#]*)/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        merchantName = this.extractMerchantFromStatement(cleanDesc || line, type);
      }

      // Detect Source
      let source: AppSource = 'BHIM';
      const lower = line.toLowerCase();
      if (bhimHandles.length > 0) source = 'BHIM';
      else if (lower.includes('phonepe')) source = 'PHONEPE';
      else if (lower.includes('gpay') || lower.includes('google pay')) source = 'GPAY';
      else if (lower.includes('paytm')) source = 'PAYTM';
      else if (lower.includes('bhim')) source = 'BHIM';
      else if (lower.includes('icici') || lower.includes('hdfc') || lower.includes('sbi')) source = 'BANK_SMS';

      const category = (UpiParserService as any).categorize(merchantName, line);

      items.push({
        amount,
        type,
        appSource: source,
        merchantName,
        vpa,
        bankRefNumber: utr,
        category,
        transactionDate: txDate,
        rawText: line
      });
    }

    return items;
  }

  /**
   * Checks if statement is a multi-line bank table (e.g. ICICI Bank statement)
   */
  private static isBankMultiLineTable(text: string): boolean {
    const rowStartRegex = /(?:^|\n)\s*(\d{1,4})\s+(\d{2}[./-]\d{2}[./-]\d{4})/g;
    const matches = [...text.matchAll(rowStartRegex)];
    return matches.length >= 2;
  }

  /**
   * Parses multi-line bank statement tables (e.g. ICICI Bank PDF statement)
   */
  private static parseBankMultiLineTable(text: string): IParsedStatementItem[] {
    const rowStartRegex = /(?:^|\n)\s*(\d{1,4})\s+(\d{2}[./-]\d{2}[./-]\d{4})([^\n]*)/g;
    const matches = [...text.matchAll(rowStartRegex)];
    if (matches.length === 0) return [];

    const items: IParsedStatementItem[] = [];
    let prevBalance: number | null = null;

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startIndex = current.index!;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : text.length;
      const block = text.slice(startIndex, endIndex).trim();

      const dateStr = current[2];
      const firstLineRest = current[3].trim();

      // Extract all numbers with two decimal places (amounts and balance)
      const amountsMatch = [...block.matchAll(/(?:\s+|^)([0-9,]+\.[0-9]{2})(?=\s+|$)/g)]
        .map((m) => parseFloat(m[1].replace(/,/g, '')));

      if (amountsMatch.length === 0) continue;

      let amount = 0;
      let balance = 0;
      if (amountsMatch.length >= 2) {
        amount = amountsMatch[amountsMatch.length - 2];
        balance = amountsMatch[amountsMatch.length - 1];
      } else {
        amount = amountsMatch[0];
      }

      if (amount <= 0) continue;

      // Determine type (DEBIT vs CREDIT) based on balance change
      let type: TransactionType = 'DEBIT';
      if (prevBalance !== null && balance > 0) {
        if (balance > prevBalance) {
          type = 'CREDIT';
        } else {
          type = 'DEBIT';
        }
      } else {
        if (/(?:payment\s+fr|cashback|refund|salary|deposit|cr\b|neft-idfb)/i.test(block)) {
          type = 'CREDIT';
        } else {
          type = 'DEBIT';
        }
      }
      if (balance > 0) prevBalance = balance;

      // Extract UTR (12 digits)
      let utr: string | undefined = undefined;
      const utrMatch = block.match(/(?:bank\/|ref\/|utr\/|upi\/|\b)([0-9]{12})\b/i);
      if (utrMatch) utr = utrMatch[1];

      // Extract VPA if present
      let vpa: string | undefined = undefined;
      const vpaMatch = block.match(/([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)/);
      if (vpaMatch) vpa = vpaMatch[1];

      // Extract merchant / payee name
      let merchantName = firstLineRest;
      merchantName = merchantName.replace(/^Debit trxn/i, '').trim();
      if (!merchantName || merchantName.length < 3) {
        const upiNameMatch = block.match(/UPI\/([^\/]+)\//i);
        if (upiNameMatch) {
          merchantName = upiNameMatch[1].trim();
        } else {
          const neftMatch = block.match(/NEFT-[A-Za-z0-9]+-([A-Za-z0-9\s]+)--/i);
          if (neftMatch) {
            merchantName = neftMatch[1].trim();
          }
        }
      }

      if (!merchantName || merchantName.length === 0) {
        merchantName = type === 'DEBIT' ? 'UPI Merchant' : 'UPI Counterparty';
      }

      merchantName = (UpiParserService as any).cleanMerchantName(merchantName);

      const txDate = this.parseDate(dateStr) || new Date();

      // Detect Source
      let source: AppSource = 'BANK_SMS';
      const lower = block.toLowerCase();
      if (lower.includes('phonepe')) source = 'PHONEPE';
      else if (lower.includes('gpay') || lower.includes('google pay')) source = 'GPAY';
      else if (lower.includes('paytm')) source = 'PAYTM';
      else if (lower.includes('bhim')) source = 'BHIM';
      else if (lower.includes('amazon')) source = 'AMAZON_PAY';
      else if (lower.includes('cred')) source = 'CRED';

      const category = (UpiParserService as any).categorize(merchantName, block);

      items.push({
        amount,
        type,
        appSource: source,
        merchantName,
        vpa,
        bankRefNumber: utr,
        bankName: 'ICICI Bank',
        category,
        transactionDate: txDate,
        rawText: block.replace(/\s+/g, ' ').slice(0, 300)
      });
    }

    return items;
  }
}

