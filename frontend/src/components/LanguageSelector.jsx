import React from 'react';
import { Globe, Languages, Check } from 'lucide-react';

const LANGUAGES = [
  {
    id: 'english',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    description: 'Executive & analytical summary in English',
  },
  {
    id: 'chinese',
    label: 'Chinese',
    nativeLabel: '简体中文',
    flag: '🇨🇳',
    description: '标准简体中文结构化分析报告',
  },
  {
    id: 'malay',
    label: 'Malay',
    nativeLabel: 'Bahasa Melayu',
    flag: '🇲🇾',
    description: 'Ringkasan berstruktur dalam Bahasa Melayu',
  },
];

const LanguageSelector = ({ selectedLanguage, onChange, disabled }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Languages className="w-4 h-4 text-sky-600" />
        <label className="text-sm font-bold text-slate-800">
          Target Output Summary Language
        </label>
        <span className="text-xs text-slate-400 font-normal">
          (Transcript stays in original spoken voice)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(lang.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50/70'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-2xl select-none" role="img" aria-label={lang.label}>
                {lang.flag}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {lang.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                </div>
                <div className="text-xs font-medium text-slate-500">{lang.nativeLabel}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{lang.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSelector;

