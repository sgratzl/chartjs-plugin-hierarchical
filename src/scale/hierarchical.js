'use strict';

import * as Chart from 'chart.js';
import {parentsOf} from '../utils';

const defaultConfig = Object.assign({}, Chart.scaleService.getScaleDefaults('category'), {
  /**
   * reduce the space between items at level X by this factor
   */
  levelPercentage: 0.75,
  /**
   * additional attributes to copy, e.g. backgroundColor
   * object where the key is the attribute and the value the default value if not explicity specified in the label tree
   */
  attributes: {},

  /**
   * top/left padding for showing the hierarchy marker
   */
  padding: 25,
  /**
   * size of the box to draw
   */
  hierarchyBoxSize: 14,
  /**
   * distance between two hierarhy indicators
   */
  hierarchyBoxLineHeight: 22,
  /**
   * color of the line indicator hierarchy children
   */
  hierarchySpanColor: 'gray',
  /**
   * storke width of the line
   */
  hierarchySpanWidth: 2,
  /**
   * color of the box to toggle collapse/expand
   */
  hierarchyBoxColor: 'gray',
  /**
   * stroke width of the toggle box
   */
  hierarchyBoxWidth: 1
});


const HierarchicalScale = Chart.Scale.extend({
  determineDataLimits() {
    const data = this.chart.data;
    const labels = this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels;

    // labels are already prepared by the plugin just use them as ticks
    this._nodes = labels.slice();

    // not really used
    this.minIndex = 0;
    this.maxIndex = this._nodes.length;
    this.min = this._nodes[this.minIndex];
    this.max = this._nodes[this.maxIndex];

    // this.options.barThickness = 'flex';
  },

  buildTicks() {
    const hor = this.isHorizontal();
    const total = hor ? this.width : this.height;
    const nodes = this._nodes.slice(this.minIndex, this.maxIndex);
    const flat = this.chart.data.flatLabels;

    if (nodes.length === 0) {
      this.ticks = [];
      return this.ticks;
    }

    // optimize such that the distance between two points on the same level is same
    // creaiing a grouping effect of nodes
    const ratio = this.options.levelPercentage;

    // max 5 levels for now
    const ratios = [1, Math.pow(ratio, 1), Math.pow(ratio, 2), Math.pow(ratio, 3), Math.pow(ratio, 4)];

    const distances = [];
    {
      let prev = nodes[0];
      let prevParents = parentsOf(prev, flat);
      distances.push(0.5); // half top level distance before and after

      for (let i = 1; i < nodes.length; ++i) {
        const n = nodes[i];
        const parents = parentsOf(n, flat);
        if (prev.parent === n.parent) {
          // same parent -> can use the level distance
          distances.push(ratios[n.level]);
        } else {
          // differnt level -> use the distance of the common parent
          // find level of common parent
          let common = 0;
          while (parents[common] === prevParents[common]) {
            common++;
          }
          distances.push(ratios[common]);
        }
        prev = n;
        prevParents = parents;
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

    this.ticks = nodes;
    return this.ticks;
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
    const node = this._nodes[index + this.minIndex];
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
