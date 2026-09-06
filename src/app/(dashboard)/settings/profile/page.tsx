'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentProfile, updateProfile } from '@/lib/actions/user';
import { updateAuthUser } from '@/lib/actions/auth';
import { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const profileFormSchema = z.object({
  name: z.string().min(2, '이름을 2자 이상 입력해주세요.'),
  department: z.string(),
  birth_date: z.date().optional(),
});

const passwordFormSchema = z.object({
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', department: '', birth_date: undefined },
  });

  const birthDate = profileForm.watch('birth_date');

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    async function fetchProfile() {
      const res = await getCurrentProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        profileForm.reset({
          name: res.data.name,
          department: res.data.department || '어린이부',
          birth_date: res.data.birth_date ? new Date(res.data.birth_date) : undefined,
        });
      }
      setIsLoadingProfile(false);
    }
    fetchProfile();
  }, [profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!profile) return;
    setIsUpdatingProfile(true);
    
    const res = await updateProfile(profile.id, {
      name: values.name,
      department: values.department as any,
      birth_date: values.birth_date ? format(values.birth_date, 'yyyy-MM-dd') : null,
    });
    
    if (res.success) {
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
    } else {
      toast.error('프로필 업데이트에 실패했습니다.');
    }
    setIsUpdatingProfile(false);
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsUpdatingPassword(true);
    
    const res = await updateAuthUser(values.password);
    
    if (res.success) {
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      passwordForm.reset();
    } else {
      toast.error('비밀번호 변경에 실패했습니다.');
    }
    setIsUpdatingPassword(false);
  }

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">내 정보 관리</h1>
        <p className="text-sm text-muted-foreground">이름, 부서 및 비밀번호를 변경할 수 있습니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>시스템에 표시될 이름과 담당 부서를 변경합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당 부서</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="부서를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="유아부">유아부</SelectItem>
                        <SelectItem value="유치부">유치부</SelectItem>
                        <SelectItem value="어린이부">어린이부</SelectItem>
                        <SelectItem value="청소년부">청소년부</SelectItem>
                        <SelectItem value="청년부">청년부</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="birth_date"
                render={() => (
                  <FormItem className="flex flex-col">
                    <FormLabel>생년월일</FormLabel>
                    <FormDescription>
                      입력하시면 일정 관리에 생일이 담당 부서 일정으로 자동 표시됩니다.
                    </FormDescription>
                    <Popover>
                      <PopoverTrigger render={
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !birthDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {birthDate ? format(birthDate, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
                        </Button>
                      } />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={birthDate}
                          onSelect={(date) => date && profileForm.setValue('birth_date', date)}
                          defaultMonth={birthDate}
                          captionLayout="dropdown"
                          locale={ko}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                정보 저장
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>계정의 비밀번호를 안전하게 변경하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="6자리 이상" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="비밀번호 다시 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="secondary" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                비밀번호 변경
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
