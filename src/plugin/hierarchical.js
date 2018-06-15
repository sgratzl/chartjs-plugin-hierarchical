'use strict';

import * as Chart from 'chart.js';
import {toNodes} from '../utils';

function resolve(label, flat, dataTree) {
	if (label.level === 0) {
		return dataTree[label.relIndex];
	}

	// TODO all levels
	const p = flat[label.parent];
	const pData = dataTree[p.relIndex];
	return pData && pData.children ? pData.children[label.relIndex] : NaN;
}

const HierarchicalPlugin = {
	id: 'chartJsPluginHierarchical',

	_enabled(chart) {
		return chart.config.options.scales.xAxes[0].type === 'hierarchical';
	},

	beforeInit(chart) {
		if (!this._enabled(chart)) {
			return;
		}
		const flat = chart.data.flatLabels = toNodes(chart.data.labels);
		const labels = chart.data.labels = chart.data.flatLabels.filter((d) => !d.hidden);

		chart.data.datasets.forEach((dataset) => {
			dataset.tree = dataset.data.slice();
			dataset.data = labels.map((l) => resolve(l, flat, dataset.tree));
		});
	},

	afterInit(chart) {
		if (!this._enabled(chart)) {
			return;
		}
		this._updateAttributes(chart);
	},

	_updateAttributes(chart) {
		const xScale = this._findXScale(chart);
		if (!xScale) {
			return;
		}
		const attributes = xScale.options.attributes;

		const nodes = chart.data.labels;
		attributes.forEach((attr) => {
			chart.data.datasets.forEach((d) => {
				d[attr] = nodes.map((d) => d[attr]);
			});
		});
	},

	_findXScale(chart) {
		const scales = Object.keys(chart.scales).map((d) => chart.scales[d]);
		return scales.find((d) => d.type === 'hierarchical' && d.isHorizontal());
	},

	beforeDatasetsDraw(chart) {
		if (!this._enabled(chart)) {
			return;
		}
		const xScale = this._findXScale(chart);

		// RENDER icons
		const ctx = chart.ctx;

		ctx.save();

		const flat = chart.data.flatLabels;
		chart.data.labels.forEach((tick) => {
			const p = tick.parent >= 0 ? flat[tick.parent] : null;
			if (p && p.relIndex === 0) {
				// first child to collapse
				ctx.fillText('-', xScale.left + tick.center - tick.width / 2, xScale.top + 5);
			} else if (!p && tick.children.length > 0) {
				ctx.fillText('+', xScale.left + tick.center - tick.width / 2, xScale.top + 5);
			}
			// TODO support all levels
		});

		ctx.restore();
	},

	_splice(chart, index, count, toAdd) {
		const labels = chart.data.labels;
		const flatLabels = chart.data.flatLabels;
		const data = chart.data.datasets;

		const removed = labels.splice.apply(labels, [index, count].concat(toAdd));
		removed.forEach((d) => d.hidden = true);
		toAdd.forEach((d) => d.hidden = false);

		data.forEach((dataset) => {
			const tree = dataset.tree;
			const toAddValues = toAdd.map((d) => resolve(d, flatLabels, tree));
			dataset.data.splice.apply(dataset.data, [index, count].concat(toAddValues));
		});

		this._updateAttributes(chart);

		chart.update();
	},

	beforeEvent(chart, event) {
		if (event.type !== 'click' || !this._enabled(chart)) {
			return;
		}

		const xScale = this._findXScale(chart);

		if (xScale.top >= event.y || event.y >= xScale.bottom) {
			return;
		}

		const elem = chart.getElementsAtXAxis(event)[0];
		if (!elem) {
			return;
		}

		const index = elem._index;
		const flat = chart.data.flatLabels;
		const label = chart.data.labels[index];
		// click
		if (label.level === 0 && label.children.length === 0) {
			return;
		}
		if (label.level === 0 && label.children.length > 0) {
			// expand
			label.collapse = false;
			this._splice(chart, index, 1, label.children);
			return;
		}

		const parent = flat[label.parent];
		if (parent && label.relIndex === 0) {
			// collapse
			parent.collapse = true;
			this._splice(chart, index, parent.children.length, [parent]);
			return
		}
	}
}

Chart.pluginService.register(HierarchicalPlugin);

export default HierarchicalPlugin;
