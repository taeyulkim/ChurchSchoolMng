'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Plus, MapPin, Loader2, Trash2 } from 'lucide-react';

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
import { ItemForm } from '@/components/items/item-form';
import { getItems, deleteItem } from '@/lib/actions/item';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

type ItemRow = Database['public']['Tables']['items']['Row'];

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    const res = await getItems();
    if (res.success && res.data) {
      setItems(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.name.includes(searchQuery) || item.category.includes(searchQuery)
  );

  const handleEditClick = (item: ItemRow) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteItem(deleteTarget.id);
      if (!res.success) {
        toast.error('비품 삭제 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${deleteTarget.name}이(가) 삭제되었습니다.`);
      setDeleteTarget(null);
      fetchItems();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">비품 관리</h1>
          <p className="text-sm text-muted-foreground">교회 학교 내 각종 비품 및 자산을 관리합니다.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm" onClick={() => setIsAddOpen(true)}>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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

              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => handleEditClick(item)}>
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
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

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 bg-card border rounded-xl shadow-sm text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>등록된 비품이 없습니다.</p>
          </div>
        )}
      </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>비품 등록</DialogTitle>
            <DialogDescription>새로운 비품 정보를 등록합니다.</DialogDescription>
          </DialogHeader>
          <ItemForm
            onSuccess={() => {
              setIsAddOpen(false);
              fetchItems();
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>비품 정보 수정</DialogTitle>
            <DialogDescription>기존 비품 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <ItemForm
              initialData={selectedItem}
              onSuccess={() => {
                setIsEditOpen(false);
                fetchItems();
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>비품 삭제</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


