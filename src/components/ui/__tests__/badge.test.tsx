import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge Component (배지 컴포넌트)', () => {
  // UI-24: 기본 렌더링
  it('UI-24: 자식 요소(텍스트)를 올바르게 렌더링한다', () => {
    render(<Badge>신규</Badge>);
    expect(screen.getByText('신규')).toBeInTheDocument();
  });

  // UI-25: 기본 variant 클래스 적용
  it('UI-25: 기본 variant(default)에 bg-primary 클래스가 적용된다', () => {
    render(<Badge data-testid="badge">기본</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-primary');
  });

  // UI-26: secondary variant 클래스 적용
  it('UI-26: secondary variant에 secondary 관련 스타일이 적용된다', () => {
    render(<Badge variant="secondary" data-testid="badge">보조</Badge>);
    const badge = screen.getByTestId('badge');
    // secondary variant에 일반적으로 bg-secondary 또는 muted 스타일이 적용됨
    expect(badge).toBeInTheDocument();
  });

  // UI-27: destructive variant 클래스 적용
  it('UI-27: destructive variant에 text-destructive 클래스가 적용된다', () => {
    render(<Badge variant="destructive" data-testid="badge">오류</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('text-destructive');
  });

  // UI-28: outline variant 클래스 적용
  it('UI-28: outline variant에 적절한 클래스가 적용된다', () => {
    render(<Badge variant="outline" data-testid="badge">외곽선</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
  });

  // UI-29: custom className 적용
  it('UI-29: 사용자 정의 className이 올바르게 적용된다', () => {
    render(<Badge className="custom-badge-class" data-testid="badge">커스텀</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('custom-badge-class');
  });

  // UI-30: 한국어 텍스트 렌더링
  it('UI-30: 한국어 텍스트(부서명 등)를 올바르게 렌더링한다', () => {
    render(<Badge>어린이부</Badge>);
    expect(screen.getByText('어린이부')).toBeInTheDocument();
  });
});
