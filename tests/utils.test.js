
import {asNode} from '../src/utils';

function nodeTest(n, label, childCount = 0, level = 0) {
  expect(n).toBeDefined();
  expect(n.label).toBe(label);
  expect(n.children.length).toBe(childCount);
  expect(n.expand).toBe(false);
  expect(n.level).toBe(level);
  expect(n.center).toBeNaN();
  expect(n.width).toBe(0);
  expect(n.hidden).toBe(false);
  expect(n.major).toBe(level === 0);
}


test('as node from label', () => {
  const n = asNode('test');
  nodeTest(n, 'test');
});

test('as node object', () => {
  const n = asNode({
    label: 'test2'
  });
  nodeTest(n, 'test2');
})

test('as node object with children', () => {
  const n = asNode({
    label: 'test3',
    children: ['abc', 'def']
  });
  nodeTest(n, 'test3', 2);
  nodeTest(n.children[0], 'abc', 0, 1);
  nodeTest(n.children[1], 'def', 0, 1);
})

test('as node object with children complex', () => {
  const n = asNode({
    label: 'test3',
    children: [{
      label: 'test4',
      children: ['abc']
    }, 'def']
  });
  nodeTest(n, 'test3', 2);
  nodeTest(n.children[0], 'test4', 1, 1);
  nodeTest(n.children[0].children[0], 'abc', 0, 2);
  nodeTest(n.children[1], 'def', 0, 1);
})
