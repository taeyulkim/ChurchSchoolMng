import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('student_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="force-light-theme min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center px-4 mx-auto justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-primary">교회학교 학생 페이지</span>
          </div>
          <div className="flex items-center gap-2">
            <form action={async () => {
              'use server';
              const c = await cookies();
              c.delete('student_token');
              redirect('/login');
            }}>
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                종료
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
