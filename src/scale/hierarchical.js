'use strict';

import * as Chart from 'chart.js';

const HierarchicalScale = {
	// TOOD
}
Chart.scaleService.registerScaleType('hierarchical', HierarchicalScale, Chart.scaleService.getScaleDefaults('linear'));

export default HierarchicalScale;
