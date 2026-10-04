import type { CvData, CvAction } from './types';
import { SAMPLE_CV_DATA, EMPTY_CV_DATA, generateId } from './constants';

export const CURRENT_STORAGE_KEY = 'cvgen:v1';
export const BACKUP_STORAGE_KEY = 'cvgen:backup';

export function cvReducer(state: CvData, action: CvAction): CvData {
  switch (action.type) {
    case 'SET_META': {
      return {
        ...state,
        meta: { ...state.meta, ...action.payload },
      };
    }

    case 'UPDATE_PERSONAL': {
      return {
        ...state,
        personal: { ...state.personal, ...action.payload },
      };
    }

    case 'ADD_LINK': {
      return {
        ...state,
        personal: {
          ...state.personal,
          links: [...state.personal.links, action.payload],
        },
      };
    }

    case 'UPDATE_LINK': {
      return {
        ...state,
        personal: {
          ...state.personal,
          links: state.personal.links.map((link) =>
            link.id === action.payload.id ? { ...link, ...action.payload.link } : link
          ),
        },
      };
    }

    case 'REMOVE_LINK': {
      return {
        ...state,
        personal: {
          ...state.personal,
          links: state.personal.links.filter((link) => link.id !== action.payload.id),
        },
      };
    }

    case 'ADD_ITEM': {
      const { section, item, prepend = true } = action.payload;
      if (section === 'custom') {
        return {
          ...state,
          custom: prepend ? [item, ...state.custom] : [...state.custom, item],
        };
      }
      const list = [...(state[section] as any[])];
      const updated = prepend ? [item, ...list] : [...list, item];
      return {
        ...state,
        [section]: updated,
      };
    }

    case 'UPDATE_ITEM': {
      const { section, id, data } = action.payload;
      if (section === 'custom') {
        return {
          ...state,
          custom: state.custom.map((item) => (item.id === id ? { ...item, ...data } : item)),
        };
      }
      return {
        ...state,
        [section]: (state[section] as any[]).map((item) =>
          item.id === id ? { ...item, ...data } : item
        ),
      };
    }

    case 'REMOVE_ITEM': {
      const { section, id } = action.payload;
      if (section === 'custom') {
        return {
          ...state,
          custom: state.custom.filter((item) => item.id !== id),
        };
      }
      return {
        ...state,
        [section]: (state[section] as any[]).filter((item) => item.id !== id),
      };
    }

    case 'DUPLICATE_ITEM': {
      const { section, id } = action.payload;
      if (section === 'custom') {
        const itemIdx = state.custom.findIndex((i) => i.id === id);
        if (itemIdx === -1) return state;
        const orig = state.custom[itemIdx];
        const clone = {
          ...orig,
          id: generateId(),
          title: `${orig.title} (Salinan)`,
          entries: orig.entries.map((e) => ({ ...e, id: generateId() })),
        };
        const next = [...state.custom];
        next.splice(itemIdx + 1, 0, clone);
        return { ...state, custom: next };
      }
      const list = [...(state[section] as any[])];
      const itemIdx = list.findIndex((i) => i.id === id);
      if (itemIdx === -1) return state;
      const orig = list[itemIdx];
      const clone = { ...orig, id: generateId() };
      list.splice(itemIdx + 1, 0, clone);
      return { ...state, [section]: list };
    }

    case 'MOVE_ITEM': {
      const { section, fromIndex, toIndex } = action.payload;
      if (section === 'custom') {
        if (fromIndex < 0 || fromIndex >= state.custom.length || toIndex < 0 || toIndex >= state.custom.length) return state;
        const list = [...state.custom];
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        return { ...state, custom: list };
      }
      const list = [...(state[section] as any[])];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return state;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { ...state, [section]: list };
    }

    case 'REORDER_ITEMS': {
      const { section, items } = action.payload;
      return {
        ...state,
        [section]: items,
      };
    }

    case 'REORDER_SECTIONS': {
      return {
        ...state,
        meta: {
          ...state.meta,
          sectionOrder: action.payload,
        },
      };
    }

    case 'TOGGLE_SECTION_VISIBILITY': {
      const sectionId = action.payload;
      const currentHidden = state.meta.hiddenSections || [];
      const isHidden = currentHidden.includes(sectionId);
      const nextHidden = isHidden
        ? currentHidden.filter((s) => s !== sectionId)
        : [...currentHidden, sectionId];
      return {
        ...state,
        meta: {
          ...state.meta,
          hiddenSections: nextHidden,
        },
      };
    }

    case 'ADD_CUSTOM_ENTRY': {
      const { sectionId, entry } = action.payload;
      return {
        ...state,
        custom: state.custom.map((sec) =>
          sec.id === sectionId
            ? { ...sec, entries: [entry, ...sec.entries] }
            : sec
        ),
      };
    }

    case 'UPDATE_CUSTOM_ENTRY': {
      const { sectionId, entryId, data } = action.payload;
      return {
        ...state,
        custom: state.custom.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                entries: sec.entries.map((entry) =>
                  entry.id === entryId ? { ...entry, ...data } : entry
                ),
              }
            : sec
        ),
      };
    }

    case 'REMOVE_CUSTOM_ENTRY': {
      const { sectionId, entryId } = action.payload;
      return {
        ...state,
        custom: state.custom.map((sec) =>
          sec.id === sectionId
            ? { ...sec, entries: sec.entries.filter((entry) => entry.id !== entryId) }
            : sec
        ),
      };
    }

    case 'RESTORE_ITEM': {
      const { section, index, item } = action.payload;
      if (section === 'custom') {
        const next = [...state.custom];
        next.splice(index, 0, item);
        return { ...state, custom: next };
      }
      const list = [...(state[section] as any[])];
      list.splice(index, 0, item);
      return { ...state, [section]: list };
    }

    case 'RESTORE_CUSTOM_SECTION': {
      const { index, section } = action.payload;
      const next = [...state.custom];
      next.splice(index, 0, section);
      return { ...state, custom: next };
    }

    case 'IMPORT': {
      return action.payload;
    }

    case 'RESET': {
      return EMPTY_CV_DATA;
    }

    case 'CLEAR_SAMPLE': {
      return {
        ...EMPTY_CV_DATA,
        meta: state.meta,
      };
    }

    default:
      return state;
  }
}

