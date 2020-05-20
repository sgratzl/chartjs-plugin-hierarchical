import ChartNS, { PluginServiceGlobalRegistration, PluginServiceRegistrationOptions } from 'chart.js';

export const Chart = ChartNS;

export declare type IMapping = {
  [key: string]: IMapping | number | string | boolean;
};

export function registerPlugin(plugin: PluginServiceGlobalRegistration & PluginServiceRegistrationOptions) {
  ChartNS.plugins.register(plugin);
  return plugin;
}

export const defaults: {
  set(key: string, value: IMapping): void;
  [key: string]: any;
} = ChartNS.defaults as any;

export interface IScaleConstructor {
  readonly id: string;
  readonly defaults: IMapping;
}

export function registerScale(scale: IScaleConstructor) {
  (ChartNS as any).scaleService.registerScale(scale);
  return scale;
}

export declare class CategoryScaleType<T> {
  chart: ChartNS;
  isHorizontal(): boolean;
  determineDataLimits(): void;
  getLabels(): (string | any)[];

  left: number;
  top: number;
  width: number;
  height: number;
  min: number;
  max: number;

  _numLabels: number;
  _valueRange: number;
  _startValue: number;
  buildTicks(): { label: string }[];

  options: T;

  getPixelForDecimal(value: number): number;
  getValueForPixel(pixel: number): number;
}

export declare interface CategoryScaleTypeConstructor {
  new <T>(): CategoryScaleType<T>;

  readonly id: string;
  readonly defaults: IMapping;
}

// export const Scale = ChartNS.Scale;
// export const LinearScale = ChartNS.scaleService.getScaleConstructor('linear');
// export const LogarithmicScale = ChartNS.scaleService.getScaleConstructor('logarithmic');
export const CategoryScale: CategoryScaleTypeConstructor = (ChartNS as any).scaleService.getScaleConstructor(
  'category'
);

// export const DatasetController = ChartNS.DatasetController;
// export const BarController = controllers.bar;
// export const BubbleController = controllers.bubble;
// export const HorizontalBarController = controllers.horizontalBar;
// export const LineController = controllers.line;
// export const PolarAreaController = controllers.polarArea;
// export const ScatterController = controllers.scatter;

// export const Element = ChartNS.Element;
// export const Rectangle = ChartNS.elements.Rectangle;
// export const Point = ChartNS.elements.Point;
// export const Line = ChartNS.elements.Line;
// export const Arc = ChartNS.elements.Arc;

export const merge: <T = IMapping>(target: any, sources: any[]) => T = ChartNS.helpers.merge;
// export const drawPoint = ChartNS.helpers.canvas.drawPoint;
// export const resolve = ChartNS.helpers.options.resolve;
// export const color = ChartNS.helpers.color;
export const valueOrDefault: <T>(value: T | undefined, defaultValue: T) => T = ChartNS.helpers.valueOrDefault;
export const _parseFont = ChartNS.helpers.options._parseFont;
// export const clipArea = ChartNS.helpers.canvas.clipArea;
// export const unclipArea = ChartNS.helpers.canvas.unclipArea;
