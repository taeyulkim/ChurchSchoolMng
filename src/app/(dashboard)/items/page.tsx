'use client';

import { useState } from 'react';
import { Package, Search, Plus, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock Data
const MOCK_ITEMS = [
  { id: 1, name: '마이크', category: '음향기기', quantity: 4, location: '본당 방송실', status: 'good' },
  { id: 2, name: '성경책 (어린이용)', category: '도서', quantity: 25, location: '유년부실', status: 'good' },
  { id: 3, name: '프로젝터 리모컨', category: '기자재', quantity: 1, location: '중등부실', status: 'missing' },
  { id: 4, name: '접이식 의자', category: '가구', quantity: 15, location: '창고', status: 'repair' },
];

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = MOCK_ITEMS.filter(item => 
    item.name.includes(searchQuery) || item.category.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">비품 관리</h1>
          <p className="text-sm text-muted-foreground">교회 학교 내 각종 비품 및 자산을 관리합니다.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          비품 등록
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="비품 이름 또는 카테고리 검색..."
          className="pl-9 h-11 bg-card shadow-sm border-transparent focus-visible:bg-background rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-card border rounded-2xl p-5 shadow-sm group hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 text-primary h-10 w-10 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={cn(
                  "bg-background font-medium",
                  item.status === 'missing' && "border-rose-300 text-rose-700 bg-rose-50",
                  item.status === 'repair' && "border-amber-300 text-amber-700 bg-amber-50"
                )}>
                  {item.status === 'good' ? '정상' : item.status === 'missing' ? '분실' : '수리 필요'}
                </Badge>
              </div>
              
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {item.location}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground font-medium">{item.category}</span>
              <span className="font-semibold">수량: {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility function inline for simplicity
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
