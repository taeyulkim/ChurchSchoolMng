import { describe, it, expect } from 'vitest';
import { buildPassbook, canCorrect, normalizeCategory, type PassbookEntry } from '../talent-passbook';

function entry(partial: Partial<PassbookEntry> & Pick<PassbookEntry, 'id' | 'created_at'>): PassbookEntry {
  return {
    type: 'grant',
    amount: 2,
    category: 'attendance',
    corrects_id: null,
    reason: '출석',
    recorded_by_name: '박은혜',
    ...partial,
  };
}

describe('talent-passbook', () => {
  it('P-01: 같은 날짜의 부여는 한 행으로 합쳐지고 잔액이 누적된다', () => {
    const book = buildPassbook([
      entry({ id: 1, created_at: '2026-07-06T02:00:00Z' }),
      entry({ id: 2, created_at: '2026-07-06T02:01:00Z', category: 'evangelism', amount: 5, reason: '전도' }),
      entry({ id: 3, created_at: '2026-07-12T02:00:00Z' }),
    ]);

    expect(book.rows).toHaveLength(2);
    expect(book.rows[0].cells).toEqual({ attendance: 2, evangelism: 5 });
    expect(book.rows[0].balance).toBe(7);
    expect(book.rows[1].prevBalance).toBe(7);
    expect(book.rows[1].balance).toBe(9);
    expect(book.balance).toBe(9);
  });

  it('P-02: 사용(차감)은 사용 열에 들어가고 잔액에서 빠진다', () => {
    const book = buildPassbook([
      entry({ id: 1, created_at: '2026-07-06T02:00:00Z', amount: 10 }),
      entry({ id: 2, created_at: '2026-08-02T03:00:00Z', type: 'deduct', category: 'use', amount: 4, reason: '달란트 사용' }),
    ]);

    expect(book.rows[1].use).toBe(4);
    expect(book.rows[1].prevBalance).toBe(10);
    expect(book.rows[1].balance).toBe(6);
  });

  it('P-03: 정정은 원래 항목 열에 마이너스로 표시되고 정정된 건은 다시 정정할 수 없다', () => {
    const original = entry({ id: 1, created_at: '2026-07-06T02:00:00Z' });
    const correction = entry({
      id: 2,
      created_at: '2026-07-07T02:00:00Z',
      type: 'deduct',
      corrects_id: 1,
      reason: '정정: 출석',
    });
    const book = buildPassbook([original, correction]);

    expect(book.rows[1].cells).toEqual({ attendance: -2 });
    expect(book.balance).toBe(0);
    expect(book.correctedIds.has(1)).toBe(true);
    expect(canCorrect(original, book.correctedIds)).toBe(false);
    expect(canCorrect(correction, book.correctedIds)).toBe(false);
  });

  it('P-04: 정정되지 않은 부여 건은 정정할 수 있다', () => {
    const e = entry({ id: 5, created_at: '2026-07-06T02:00:00Z' });
    expect(canCorrect(e, buildPassbook([e]).correctedIds)).toBe(true);
  });

  it('P-05: category가 없는 과거 이력은 부여=기타, 차감=사용으로 본다', () => {
    expect(normalizeCategory({ type: 'grant', category: null })).toBe('other');
    expect(normalizeCategory({ type: 'deduct', category: null })).toBe('use');
  });

  it('P-06: 날짜는 UTC가 아니라 한국 시간 기준으로 묶는다', () => {
    // UTC 7/6 15:30 = KST 7/7 00:30
    const book = buildPassbook([entry({ id: 1, created_at: '2026-07-06T15:30:00Z' })]);
    expect(book.rows[0].date).toBe('2026-07-07');
  });
});
