import Theme from 'vitepress/theme';
import { Chart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  Tooltip,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  Colors,
  LineElement,
} from 'chart.js';
import { HierarchicalScale } from '../../../src';

export default {
  ...Theme,
  enhanceApp({ app }) {
    ChartJS.register(
      HierarchicalScale,
      CategoryScale,
      Tooltip,
      LinearScale,
      BarController,
      BarElement,
      LineController,
      LineElement,
      Colors
    );
    app.component('Chart', Chart);
  },
};
