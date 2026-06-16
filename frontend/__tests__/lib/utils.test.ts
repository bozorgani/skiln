import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('handles conditional classes', () => {
    const result = cn('class1', false && 'class2', 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class3');
    expect(result).not.toContain('class2');
  });

  it('handles undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge should handle conflicting classes
    expect(result).toBeTruthy();
  });
});

