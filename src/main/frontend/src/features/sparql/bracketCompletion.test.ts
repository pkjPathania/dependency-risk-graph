import { describe, expect, it } from 'vitest';
import { completeBracket } from './bracketCompletion';

describe('completeBracket', () => {
  it.each([
    ['(', ')'],
    ['[', ']'],
    ['{', '}']
  ])('inserts the matching pair for %s', (opening, closing) => {
    expect(completeBracket('SELECT ', 7, 7, opening)).toEqual({
      value: `SELECT ${opening}${closing}`,
      selectionStart: 8,
      selectionEnd: 8
    });
  });

  it('wraps selected text and keeps it selected', () => {
    expect(completeBracket('SELECT value', 7, 12, '(')).toEqual({
      value: 'SELECT (value)',
      selectionStart: 8,
      selectionEnd: 13
    });
  });

  it('moves over an existing closing bracket', () => {
    expect(completeBracket('()', 1, 1, ')')).toEqual({
      value: '()',
      selectionStart: 2,
      selectionEnd: 2
    });
  });

  it('deletes an empty bracket pair together', () => {
    expect(completeBracket('SELECT {}', 8, 8, 'Backspace')).toEqual({
      value: 'SELECT ',
      selectionStart: 7,
      selectionEnd: 7
    });
  });
});
