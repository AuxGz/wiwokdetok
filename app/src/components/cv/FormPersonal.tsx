import React, { useState } from 'react';
import { useCv } from './CvContext';
import { formatPhone, validatePhone, validateEmail, normalizeUrl } from './utils';
import { generateId } from './constants';
import type { CvLink } from './types';

export const FormPersonal: React.FC = () => {
  const { data, dispatch, focusedEntryId } = useCv();
  const { personal } = data;

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const update = (field: keyof typeof personal, value: any) => {
    dispatch({
      type: 'UPDATE_PERSONAL',
      payload: { [field]: value },
    });
  };

  const handlePhoneBlur = () => {
    const raw = personal.phone;
    if (!raw) {
      setPhoneError('');
      return;
    }
    const formatted = formatPhone(raw);
    update('phone', formatted);
    if (!validatePhone(formatted)) {
      setPhoneError('Format nomor telepon kurang sesuai (cth: 0812-2970-1800 atau +62 812-2970-1800).');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailBlur = () => {
    if (personal.email && !validateEmail(personal.email)) {
      setEmailError('Format email tidak valid.');
    } else {
      setEmailError('');
    }
  };

  const handleAddLink = (label: string = 'GitHub', url: string = '') => {
    const newLink: CvLink = {
      id: generateId(),
      label,
      url,
    };
    dispatch({ type: 'ADD_LINK', payload: newLink });
  };

  const handleUpdateLink = (id: string, partial: Partial<CvLink>) => {
    dispatch({ type: 'UPDATE_LINK', payload: { id, link: partial } });
  };

  const handleRemoveLink = (id: string) => {
    dispatch({ type: 'REMOVE_LINK', payload: { id } });
  };

  const isFocused = focusedEntryId === 'sec-personal';

  return (
    <div
      id="sec-personal"
      className={`bg-white rounded-2xl p-6 sm:p-7 border transition-all duration-200 shadow-xs space-y-5 ${
        isFocused ? 'border-[#ED1E28] ring-2 ring-[#ED1E28]/20' : 'border-[#E7E8EA]'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Data Diri
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Informasi kontak utama dan target peran profesional
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Wajib
        </span>
      </div>

      {/* Row: Nama Lengkap */}
      <div>
        <label className="block text-xs font-semibold text-[#555555] mb-1">
          Nama Lengkap <span className="text-[#ED1E28]">*</span>
        </label>
        <input
          type="text"
          value={personal.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          placeholder="cth. Cresendo Assyabani Darmawan"
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
        />
      </div>

      {/* Row: Target Profesi / Headline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-[#555555]">
            Target Profesi / Headline <span className="text-[#ED1E28]">*</span>
          </label>
          <span
            className={`text-[11px] ${
              personal.headline.length > 60 ? 'text-amber-600 font-medium' : 'text-neutral-400'
            }`}
          >
            {personal.headline.length}/60 karakter
          </span>
        </div>
        <input
          type="text"
          value={personal.headline}
          onChange={(e) => update('headline', e.target.value)}
          placeholder="cth. Junior Full-Stack Developer & UI Designer"
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
        />
        <p className="text-[11px] text-neutral-400 mt-1">
          Satu fokus peran yang kamu tuju untuk mempermudah screening magang/pekerjaan.
        </p>
      </div>

      {/* Contact Row: Telp & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1">
            No. Telepon / WhatsApp <span className="text-[#ED1E28]">*</span>
          </label>
          <input
            type="text"
            value={personal.phone}
            onChange={(e) => update('phone', e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="0812-2970-1800"
            className={`w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border text-sm text-[#111827] focus:bg-white focus:outline-none transition-all ${
              phoneError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#ED1E28]'
            }`}
          />
          {phoneError && <p className="text-[11px] text-red-500 mt-1">{phoneError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1">
            Email <span className="text-[#ED1E28]">*</span>
          </label>
          <input
            type="email"
            value={personal.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="cresendo@smktelkom-pwt.sch.id"
            className={`w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border text-sm text-[#111827] focus:bg-white focus:outline-none transition-all ${
              emailError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#ED1E28]'
            }`}
          />
          {emailError && <p className="text-[11px] text-red-500 mt-1">{emailError}</p>}
        </div>
      </div>

      {/* Row: Domisili / Alamat */}
      <div>
        <label className="block text-xs font-semibold text-[#555555] mb-1">
          Domisili / Kota
        </label>
        <input
          type="text"
          value={personal.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="cth. Purwokerto, Jawa Tengah"
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
        />
        <p className="text-[11px] text-neutral-400 mt-1">
          Cukup cantumkan Kota & Provinsi untuk privasi keamanan (tidak perlu alamat lengkap RT/RW).
        </p>
      </div>

      {/* Row: Ringkasan / Summary */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-[#555555]">
            Tentang Saya / Ringkasan Profil
          </label>
          <span
            className={`text-[11px] ${
              personal.summary.length > 350
                ? 'text-amber-600 font-medium'
                : personal.summary.length >= 100
                ? 'text-emerald-600 font-medium'
                : 'text-neutral-400'
            }`}
          >
            {personal.summary.length} karakter (ideal: 100-300)
          </span>
        </div>
        <textarea
          rows={3}
          value={personal.summary}
          onChange={(e) => update('summary', e.target.value)}
          placeholder="Tuliskan 2-3 kalimat mengenai fokus jurusan, teknologi utama yang dikuasai, dan tujuan kariermu..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all resize-y"
        />
      </div>

      {/* Row: Tautan Portofolio / GitHub / LinkedIn */}
      <div className="space-y-3 pt-2 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#555555]">
            Tautan Profil & Portofolio
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddLink('GitHub', 'https://github.com/')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors"
            >
              + GitHub
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('LinkedIn', 'https://linkedin.com/in/')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors"
            >
              + LinkedIn
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('Portofolio', 'https://')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors"
            >
              + Portofolio
            </button>
          </div>
        </div>

        {personal.links.map((link) => (
          <div key={link.id} className="flex items-center gap-2">
            <input
              type="text"
              value={link.label}
              onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
              placeholder="Label (cth. GitHub)"
              className="w-28 sm:w-32 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
              onBlur={() => handleUpdateLink(link.id, { url: normalizeUrl(link.url) })}
              placeholder="https://..."
              className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleRemoveLink(link.id)}
              aria-label="Hapus tautan"
              className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
