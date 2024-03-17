import { pn, amountToString } from './prettyNumbers';

describe('prettyNumbers', () => {
  test('pn()', () => {
    [
      { input: null, output: '' },
      { input: undefined, output: '' },
      { input: 0, output: '0' },
      { input: 1, output: '1' },
      { input: 2, output: '2' },
      { input: 10, output: '10' },
      { input: 11, output: '11' },
      { input: 11.0, output: '11' },
      { input: 12.0, output: '12' },
      { input: 100.5, output: '100.5' },
      { input: 224.56, output: '224.56' },
      { input: 1567, output: '1,567' },
      { input: 15678, output: '15,678' },
      { input: 2984.99, output: '2,984.99' },
      { input: 100000.0, output: '100,000' },
    ].forEach((it) => {
      const response = pn(it.input);
      expect(response).toBe(it.output);
    });
  });
});

describe('amountToString', () => {
  test('pn()', () => {
    [
      { input: null, output: 'NaN' },
      { input: undefined, output: 'NaN' },
      { input: ['', false, 50, 150], output: '0' },
      { input: ['100.00', false, 50, 150], output: '100' },
      { input: ['100.00', true, undefined, undefined], output: 'NaN-NaN' },
      { input: ['100.00', true, undefined, 150], output: 'NaN-150' },
      { input: ['100.00', true, 50, undefined], output: '50-NaN' },
      { input: ['100.00', true, 50, 150], output: '50-150' },
    ].forEach((it) => {
      const params: any[] = it.input ?? [];
      const response = amountToString(params[0], params[1], params[2], params[3]);
      expect(response).toBe(it.output);
    });
  });
});
