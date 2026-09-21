import { getKstDateString } from '@/lib/date-kst';
import { PASSBOOK_COLUMNS, type TalentCategory } from '@/lib/talent-categories';

export interface PassbookEntry {
  id: number;
  type: 'grant' | 'deduct';
  amount: number;
  category: string | null;
  corrects_id: number | null;
  reason: string;
  recorded_by_name: string;
  created_at: string;
}

export type CellKey = (typeof PASSBOOK_COLUMNS)[number]['key'];

export interface PassbookRow {
  /** 'yyyy-MM-dd' (한국 날짜) */
  date: string;
  /** 항목별 그날의 순증감 (정정은 마이너스로 반영) */
  cells: Partial<Record<CellKey, number>>;
  use: number;
  /** 이 행이 시작되기 전 잔액 */
  prevBalance: number;
  balance: number;
  entries: PassbookEntry[];
}

export interface Passbook {
  rows: PassbookRow[];
  balance: number;
  /** 이미 정정된 부여 건의 id */
  correctedIds: Set<number>;
}

/** category가 비어 있는 과거 이력을 부여는 '기타', 차감은 '사용'으로 봅니다. */
export function normalizeCategory(entry: Pick<PassbookEntry, 'type' | 'category'>): TalentCategory {
  if (entry.category) return entry.category as TalentCategory;
  return entry.type === 'deduct' ? 'use' : 'other';
}

export function buildPassbook(entries: PassbookEntry[]): Passbook {
  const sorted = [...entries].sort((a, b) => {
    const t = a.created_at.localeCompare(b.created_at);
    return t !== 0 ? t : a.id - b.id;
  });

  const correctedIds = new Set<number>();
  sorted.forEach((e) => {
    if (e.corrects_id != null) correctedIds.add(e.corrects_id);
  });

  const rows: PassbookRow[] = [];
  let balance = 0;

  sorted.forEach((entry) => {
    const date = getKstDateString(new Date(entry.created_at));
    let row = rows[rows.length - 1];
    if (!row || row.date !== date) {
      row = { date, cells: {}, use: 0, prevBalance: balance, balance, entries: [] };
      rows.push(row);
    }

    const category = normalizeCategory(entry);
    const signed = entry.type === 'grant' ? entry.amount : -entry.amount;

    if (category === 'use' && entry.type === 'deduct') {
      row.use += entry.amount;
    } else {
      const key: CellKey = category === 'use' ? 'other' : (category as CellKey);
      row.cells[key] = (row.cells[key] ?? 0) + signed;
    }

    balance += signed;
    row.balance = balance;
    row.entries.push(entry);
  });

  return { rows, balance, correctedIds };
}

/** 부여 건만, 그리고 아직 정정되지 않은 경우에만 정정할 수 있습니다. */
export function canCorrect(entry: PassbookEntry, correctedIds: Set<number>): boolean {
  return entry.type === 'grant' && entry.corrects_id == null && !correctedIds.has(entry.id);
}
