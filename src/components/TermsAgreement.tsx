'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface TermItem {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

interface TermsAgreementProps {
  terms: TermItem[];
  onAgreementChange: (agreements: Record<string, boolean>) => void;
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({ terms, onAgreementChange }) => {
  const [agreements, setAgreements] = useState<Record<string, boolean>>(
    Object.fromEntries(terms.map((t) => [t.id, false]))
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleAgreement = (id: string) => {
    const newAgreements = { ...agreements, [id]: !agreements[id] };
    setAgreements(newAgreements);
    onAgreementChange(newAgreements);
  };

  const toggleAll = () => {
    const allChecked = Object.values(agreements).every((v) => v);
    const newAgreements = Object.fromEntries(terms.map((t) => [t.id, !allChecked]));
    setAgreements(newAgreements);
    onAgreementChange(newAgreements);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isAllChecked = Object.values(agreements).every((v) => v);

  return (
    <div className="flex flex-col gap-4 w-full p-6 bg-transparent">
      <div 
        onClick={toggleAll}
        className={`flex items-center gap-3 p-5 rounded-2xl cursor-pointer transition-all border ${
          isAllChecked 
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
          : 'bg-theme border-theme text-sub hover:border-indigo-300'
        }`}
      >
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isAllChecked ? 'bg-white border-white' : 'border-theme'}`}>
          {isAllChecked && <Check size={14} className="text-indigo-600" />}
        </div>
        <span className="font-bold">전체 약관에 동의합니다.</span>
      </div>

      <div className="space-y-3">
        {terms.map((term) => (
          <div key={term.id} className="bg-theme border border-theme rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 px-5">
              <div 
                onClick={() => toggleAgreement(term.id)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${agreements[term.id] ? 'bg-indigo-600 border-indigo-600' : 'border-theme group-hover:border-indigo-400'}`}>
                  {agreements[term.id] && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-theme">
                  {term.title} <span className={term.required ? 'text-indigo-500' : 'text-sub'}>{term.required ? '(필수)' : '(선택)'}</span>
                </span>
              </div>
              <button 
                onClick={() => toggleExpand(term.id)}
                className="text-sub hover:text-indigo-500 transition-colors p-1"
              >
                {expanded[term.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            
            {expanded[term.id] && (
              <div className="p-5 bg-card text-[11px] text-sub leading-relaxed border-t border-theme whitespace-pre-wrap">
                {term.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsAgreement;
