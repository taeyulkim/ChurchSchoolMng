import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component (인풋 컴포넌트)', () => {
  // UI-16: placeholder 렌더링
  it('UI-16: placeholder가 올바르게 표시된다', () => {
    render(<Input placeholder="검색어를 입력하세요" />);
    expect(screen.getByPlaceholderText('검색어를 입력하세요')).toBeInTheDocument();
  });

  // UI-17: custom className 적용
  it('UI-17: 사용자 정의 className이 적용된다', () => {
    render(<Input data-testid="inp" className="my-input-class" />);
    const input = screen.getByTestId('inp');
    expect(input.className).toContain('my-input-class');
  });

  // UI-18: 텍스트 입력
  it('UI-18: 텍스트 입력 시 value가 변경된다', () => {
    render(<Input data-testid="inp" />);
    const input = screen.getByTestId('inp') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '홍길동' } });
    expect(input.value).toBe('홍길동');
  });

  // UI-19: onChange 핸들러 호출
  it('UI-19: 값 변경 시 onChange 핸들러가 호출된다', () => {
    const handleChange = vi.fn();
    render(<Input data-testid="inp" onChange={handleChange} />);
    const input = screen.getByTestId('inp');
    fireEvent.change(input, { target: { value: '테스트' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // UI-20: disabled 상태
  it('UI-20: disabled 속성 설정 시 입력이 비활성화된다', () => {
    render(<Input data-testid="inp" disabled />);
    expect(screen.getByTestId('inp')).toBeDisabled();
  });

  // UI-21: type=password 적용
  it('UI-21: type="password" 설정 시 password 타입으로 렌더링된다', () => {
    render(<Input data-testid="inp" type="password" />);
    const input = screen.getByTestId('inp') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  // UI-22: type=number 적용
  it('UI-22: type="number" 설정 시 number 타입으로 렌더링된다', () => {
    render(<Input data-testid="inp" type="number" />);
    const input = screen.getByTestId('inp') as HTMLInputElement;
    expect(input.type).toBe('number');
  });

  // UI-23: 기본 type은 text
  it('UI-23: type 속성 미지정 시 기본 타입은 text이다', () => {
    render(<Input data-testid="inp" />);
    const input = screen.getByTestId('inp') as HTMLInputElement;
    expect(input.type).toBe('text');
  });
});
