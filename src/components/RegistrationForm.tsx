'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, CheckCircle2, ArrowRight, ArrowLeft, Loader2, CreditCard, Landmark, ShieldCheck, MapPin, Search, Eraser, PenLine, Package, Calculator, Briefcase, Calendar } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import TermsAgreement from './TermsAgreement';
import { registerAction } from '@/app/actions';
import Script from 'next/script';

const DEFAULT_TERMS = [
  { 
    id: 'product_notice', 
    title: '1. 상품내용 고지에 대한 동의 (필수)', 
    content: `본 신청과 관련하여 계약자 본인은 상기 금융거래정보(카드 정보, 은행, 계좌번호 등)를 만기·해지 신청 때까지 청구 기관에 제공하고, 자동이체를 신청합니다.
본 상품은 더좋은크루즈의 선불식 할부거래(크루즈 여행) 상품입니다.
본 상품은 1구좌 기준 총 100회 납입 상품(총액 330만 원)이며, 청약 철회 기간(14일) 이후 해지 시 공정거래위원회 해약환급금 산정 기준 고시에 따라 환급됩니다.
고객님께서 100회 납입을 모두 완료하고, 완납일로부터 7년을 예치한 후 크루즈 서비스를 이용하지 않고 해약하실 경우, 납입원금의 100%를 전액 환급해 드립니다. 
단, 만기 및 예치 조건 충족 이전에 해지할 경우, 해지 시점을 기준으로 당사 해약환급률표 및 공정거래위원회 고시에 따라 환급합니다.`, 
    required: true 
  },
  { 
    id: 'privacy', 
    title: '2. 개인(신용)정보의 수집·이용에 관한 사항(필수)', 
    content: `이용목적
· 크루즈 여행서비스에 관한 계약이행 및 서비스 제공
· 가입 고객 관리 및 계약의 체결·유지·관리, 상담(민원처리 등)
· 요금청구를 위한 본인 확인, 요금결제(카드결제, CMS출금 등) 및 추심 업무를 위한 신용정보조회
· 공공기관의 정책자료로 제공
수집·이용할 개인(신용)정보의 항목
성명, 주소, 주민번호 앞 6자리(또는 생년월일/성별),전화번호, 계좌번호, 카드정보, 휴대폰번호
이용기간
본 계약체결일로부터 계약종료 후 3년까지
(단, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령의 규정에 의하여 보존할 필요가 있는 경우에는 그에 따름)`, 
    required: true 
  },
  { 
    id: 'third_party', 
    title: '3. 제3자 제공 동의 관한 사항(필수)', 
    content: `본 계약과 관련하여 귀사가 본인으로부터 취득한 개인정보는 「개인정보보호법」 제17조와 제22조에 따라 제3자에게 제공할 경우에는 본인의 사전 동의를 얻어야 합니다. 
이에 본인은 귀사가 본인의 개인정보를 아래와 같이 제3자에게 제공하는 것에 동의합니다.
· 개인정보를 제공받는 자: 신한은행, 금융결제원, KICC, 더좋은라이프(주), 제휴 크루즈 선사 및 항공사, 제휴 여행사, 신안소프트, 여의도자산관리본부, 위더스앤씨
· 개인정보를 제공받는 자의 개인정보 이용 목적: 할부거래에 관한 법률 제27조에 따른 공제 계약 및 소비자피해보상보험계약업무, 출금이체 서비스 제공 및 출금 동의 확인
· 크루즈/항공 승선 명단 등록 및 예약 수속 대행, SMS 서비스 제공, 개인정보조회/신용정보조회 등
· 제공하는 개인정보의 항목: * 개인식별정보: 성명, 생년월일, 주소(자택/직장), 연락처(휴대폰/자택), 여권정보(행사 진행 시)
	· 계약정보: 회원번호, 납입내역, 상담내역, 행사/해약사항
	· 결제정보: 예금주, 생년월일, 연락처, 계약자와의 관계, 계좌·카드 정보
· 개인정보를 제공받는 자의 개인정보 보유 및 이용기간: 크루즈 여행서비스 계약 종료 시 삭제`, 
    required: true 
  },
  { 
    id: 'marketing', 
    title: '4. 마케팅 정보 제공 동의(선택)', 
    content: `이용목적
· 신규 상품 및 서비스 안내
· 이벤트, 프로모션, 혜택 정보 제공
· 고객 맞춤 정보 제공
수집·이용할 개인(신용)정보의 항목
성명, 주소, 휴대폰번호
이용기간
동의일로부터 동의 철회 시까지`, 
    required: false 
  },
];

