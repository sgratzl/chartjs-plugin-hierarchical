'use strict';

import * as Chart from 'chart.js';
import {toNodes, countExpanded, lastOfLevel, resolve, parentsOf} from '../utils';

const ROW = 15;

const HierarchicalPlugin = {
	id: 'chartJsPluginHierarchical',

	_enabled(chart) {
		if (chart.config.options.scales.xAxes[0].type === 'hierarchical') {
			return 'x';
		}
		if (chart.config.options.scales.yAxes[0].type === 'hierarchical') {
			return 'y';
		}
		return null;
	},

	beforeInit(chart) {
		if (!this._enabled(chart)) {
			return;
		}
		const flat = chart.data.flatLabels = toNodes(chart.data.labels);
		const labels = chart.data.labels = chart.data.flatLabels.filter((d) => !d.hidden);

		chart.data.datasets.forEach((dataset) => {
			if (dataset.tree == null) {
				dataset.tree = dataset.data.slice();
			}
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
				d[attr] = nodes.map((n) => n[attr]);
			});
		});
	},

	_findXScale(chart) {
		const scales = Object.keys(chart.scales).map((d) => chart.scales[d]);
		return scales.find((d) => d.type === 'hierarchical');
	},

	beforeDatasetsDraw(chart) {
		if (!this._enabled(chart)) {
			return;
		}
		const xScale = this._findXScale(chart);
		const flat = chart.data.flatLabels;
		const ctx = chart.ctx;
		const hor = xScale.isHorizontal();

		ctx.save();
		ctx.strokeStyle = 'gray';
		ctx.fillStyle = 'gray';

		if (hor) {
			ctx.translate(xScale.left, xScale.top + xScale.options.padding);

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
		} else {
			ctx.translate(xScale.left - xScale.options.padding, xScale.top);

			chart.data.labels.forEach((tick) => {
				const center = tick.center;
				let offset = 0;
				const parents = parentsOf(tick, flat);
				parents.slice(1).forEach((d) => {
					if (d.relIndex === 0) {
						const last = lastOfLevel(d, flat);
						ctx.strokeRect(offset - 10, center - 5, 10, 10);
						ctx.fillRect(offset - 8, center - 1, 6, 2);
						ctx.fillRect(offset - 5, center + 5, 1, last.center - center - 5);
						ctx.fillRect(offset - 5, last.center, 3, 1);
					}
					offset -= ROW;
				});
				if (tick.children.length > 0) {
					ctx.strokeRect(offset - 10, center - 5, 10, 10);
					ctx.fillRect(offset - 8, center - 1, 6, 2);
					ctx.fillRect(offset - 6, center - 3, 2, 6);
				}
			});
		}

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
		toAdd.forEach((d) => {
			d.hidden = false;
		});

		data.forEach((dataset) => {
			const toAddData = toAdd.map((d) => resolve(d, flatLabels, dataset.tree));
			dataset.data.splice.apply(dataset.data, [index, count].concat(toAddData));
		});

		this._updateAttributes(chart);

		chart.update();
	},

	_resolveElement(event, chart, xScale) {
		const hor = xScale.isHorizontal();
		let offset = hor ? xScale.top + xScale.options.padding : xScale.left - xScale.options.padding;
		if ((hor && event.y <= offset) || (!hor && event.x > offset)) {
			return null;
		}

		const elem = chart.getElementsAtEventForMode(event, 'index', {axis: hor ? 'x' : 'y'})[0];
		if (!elem) {
			return null;
		}
		return {offset, index: elem._index};
	},

	beforeEvent(chart, event) {
		if (event.type !== 'click' || !this._enabled(chart)) {
			return;
		}

		const xScale = this._findXScale(chart);
		const hor = xScale.isHorizontal();

		const elem = this._resolveElement(event, chart, xScale);
		if (!elem) {
			return;
		}
		let offset = elem.offset;

		const index = elem.index;
		const flat = chart.data.flatLabels;
		const label = chart.data.labels[index];
		const parents = parentsOf(label, flat);

		const inRange = hor ? (o) => event.y >= o && event.y <= o + ROW : (o) => event.x <= o && event.x >= o - ROW;

		for (let i = 1; i < parents.length; ++i) {
			const parent = parents[i];
			// out of box
			if (parent.relIndex === 0 || inRange(offset)) {
				// collapse its parent?
				const pp = flat[parent.parent];
				const count = countExpanded(pp);
				pp.collapse = true;
				this._splice(chart, index, count, [pp]);
				return;
			}
			offset += hor ? ROW : -ROW;
		}

		if (label.children.length > 0 && inRange(offset)) {
			// expand
			label.collapse = false;
			this._splice(chart, index, 1, label.children);
			return;
		}
	}
};

Chart.pluginService.register(HierarchicalPlugin);

export default HierarchicalPlugin;
