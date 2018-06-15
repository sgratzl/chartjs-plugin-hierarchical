'use strict';

import * as Chart from 'chart.js';

const defaultConfig = Object.assign({}, Chart.scaleService.getScaleDefaults('category'), {
	// TOOD
	levelPercentage: 0.5
});


function asNode(label, parent) {
	const node = Object.assign({
		label: '',
		children: [],
		parent,
		collapse: true,
		level: parent ? parent.level + 1 : 0,
		center: 0, // TODO
		width: 0,
		major: !Boolean(parent)
	}, typeof label === 'string' ? {label} : label);

	node.children = node.children.map((d) => asNode(d, node));

	return node;
}

const superClass = Chart.Scale;
const _super = superClass.prototype;

const HierarchicalScale = superClass.extend({
	determineDataLimits() {
		const data = this.chart.data;

		const labels = this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels;

		// build tree
		const tree = this._tree = data.tree = labels.map((l) => asNode(l, undefined));

		// flat tree according to collapsed state
		this._flatTree = [];
		const push = (node) => {
			if (node.collapse) {
				this._flatTree.push(node);
			} else {
				node.children.forEach(push);
			}
		};
		tree.forEach(push);
		data.flatTree = this._flatTree;

		this.minIndex = 0;
		this.maxIndex = this._flatTree.length;
		this.min = this._flatTree[this.minIndex];
		this.max = this._flatTree[this.maxIndex];
	},

	buildTicks() {
		const hor = this.isHorizontal();
		const total = hor ? this.width : this.height;

		const countPerLevel = [0, 0, 0, 0, 0];
		this._flatTree.forEach((node) => countPerLevel[node.level] += 1);
		const ratio = this.options.levelPercentage;
		const slices = countPerLevel.reduce((acc, count, level) => acc + count * Math.pow(ratio, level), 0);

		const perSlice = total / slices;

		let offset = 0;
		this._flatTree.forEach((node) => {
			const slice = perSlice * Math.pow(ratio, node.level);
			node.width = slice;
			node.center = offset + slice / 2;
			offset += slice;
		});

		return this.ticks = this._flatTree;
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
		return this._flatTree[index - this.minIndex].label;
	},

	// Used to get data value locations.  Value can either be an index or a numerical value
	getPixelForValue(value, index) {
		const me = this;

		// If value is a data object, then index is the index in the data array,
		// not the index of the scale. We need to change that.
		{
			let valueCategory;
			if (value !== undefined && value !== null) {
				valueCategory = me.isHorizontal() ? value.x : value.y;
			}
			if (valueCategory !== undefined || (value !== undefined && isNaN(index))) {
				value = valueCategory || value;
				const idx = this._flatTree.findIndex((d) => d.label === value);
				index = idx !== -1 ? idx : index;
			}
		}

		const node = this._flatTree[index];

		const centerTick = this.options.offset;

		const base = this.isHorizontal() ? this.left : this.top;

		return base + node.center - (centerTick ? 0 : node.width / 2);
	},
	getPixelForTick(index) {
		return this.getPixelForValue(this.ticks[index], index + this.minIndex, null);
	},
	getValueForPixel(pixel) {
		var me = this;
		var offset = me.options.offset;
		var value;
		var offsetAmt = Math.max((me._ticks.length - (offset ? 0 : 1)), 1);
		var horz = me.isHorizontal();
		var valueDimension = (horz ? me.width : me.height) / offsetAmt;

		pixel -= horz ? me.left : me.top;

		if (offset) {
			pixel -= (valueDimension / 2);
		}

		if (pixel <= 0) {
			value = 0;
		} else {
			value = Math.round(pixel / valueDimension);
		}

		return value + me.minIndex;
	},
	getBasePixel() {
		return this.bottom;
	}
});
Chart.scaleService.registerScaleType('hierarchical', HierarchicalScale, defaultConfig);

export default HierarchicalScale;


`
Tick {
	label: string;
	major: boolean; // major grid line
}

getPixelForTick(tickIndex) -> width

{
	// Determines the data limits. Should set this.min and this.max to be the data max/min
	determineDataLimits: function() {},

	// Generate tick marks. this.chart is the chart instance. The data object can be accessed as this.chart.data
	// buildTicks() should create a ticks array on the axis instance, if you intend to use any of the implementations from the base class
	buildTicks: function() {},

	// Get the value to show for the data at the given index of the the given dataset, ie this.chart.data.datasets[datasetIndex].data[index]
	getLabelForIndex: function(index, datasetIndex) {},

	// Get the pixel (x coordinate for horizontal axis, y coordinate for vertical axis) for a given value
	// @param index: index into the ticks array
	// @param includeOffset: if true, get the pixel halfway between the given tick and the next
	getPixelForTick: function(index, includeOffset) {},

	// Get the pixel (x coordinate for horizontal axis, y coordinate for vertical axis) for a given value
	// @param value : the value to get the pixel for
	// @param index : index into the data array of the value
	// @param datasetIndex : index of the dataset the value comes from
	// @param includeOffset : if true, get the pixel halfway between the given tick and the next
	getPixelForValue: function(value, index, datasetIndex, includeOffset) {}

	// Get the value for a given pixel (x coordinate for horizontal axis, y coordinate for vertical axis)
	// @param pixel : pixel value
	getValueForPixel: function(pixel) {}
}
`
