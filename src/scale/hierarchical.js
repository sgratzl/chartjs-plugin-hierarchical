import { scaleService, helpers } from 'chart.js';
import { parentsOf } from '../utils';
import { HierarchicalPlugin } from '../plugin';

const defaultConfig = {
  // offset settings, for centering the categorical axis in the bar chart case
  offset: true,

  // grid line settings
  gridLines: {
    offsetGridLines: true,
  },

  /**
   * reduce the space between items at level X by this factor
   */
  levelPercentage: 0.75,

  /**
   * top/left padding for showing the hierarchy marker
   */
  padding: 25,
  /**
   * position of the hierarchy label
   * possible values: 'below', 'above', null to disable
   */
  hierarchyLabelPosition: 'below',
  /**
   * size of the box to draw
   */
  hierarchyBoxSize: 14,
  /**
   * distance between two hierarchy indicators
   */
  hierarchyBoxLineHeight: 30,
  /**
   * color of the line indicator hierarchy children
   */
  hierarchySpanColor: 'gray',
  /**
   * stroke width of the line
   */
  hierarchySpanWidth: 2,
  /**
   * color of the box to toggle collapse/expand
   */
  hierarchyBoxColor: 'gray',
  /**
   * stroke width of the toggle box
   */
  hierarchyBoxWidth: 1,

  attributes: {},
};

export class HierarchicalScale extends scaleService.getScaleConstructor('category') {
  determineDataLimits() {
    const labels = this.getLabels();

    // labels are already prepared by the plugin just use them as ticks
    this._nodes = labels.slice();

    super.determineDataLimits();
  }

  buildTicks() {
    const hor = this.isHorizontal();
    const total = hor ? this.width : this.height;
    const nodes = this._nodes.slice(this.min, this.max + 1);
    const flat = this.chart.data.flatLabels;

    this._numLabels = nodes.length;
    this._valueRange = Math.max(nodes.length, 1);
    this._startValue = this.min - 0.5;

    if (nodes.length === 0) {
      return [];
    }

    // optimize such that the distance between two points on the same level is same
    // creating a grouping effect of nodes
    const ratio = this.options.levelPercentage;

    // max 5 levels for now
    const ratios = [1, Math.pow(ratio, 1), Math.pow(ratio, 2), Math.pow(ratio, 3), Math.pow(ratio, 4)];

    const distances = [];

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
        // different level -> use the distance of the common parent
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

    const distance = distances.reduce((acc, s) => acc + s, 0);
    const factor = total / distance;

    let offset = distances[0] * factor;
    nodes.forEach((node, i) => {
      const previous = distances[i] * factor;
      const next = distances[i + 1] * factor;
      node.center = offset;
      offset += next;

      node.value = node.label;
      node.width = Math.min(next, previous) / 2;
    });

    return nodes.map((d) => Object.assign({}, d)); // copy since mutated during auto skip
  }

  getPixelForDecimal(value) {
    const index = Math.min(Math.floor(value * this._nodes.length), this._nodes.length - 1);

    if (index === 1 && this._nodes.length === 1) {
      // corner case in chartjs to determine tick width, hard coded 1
      return this._nodes[0].width;
    }
    return this._centerBase(index);
  }

  _centerBase(index) {
    const centerTick = this.options.offset;
    const base = this.isHorizontal() ? this.left : this.top;
    const node = this._nodes[index];

    if (node == null) {
      return base;
    }

    const nodeCenter = node.center != null ? node.center : 0;
    const nodeWidth = node.width != null ? node.width : 0;
    return base + nodeCenter - (centerTick ? 0 : nodeWidth / 2);
  }

  getValueForPixel(pixel) {
    return this._nodes.findIndex((d) => pixel >= d.center - d.width / 2 && pixel <= d.center + d.width / 2);
  }
}

HierarchicalScale.id = 'hierarchical';
HierarchicalScale.defaults = helpers.merge({}, [scaleService.getScaleDefaults('category'), defaultConfig]);
HierarchicalScale.register = () => {
  HierarchicalPlugin.register();
  scaleService.registerScale(HierarchicalScale);
  return HierarchicalScale;
};
