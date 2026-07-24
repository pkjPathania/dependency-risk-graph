export interface BracketEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const OPENING_BRACKETS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}'
};

const CLOSING_BRACKETS = new Set(Object.values(OPENING_BRACKETS));

export function completeBracket(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  key: string
): BracketEdit | null {
  const closingBracket = OPENING_BRACKETS[key];
  if (closingBracket) {
    const selectedText = value.slice(selectionStart, selectionEnd);
    return {
      value:
        value.slice(0, selectionStart) +
        key +
        selectedText +
        closingBracket +
        value.slice(selectionEnd),
      selectionStart: selectionStart + 1,
      selectionEnd: selectionEnd + 1
    };
  }

  if (
    CLOSING_BRACKETS.has(key) &&
    selectionStart === selectionEnd &&
    value.at(selectionStart) === key
  ) {
    return {
      value,
      selectionStart: selectionStart + 1,
      selectionEnd: selectionStart + 1
    };
  }

  if (key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
    const openingBracket = value.at(selectionStart - 1);
    const closing = openingBracket ? OPENING_BRACKETS[openingBracket] : undefined;
    if (closing && value.at(selectionStart) === closing) {
      return {
        value: value.slice(0, selectionStart - 1) + value.slice(selectionStart + 1),
        selectionStart: selectionStart - 1,
        selectionEnd: selectionStart - 1
      };
    }
  }

  return null;
}
