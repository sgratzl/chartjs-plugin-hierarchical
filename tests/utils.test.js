
import {asNode} from '../src/utils';

test('as node', () => {
  expect(asNode('test')).toHaveProperty('label', 'test');
})
