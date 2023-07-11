import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';
// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  // define label tree
  labels: [
    'A',
    {
      label: 'B1',
      expand: true,
      children: [
        'B1.1',
        {
          label: 'B1.2',
          children: ['B1.2.1', 'B1.2.2'],
        },
        'B1.3',
      ],
    },
    {
      label: 'C1',
      children: ['C1.1', 'C1.2', 'C1.3', 'C1.4'],
    },
    'D',
  ],
  datasets: [
    {
      label: 'Test',
      tree: [
        1,
        {
          value: 2,
          children: [
            3,
            {
              value: 4,
              children: [4.1, 4.2],
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
    indexAxis: 'y',
    layout: {
      padding: {
        // add more space at the left side for the hierarchy
        left: 50,
      },
    },
    scales: {
      y: {
        type: 'hierarchical',
        // tune padding setting
        padding: 0,
      },
    },
  },
};
// #endregion config

// #region reverse
export const reverse: ChartConfiguration<'bar'> = {
  type: 'bar',
  data,
  options: {
    indexAxis: 'y',
    layout: {
      padding: {
        // add more space at the left side for the hierarchy
        left: 50,
      },
    },
    scales: {
      y: {
        type: 'hierarchical',
        // tune padding setting
        padding: 0,
        reverseOrder: true,
      },
    },
  },
};
// #endregion reverse
