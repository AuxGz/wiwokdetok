import React, { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  label,
  placeholder = 'Ketik lalu tekan Enter atau koma...',
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-[#555555]">{label}</label>}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 focus-within:bg-white focus-within:border-[#ED1E28] transition-all min-h-[42px]">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-800 shadow-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              aria-label={`Hapus tag ${tag}`}
              className="text-neutral-400 hover:text-red-500 rounded p-0.5 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : 'Tambah lagi...'}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-[#111827] focus:outline-none placeholder:text-neutral-400 py-0.5"
        />
      </div>
      {helperText && <p className="text-[11px] text-neutral-400">{helperText}</p>}
    </div>
  );
};
