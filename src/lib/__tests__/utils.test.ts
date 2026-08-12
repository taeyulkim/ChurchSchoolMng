import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils.cn', () => {
  it('should merge classes correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'truthy-class', false && 'falsy-class')).toBe('base-class truthy-class');
  });

  it('should resolve tailwind conflicts', () => {
    expect(cn('p-4 p-8')).toBe('p-8');
    expect(cn('px-2', 'p-4')).toBe('p-4');
  });
});
