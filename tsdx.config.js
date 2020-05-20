const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('rollup-plugin-pnp-resolve');
// import pkg from './package.json';

module.exports = {
  rollup(config, options) {
    if (options.format === 'umd') {
      config.input = './src/bundle.ts';
    }

    config.output.globals['chart.js'] = 'Chart';
    // const base = config.external;

    const c = config.plugins.findIndex((d) => d.name === 'commonjs');
    if (c !== -1) {
      config.plugins.splice(c, 1);
    }
    config.plugins.splice(0, 0, resolve(), commonjs());
    return config;
  },
};
