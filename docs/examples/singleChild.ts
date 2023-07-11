import type { ChartConfiguration } from 'chart.js';
import {} from '../../src';
import { interpolateBlues } from 'd3-scale-chromatic';
import { scaleSequential } from 'd3-scale';
// #region data

export const data: ChartConfiguration<'bar'>['data'] = {
  // define label tree
  labels: [
    'A',
    {
      label: 'B1',
      expand: false, // 'focus', // expand level
      children: ['B1.1'],
    },
    'C',
  ],
  datasets: [
    {
      label: 'Test',
      // store as the tree attribute for reference, the data attribute will be automatically managed
      tree: [
        1,
        {
          value: 2,
          children: [2],
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
