import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { getCurrentProfile } from '@/lib/actions/user';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await getCurrentProfile();
  
  if (!res.success || !res.data) {
    redirect('/login?error=no_profile');
  }

  const profile = res.data;
  const permissions = (profile.permissions as Record<string, boolean>) || {};
  // 최고 관리자는 모든 권한 허용
  if (profile.role === 'admin') {
    permissions.attendance = true;
    permissions.talent = true;
    permissions.budget = true;
    permissions.items = true;
    permissions.schedule = true;
    permissions.users = true;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />

      <div className="flex flex-1">
        <Sidebar permissions={permissions} />

        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl px-4 py-6 md:px-6 lg:px-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <BottomNav permissions={permissions} />
    </div>
  );
}
