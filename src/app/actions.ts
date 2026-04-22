'use server';

import { addRegistrationToSheet } from '@/lib/googleSheets';
import { createEformsignDocument } from '@/lib/eformsign';

// Utility: Format Phone Number (010-0000-0000)
function formatPhone(phone: string = '') {
  const nums = phone.replace(/\D/g, '');
  if (nums.length === 11) {
    return nums.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (nums.length === 10) {
    return nums.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

export async function registerAction(data: any) {
  try {
    console.log('--- Register Action Started (Extended Fields) ---');

    // 1. 구글 시트 저장
    const sheetData = {
      '신청일시': new Date().toLocaleString('ko-KR'),
      '성명': data.name,
      '성별': data.gender,
      '연락처': formatPhone(data.phone),
      '주소': `${data.address} ${data.addressDetail || ''}`.trim(),
      '주민번호앞자리': data.residentId.split('-')[0],
      '상품명': data.product,
      '수량': data.productCount + '구좌',
      '플랜': data.paymentPlan === 'normal' ? '일반 납입' : '30회 선납',
      '결제수단': data.paymentMethod === 'card' ? '카드' : 'CMS(계좌)',
      '결제기관': data.paymentMethod === 'card' ? data.paymentInfo.cardCompany : data.paymentInfo.bankName,
      '계좌/카드번호': data.paymentMethod === 'card' ? data.paymentInfo.cardNumber : data.paymentInfo.accountNumber,
      '유효기간': data.paymentMethod === 'card' ? data.paymentInfo.cardExpiry : '-',
      '예금주': data.paymentInfo.accountHolder || data.name,
      '영업소속': data.salesAffiliation,
      '영업담당': `${data.salesName} (${data.salesPhone})`,
      '서명': data.signature ? '전자서명 완료' : '미완료',
      '상태': '등록완료'
    };

    console.log('Saving to Google Sheets...');
    await addRegistrationToSheet(sheetData);

    // 2. 이폼사인 연동
    console.log('Creating e-FormSign document...');
    const eformResult = await createEformsignDocument(data);

    if (!eformResult.success) {
      console.error('e-FormSign failed, but Sheet was saved.');
      return { 
        success: false, 
        message: '구글 시트 저장은 완료되었으나, 이폼사인 전송 중 오류가 발생했습니다: ' + eformResult.message 
      };
    }

    console.log('--- Register Action Completed Successfully ---');
    return { 
      success: true, 
      message: '가입 신청 및 전자 서명이 완료되었습니다.' 
    };
  } catch (error: any) {
    console.error('--- Register Action Fatal Error ---');
    console.error(error);
    return { success: false, message: error.message || '등록 중 오류가 발생했습니다.' };
  }
}