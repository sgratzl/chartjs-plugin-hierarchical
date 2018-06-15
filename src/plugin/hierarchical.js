'use strict';

import * as Chart from 'chart.js';


function flatten(chart) {
	const labels = chart.data.labels;

	if (labels.every((d) => typeof d === 'string' || d.collapse !== false)) {
		// nothing to do
		return;
	}
	const datasets = chart.data.datasets;
	datasets.forEach((dataset) => {
		if (dataset.tree !== undefined) {
			return;
		}

		const flat = [];
		const pushFlat = (label, d) => {
			if (typeof label === 'string'|| label.collapse !== false) {
				flat.push(d);
			} else {
				const children = d.children || [];
				(label.children || []).forEach((l, i) => {
					pushFlat(l, children[i]);
				});
			}
		};
		labels.forEach((label, i) => pushFlat(label, dataset.data[i]));

		dataset.tree = dataset.data;
		dataset.data = flat;
	});
}

const HierarchicalPlugin = {
	id: 'chartJsPluginHierarchical',

	// beforeInit(chart) {
	// 	flatten(chart);
	// },

	beforeUpdate(chart) {
		flatten(chart);
	},

	beforeDatasetsUpdate(chart) {
		flatten(chart)
	},

	afterUpdate(chart) {
		const datasets = chart.data.datasets;
		datasets.forEach((dataset) => {
			if (dataset.tree) {
				dataset.data = dataset.tree;
				delete dataset.tree;
			}
		});
	}
}

// Chart.pluginService.register(HierarchicalPlugin);

export default HierarchicalPlugin;
