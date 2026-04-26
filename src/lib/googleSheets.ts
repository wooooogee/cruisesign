import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '19HQigorXz8j2K2PyQx4k4rGGUMVKk43aNSAI9sEgRyc';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ?.replace(/^"|"$/g, '')
  ?.replace(/\\n/g, '\n');

export async function verifyEmployee(searchTerm: string) {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Sheets credentials are not set.');
    return { success: false, error: 'credentials_missing' };
  }

  try {
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['회원코드'];
    if (!sheet) {
      throw new Error("'회원코드' 시트를 찾을 수 없습니다.");
    }

    const rows = await sheet.getRows();
    const headers = sheet.headerValues;

    const clean = (str: any) => 
      str ? String(str).normalize('NFC').replace(/[\s\-_]/g, '').toLowerCase() : '';

    const findIndex = (name: string, defaultIdx: number) => {
      const idx = headers.findIndex(h => clean(h).includes(clean(name)));
      return idx !== -1 ? idx : defaultIdx;
    };

    const idx = {
      code: findIndex('사원코드', 1),
      name: findIndex('사원명', 5),
      status: findIndex('재직구분', 8),
      phone: findIndex('휴대폰번호', 11)
    };

    const target = clean(searchTerm);
    
    const foundRow = rows.find((row) => {
      // Use official .get() method instead of private _rawData
      const status = clean(row.get(headers[idx.status]));
      const code = clean(row.get(headers[idx.code]));
      const name = clean(row.get(headers[idx.name]));
      const phone = clean(row.get(headers[idx.phone]));
      
      if (!name && !code && !phone) return false;

      const nameMatch = name && (name === target || name.includes(target));
      const codeMatch = code && (code === target);
      const phoneMatch = phone && (phone === target || phone.includes(target));
      
      if (nameMatch || codeMatch || phoneMatch) {
         const isEmployed = status.includes('재직');
         if (isEmployed) return true;
      }
      return false;
    });

    if (foundRow) {
      const display = (str: any) => str ? String(str).normalize('NFC').trim() : '';

      const code = display(foundRow.get(headers[idx.code]));
      const name = display(foundRow.get(headers[idx.name]));
      const phone = display(foundRow.get(headers[idx.phone]));
      
      console.log(`[verifyEmployee] Match found: ${code}(${name})`);
      return { 
        success: true, 
        employeeInfo: `${code}(${name}) ${phone}` 
      };
    }

    return { success: false, error: 'not_found' };
  } catch (error) {
    console.error('Error verifying employee:', error);
    throw error;
  }
}

export async function addRegistrationToSheet(data: any) {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Sheets credentials are not set.');
    return { success: false, error: 'credentials_missing' };
  }

  try {
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle['신청현황'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: '신청현황', headerValues: Object.keys(data) });
    }

    try {
      await sheet.loadHeaderRow();
      const existingHeaders = sheet.headerValues;
      const dataKeys = Object.keys(data);
      const missingHeaders = dataKeys.filter(key => !existingHeaders.includes(key));
      
      if (missingHeaders.length > 0) {
        await sheet.setHeaderRow([...existingHeaders, ...missingHeaders]);
      }
    } catch (e) {
      await sheet.setHeaderRow(Object.keys(data));
    }

    const result = await sheet.addRow(data);
    return { success: true, rowNumber: result.rowNumber };
  } catch (error: any) {
    console.error('Google Sheets AddRow Error:', error);
    throw error;
  }
}

export async function getRegistrationByContact(name: string, phone: string) {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Sheets credentials are not set.');
    return { success: false, error: 'credentials_missing' };
  }

  try {
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['신청현황'];
    if (!sheet) {
      return { success: false, error: 'sheet_not_found' };
    }

    const rows = await sheet.getRows();
    
    // Find the latest entry (search from the end)
    const foundRow = [...rows].reverse().find(row => {
      const rowName = row.get('성명');
      const rowPhone = row.get('연락처');
      return rowName === name && (rowPhone === phone || rowPhone?.replace(/-/g, '') === phone.replace(/-/g, ''));
    });

    if (!foundRow) {
      return { success: false, error: 'not_found' };
    }

    // Parse Sales Rep Info: "Name (Phone)"
    const salesInfoRaw = foundRow.get('영업담당') || '';
    let salesName = '';
    let salesPhone = '';
    const salesMatch = salesInfoRaw.match(/^(.+)\s\((.+)\)$/);
    if (salesMatch) {
      salesName = salesMatch[1].trim();
      salesPhone = salesMatch[2].trim();
    } else {
      salesName = salesInfoRaw;
    }

    const data = {
      name: foundRow.get('성명') || '',
      gender: foundRow.get('성별') || '남',
      phone: foundRow.get('연락처') || '',
      address: foundRow.get('주소') || '',
      residentId: foundRow.get('주민번호앞자리') || '',
      product: foundRow.get('상품명') || '더좋은크루즈',
      productCount: (foundRow.get('수량') || '1').replace('구좌', ''),
      paymentPlan: foundRow.get('플랜') === '30회 선납' ? 'prepaid' : 'normal',
      paymentMethod: foundRow.get('결제수단') === '카드' ? 'card' : 'bank',
      paymentInfo: {
        cardCompany: foundRow.get('결제수단') === '카드' ? foundRow.get('결제기관') : '',
        cardNumber: foundRow.get('결제수단') === '카드' ? foundRow.get('계좌/카드번호') : '',
        cardExpiry: foundRow.get('결제수단') === '카드' ? foundRow.get('유효기간') : '',
        bankName: foundRow.get('결제수단') !== '카드' ? foundRow.get('결제기관') : '',
        accountNumber: foundRow.get('결제수단') !== '카드' ? foundRow.get('계좌/카드번호') : '',
        accountHolder: foundRow.get('예금주') || '',
      },
      salesAffiliation: foundRow.get('영업소속') || '',
      salesName,
      salesPhone,
    };

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching registration:', error);
    return { success: false, error: 'internal_error' };
  }
}
