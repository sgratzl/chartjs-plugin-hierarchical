# Chart.js Hierarchical Scale Plugin

[![datavisyn][datavisyn-image]][datavisyn-url] [![NPM Package][npm-image]][npm-url] [![Github Actions][github-actions-image]][github-actions-url]

Chart.js module for adding a new categorical scale which mimics a hierarchical tree.

![hierarchy](https://user-images.githubusercontent.com/4129778/41763778-6722e04a-75ff-11e8-84ad-1b417fd25c65.gif)

## Related Plugins

Check out also my other chart.js plugins:

- [chartjs-chart-boxplot](https://github.com/sgratzl/chartjs-chart-boxplot) for rendering boxplots and violin plots
- [chartjs-chart-error-bars](https://github.com/sgratzl/chartjs-chart-error-bars) for rendering errors bars to bars and line charts
- [chartjs-chart-geo](https://github.com/sgratzl/chartjs-chart-geo) for rendering map, bubble maps, and choropleth charts
- [chartjs-chart-graph](https://github.com/sgratzl/chartjs-chart-graph) for rendering graphs, trees, and networks
- [chartjs-chart-pcp](https://github.com/sgratzl/chartjs-chart-pcp) for rendering parallel coordinate plots
- [chartjs-chart-venn](https://github.com/sgratzl/chartjs-chart-venn) for rendering venn and euler diagrams
- [chartjs-chart-wordcloud](https://github.com/sgratzl/chartjs-chart-wordcloud) for rendering word clouds

## Install

```bash
npm install --save chart.js chartjs-plugin-hierarchical
```

## Usage

see [Examples](https://www.sgratzl.com/chartjs-plugin-hierarchical/examples/)

or at this [![Open in CodePen][codepen]](https://codepen.io/sgratzl/pen/KKdryvg)

## Scale

a new scale type `hierarchical`.

## Styling

The `hierarchical` axis scale has the following styling options

see [IHierarchicalScaleOptions](https://www.sgratzl/com/chartjs-plugin-hierarchical/api/interfaces/IHierarchicalScaleOptions.html)

## Data structure

see [ILabelNode](https://www.sgratzl/com/chartjs-plugin-hierarchical/api/interfaces/ILabelNode.html) and [IValueNode](https://www.sgratzl/com/chartjs-plugin-hierarchical/api/interfaces/IValueNode.html)

### ESM and Tree Shaking

The ESM build of the library supports tree shaking thus having no side effects. As a consequence the chart.js library won't be automatically manipulated nor new controllers automatically registered. One has to manually import and register them.

```js
import { Chart } from 'chart.js';
import { HierarchicalScale } from 'chartjs-plugin-hierarchical';

// register scale in chart.js and ensure the defaults are set
Chart.register(HierarchicalScale);
...
```

## Development Environment

```sh
npm i -g yarn
yarn install
yarn sdks vscode
```

### Common commands

```sh
yarn compile
yarn test
yarn lint
yarn fix
yarn build
yarn docs
```

---

<a href="https://www.datavisyn.io"><img src="https://www.datavisyn.io/img/logos/datavisyn-d-logo.png" align="left" width="25px" hspace="10" vspace="6"></a>
developed by **[datavisyn][datavisyn-url]**.

[datavisyn-image]: https://img.shields.io/badge/datavisyn-io-black.svg
[datavisyn-url]: https://www.datavisyn.io
[npm-image]: https://badge.fury.io/js/chartjs-plugin-hierarchical.svg
[npm-url]: https://npmjs.org/package/chartjs-plugin-hierarchical
[github-actions-image]: https://github.com/sgratzl/chartjs-plugin-hierarchical/workflows/ci/badge.svg
[github-actions-url]: https://github.com/sgratzl/chartjs-plugin-hierarchical/actions
[codepen]: https://img.shields.io/badge/CodePen-open-blue?logo=codepen
