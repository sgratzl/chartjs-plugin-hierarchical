import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';

// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  // define label tree
  labels: [
    'A',
    {
      label: 'B1',
      children: [
        'B1.1',
        {
          label: 'B1.2',
          children: [
            {
              label: 'B1.2.1',
              children: [
                {
                  label: 'B1.2.1.1',
                  children: [
                    {
                      label: 'B1.2.1.1.1',
                      children: [
                        {
                          label: 'B1.2.1.1.1.2',
                          children: [{ label: 'ZZ', children: ['X'] }, 'Y', 'Z'],
                        },
                        'XX',
                        'X',
                      ],
                    },
                    'Y',
                    'Z',
                  ],
                },
                'B1.2.1.2',
                'B1.2.1.3',
              ],
            },
            'B1.2.2',
          ],
        },
        'B1.3',
      ],
    },
    'D',
  ],
  datasets: [
    {
      label: 'Test',
      // store as the tree attribute for reference, the data attribute will be automatically managed
      tree: [
        1,
        {
          value: 2,
          children: [
            3,
            {
              value: 4,
              children: [
                {
                  value: 4.1,
                  children: [
                    {
                      value: 4.12,
                      children: [
                        {
                          value: 4.121,
                          children: [4.1211, 4.1212],
                        },
                        4.122,
                      ],
                    },
                    4.12,
                  ],
                },
                4.2,
              ],
            },
            5,
          ],
        },
        {
          value: 6,
          children: [7, 8, 9, 10],
        },
        11,
      ],
      data: [],
    },
  ],
};

// #endregion

// #region config
export const config: ChartConfiguration<'bar'> = {
  type: 'bar',
  data,
  options: {
    layout: {
      padding: {
        // add more space at the bottom for the hierarchy
        bottom: 60,
      },
    },
    scales: {
      x: {
        type: 'hierarchical',
      },
    },
  },
};
// #endregion config
