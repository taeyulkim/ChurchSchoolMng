import { QrScanner } from '@/components/auth/qr-scanner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QrLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm my-8">
        <div className="text-center relative">
          <Link href="/login" className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            학생 QR 로그인
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            선생님께 받은 QR 코드를 화면에 비춰주세요.
          </p>
        </div>

        <QrScanner />

        <div className="text-center text-sm pt-4 border-t">
          <span className="text-muted-foreground">교사이신가요? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            교사 이메일 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
