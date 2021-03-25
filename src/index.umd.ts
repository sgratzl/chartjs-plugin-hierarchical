import { registry } from 'chart.js';
import { HierarchicalScale } from './scale';

export * from '.';

registry.addScales(HierarchicalScale);
