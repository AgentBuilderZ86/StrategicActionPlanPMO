import { describe, it, expect } from 'vitest';
import { segmentCode, genererCode } from './utils';

describe('segmentCode', () => {
  it('combine préfixe de niveau et position 1-based', () => {
    expect(segmentCode(1, 1)).toBe('PS1');
    expect(segmentCode(2, 2)).toBe('CS2');
    expect(segmentCode(3, 1)).toBe('PRJ1');
    expect(segmentCode(4, 3)).toBe('AP3');
    expect(segmentCode(5, 2)).toBe('SA2');
  });

  it('utilise le repli générique au-delà de 5 niveaux', () => {
    expect(segmentCode(6, 1)).toBe('N61');
  });
});

describe('genererCode', () => {
  it('concatène le chemin des ancêtres avec le segment du nœud', () => {
    expect(genererCode([], 1, 1)).toBe('PS1');
    expect(genererCode(['PS1'], 2, 2)).toBe('PS1.CS2');
    expect(genererCode(['PS1', 'CS2'], 3, 1)).toBe('PS1.CS2.PRJ1');
    expect(genererCode(['PS1', 'CS2', 'PRJ1'], 4, 3)).toBe('PS1.CS2.PRJ1.AP3');
  });
});
