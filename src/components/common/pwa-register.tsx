'use client';

import { useEffect } from 'react';

/** PWA 설치(홈 화면에 추가) 조건을 충족시키기 위한 서비스워커 등록. 화면에는 아무것도 렌더링하지 않습니다. */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
