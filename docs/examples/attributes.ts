import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';

// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  labels: [
    {
      label: 'A',
      backgroundColor: 'red',
    },
    {
      label: 'B',
      backgroundColor: 'blue',
      expand: true, // expand level
      children: [
        {
          label: 'B1',
        },
        {
          label: 'B2',
          backgroundColor: 'lightblue',
        },
      ],
    },
    {
      label: 'C',
      backgroundColor: 'green',
    },
  ],
  datasets: [
    {
      label: 'Test',
      // store as the tree attribute for reference, the data attribute will be automatically managed
      tree: [
        1,
        {
          value: 2,
          children: [11, 12],
        },
        3,
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
        attributes: {
          backgroundColor: 'gray',
        },
      },
    },
  },
};
// #endregion config
