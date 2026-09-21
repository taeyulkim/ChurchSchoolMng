'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, Coins } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTalentRules, updateTalentRule } from '@/lib/actions/talent';
import { isMasterAdmin } from '@/lib/actions/user';
import { DEFAULT_TALENT_RULES, type TalentRule } from '@/lib/talent-categories';

export default function TalentRulesPage() {
  const [isMaster, setIsMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rules, setRules] = useState<TalentRule[]>(DEFAULT_TALENT_RULES);
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const masterCheck = await isMasterAdmin();
      setIsMaster(masterCheck);
      if (masterCheck) {
        const res = await getTalentRules();
        const list = res.success && res.data ? res.data : DEFAULT_TALENT_RULES;
        setRules(list);
        setSaved(Object.fromEntries(list.map((r) => [r.category, r.amount])));
        setDrafts(Object.fromEntries(list.map((r) => [r.category, String(r.amount)])));
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleSave = async (rule: TalentRule) => {
    const amount = Number(drafts[rule.category]);
    setSavingKey(rule.category);
    try {
      const res = await updateTalentRule(rule.category, amount);
      if (!res.success) {
        toast.error(res.error || '규정을 저장하지 못했습니다.');
        return;
      }
      setSaved((prev) => ({ ...prev, [rule.category]: amount }));
      toast.success(`${rule.label} 규정을 ${amount}달란트로 저장했습니다.`);
    } catch {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-amber-50 text-amber-600 p-6 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-sm">달란트 규정 설정은 마스터 관리자만 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">달란트 규정</h1>
        <p className="text-sm text-muted-foreground">
          항목별 부여 금액을 정합니다. 달란트 통장의 항목 버튼과 출석 &apos;달란트 일괄 부여&apos;에 바로 적용되며, 이미 부여한 이력은 바뀌지 않습니다.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {rules.map((rule) => {
          const draft = drafts[rule.category] ?? '';
          const value = Number(draft);
          const isValid = Number.isInteger(value) && value >= 1 && value <= 1000;
          const changed = isValid && value !== saved[rule.category];
          return (
            <div key={rule.category} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{rule.label}</p>
                {!isValid && <p className="text-xs text-destructive">1~1000 사이의 정수를 입력하세요.</p>}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  className="w-24 text-right tabular-nums"
                  value={draft}
                  aria-label={`${rule.label} 금액`}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [rule.category]: e.target.value }))}
                />
                <span className="text-sm text-muted-foreground">달란트</span>
                <Button
                  size="sm"
                  disabled={!changed || savingKey === rule.category}
                  onClick={() => handleSave(rule)}
                >
                  {savingKey === rule.category ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        &apos;기타&apos;는 규정 없이 부여할 때마다 수량과 사유를 직접 입력합니다.
      </p>
    </div>
  );
}
