export interface CvLink {
  id: string;
  label: string;
  url: string;
}

export interface CvPersonal {
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
  links: CvLink[];
}

export interface CvEducation {
  id: string;
  school: string;
  major: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  gpa: string;
  description: string;
}

export interface CvExperience {
  id: string;
  role: string;
  organization: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  bullets: string[];
}

export interface CvProject {
  id: string;
  name: string;
  techStack: string[];
  url: string;
  bullets: string[];
}

export interface CvSkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface CvCustomEntry {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  bullets: string[];
}

export interface CvCustomSection {
  id: string;
  title: string;
  entries: CvCustomEntry[];
}

export interface CvMeta {
  language: 'id' | 'en';
  template: 'klasik' | 'modern' | 'ringkas';
  accent: string;
  font: 'sans' | 'serif' | 'mono-ish';
  sectionOrder: string[]; // e.g. ['education', 'experience', 'projects', 'skills', 'custom']
  hiddenSections?: string[];
}

export interface CvData {
  version: 1;
  meta: CvMeta;
  personal: CvPersonal;
  education: CvEducation[];
  experience: CvExperience[];
  projects: CvProject[];
  skills: CvSkillCategory[];
  custom: CvCustomSection[];
}

export type CvAction =
  | { type: 'SET_META'; payload: Partial<CvMeta> }
  | { type: 'UPDATE_PERSONAL'; payload: Partial<CvPersonal> }
  | { type: 'ADD_LINK'; payload: CvLink }
  | { type: 'UPDATE_LINK'; payload: { id: string; link: Partial<CvLink> } }
  | { type: 'REMOVE_LINK'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; item: any; prepend?: boolean } }
  | { type: 'UPDATE_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; id: string; data: any } }
  | { type: 'REMOVE_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; id: string } }
  | { type: 'DUPLICATE_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; id: string } }
  | { type: 'MOVE_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; fromIndex: number; toIndex: number } }
  | { type: 'REORDER_ITEMS'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; items: any[] } }
  | { type: 'REORDER_SECTIONS'; payload: string[] }
  | { type: 'TOGGLE_SECTION_VISIBILITY'; payload: string }
  | { type: 'ADD_CUSTOM_ENTRY'; payload: { sectionId: string; entry: CvCustomEntry } }
  | { type: 'UPDATE_CUSTOM_ENTRY'; payload: { sectionId: string; entryId: string; data: Partial<CvCustomEntry> } }
  | { type: 'REMOVE_CUSTOM_ENTRY'; payload: { sectionId: string; entryId: string } }
  | { type: 'RESTORE_ITEM'; payload: { section: 'education' | 'experience' | 'projects' | 'skills' | 'custom'; index: number; item: any } }
  | { type: 'RESTORE_CUSTOM_SECTION'; payload: { index: number; section: CvCustomSection } }
  | { type: 'IMPORT'; payload: CvData }
  | { type: 'RESET' }
  | { type: 'CLEAR_SAMPLE' };
