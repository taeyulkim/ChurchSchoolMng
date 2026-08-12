import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '../checkbox';

describe('Checkbox Component (체크박스 컴포넌트)', () => {
  // UI-09: 기본 렌더링
  it('UI-09: 체크박스가 정상적으로 렌더링된다', () => {
    render(<Checkbox data-testid="cb" />);
    expect(screen.getByTestId('cb')).toBeInTheDocument();
  });

  // UI-10: 초기 aria-checked 상태
  it('UI-10: 초기 상태에서 aria-checked가 false이다', () => {
    render(<Checkbox data-testid="cb" />);
    const cb = screen.getByTestId('cb');
    expect(cb).toHaveAttribute('aria-checked', 'false');
  });

  // UI-11: custom className 적용
  it('UI-11: 사용자 정의 className이 올바르게 적용된다', () => {
    render(<Checkbox data-testid="cb" className="custom-check" />);
    const cb = screen.getByTestId('cb');
    expect(cb.className).toContain('custom-check');
  });

  // UI-12: 클릭 시 onCheckedChange 핸들러 호출
  it('UI-12: 클릭 시 onCheckedChange 핸들러가 호출된다', () => {
    const handleChange = vi.fn();
    render(<Checkbox data-testid="cb" onCheckedChange={handleChange} />);
    fireEvent.click(screen.getByTestId('cb'));
    expect(handleChange).toHaveBeenCalled();
  });

  // UI-13: disabled 상태 (aria-disabled)
  it('UI-13: disabled 속성 설정 시 aria-disabled가 true이다', () => {
    render(<Checkbox data-testid="cb" disabled />);
    const cb = screen.getByTestId('cb');
    expect(cb).toHaveAttribute('aria-disabled', 'true');
  });

  // UI-14: disabled 상태에서 data-disabled 속성 존재
  it('UI-14: disabled 설정 시 data-disabled 속성이 존재한다', () => {
    render(<Checkbox data-testid="cb" disabled />);
    const cb = screen.getByTestId('cb');
    expect(cb).toHaveAttribute('data-disabled');
  });

  // UI-15: role=checkbox
  it('UI-15: role이 checkbox이다', () => {
    render(<Checkbox data-testid="cb" />);
    const cb = screen.getByTestId('cb');
    expect(cb).toHaveAttribute('role', 'checkbox');
  });
});
