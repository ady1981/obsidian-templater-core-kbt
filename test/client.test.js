const { strObj, strJson, removeLineWithPlaceholder } = require('../src/client');

describe('strObj', () => {
  test('should correctly stringify a simple object', () => {
    const testMap = {'akey': 'avalue'}
    const expected = 'akey: avalue';
    expect(strObj(testMap)).toBe(expected);
  });
});

describe('strJson', () => {
  test('should correctly stringify a simple object', () => {
    const testMap = {'akey': 'avalue'}
    const expected = JSON.stringify(testMap, null, 2);
    expect(strJson(testMap)).toBe(expected);
  });
});

describe('removeLineWithPlaceholder', () => {
  test('should remove the line with the placeholder', () => {
    const text = 'line 1\nline 2 {{}}\nline 3';
    const expected = 'line 1\nline 3';
    expect(removeLineWithPlaceholder(text)).toBe(expected);
  });

  test('should return the original text if no placeholder is found', () => {
    const text = 'line 1\nline 2\nline 3';
    expect(removeLineWithPlaceholder(text)).toBe(text);
  });

  test('should return the original text if the text is empty', () => {
    const text = '';
    expect(removeLineWithPlaceholder(text)).toBe(text);
  });
});
