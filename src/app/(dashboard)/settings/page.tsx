'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <div className="bg-primary/10 p-6 rounded-full text-primary">
        <Settings className="h-16 w-16" />
      </div>
      <h1 className="text-3xl font-bold">시스템 설정</h1>
      <p className="text-muted-foreground">설정 페이지는 현재 개발 중입니다.</p>
    </div>
  );
}
