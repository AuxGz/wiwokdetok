import React from 'react';
import { MONTHS_ID, MONTHS_EN } from './constants';

interface PeriodPickerProps {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  onStartMonthChange: (val: string) => void;
  onStartYearChange: (val: string) => void;
  onEndMonthChange: (val: string) => void;
  onEndYearChange: (val: string) => void;
  onCurrentChange: (val: boolean) => void;
  currentCheckboxLabel?: string;
  lang?: 'id' | 'en';
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  startMonth,
  startYear,
  endMonth,
  endYear,
  current,
  onStartMonthChange,
  onStartYearChange,
  onEndMonthChange,
  onEndYearChange,
  onCurrentChange,
  currentCheckboxLabel = 'Masih berlangsung / Aktif saat ini',
  lang = 'id',
}) => {
  const currentYear = new Date().getFullYear();
  // Dynamic years from (currentYear + 5) down to (currentYear - 20)
  const years = Array.from({ length: 26 }, (_, i) => String(currentYear + 4 - i));
  const months = lang === 'en' ? MONTHS_EN : MONTHS_ID;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mulai */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1">
            Waktu Mulai
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={startMonth}
              onChange={(e) => onStartMonthChange(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
            >
              <option value="">Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={startYear}
              onChange={(e) => onStartYearChange(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
            >
              <option value="">Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selesai */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1">
            Waktu Berakhir
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              disabled={current}
              value={endMonth}
              onChange={(e) => onEndMonthChange(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              disabled={current}
              value={endYear}
              onChange={(e) => onEndYearChange(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Checkbox Present */}
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => onCurrentChange(e.target.checked)}
          className="w-4 h-4 rounded text-[#ED1E28] border-neutral-300 focus:ring-[#ED1E28]"
        />
        <span className="text-xs font-medium text-neutral-700">
          {currentCheckboxLabel}
        </span>
      </label>
    </div>
  );
};
