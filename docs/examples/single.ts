import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';

// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  // define label tree
  labels: [
    {
      label: 'a consectetur adipiscing elit',
      expand: true, // 'focus', // expand level
      children: [
        {
          label: 'aa consectetur adipiscing elit',
          expand: true, // 'focus', // expand level
          children: ['aaa ex ea commodo consequat', 'aab ex ea commodo consequat'],
        },
        {
          label: 'ab consectetur adipiscing elit',
          children: ['aba ex ea commodo consequat', 'abb ex ea commodo consequat'],
        },
        'ac ex ea commodo consequat',
      ],
    },
  ],
  datasets: [
    {
      label: 'Test',
      // store as the tree attribute for reference, the data attribute will be automatically managed
      tree: [
        {
          value: 2,
          children: [
            {
              value: 4,
              children: [4.1, 4.2],
            },
            {
              value: 4,
              children: [4.1, 4.2],
            },
            5,
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
        padding: 10,
        ticks: {
          padding: 50,
          minRotation: 90,
          maxRotation: 90,
        },
      },
    },
  },
};
// #endregion config
