'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpWithPassword } from '@/lib/actions/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('어린이부');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('모든 정보를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      toast.error('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithPassword(email, password, name, department);
      
      if (res.success) {
        setIsSuccess(true);
      } else {
        toast.error(res.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl border shadow-sm text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">가입 신청 완료</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            교사 계정 신청이 완료되었습니다.<br />
            보안을 위해 <strong>최고 관리자의 승인 이후</strong>부터<br />
            시스템에 로그인하실 수 있습니다.
          </p>
          <Button className="w-full mt-4" asChild>
            <Link href="/login">로그인 화면으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border shadow-sm my-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            교사 회원가입
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            교회학교 관리 시스템 교사 계정을 신청합니다.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="홍길동"
                className="pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>담당 부서</Label>
            <Select value={department} onValueChange={(v) => v && setDepartment(v)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="부서를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="유아부">유아부</SelectItem>
                <SelectItem value="유치부">유치부</SelectItem>
                <SelectItem value="어린이부">어린이부</SelectItem>
                <SelectItem value="청소년부">청소년부</SelectItem>
                <SelectItem value="청년부">청년부</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="6자리 이상 입력"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            가입 신청하기
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
