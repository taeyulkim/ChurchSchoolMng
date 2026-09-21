'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  correctTalentTransaction,
  createTalentTransaction,
  getTalentHistory,
  grantTalentsBatch,
  type TalentGrantItem,
} from '@/lib/actions/talent';
import { Database } from '@/lib/supabase/database.types';
import { getKstDateString } from '@/lib/date-kst';
import {
  PASSBOOK_COLUMNS,
  categoryLabel,
  type RuleCategory,
  type TalentRule,
} from '@/lib/talent-categories';
import {
  buildPassbook,
  canCorrect,
  normalizeCategory,
  type PassbookEntry,
} from '@/lib/talent-passbook';

type StudentRow = Database['public']['Tables']['students']['Row'];
type Mode = 'grant' | 'use';

const QUICK_USE_VALUES = [1, 5, 10];

function formatDate(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

async function fetchEntries(studentId: number): Promise<PassbookEntry[] | null> {
  const res = await getTalentHistory({ studentId });
  if (!res.success || !res.data) return null;
  return res.data.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    category: e.category,
    corrects_id: e.corrects_id,
    reason: e.reason,
    recorded_by_name: e.recorded_by_name,
    created_at: e.created_at,
  }));
}

interface TalentPassbookDialogProps {
  student: StudentRow | null;
  initialMode: Mode;
  rules: TalentRule[];
  onClose: () => void;
  onChanged: () => void;
}

