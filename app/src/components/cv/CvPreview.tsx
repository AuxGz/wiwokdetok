import React, { useRef } from 'react';
import type { CvData } from './types';
import { formatPeriod } from './utils';

interface CvPreviewProps {
  data: CvData;
  scale?: number;
  onEntryClick?: (entryId: string) => void;
  hoverHighlight?: string | null;
}

export const CvPreview: React.FC<CvPreviewProps> = ({
  data,
  scale = 1,
  onEntryClick,
  hoverHighlight,
}) => {
  const { meta, personal, education, experience, projects, skills, custom } = data;
  const { language, template, accent, font, sectionOrder, hiddenSections = [] } = meta;

  const fontClass =
    font === 'serif'
      ? 'font-serif'
      : font === 'mono-ish'
      ? 'font-mono'
      : 'font-sans';

  // Section Headers Dictionary
  const HEADERS = {
    education: language === 'en' ? 'EDUCATION' : 'PENDIDIKAN',
    projects: language === 'en' ? 'KEY PROJECTS' : 'PROYEK & PORTOFOLIO',
    experience: language === 'en' ? 'EXPERIENCE & LEADERSHIP' : 'PENGALAMAN & ORGANISASI',
    skills: language === 'en' ? 'TECHNICAL SKILLS' : 'KEAHLIAN TEKNIS',
    custom: language === 'en' ? 'ADDITIONAL HIGHLIGHTS' : 'INFORMASI TAMBAHAN',
  };

  // Helper check if section has content
  const hasContent = (secId: string) => {
    if (hiddenSections.includes(secId)) return false;
    switch (secId) {
      case 'education':
        return education.length > 0 && education.some((e) => e.school.trim());
      case 'experience':
        return experience.length > 0 && experience.some((e) => e.organization.trim() || e.role.trim());
      case 'projects':
        return projects.length > 0 && projects.some((p) => p.name.trim());
      case 'skills':
        return skills.length > 0 && skills.some((s) => s.items.length > 0);
      case 'custom':
        return custom.length > 0 && custom.some((c) => c.entries.length > 0);
      default:
        return false;
    }
  };

  // Render individual sections
  const renderSection = (secId: string) => {
    if (!hasContent(secId)) return null;

    switch (secId) {
      case 'education':
        return (
          <div key="education" className="mb-4 cv-section-block">
            <h2
              className={`text-[12px] font-bold tracking-wider uppercase pb-1 mb-2 ${
                template === 'modern'
                  ? 'border-b-[1.5px]'
                  : template === 'klasik'
                  ? 'border-b border-neutral-300 text-center tracking-widest'
                  : 'border-b border-neutral-200'
              }`}
              style={{
                borderColor: template === 'modern' ? accent : '#d1d5db',
                color: template === 'modern' ? accent : '#111827',
              }}
            >
              {HEADERS.education}
            </h2>
            <div className="space-y-2.5">
              {education.map((edu) => {
                const period = formatPeriod(
                  edu.startMonth,
                  edu.startYear,
                  edu.endMonth,
                  edu.endYear,
                  edu.current,
                  language
                );

                return (
                  <div
                    key={edu.id}
                    onClick={() => onEntryClick && onEntryClick(edu.id)}
                    className={`cv-entry-item p-1 -m-1 rounded cursor-pointer transition-colors ${
                      hoverHighlight === edu.id ? 'bg-red-50/60 ring-1 ring-[#ED1E28]' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-bold text-[11px] text-neutral-900">
                        {edu.school}
                      </div>
                      {period && (
                        <div className="text-[10px] text-neutral-500 font-medium shrink-0">
                          {period}
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between gap-2 text-[10px] text-neutral-700">
                      <div>
                        {edu.major}
                        {edu.gpa && <span className="text-neutral-500 ml-1.5">• Nilai: {edu.gpa}</span>}
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-[9.5px] text-neutral-600 mt-0.5 leading-relaxed">
                        {edu.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'projects':
        return (
          <div key="projects" className="mb-4 cv-section-block">
            <h2
              className={`text-[12px] font-bold tracking-wider uppercase pb-1 mb-2 ${
                template === 'modern'
                  ? 'border-b-[1.5px]'
                  : template === 'klasik'
                  ? 'border-b border-neutral-300 text-center tracking-widest'
                  : 'border-b border-neutral-200'
              }`}
              style={{
                borderColor: template === 'modern' ? accent : '#d1d5db',
                color: template === 'modern' ? accent : '#111827',
              }}
            >
              {HEADERS.projects}
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onEntryClick && onEntryClick(proj.id)}
                  className={`cv-entry-item p-1 -m-1 rounded cursor-pointer transition-colors ${
                    hoverHighlight === proj.id ? 'bg-red-50/60 ring-1 ring-[#ED1E28]' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-bold text-[11px] text-neutral-900">
                      {proj.name}
                      {proj.techStack.length > 0 && (
                        <span className="font-normal text-[9.5px] text-neutral-600 ml-2">
                          | {proj.techStack.join(', ')}
                        </span>
                      )}
                    </div>
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9.5px] text-blue-600 hover:underline shrink-0 max-w-[150px] truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {proj.url.replace(/^https?:\/\//i, '')}
                      </a>
                    )}
                  </div>
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="list-disc list-outside pl-3.5 mt-1 space-y-0.5 text-[9.5px] text-neutral-700 leading-relaxed">
                      {proj.bullets.filter(Boolean).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'experience':
        return (
          <div key="experience" className="mb-4 cv-section-block">
            <h2
              className={`text-[12px] font-bold tracking-wider uppercase pb-1 mb-2 ${
                template === 'modern'
                  ? 'border-b-[1.5px]'
                  : template === 'klasik'
                  ? 'border-b border-neutral-300 text-center tracking-widest'
                  : 'border-b border-neutral-200'
              }`}
              style={{
                borderColor: template === 'modern' ? accent : '#d1d5db',
                color: template === 'modern' ? accent : '#111827',
              }}
            >
              {HEADERS.experience}
            </h2>
            <div className="space-y-2.5">
              {experience.map((exp) => {
                const period = formatPeriod(
                  exp.startMonth,
                  exp.startYear,
                  exp.endMonth,
                  exp.endYear,
                  exp.current,
                  language
                );

                return (
                  <div
                    key={exp.id}
                    onClick={() => onEntryClick && onEntryClick(exp.id)}
                    className={`cv-entry-item p-1 -m-1 rounded cursor-pointer transition-colors ${
                      hoverHighlight === exp.id ? 'bg-red-50/60 ring-1 ring-[#ED1E28]' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-bold text-[11px] text-neutral-900">
                        {exp.role}
                      </div>
                      {period && (
                        <div className="text-[10px] text-neutral-500 font-medium shrink-0">
                          {period}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-medium text-neutral-700">
                      {exp.organization}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-3.5 mt-1 space-y-0.5 text-[9.5px] text-neutral-700 leading-relaxed">
                        {exp.bullets.filter(Boolean).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div key="skills" className="mb-4 cv-section-block">
            <h2
              className={`text-[12px] font-bold tracking-wider uppercase pb-1 mb-2 ${
                template === 'modern'
                  ? 'border-b-[1.5px]'
                  : template === 'klasik'
                  ? 'border-b border-neutral-300 text-center tracking-widest'
                  : 'border-b border-neutral-200'
              }`}
              style={{
                borderColor: template === 'modern' ? accent : '#d1d5db',
                color: template === 'modern' ? accent : '#111827',
              }}
            >
              {HEADERS.skills}
            </h2>
            <div className="space-y-1 text-[10px] text-neutral-800">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => onEntryClick && onEntryClick(skill.id)}
                  className={`cv-entry-item flex items-baseline gap-2 p-0.5 rounded cursor-pointer ${
                    hoverHighlight === skill.id ? 'bg-red-50/60 ring-1 ring-[#ED1E28]' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span className="font-bold text-neutral-900 shrink-0">
                    {skill.category}:
                  </span>
                  <span className="text-neutral-700">
                    {skill.items.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'custom':
        return (
          <div key="custom" className="space-y-4 cv-section-block">
            {custom.map((sec) => (
              <div key={sec.id} className="mb-4">
                <h2
                  className={`text-[12px] font-bold tracking-wider uppercase pb-1 mb-2 ${
                    template === 'modern'
                      ? 'border-b-[1.5px]'
                      : template === 'klasik'
                      ? 'border-b border-neutral-300 text-center tracking-widest'
                      : 'border-b border-neutral-200'
                  }`}
                  style={{
                    borderColor: template === 'modern' ? accent : '#d1d5db',
                    color: template === 'modern' ? accent : '#111827',
                  }}
                >
                  {sec.title}
                </h2>
                <div className="space-y-2">
                  {sec.entries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => onEntryClick && onEntryClick(sec.id)}
                      className={`cv-entry-item p-1 -m-1 rounded cursor-pointer transition-colors ${
                        hoverHighlight === sec.id ? 'bg-red-50/60 ring-1 ring-[#ED1E28]' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-bold text-[10.5px] text-neutral-900">
                          {entry.title}
                        </div>
                        {entry.year && (
                          <div className="text-[10px] text-neutral-500 font-medium shrink-0">
                            {entry.year}
                          </div>
                        )}
                      </div>
                      {entry.subtitle && (
                        <div className="text-[9.5px] text-neutral-600">
                          {entry.subtitle}
                        </div>
                      )}
                      {entry.bullets && entry.bullets.length > 0 && (
                        <ul className="list-disc list-outside pl-3.5 mt-0.5 space-y-0.5 text-[9.5px] text-neutral-700">
                          {entry.bullets.filter(Boolean).map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id="cv-paper-root"
      className={`cv-preview-paper bg-white text-neutral-900 shadow-xl mx-auto ${fontClass} relative select-text`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 18mm',
        boxSizing: 'border-box',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {/* Header Info */}
      <header
        className={`mb-4 pb-3 ${
          template === 'klasik'
            ? 'text-center border-b border-neutral-300'
            : template === 'ringkas'
            ? 'border-b border-neutral-200'
            : 'border-b-2'
        }`}
        style={{
          borderColor: template === 'modern' ? accent : '#e5e7eb',
        }}
      >
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: template === 'modern' ? accent : '#111827' }}
        >
          {personal.fullName || 'Nama Lengkap Anda'}
        </h1>
        {personal.headline && (
          <div className="text-[12px] font-semibold text-neutral-600 mt-0.5">
            {personal.headline}
          </div>
        )}

        {/* Contacts & Links bar */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-neutral-600 mt-2">
          {personal.phone && (
            <span className="flex items-center gap-1">
              <span>📞</span> {personal.phone}
            </span>
          )}
          {personal.email && (
            <span className="flex items-center gap-1">
              <span>✉️</span> {personal.email}
            </span>
          )}
          {personal.address && (
            <span className="flex items-center gap-1">
              <span>📍</span> {personal.address}
            </span>
          )}
          {personal.links.map((link) => (
            <span key={link.id} className="flex items-center gap-1">
              <span>🔗</span>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>

        {/* Summary */}
        {personal.summary && (
          <p className="text-[10px] text-neutral-700 mt-2.5 leading-relaxed text-justify">
            {personal.summary}
          </p>
        )}
      </header>

      {/* Dynamic Sections by sectionOrder */}
      <main className="space-y-1">
        {sectionOrder.map((secId) => renderSection(secId))}
      </main>
    </div>
  );
};