export function migrateData(raw: any): CvData {
  if (!raw || typeof raw !== 'object') {
    return SAMPLE_CV_DATA;
  }

  // If old flat structure from existing cv-generator.astro (jhic_student_cv)
  if (!raw.version && (raw.name || raw.school || raw.skills)) {
    const migrated: CvData = {
      version: 1,
      meta: {
        language: 'id',
        template: 'modern',
        accent: '#ED1E28',
        font: 'sans',
        sectionOrder: ['education', 'projects', 'experience', 'skills', 'custom'],
        hiddenSections: [],
      },
      personal: {
        fullName: raw.name || '',
        headline: raw.role || '',
        phone: raw.phone || '',
        email: raw.email || '',
        address: raw.address || '',
        summary: raw.about || '',
        links: [],
      },
      education: raw.school
        ? [
            {
              id: generateId(),
              school: raw.school,
              major: raw.major || '',
              startMonth: '07',
              startYear: '2023',
              endMonth: '',
              endYear: '',
              current: true,
              gpa: '',
              description: '',
            },
          ]
        : [],
      experience: raw.expRole || raw.expOrg
        ? [
            {
              id: generateId(),
              role: raw.expRole || '',
              organization: raw.expOrg || '',
              startMonth: '',
              startYear: raw.expYear || '',
              endMonth: '',
              endYear: '',
              current: false,
              bullets: raw.expDesc ? [raw.expDesc] : [],
            },
          ]
        : [],
      projects: [],
      skills: raw.skillsList
        ? [
            {
              id: generateId(),
              category: 'Keahlian Teknis',
              items: raw.skillsList,
            },
          ]
        : [],
      custom: [],
    };
    return migrated;
  }

  return {
    version: 1,
    meta: {
      language: raw.meta?.language || 'id',
      template: raw.meta?.template || 'modern',
      accent: raw.meta?.accent || '#ED1E28',
      font: raw.meta?.font || 'sans',
      sectionOrder: raw.meta?.sectionOrder || ['education', 'projects', 'experience', 'skills', 'custom'],
      hiddenSections: raw.meta?.hiddenSections || [],
    },
    personal: {
      fullName: raw.personal?.fullName || '',
      headline: raw.personal?.headline || '',
      phone: raw.personal?.phone || '',
      email: raw.personal?.email || '',
      address: raw.personal?.address || '',
      summary: raw.personal?.summary || '',
      links: Array.isArray(raw.personal?.links) ? raw.personal.links : [],
    },
    education: Array.isArray(raw.education) ? raw.education : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    custom: Array.isArray(raw.custom) ? raw.custom : [],
  };
}
