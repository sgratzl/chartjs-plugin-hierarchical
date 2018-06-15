'use strict';

import * as Chart from 'chart.js';

const defaultConfig = Object.assign({}, Chart.scaleService.getScaleDefaults('category'), {
	// TOOD
});

const HierarchicalScale = Chart.scaleService.getScaleConstructor('category').extend({
	// TOOD
});
Chart.scaleService.registerScaleType('hierarchical', HierarchicalScale, defaultConfig);

export default HierarchicalScale;
