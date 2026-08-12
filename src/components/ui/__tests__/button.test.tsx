import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component (버튼 컴포넌트)', () => {
  // UI-01: 기본 렌더링
  it('UI-01: 자식 요소(텍스트)를 올바르게 렌더링한다', () => {
    render(<Button>클릭하세요</Button>);
    expect(screen.getByText('클릭하세요')).toBeInTheDocument();
  });

  // UI-02: 기본 variant 클래스 적용
  it('UI-02: 기본 variant(default)에 bg-primary 클래스가 적용된다', () => {
    render(<Button data-testid="btn">기본</Button>);
    const button = screen.getByTestId('btn');
    expect(button.className).toContain('bg-primary');
  });

  // UI-03: destructive variant 클래스 적용
  it('UI-03: destructive variant에 bg-destructive 클래스가 적용된다', () => {
    render(<Button variant="destructive" data-testid="btn">삭제</Button>);
    const button = screen.getByTestId('btn');
    expect(button.className).toContain('bg-destructive');
  });

  // UI-04: outline variant 클래스 적용
  it('UI-04: outline variant에 border 관련 클래스가 적용된다', () => {
    render(<Button variant="outline" data-testid="btn">외곽선</Button>);
    const button = screen.getByTestId('btn');
    expect(button.className).toContain('border');
  });

  // UI-05: custom className 적용
  it('UI-05: 사용자 정의 className이 올바르게 적용된다', () => {
    render(<Button className="my-custom-class" data-testid="btn">커스텀</Button>);
    const button = screen.getByTestId('btn');
    expect(button.className).toContain('my-custom-class');
  });

  // UI-06: 클릭 이벤트 처리
  it('UI-06: 클릭 시 onClick 핸들러가 정확히 한 번 호출된다', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>클릭</Button>);
    fireEvent.click(screen.getByText('클릭'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // UI-07: disabled 상태
  it('UI-07: disabled 속성이 설정된 경우 버튼이 비활성화된다', () => {
    render(<Button disabled>비활성화</Button>);
    expect(screen.getByText('비활성화')).toBeDisabled();
  });

  // UI-08: disabled 상태에서 클릭 이벤트 차단
  it('UI-08: disabled 상태에서 클릭해도 onClick 핸들러가 호출되지 않는다', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>비활성화</Button>);
    fireEvent.click(screen.getByText('비활성화'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
