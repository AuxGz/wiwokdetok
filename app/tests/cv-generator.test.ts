import { describe, it, expect } from 'vitest';
import { formatPhone, validatePhone, validateEmail, formatPeriod, calculateCvCompleteness, normalizeUrl } from '../src/components/cv/utils';
import { cvReducer, migrateData } from '../src/components/cv/reducer';
import { SAMPLE_CV_DATA, EMPTY_CV_DATA } from '../src/components/cv/constants';

describe('CV Generator Utils & Validation', () => {
  it('formats Indonesian phone numbers accurately', () => {
    expect(formatPhone('081229701800')).toBe('0812-2970-1800');
    expect(formatPhone('+6281229701800')).toBe('+62 812-2970-1800');
    expect(formatPhone('6281229701800')).toBe('+62 812-2970-1800');
  });

  it('validates phone numbers', () => {
    expect(validatePhone('0812-2970-1800')).toBe(true);
    expect(validatePhone('+62 812-2970-1800')).toBe(true);
    expect(validatePhone('12345')).toBe(false);
  });

  it('validates email addresses', () => {
    expect(validateEmail('student@smktelkom-pwt.sch.id')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(true); // optional if empty
  });

  it('normalizes URLs cleanly', () => {
    expect(normalizeUrl('github.com/user')).toBe('https://github.com/user');
    expect(normalizeUrl('https://portfolio.dev')).toBe('https://portfolio.dev');
    expect(normalizeUrl('')).toBe('');
  });

  it('formats period strings accurately for Indonesian and English', () => {
    expect(formatPeriod('07', '2023', '', '', true, 'id')).toBe('Jul 2023 - Sekarang');
    expect(formatPeriod('07', '2023', '', '', true, 'en')).toBe('Jul 2023 - Present');
    expect(formatPeriod('07', '2020', '06', '2023', false, 'id')).toBe('Jul 2020 - Jun 2023');
  });

  it('calculates CV completeness score and provides recommendations', () => {
    const { score, suggestions } = calculateCvCompleteness(SAMPLE_CV_DATA);
    expect(score).toBeGreaterThanOrEqual(90);
    expect(suggestions.length).toBeGreaterThanOrEqual(8);

    const emptyResult = calculateCvCompleteness(EMPTY_CV_DATA);
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.suggestions.some((s) => !s.completed)).toBe(true);
  });
});

describe('CV Reducer State Management', () => {
  it('handles item addition, update, duplication, and reordering', () => {
    let state = EMPTY_CV_DATA;

    // Add education
    const edu = {
      id: 'edu-test',
      school: 'SMK Telkom',
      major: 'RPL',
      startMonth: '07',
      startYear: '2023',
      endMonth: '06',
      endYear: '2026',
      current: true,
      gpa: '90',
      description: 'Web development',
    };
    state = cvReducer(state, {
      type: 'ADD_ITEM',
      payload: { section: 'education', item: edu },
    });
    expect(state.education.length).toBe(1);
    expect(state.education[0].school).toBe('SMK Telkom');

    // Update education
    state = cvReducer(state, {
      type: 'UPDATE_ITEM',
      payload: { section: 'education', id: 'edu-test', data: { school: 'SMK Telkom Purwokerto' } },
    });
    expect(state.education[0].school).toBe('SMK Telkom Purwokerto');

    // Duplicate item
    state = cvReducer(state, {
      type: 'DUPLICATE_ITEM',
      payload: { section: 'education', id: 'edu-test' },
    });
    expect(state.education.length).toBe(2);
    expect(state.education[1].id).not.toBe('edu-test');

    // Remove item
    state = cvReducer(state, {
      type: 'REMOVE_ITEM',
      payload: { section: 'education', id: 'edu-test' },
    });
    expect(state.education.length).toBe(1);

    // Section ordering
    const newOrder = ['skills', 'projects', 'education', 'experience', 'custom'];
    state = cvReducer(state, {
      type: 'REORDER_SECTIONS',
      payload: newOrder,
    });
    expect(state.meta.sectionOrder).toEqual(newOrder);

    // Toggle section visibility
    state = cvReducer(state, {
      type: 'TOGGLE_SECTION_VISIBILITY',
      payload: 'custom',
    });
    expect(state.meta.hiddenSections).toContain('custom');
    state = cvReducer(state, {
      type: 'TOGGLE_SECTION_VISIBILITY',
      payload: 'custom',
    });
    expect(state.meta.hiddenSections).not.toContain('custom');
  });

  it('migrates legacy jhic_student_cv structure and corrupted data safely', () => {
    // Legacy format
    const legacy = {
      name: 'Budi Santoso',
      role: 'Frontend Engineer',
      phone: '081234567890',
      email: 'budi@example.com',
      school: 'SMK Telkom Purwokerto',
      major: 'RPL',
      skillsList: ['HTML', 'CSS', 'JavaScript'],
    };
    const migrated = migrateData(legacy);
    expect(migrated.version).toBe(1);
    expect(migrated.personal.fullName).toBe('Budi Santoso');
    expect(migrated.personal.headline).toBe('Frontend Engineer');
    expect(migrated.education[0].school).toBe('SMK Telkom Purwokerto');
    expect(migrated.skills[0].items).toEqual(['HTML', 'CSS', 'JavaScript']);

    // Corrupted or null format
    const fallback = migrateData(null);
    expect(fallback.version).toBe(1);
    expect(fallback.personal.fullName).toBe(SAMPLE_CV_DATA.personal.fullName);

    // Corrupted non-object
    const fallbackString = migrateData('invalid json');
    expect(fallbackString.version).toBe(1);
  });
});

