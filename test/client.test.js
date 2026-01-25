const { strProperties, strJson, removeLineWithPlaceholder, formatDifferenceResult, formatFactualQA } = require('../src/client');
const difference = require('./difference.json');

describe('strProperties', () => {
  test('should correctly stringify a simple object', () => {
    const testMap = {'akey': 'avalue'}
    const expected = 'akey: avalue';
    expect(strProperties(testMap)).toBe(expected);
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

describe('formatFactualQA', () => {
  test('should correctly format factual Q&A results with references', () => {
    const result = {
      items: [
        {
          answer_text: 'The capital of France is Paris.',
          answer_references: [
            { reference_text: 'Wikipedia', reference_type: 'external' },
            { reference_text: 'Internal Doc ID 123', reference_type: 'internal_knowledge' }
          ]
        },
        {
          answer_text: 'Mars is known as the Red Planet.',
          answer_references: [
            { reference_text: 'NASA', reference_type: 'external' }
          ]
        }
      ]
    };
    const expected = `- The capital of France is Paris.
[Refs::
 - Wikipedia
 - Internal Doc ID 123 // internal knowledge]
- Mars is known as the Red Planet.
[Refs::
 - NASA]`
    expect(formatFactualQA(result)).toBe(expected);
  });

  test('should correctly format factual Q&A results with no references', () => {
    const result = {
      items: [
        {
          answer_text: 'The capital of France is Paris.',
          answer_references: []
        }
      ]
    };
    const expected = `- The capital of France is Paris.
[Refs::
]`
    expect(formatFactualQA(result)).toBe(expected);
  });

  test('should return an empty string for an empty items array', () => {
    const result = {
      items: []
    };
    expect(formatFactualQA(result)).toBe('');
  });
});