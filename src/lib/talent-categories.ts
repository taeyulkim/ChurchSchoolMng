export type RuleCategory = 'attendance' | 'verse' | 'evangelism' | 'bible' | 'birthday';
export type TalentCategory = RuleCategory | 'other' | 'use';

export interface TalentRule {
  category: RuleCategory;
  label: string;
  amount: number;
}

/** 통장의 항목 열 (사용 열은 별도로 표시) */
export const PASSBOOK_COLUMNS: { key: RuleCategory | 'other'; label: string }[] = [
  { key: 'attendance', label: '출석' },
  { key: 'verse', label: '암송' },
  { key: 'evangelism', label: '전도' },
  { key: 'bible', label: '성경책' },
  { key: 'birthday', label: '생일' },
  { key: 'other', label: '기타' },
];

export const RULE_CATEGORIES: RuleCategory[] = ['attendance', 'verse', 'evangelism', 'bible', 'birthday'];

/** DB의 규정 테이블을 읽지 못할 때 쓰는 기본 규정 (2025 달란트) */
export const DEFAULT_TALENT_RULES: TalentRule[] = [
  { category: 'attendance', label: '출석', amount: 2 },
  { category: 'verse', label: '암송', amount: 1 },
  { category: 'evangelism', label: '전도', amount: 5 },
  { category: 'bible', label: '성경책', amount: 1 },
  { category: 'birthday', label: '생일', amount: 5 },
];

export function categoryLabel(category: string): string {
  if (category === 'use') return '사용';
  return PASSBOOK_COLUMNS.find((c) => c.key === category)?.label ?? '기타';
}
