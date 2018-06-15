// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
	dest: 'build/Chart.Hierarchical.js',
	format: 'umd',
	external: ['chart.js'],
	globals: {
		'chart.js': 'Chart'
	},
	moduleName: 'ChartHierarchical',
	plugins: [
		resolve(),
		commonjs(),
		babel()
	]
};
