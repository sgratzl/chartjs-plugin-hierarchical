'use strict';

import * as Chart from 'chart.js';
import {toNodes} from '../utils';

function parentsOf(node, flat) {
	const parents = [node];
	while (parents[0].parent >= 0) {
		parents.unshift(flat[parents[0].parent]);
	}
	return parents;
}

function lastOfLevel(node, flat) {
	let last = flat[node.index];
	while (last && last.level >= node.level && (last.level !== node.level || last.parent === node.parent)) {
		last = flat[last.index + 1];
	}
	return flat[(last ? last.index : flat.length) - 1];
}

function resolve(label, flat, dataTree) {
	const parents = parentsOf(label, flat);

	let dataItem = { children: dataTree };
	const dataParents = parents.map((p) => dataItem && !(typeof dataItem === 'number' && isNaN(dataItem)) && dataItem.children ? dataItem.children[p.relIndex] : NaN);

	return dataParents[dataParents.length - 1];
}

function countExpanded(node) {
	if (node.collapse) {
		return 1;
	}
	return node.children.reduce((acc, d) => acc + countExpanded(d), 0);
}

const ROW = 15;

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
		const flat = chart.data.flatLabels;

		// RENDER icons
		const ctx = chart.ctx;

		ctx.save();
		ctx.translate(xScale.left, xScale.top + xScale.options.padding);
		ctx.strokeStyle = 'gray';
		ctx.fillStyle = 'gray';

		chart.data.labels.forEach((tick) => {
			const center = tick.center;
			let offset = 0;
			const parents = parentsOf(tick, flat);
			parents.slice(1).forEach((d) => {
				if (d.relIndex === 0) {
					const last = lastOfLevel(d, flat);
					ctx.strokeRect(center - 5, offset + 0, 10, 10);
					ctx.fillRect(center - 3, offset + 4, 6, 2);
					ctx.fillRect(center + 5, offset + 5, last.center - center - 5, 1);
					ctx.fillRect(last.center, offset + 2, 1, 3);
				}
				offset += ROW;
			});
			if (tick.children.length > 0) {
				ctx.strokeRect(center - 5, offset + 0, 10, 10);
				ctx.fillRect(center - 3, offset + 4, 6, 2);
				ctx.fillRect(center - 1, offset + 2, 2, 6);
			}
		});

		ctx.restore();
	},

	_splice(chart, index, count, toAdd) {
		const labels = chart.data.labels;
		const flatLabels = chart.data.flatLabels;
		const data = chart.data.datasets;

		const removed = labels.splice.apply(labels, [index, count].concat(toAdd));
		removed.forEach((d) => {
			d.hidden = true;
			d.collapsed = true;
		});
		toAdd.forEach((d) => d.hidden = false);

		data.forEach((dataset) => {
			const toAddData = toAdd.map((d) => resolve(d, flatLabels, dataset.tree));
			dataset.data.splice.apply(dataset.data, [index, count].concat(toAddData));
		});

		this._updateAttributes(chart);

		chart.update();
	},

	beforeEvent(chart, event) {
		if (event.type !== 'click' || !this._enabled(chart)) {
			return;
		}

		const xScale = this._findXScale(chart);

		if (event.y <= xScale.top + xScale.options.padding) {
			return;
		}

		const elem = chart.getElementsAtXAxis(event)[0];
		if (!elem) {
			return;
		}

		const index = elem._index;
		const flat = chart.data.flatLabels;
		const label = chart.data.labels[index];
		const parents = parentsOf(label, flat);

		let offset = xScale.top + xScale.options.padding;
		for (let i = 1; i < parents.length; ++i) {
			const parent = parents[i];
			if (event.y >= offset && event.y <= offset + ROW && parent.relIndex === 0) {
				// collapse its parent?
				const pp = flat[parent.parent];
				const count = countExpanded(pp);
				pp.collapse = true;
				this._splice(chart, index, count, [pp]);
				return;
			}
			offset += ROW;
		}
		if (event.y >= offset && event.y <= offset + ROW && label.children.length > 0) {
			// expand
			label.collapse = false;
			this._splice(chart, index, 1, label.children);
			return;
		}
	}
}

Chart.pluginService.register(HierarchicalPlugin);

export default HierarchicalPlugin;
