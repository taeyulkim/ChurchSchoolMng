'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * 다크모드 테마 프로바이더
 * - system / light / dark 3가지 모드 지원
 * - class 기반 테마 적용 (TailwindCSS .dark 클래스)
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