export function TalentPassbookDialog({ student, initialMode, rules, onClose, onChanged }: TalentPassbookDialogProps) {
  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>달란트 통장</DialogTitle>
          <DialogDescription>항목을 골라 부여하면 아래 통장에 날짜별로 기록됩니다.</DialogDescription>
        </DialogHeader>
        {student && (
          <PassbookBody
            key={student.id}
            student={student}
            initialMode={initialMode}
            rules={rules}
            onChanged={onChanged}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PassbookBodyProps {
  student: StudentRow;
  initialMode: Mode;
  rules: TalentRule[];
  onChanged: () => void;
}

function PassbookBody({ student, initialMode, rules, onChanged }: PassbookBodyProps) {
  const [entries, setEntries] = useState<PassbookEntry[] | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [etcAmount, setEtcAmount] = useState('');
  const [etcMemo, setEtcMemo] = useState('');
  const [useAmount, setUseAmount] = useState('');
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchEntries(student.id).then((result) => {
      if (!alive) return;
      if (result) setEntries(result);
      else {
        setEntries([]);
        toast.error('달란트 통장을 불러오지 못했습니다.');
      }
    });
    return () => {
      alive = false;
    };
  }, [student.id]);

  const passbook = useMemo(() => buildPassbook(entries ?? []), [entries]);
  const balance = passbook.balance;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const reload = async () => {
    const result = await fetchEntries(student.id);
    if (result) setEntries(result);
    onChanged();
  };

  const ruleAmount = (category: RuleCategory) => rules.find((r) => r.category === category)?.amount ?? 0;

  const grantItems: TalentGrantItem[] = [];
  const grantParts: string[] = [];
  let grantTotal = 0;
  rules.forEach((rule) => {
    if (!selected[rule.category]) return;
    grantItems.push({ category: rule.category });
    grantParts.push(`${rule.label} ${rule.amount}`);
    grantTotal += rule.amount;
  });
  const etcValue = parseInt(etcAmount, 10) || 0;
  if (selected.other && etcValue > 0) {
    grantItems.push({ category: 'other', amount: etcValue, memo: etcMemo });
    grantParts.push(`기타 ${etcValue}`);
    grantTotal += etcValue;
  }

  const useValue = parseInt(useAmount, 10) || 0;
  const exceedsBalance = useValue > balance;

  const toggle = (key: string) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGrant = async () => {
    setIsSubmitting(true);
    try {
      const res = await grantTalentsBatch(student.id, grantItems);
      if (!res.success) {
        toast.error(res.error || '달란트 부여 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${student.name} 학생에게 ${res.data?.total ?? grantTotal}달란트를 부여했습니다.`);
      setSelected({});
      setEtcAmount('');
      setEtcMemo('');
      await reload();
    } catch {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUse = async () => {
    setIsSubmitting(true);
    try {
      const res = await createTalentTransaction({
        student_id: student.id,
        type: 'deduct',
        amount: useValue,
        reason: '달란트 사용',
        category: 'use',
      });
      if (!res.success) {
        toast.error(res.error || '달란트 사용 처리 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${student.name} 학생이 ${useValue}달란트를 사용했습니다.`);
      setUseAmount('');
      await reload();
    } catch {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrect = async (entry: PassbookEntry) => {
    if (confirmId !== entry.id) {
      setConfirmId(entry.id);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await correctTalentTransaction(entry.id);
      if (!res.success) {
        toast.error(res.error || '정정 중 오류가 발생했습니다.');
        return;
      }
      toast.success('정정했습니다. 통장에 마이너스 줄이 추가됩니다.');
      await reload();
    } catch {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setConfirmId(null);
      setIsSubmitting(false);
    }
  };

  const today = getKstDateString();
  const columnCount = PASSBOOK_COLUMNS.length + 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
          {student.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold truncate">{student.name}</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0 h-4">
              {student.department}
            </Badge>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="flex items-center justify-end gap-1 text-2xl font-bold tracking-tight tabular-nums">
            <Coins className="h-5 w-5 text-primary" />
            {balance.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">현재 잔액</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setMode('grant')}
          aria-pressed={mode === 'grant'}
          className={cn(
            'rounded-lg py-2 text-sm font-semibold transition-colors',
            mode === 'grant' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'text-muted-foreground'
          )}
        >
          달란트 부여
        </button>
        <button
          type="button"
          onClick={() => setMode('use')}
          aria-pressed={mode === 'use'}
          className={cn(
            'rounded-lg py-2 text-sm font-semibold transition-colors',
            mode === 'use' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'text-muted-foreground'
          )}
        >
          달란트 사용
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">날짜</span>
        <span className="rounded-full border bg-muted/40 px-3 py-0.5 font-semibold tabular-nums">
          {formatDate(today)}
          <span className="ml-1.5 text-[11px] font-semibold text-primary">오늘</span>
        </span>
      </div>

      {mode === 'grant' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {rules.map((rule) => (
              <ChipButton
                key={rule.category}
                label={rule.label}
                sub={`+${ruleAmount(rule.category)}`}
                pressed={!!selected[rule.category]}
                onClick={() => toggle(rule.category)}
              />
            ))}
            <ChipButton label="기타" sub="직접 입력" pressed={!!selected.other} onClick={() => toggle('other')} />
          </div>
          {selected.other && (
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <Input
                type="number"
                min={1}
                placeholder="수량"
                value={etcAmount}
                onChange={(e) => setEtcAmount(e.target.value)}
              />
              <Input
                type="text"
                placeholder="사유 (예: 특송 참여)"
                value={etcMemo}
                onChange={(e) => setEtcMemo(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="min-w-0 text-sm text-muted-foreground">
              {grantTotal > 0 ? (
                <>
                  <b className="text-foreground">{grantParts.join(' + ')}</b> = <b className="text-foreground">{grantTotal}</b>달란트
                </>
              ) : (
                '항목을 선택하세요'
              )}
            </p>
            <Button
              onClick={handleGrant}
              disabled={isSubmitting || grantTotal === 0}
              className="shrink-0 bg-emerald-600 font-bold hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {grantTotal > 0 ? `${grantTotal}달란트 부여하기` : '부여하기'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            placeholder="사용할 달란트 수량"
            value={useAmount}
            onChange={(e) => setUseAmount(e.target.value)}
          />
          <div className="flex gap-2">
            {QUICK_USE_VALUES.map((v) => (
              <Button
                key={v}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setUseAmount(String(useValue + v))}
              >
                +{v}
              </Button>
            ))}
          </div>
          {exceedsBalance && (
            <p className="text-xs text-destructive">보유 달란트({balance.toLocaleString()})보다 많이 사용할 수 없습니다.</p>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm text-muted-foreground">
              {useValue > 0 && !exceedsBalance ? (
                <>
                  사용 후 잔액 <b className="text-foreground">{balance - useValue}</b>
                </>
              ) : (
                '사용할 수량을 입력하세요'
              )}
            </p>
            <Button
              onClick={handleUse}
              disabled={isSubmitting || useValue < 1 || exceedsBalance}
              className="shrink-0 bg-rose-600 font-bold hover:bg-rose-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {useValue > 0 ? `${useValue}달란트 사용하기` : '사용하기'}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border-[1.5px] border-teal-300 bg-teal-50/30 dark:border-teal-800 dark:bg-teal-950/20">
        <div className="flex items-baseline justify-between bg-teal-100/70 px-3.5 pb-2 pt-2.5 font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
          달란트 통장
          <small className="text-[11px] font-medium opacity-85">행을 누르면 기록자 확인 · 정정</small>
        </div>
        <div ref={scrollRef} className="max-h-[300px] overflow-auto">
          {entries === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : passbook.rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">아직 기록이 없습니다.</p>
          ) : (
            <table className="w-full min-w-[470px] border-collapse text-[13px] tabular-nums">
              <thead>
                <tr>
                  <Th sticky corner>날짜</Th>
                  {PASSBOOK_COLUMNS.map((c) => (
                    <Th key={c.key}>{c.label}</Th>
                  ))}
                  <Th>사용</Th>
                  <Th>잔액</Th>
                </tr>
              </thead>
              <tbody>
                {passbook.rows.map((row) => {
                  const isOpen = openDate === row.date;
                  return (
                    <Fragment key={row.date}>
                      <tr
                        className="cursor-pointer hover:bg-primary/5"
                        onClick={() => {
                          setOpenDate(isOpen ? null : row.date);
                          setConfirmId(null);
                        }}
                      >
                        <Td sticky>{formatDate(row.date)}</Td>
                        {PASSBOOK_COLUMNS.map((c) => {
                          const v = row.cells[c.key];
                          return v ? (
                            <Td key={c.key} className={cn('font-semibold', v > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                              {v > 0 ? v : `−${Math.abs(v)}`}
                            </Td>
                          ) : (
                            <Td key={c.key} className="text-muted-foreground/40">
                              ·
                            </Td>
                          );
                        })}
                        {row.use > 0 ? (
                          <Td className="font-semibold text-rose-600 dark:text-rose-400">−{row.use}</Td>
                        ) : (
                          <Td className="text-muted-foreground/40">·</Td>
                        )}
                        <Td className="font-bold">
                          {row.use > 0 && (
                            <s className="mr-1 text-[11px] font-normal text-muted-foreground decoration-rose-500 decoration-[1.5px]">
                              {row.prevBalance}
                            </s>
                          )}
                          {row.balance}
                        </Td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={columnCount} className="border-b border-dotted border-teal-300 bg-primary/5 px-3 py-2 text-xs dark:border-teal-800">
                            <ul className="space-y-1.5">
                              {row.entries.map((e) => {
                                const category = normalizeCategory(e);
                                const sign = e.type === 'grant' ? '+' : '−';
                                return (
                                  <li key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="font-semibold">
                                      {categoryLabel(category)} {sign}
                                      {e.amount}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {e.recorded_by_name} 선생님 · {formatTime(e.created_at)}
                                      {e.reason && e.reason !== categoryLabel(category) ? ` · ${e.reason}` : ''}
                                    </span>
                                    {canCorrect(e, passbook.correctedIds) && (
                                      <Button
                                        type="button"
                                        variant={confirmId === e.id ? 'destructive' : 'outline'}
                                        size="sm"
                                        className="ml-auto h-6 px-2 text-[11px]"
                                        disabled={isSubmitting}
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          handleCorrect(e);
                                        }}
                                      >
                                        {confirmId === e.id ? '정말 정정할까요?' : `정정 (−${e.amount})`}
                                      </Button>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-dotted border-teal-300 px-3.5 py-2 text-[11.5px] text-muted-foreground dark:border-teal-800">
          사용한 날은 이전 잔액에 줄이 그어지고 새 잔액이 적힙니다. 정정하면 원래 이력은 남고 마이너스 줄이 추가됩니다.
        </div>
      </div>
    </div>
  );
}

function ChipButton({ label, sub, pressed, onClick }: { label: string; sub: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        'relative rounded-xl border-[1.5px] px-1.5 pb-2 pt-2.5 text-center transition-colors hover:border-primary',
        pressed ? 'border-primary bg-primary/10' : 'border-border bg-card'
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className={cn('block text-xs tabular-nums', pressed ? 'font-semibold text-primary' : 'text-muted-foreground')}>{sub}</span>
      {pressed && <span className="absolute right-2 top-1 text-[11px] font-bold text-primary">✓</span>}
    </button>
  );
}

function Th({ children, sticky, corner }: { children: React.ReactNode; sticky?: boolean; corner?: boolean }) {
  return (
    <th
      className={cn(
        'sticky top-0 border-b border-r border-dotted border-teal-300 bg-teal-100 px-1 py-2 text-xs font-bold text-teal-700 last:border-r-0 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
        sticky && 'left-0 w-[52px]',
        corner ? 'z-20' : 'z-10'
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, sticky, className }: { children: React.ReactNode; sticky?: boolean; className?: string }) {
  return (
    <td
      className={cn(
        'whitespace-nowrap border-b border-r border-dotted border-teal-300 px-1 py-2 text-center last:border-r-0 dark:border-teal-800',
        sticky && 'sticky left-0 z-[5] w-[52px] bg-background',
        className
      )}
    >
      {children}
    </td>
  );
}
