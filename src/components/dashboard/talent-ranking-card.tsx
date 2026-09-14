'use client';

import { useState } from 'react';
import { Trophy, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RankedBarChart, type RankedBarItem } from '@/components/charts/ranked-bar-chart';

interface TalentRankingCardProps {
  topItems: RankedBarItem[];
  allItems: RankedBarItem[];
}

/**
 * 대시보드 '학생별 달란트 획득 순위' 카드.
 * 기본은 상위 학생만 보여주고, 전체보기 버튼으로 전체 학생 순위를 팝업으로 확인할 수 있습니다.
 */
export function TalentRankingCard({ topItems, allItems }: TalentRankingCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-2 p-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            학생별 달란트 획득 순위
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">누적 달란트 기준 상위 학생</p>
        </div>
        {allItems.length > topItems.length && (
          <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => setIsOpen(true)}>
            <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
            전체보기
          </Button>
        )}
      </div>
      <div className="p-5 pt-3">
        <RankedBarChart data={topItems} color="var(--color-emerald-500)" valueSuffix="개" />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>학생별 달란트 획득 순위 (전체)</DialogTitle>
            <DialogDescription>누적 달란트 기준 전체 {allItems.length}명 순위</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <RankedBarChart data={allItems} color="var(--color-emerald-500)" valueSuffix="개" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
