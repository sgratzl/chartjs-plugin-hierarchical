import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';

// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  // define label tree
  labels: [
    {
      label: 'A1',
      children: [
        {
          label: 'A1.1',
          children: ['A1.1.1', 'A1.1.2', 'A1.1.3'],
        },
        {
          label: 'A1.2',
          children: ['A1.2.1', 'A1.2.2', 'A1.2.3'],
        },
        'A1.3',
        {
          label: 'A1.4',
          children: ['A1.4.1', 'A1.4.2', 'A1.4.3'],
        },
      ],
    },
    {
      label: 'C1',
      expand: true,
      children: [
        'C1.1',
        'C1.2',
        'C1.3',
        {
          label: 'C1.4',
          expand: true,
          children: ['C1.4.1', 'C1.4.2', 'C1.4.3'],
        },
      ],
    },
  ],
  datasets: [
    {
      label: 'Test',
      // store as the tree attribute for reference, the data attribute will be automatically managed
      tree: [
        {
          value: 1,
          children: [
            {
              value: 2,
              children: [3, 4, 5],
            },
            {
              value: 6,
              children: [7, 8, 9],
            },
            10,
            {
              value: 11,
              children: [12, 13, 14],
            },
          ],
        },
        {
          value: 6,
          children: [
            7,
            8,
            9,
            {
              value: 10,
              children: [11, 12, 13],
            },
          ],
        },
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