const STEPS = [
  { id: 'info', title: '정보 입력' },
  { id: 'plan', title: '상품 정보' },
  { id: 'payment', title: '결제 정보' },
  { id: 'terms', title: '약관 동의' },
  { id: 'signature', title: '전자 서명' },
  { id: 'sales', title: '영업 정보' },
  { id: 'complete', title: '가입 완료' },
];

const RegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    residentId: '',
    product: '더좋은크루즈',
    productCount: '1',
    paymentPlan: 'normal',
    paymentMethod: 'card',
    paymentDate: '5',
    paymentInfo: {
      cardCompany: '',
      cardNumber: '',
      cardExpiry: '', // MM/YY
      bankName: '',
      accountNumber: '',
      accountHolder: '',
    },
    agreement: {},
    signature: '', // Base64 signature
    gender: '남', // New: '남' or '여'
    salesAffiliation: '',
    salesName: '',
    salesPhone: '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePaymentInfo = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentInfo: { ...prev.paymentInfo, [field]: value }
    }));
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    updateFormData('signature', '');
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('서명을 먼저 진행해 주세요.');
      return false;
    }
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    updateFormData('signature', dataURL);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.phone || !formData.address || !formData.residentId || !formData.gender) {
        alert('필수 정보를 모두 입력해 주세요.');
        return;
      }
    }
    if (currentStep === 2) { // Payment Details step
      if (formData.paymentMethod === 'card') {
        if (!formData.paymentInfo.cardNumber || !formData.paymentInfo.cardCompany || !formData.paymentInfo.cardExpiry) {
          alert('카드 정보를 모두 입력해 주세요 (유효기간 포함).');
          return;
        }
      } else {
        if (!formData.paymentInfo.accountNumber || !formData.paymentInfo.bankName) {
          alert('계좌 정보를 모두 입력해 주세요.');
          return;
        }
      }
    }
    if (currentStep === 4) { // Signature step
      if (!saveSignature()) return;
    }
    if (currentStep === 5) { // Sales Info step
      if (!formData.salesName || !formData.salesPhone || !formData.salesAffiliation) {
        alert('영업사원 정보(소속 포함)를 모두 정확히 입력해 주세요.');
        return;
      }
      handleSubmit();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await registerAction(formData);
      if (result.success) {
        setCurrentStep(6);
      } else {
        alert(result.message || '등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPostcode = () => {
    // @ts-ignore
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    // @ts-ignore
    new window.daum.Postcode({
      oncomplete: function(data: any) {
        updateFormData('address', data.address);
      }
    }).open();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center py-12 px-4 selection:bg-indigo-500/30">
      <Script 
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" 
        strategy="afterInteractive" 
      />
      
      <div className="w-full max-w-xl space-y-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
              <ShieldCheck className="text-indigo-400" size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Membership System</p>
              <p className="text-sm font-bold text-white italic">Premium Access Center</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Step {currentStep + 1} of 7</span>
          </div>
        </div>

        <div className="relative flex justify-between items-center bg-zinc-900/50 border border-white/5 p-3 rounded-[2rem] backdrop-blur-xl">
          {STEPS.slice(0, 6).map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all duration-500 ${
                idx <= currentStep 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
              }`}>
                {idx < currentStep ? <CheckCircle2 size={16} /> : <span className="text-xs">{idx + 1}</span>}
              </div>
              <span className={`text-[8px] mt-2 font-bold transition-colors duration-300 ${idx <= currentStep ? 'text-white' : 'text-zinc-600'}`}>
                {step.title}
              </span>
            </div>
          ))}
          <div className="absolute left-8 right-8 top-[1.8rem] h-[1px] bg-zinc-800 -z-0" />
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">PRODUCT & BASIC INFO</h2>
                <p className="text-zinc-500 text-sm">신청 상품과 구좌 수량을 선택해 주세요.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><Package size={14} /> 상품 선택</label>
                    <select
                      value={formData.product}
                      onChange={(e) => updateFormData('product', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-indigo-500 transition-all outline-none text-white appearance-none"
                    >
                      <option value="더좋은크루즈">더좋은크루즈</option>
                      <option value="좋은건강크루즈">좋은건강크루즈</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><Calculator size={14} /> 수량</label>
                    <select
                      value={formData.productCount}
                      onChange={(e) => updateFormData('productCount', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-indigo-500 transition-all outline-none text-white appearance-none"
                    >
                      <option value="1">1 구좌</option>
                      <option value="2">2 구좌</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">성명</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input type="text" placeholder="실명을 입력하세요" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4.5 pl-14 pr-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">연락처</label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input type="tel" placeholder="010-0000-0000" value={formData.phone} onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 3 && val.length <= 7) val = val.substring(0, 3) + '-' + val.substring(3);
                      else if (val.length > 7) val = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7, 11);
                      updateFormData('phone', val);
                    }} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4.5 pl-14 pr-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">주소</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input type="text" placeholder="주소 검색" value={formData.address} readOnly onClick={openPostcode} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4.5 pl-14 pr-6 focus:border-indigo-500 transition-all outline-none text-white cursor-pointer placeholder:text-zinc-700" />
                      </div>
                      <button onClick={openPostcode} className="px-6 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"><Search size={18} /> 검색</button>
                    </div>
                    <input type="text" placeholder="상세 주소" value={formData.addressDetail} onChange={(e) => updateFormData('addressDetail', e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 ml-1">주민등록번호 앞6자리</label>
                    <input type="text" placeholder="900101" maxLength={6} value={formData.residentId} onChange={(e) => updateFormData('residentId', e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white font-mono tracking-[0.2em] placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 ml-1">성별</label>
                    <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
                      <button onClick={() => updateFormData('gender', '남')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.gender === '남' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>남성</button>
                      <button onClick={() => updateFormData('gender', '여')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.gender === '여' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>여성</button>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleNext} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/20">다음 단계 선택 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step-plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">PRODUCT DETAILS</h2>
                <p className="text-zinc-500 text-sm">선택하신 상품의 가입 정보 및 납입 플랜을 확인해 주세요.</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Selected Product</p>
                    <h3 className="text-xl font-black italic">{formData.product} ({formData.productCount}구좌)</h3>
                  </div>
                  <div className="bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold text-indigo-400">
                    {formData.product === '더좋은크루즈' ? '30회 선납형' : '정기 납입형'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                    <span className="text-zinc-400 text-xs font-bold">1회차 결제금액</span>
                    <span className="text-white font-black">
                      {formData.product === '더좋은크루즈' 
                        ? (990000 * Number(formData.productCount)).toLocaleString() 
                        : (660000 * Number(formData.productCount)).toLocaleString()
                      }원
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                    <span className="text-zinc-400 text-xs font-bold">2회차 이후 월 납입금</span>
                    <span className="text-white font-black text-indigo-400">
                      {formData.product === '더좋은크루즈' 
                        ? (33000 * Number(formData.productCount)).toLocaleString() 
                        : (27000 * Number(formData.productCount)).toLocaleString()
                      }원
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600 text-right px-2">
                    {formData.product === '더좋은크루즈' 
                      ? '* 2회차~71회차까지 납입 (총액 330만원)' 
                      : '* 2회차~101회차까지 납입 (VAT 포함)'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleBack} className="flex-1 py-5 bg-zinc-800 text-zinc-300 rounded-2xl font-bold">이전</button>
                <button onClick={handleNext} className="flex-[2] py-5 bg-white text-black rounded-2xl font-black">결제 정보 입력 단계</button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-pay-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">PAYMENT DETAILS</h2>
                <p className="text-zinc-500 text-sm">대금 납입을 위한 상세 정보를 입력해 주세요.</p>
              </div>

              <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
                <button onClick={() => updateFormData('paymentMethod', 'card')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.paymentMethod === 'card' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>카드 결제</button>
                <button onClick={() => updateFormData('paymentMethod', 'bank')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.paymentMethod === 'bank' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>계좌 이체(CMS)</button>
              </div>

              <div className="space-y-4">
                {formData.paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><CreditCard size={14} /> 카드사</label>
                      <input type="text" placeholder="예: 현대카드" value={formData.paymentInfo.cardCompany} onChange={(e) => updatePaymentInfo('cardCompany', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 ml-1">카드번호</label>
                        <input type="text" placeholder="0000-0000-0000-0000" value={formData.paymentInfo.cardNumber} onChange={(e) => updatePaymentInfo('cardNumber', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><Calendar size={14} /> 유효기간</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          maxLength={5} 
                          value={formData.paymentInfo.cardExpiry} 
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                            updatePaymentInfo('cardExpiry', val);
                          }} 
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-800" 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><Landmark size={14} /> 은행명</label>
                      <input type="text" placeholder="예: 국민은행" value={formData.paymentInfo.bankName} onChange={(e) => updatePaymentInfo('bankName', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-800" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 ml-1">계좌번호</label>
                      <input type="text" placeholder="'-' 없이 숫자만" value={formData.paymentInfo.accountNumber} onChange={(e) => updatePaymentInfo('accountNumber', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white placeholder:text-zinc-800" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">매월 결제일</label>
                  <select value={formData.paymentDate} onChange={(e) => updateFormData('paymentDate', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-6 focus:border-indigo-500 transition-all outline-none text-white appearance-none">
                    <option value="5">매월 5일</option>
                    <option value="15">매월 15일</option>
                    <option value="25">매월 25일</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleBack} className="flex-1 py-5 bg-zinc-800 text-zinc-300 rounded-2xl font-bold">이전</button>
                <button onClick={handleNext} className="flex-[2] py-5 bg-white text-black rounded-2xl font-black">약관 동의 단계</button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">TERMS & CONSENT</h2>
                <p className="text-zinc-500 text-sm">주요 고지 사항 및 개인정보 이용에 동의해 주세요.</p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden max-h-[350px] overflow-y-auto px-4 shadow-inner">
                <TermsAgreement terms={DEFAULT_TERMS} onAgreementChange={(agreement) => updateFormData('agreement', agreement)} />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleBack} className="flex-1 py-5 bg-zinc-800 text-zinc-300 rounded-2xl font-bold">이전</button>
                <button onClick={handleNext} className="flex-[2] py-5 bg-white text-black rounded-2xl font-black">전자 서명 단계</button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step-signature"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">DIGITAL SIGNATURE</h2>
                <p className="text-zinc-500 text-sm">패드 중앙에 성함을 정자로 서명해 주세요.</p>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
                <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: "signature-canvas w-full h-64" }} />
              </div>
              <div className="flex justify-between items-center px-2">
                <button onClick={clearSignature} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-indigo-400 transition-colors"><Eraser size={14} /> 서명 초기화</button>
                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2"><PenLine size={12} className="text-indigo-500" /> Secure Input Active</div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleBack} className="flex-1 py-5 bg-zinc-800 text-zinc-300 rounded-2xl font-bold">이전</button>
                <button onClick={handleNext} className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20">서명 완료</button>
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step-sales"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 bg-zinc-900/40 p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">SALES REPRESENTATIVE</h2>
                <p className="text-zinc-500 text-sm">상담을 진행한 담당자의 성함과 소속을 확인해 주세요.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-2"><Briefcase size={14} /> 소속</label>
                  <input type="text" placeholder="영업사원의 소속을 입력하세요" value={formData.salesAffiliation} onChange={(e) => updateFormData('salesAffiliation', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-8 outline-none text-white focus:border-indigo-500 placeholder:text-zinc-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">사원 성함</label>
                  <input type="text" placeholder="성명을 입력하세요" value={formData.salesName} onChange={(e) => updateFormData('salesName', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-8 outline-none text-white focus:border-indigo-500 placeholder:text-zinc-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 ml-1">사원 연락처</label>
                  <input type="tel" placeholder="010-0000-0000" value={formData.salesPhone} onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length > 3 && val.length <= 7) val = val.substring(0, 3) + '-' + val.substring(3);
                    else if (val.length > 7) val = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7, 11);
                    updateFormData('salesPhone', val);
                  }} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4.5 px-8 outline-none text-white focus:border-indigo-500 placeholder:text-zinc-800" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleBack} className="flex-1 py-5 bg-zinc-800 text-zinc-300 rounded-2xl font-bold">이전</button>
                <button onClick={handleNext} disabled={isSubmitting} className="flex-[2] py-5 bg-white text-black disabled:bg-zinc-800 rounded-2xl font-black flex items-center justify-center shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : '최종 신청하기'}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="step-complete"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-700 p-16 rounded-[4rem] text-center space-y-8 shadow-[0_40px_100px_rgba(79,70,229,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
              <div className="inline-flex w-24 h-24 bg-white/20 rounded-[2.5rem] items-center justify-center mb-2 animate-bounce"><CheckCircle2 className="text-white" size={48} /></div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white italic tracking-tighter leading-tight">회원가입신청서 작성완료</h2>
              </div>
              <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-indigo-900 rounded-[2rem] font-black hover:shadow-2xl hover:scale-[1.02] transition-all">신규 회원가입신청서 작성</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-20 text-[10px] text-zinc-700 font-bold uppercase tracking-[0.5em] opacity-40 italic">Premium Membership Platform // Advanced Digital Signing</footer>
    </div>
  );
};

export default RegistrationForm;
