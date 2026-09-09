'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithPassword, signOutAction } from '@/lib/actions/auth';

import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'no_profile') {
      toast.error('프로필 정보가 없습니다. 회원가입을 다시 진행하거나 관리자에게 문의하세요.');
      signOutAction();
    }
    if (searchParams.get('error') === 'deactivated') {
      toast.error('비활성화된 계정입니다. 관리자에게 문의하세요.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithPassword(email, password);
      
      if (res.success) {
        toast.success('로그인 되었습니다.');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(res.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border shadow-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          교회학교 관리 시스템
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          계정 정보를 입력하여 로그인하세요.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="teacher@church.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            이메일 로그인
          </Button>
          
          <Button type="button" variant="outline" className="w-full h-11 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary" asChild>
            <Link href="/qr-login">
              학생 QR 스캔으로 로그인
            </Link>
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">아직 교사 계정이 없으신가요? </span>
          <Link href="/signup" className="text-primary hover:underline font-medium">
            가입 신청
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
