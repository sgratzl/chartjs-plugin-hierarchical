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
  label: string;
  expand?: boolean | 'focus';
  hidden?: boolean;
  children?: (IRawLabelNode | string)[];
}

export declare type ILabelNodes = ReadonlyArray<ILabelNode>;

export interface IValueNode {
  children: ReadonlyArray<IValueNode | number>;
  value: number;
}

export function isValueNode(node: IValueNode | any): node is IValueNode {
  return node != null && Array.isArray(node.children);
}

export interface IEnhancedChartDataSet extends ChartDataset<'bar'> {
  tree: IValueNode[];
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
