import { HierarchicalScale } from './scale';
import { registry } from 'chart.js';
export * from '.';

registry.addScales(HierarchicalScale);
