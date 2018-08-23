
import {toNodes, parentsOf, lastOfLevel, countExpanded} from '../src/utils';

describe('bug_#7', () => {
  let nodes;
  test('setup', () => {
    nodes = toNodes([{
      label: '0',
      expand: true, // 'focus', // expand level
      children: [
        {
          label: '00',
          expand: true, // 'focus', // expand level
          children: [
            '000',
            '001',
          ]
        },
        {
          label: '01',
          children: [
            '010',
            '011',
          ]
        },
        '1'
      ]
    }]);

    expect(nodes.length).toBe(8);
    expect(nodes.map((d) => d.label)).toEqual(['0', '00', '000', '001', '01', '010', '011', '1']);
  });

  test('parents', () => {
    const parents = (node, ...arr) => expect(parentsOf(node, nodes).map((d) => d.label)).toEqual(arr);
    parents(nodes[0], '0');
    parents(nodes[1], '0', '00');
    parents(nodes[2], '0', '00', '000');
    parents(nodes[3], '0', '00', '001');
  });
});
