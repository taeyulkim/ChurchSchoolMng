'use client';

import { useState } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock Data
const MOCK_BUDGETS = [
  { id: 1, date: '2026-07-15', category: '행사비', description: '여름 성경 학교 간식', type: 'expense', amount: 150000 },
  { id: 2, date: '2026-07-10', category: '헌금', description: '주일 헌금', type: 'income', amount: 320000 },
  { id: 3, date: '2026-07-05', category: '비품비', description: '복사 용지 구매', type: 'expense', amount: 18000 },
  { id: 4, date: '2026-07-01', category: '이월금', description: '전월 이월', type: 'income', amount: 1250000 },
];

export default function BudgetPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const totalIncome = MOCK_BUDGETS.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0);
  const totalExpense = MOCK_BUDGETS.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">예산 관리</h1>
          <p className="text-sm text-muted-foreground">부서별 수입/지출 내역과 잔액을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="shadow-sm w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            필터
          </Button>
          <Button className="shadow-sm w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            내역 추가
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-sm font-medium">수입 합계</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {totalIncome.toLocaleString()}원
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-sm font-medium">지출 합계</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {totalExpense.toLocaleString()}원
          </div>
        </div>
        <div className="bg-primary border border-primary-foreground/10 rounded-xl p-5 shadow-sm text-primary-foreground relative overflow-hidden">
          <DollarSign className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10" />
          <div className="flex items-center justify-between mb-2 opacity-90">
            <span className="text-sm font-medium">현재 잔액</span>
          </div>
          <div className="text-3xl font-bold">
            {balance.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="내역 검색..."
              className="pl-9 h-9 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y">
          {MOCK_BUDGETS.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border",
                  item.type === 'income' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                  {item.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {item.description}
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-background">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.date}
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "text-lg font-bold text-right",
                item.type === 'income' ? "text-emerald-600" : "text-foreground"
              )}>
                {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
