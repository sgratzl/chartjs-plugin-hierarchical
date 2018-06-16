'use strict';

import * as Chart from 'chart.js';

const defaultConfig = Object.assign({}, Chart.scaleService.getScaleDefaults('category'), {
	levelPercentage: 0.75,
	padding: 25,
	attributes: []
});


const HierarchicalScale = Chart.Scale.extend({
	determineDataLimits() {
		const data = this.chart.data;
		const labels = this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels;

		this._nodes = labels.slice();

		this.minIndex = 0;
		this.maxIndex = this._nodes.length;
		this.min = this._nodes[this.minIndex];
		this.max = this._nodes[this.maxIndex];

		// this.options.barThickness = 'flex';
	},

	buildTicks() {
		const hor = this.isHorizontal();
		const total = hor ? this.width : this.height;
		const nodes = this._nodes;
		// optimize such that the distance between two points
		const ratio = this.options.levelPercentage;
		const ratios = [1, Math.pow(ratio, 1), Math.pow(ratio, 2)];

		const distances = [];
		{
			let prev = nodes[0];
			distances.push(0.5);
			for(let i = 1; i < nodes.length; ++i) {
				const n = nodes[i];
				distances.push(ratios[Math.min(prev.level, n.level)]);
				prev = n;
			}
			distances.push(0.5);
		}

		const distance = distances.reduce((acc, s) => acc + s, 0);
		const factor = total / distance;

		let offset = distances[0] * factor;
		nodes.forEach((node, i) => {
			const previous = distances[i] * factor;
			const next = distances[i + 1] * factor;
			node.center = offset;
			offset += next;

			node.width = Math.min(next, previous) / 2;
		});

		return this.ticks = this._nodes;
	},

	convertTicksToLabels(ticks) {
		return ticks.map((d) => d.label);
	},

	getLabelForIndex(index, datasetIndex) {
		const data = this.chart.data;
		const isHorizontal = this.isHorizontal();

		if (data.yLabels && !isHorizontal) {
			return this.getRightValue(data.datasets[datasetIndex].data[index]);
		}
		return this._nodes[index - this.minIndex].label;
	},

	// Used to get data value locations.  Value can either be an index or a numerical value
	getPixelForValue(value, index) {
		// If value is a data object, then index is the index in the data array,
		// not the index of the scale. We need to change that.
		{
			let valueCategory;
			if (value !== undefined && value !== null) {
				valueCategory = this.isHorizontal() ? value.x : value.y;
			}
			if (valueCategory !== undefined || (value !== undefined && isNaN(index))) {
				value = valueCategory || value;
				const idx = this._flatTree.findIndex((d) => d.label === value);
				index = idx !== -1 ? idx : index;
			}
		}

		const node = this._nodes[index];
		const centerTick = this.options.offset;
		const base = this.isHorizontal() ? this.left : this.top;

		return base + node.center - (centerTick ? 0 : node.width / 2);
	},

	getPixelForTick(index) {
		const node = this._nodes[index];
		const centerTick = this.options.offset;
		const base = this.isHorizontal() ? this.left : this.top;
		return base + node.center - (centerTick ? 0 : node.width / 2);
	},

	getValueForPixel(pixel) {
		return this._nodes.findIndex((d) => pixel >= d.center - d.width / 2 && pixel <= d.center + d.width / 2);
	},

	getBasePixel() {
		return this.bottom;
	}
});

Chart.scaleService.registerScaleType('hierarchical', HierarchicalScale, defaultConfig);

export default HierarchicalScale;
