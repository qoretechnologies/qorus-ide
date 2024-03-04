import moment from 'moment';
import { formatDate } from '../../src/helpers/date';

test('formatDate should format the dates according to the input value', () => {
  expect(formatDate('week').date()).toEqual(moment().add(-1, 'weeks').date());
  expect(formatDate('now').date()).toEqual(moment().date());
  expect(formatDate('thirty').date()).toEqual(moment().add(-30, 'days').date());
  expect(formatDate('24h').date()).toEqual(moment().add(-1, 'days').date());
  expect(formatDate('today').hour()).toEqual(0);
});
