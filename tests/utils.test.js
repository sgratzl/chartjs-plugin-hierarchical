
import {asNode, toNodes, parentsOf, lastOfLevel, countExpanded} from '../src/utils';

function nodeTest(n, label, options = {}) {
  const {childCount, level, hidden} = Object.assign({
    childCount: 0,
    level: 0,
    hidden: false
  }, options)
  expect(n).toBeDefined();
  expect(n.label).toBe(label);
  expect(n.children.length).toBe(childCount);
  expect(n.expand).toBe(false);
  expect(n.level).toBe(level);
  expect(n.center).toBeNaN();
  expect(n.width).toBe(0);
  expect(n.hidden).toBe(hidden);
  expect(n.major).toBe(level === 0);
}

function treeNodeTest(n, parent, relIndex, index) {
  expect(n.relIndex).toBe(relIndex);
  expect(n.parent).toBe(parent);
  expect(n.index).toBe(index);
  expect(n.index).toBe(index);
}

describe('asNode', () => {
  test('from label', () => {
    const n = asNode('test');
    nodeTest(n, 'test');
  });

  test('object', () => {
    const n = asNode({
      label: 'test2'
    });
    nodeTest(n, 'test2');
  })

  test('object with children', () => {
    const n = asNode({
      label: 'test3',
      children: ['abc', 'def']
    });
    nodeTest(n, 'test3', {childCount: 2});
    nodeTest(n.children[0], 'abc', {level: 1});
    nodeTest(n.children[1], 'def', {level: 1});
  })

  test('object with children complex', () => {
    const n = asNode({
      label: 'test3',
      children: [{
        label: 'test4',
        children: ['abc']
      }, 'def']
    });
    nodeTest(n, 'test3', {childCount: 2});
    nodeTest(n.children[0], 'test4', {childCount: 1, level: 1});
    nodeTest(n.children[0].children[0], 'abc', {level: 2});
    nodeTest(n.children[1], 'def', {level: 1});
  })
});


describe('toNodes', () => {
  test('simple', () => {
    const nodes = toNodes(['a', 'b', 'c']);
    expect(nodes.length).toBe(3);
    nodeTest(nodes[0], 'a');
    treeNodeTest(nodes[0], -1, 0, 0);
    nodeTest(nodes[1], 'b');
    treeNodeTest(nodes[1], -1, 1, 1);
    nodeTest(nodes[2], 'c');
    treeNodeTest(nodes[2], -1, 2, 2);
  });

  test('hierarchy', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa', 'ab'] }, 'b']);
    expect(nodes.length).toBe(4);
    nodeTest(nodes[0], 'a', {childCount: 2});
    treeNodeTest(nodes[0], -1, 0, 0);
    nodeTest(nodes[1], 'aa', {level: 1, hidden: true});
    treeNodeTest(nodes[1], 0, 0, 1);
    nodeTest(nodes[2], 'ab', {level: 1, hidden: true});
    treeNodeTest(nodes[2], 0, 1, 2);
    nodeTest(nodes[3], 'b');
    treeNodeTest(nodes[3], -1, 1, 3);
  });
});

describe('parentsOf', () => {
  test('simple', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa'] }]);
    const child = nodes[1];
    expect(child.parent).toBe(0);

    const parents = parentsOf(child, nodes);
    expect(parents.length).toBe(2);
    expect(parents[0]).toBe(nodes[0]);
    expect(parents[1]).toBe(child);
  });
});


describe('lastOfLevel', () => {
  test('simple', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa'] }, 'b', 'c']);

    const last = lastOfLevel(nodes[0], nodes);
    expect(last).toBe(nodes[3]);
  });
});

describe('countExpanded', () => {
  test('simple', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa'] }, 'b', 'c']);

    const count = countExpanded(nodes[0]);
    expect(count).toBe(1);
  });

  test('simple2', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa', 'bb'], expand: true }, 'b', 'c']);

    const count = countExpanded(nodes[0]);
    expect(count).toBe(2);
  });

  test('simple3', () => {
    const nodes = toNodes([{ label: 'a', children: ['aa', { expand: true, label: 'bb', children: ['bba', 'bbb']}], expand: true }, 'b', 'c']);

    const count = countExpanded(nodes[0]);
    expect(count).toBe(3);
  });
});
