import type { Chart, ChartData, ChartDataset } from 'chart.js';

export interface ILabelNode {
  label: string;
  expand: boolean | 'focus';
  level: number;

  center: number;
  width: number;
  hidden: boolean;
  major: boolean;
  toString(): string;

  parent: number;
  children: ILabelNode[];

  index: number;
  relIndex: number;

  value?: string;
}

export interface IRawLabelNode {
  /**
   * label
   */
  label: string;
  /**
   * defines whether this node is collapsed (false) or expanded (true) or focussed ('focus')
   * @default false
   */
  expand?: boolean | 'focus';
  /**
   * hide this node
   */
  hidden?: boolean;
  /**
   * list of children
   */
  children?: (IRawLabelNode | string)[];
}

export declare type ILabelNodes = readonly ILabelNode[];

export interface IValueNode {
  /**
   * the actual value of this node
   */
  value: number;
  /**
   * list of children
   */
  children: readonly (IValueNode | number)[];
}

export function isValueNode(node: IValueNode | any): node is IValueNode {
  return node != null && Array.isArray(node.children);
}

export interface IEnhancedChartDataSet extends ChartDataset<'bar'> {
  tree: (IValueNode | number)[];
}

export interface IEnhancedChart extends Chart<any, any, ILabelNode> {
  data: ChartData<any, any, ILabelNode> & {
    flatLabels?: ILabelNodes;
    labels: ILabelNode[];
    _verify?: string;
    rootNodes?: ILabelNodes;

    datasets: IEnhancedChartDataSet[];
  };
}
