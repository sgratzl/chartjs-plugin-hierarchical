import { CategoryScale, CategoryScaleOptions, registry } from 'chart.js';
import { merge } from 'chart.js/helpers';
import hierarchicalPlugin from '../plugin';
import { parentsOf } from '../utils';
import type { ILabelNodes, IEnhancedChart, IValueNode } from '../model';

export interface IHierarchicalScaleOptions extends CategoryScaleOptions {
  /**
   * ratio by which the distance between two elements shrinks the higher the level of the tree is. i.e. two two level bars have a distance of 1. two nested one just 0.75
   * @default 0.75
   */
  levelPercentage: number;
  /**
   * padding of the first collapse to the start of the x-axis
   * @default 25
   */
  padding: number;
  /**
   * position of the hierarchy label in expanded levels, 'none' to disable
   * @default 'below'
   */
  hierarchyLabelPosition: 'below' | 'above' | 'none' | null;

  /**
   * position of the hierarchy group label relative to the its children
   * @default between-first-and-second
   */
  hierarchyGroupLabelPosition: 'center' | 'first' | 'last' | 'between-first-and-second';

  /**
   * whether interactive buttons should be shown or whether it should be static
   * @default false
   */
  static: boolean;
  /**
   * size of the box to draw
   */
  hierarchyBoxSize: number;
  /**
   * distance between two hierarchy indicators
   */
  hierarchyBoxLineHeight: number;
  /**
   * color of the line indicator hierarchy children
   */
  hierarchySpanColor: string;
  /**
   * stroke width of the line
   */
  hierarchySpanWidth: number;
  /**
   * color of the box to toggle collapse/expand
   */
  hierarchyBoxColor: string;
  /**
   * stroke width of the toggle box
   */
  hierarchyBoxWidth: number;

  /**
   * object of attributes that should be managed and extracted from the tree
   * data structures such as `backgroundColor` for coloring individual bars
   * the object contains the key and default value
   * @default {}
   */
  attributes: { [attribute: string]: any };

  offset: true;
  /**
   * if reverseOrder is true the lowest hierarchy level is on axis level and the highest level is the one furthest from axis
   * @default false
   */
  reverseOrder: boolean;
}

const defaultConfig: Partial<Omit<IHierarchicalScaleOptions, 'grid'>> & {
  grid: Partial<IHierarchicalScaleOptions['grid']>;
} = {
  // offset settings, for centering the categorical axis in the bar chart case
  offset: true,

  // grid line settings
  grid: {
    offset: true,
  },

  static: false,

  /**
   * reduce the space between items at level X by this factor
   */
  levelPercentage: 0.75,

  /**
   * top/left padding for showing the hierarchy marker
   */
  padding: 5,
  /**
   * position of the hierarchy label
   * possible values: 'below', 'above', 'none' to disable
   */
  hierarchyLabelPosition: 'below' as 'below' | 'above' | null | 'none',

  hierarchyGroupLabelPosition: 'between-first-and-second',
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
  /**
   * if reverseOrder is true the lowest hierarchy level is on axis level and the highest level is the one furthest from axis
   * @default false
   */
  reverseOrder: false,
};

export interface IInternalScale {
  _valueRange: number;
  _startValue: number;
  _startPixel: number;
  _length: number;
}

export class HierarchicalScale extends CategoryScale<IHierarchicalScaleOptions> {
  /**
   * @internal
   */
  private _nodes: ILabelNodes = [];

  /**
   * @internal
   */
  determineDataLimits(): void {
    const labels = this.getLabels() as unknown as ILabelNodes;

    // labels are already prepared by the plugin just use them as ticks
    this._nodes = labels.slice();

    super.determineDataLimits();
  }

  /**
   * @internal
   */
  buildTicks(): {
    label: string;
    value: number;
  }[] {
    const nodes = this._nodes.slice(this.min, this.max + 1);

    const me = this as unknown as IInternalScale;
    me._valueRange = Math.max(nodes.length, 1);
    me._startValue = this.min - 0.5;
    if (nodes.length === 0) {
      return [];
    }

    return nodes.map((d, i) => ({ label: d.label, value: i })); // copy since mutated during auto skip
  }

  /**
   * @internal
   */
  configure(): void {
    super.configure();
    const nodes = this._nodes.slice(this.min, this.max + 1);
    const flat = (this.chart as unknown as IEnhancedChart).data.flatLabels ?? [];
    const total = (this as unknown as IInternalScale)._length;

    if (nodes.length === 0) {
      return;
    }

    // optimize such that the distance between two points on the same level is same
    // creating a grouping effect of nodes
    const ratio = this.options.levelPercentage;

    const distances: number[] = [];

    let prev = nodes[0];
    let prevParents = parentsOf(prev, flat);
    distances.push(0.5); // half top level distance before and after

    for (let i = 1; i < nodes.length; i += 1) {
      const n = nodes[i];
      const parents = parentsOf(n, flat);
      if (prev.parent === n.parent) {
        // same parent -> can use the level distance
        distances.push(Math.pow(ratio, n.level));
      } else {
        // different level -> use the distance of the common parent
        // find level of common parent
        let common = 0;
        while (parents[common] === prevParents[common]) {
          common += 1;
        }
        distances.push(Math.pow(ratio, common));
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
      // eslint-disable-next-line no-param-reassign
      node.center = offset;
      offset += next;

      // eslint-disable-next-line no-param-reassign
      node.width = Math.min(next, previous) / 2;
    });
  }

  /**
   * @internal
   */
  getPixelForDecimal(value: number): number {
    const index = Math.min(Math.floor(value * this._nodes.length), this._nodes.length - 1);

    if (index === 1 && this._nodes.length === 1) {
      // corner case in chartjs to determine tick width, hard coded 1
      return this._nodes[0].width;
    }
    return this._centerBase(index);
  }

  /**
   * @internal
   */
  _centerBase(index: number): number {
    const centerTick = this.options.offset;
    const base = (this as unknown as IInternalScale)._startPixel;
    const node = this._nodes[index];

    if (node == null) {
      return base;
    }

    const nodeCenter = node.center != null ? node.center : 0;
    const nodeWidth = node.width != null ? node.width : 0;
    return base + nodeCenter - (centerTick ? 0 : nodeWidth / 2);
  }

  /**
   * @internal
   */
  getValueForPixel(pixel: number): number {
    return this._nodes.findIndex((d) => pixel >= d.center - d.width / 2 && pixel <= d.center + d.width / 2);
  }

  /**
   * @internal
   */
  static id = 'hierarchical';

  /**
   * @internal
   */
  static defaults: any = /*! __PURE__ */ merge({}, [CategoryScale.defaults, defaultConfig]);

  /**
   * @internal
   */
  static afterRegister(): void {
    registry.addPlugins(hierarchicalPlugin);
  }
}

export interface HierarchicalScaleType extends Partial<IHierarchicalScaleOptions> {
  type: 'hierarchical';
}

declare module 'chart.js' {
  export interface ControllerDatasetOptions {
    tree: IValueNode[];
  }
  export interface CartesianScaleTypeRegistry {
    hierarchical: {
      options: IHierarchicalScaleOptions;
    };
  }
}
