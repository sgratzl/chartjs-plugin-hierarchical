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

see [Samples](https://github.com/sgratzl/chartjs-plugin-hierarchical/tree/master/samples) on Github

or at this [![Open in CodePen][codepen]](https://codepen.io/sgratzl/pen/KKdryvg)

## Scale

a new scale type `hierarchical`.

## Styling

The `hierarchical` axis scale has the following styling options

```ts
interface IHierarchicalScaleOptions {
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
   * position of the hierarchy label in expanded levels, null to disable
   * @default 'below'
   */
  hierarchyLabelPosition: 'below' | 'above' | null;

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
   * object of attributes that should be managed and extracted from the tree
   * data structures such as `backgroundColor` for coloring individual bars
   * the object contains the key and default value
   * @default {}
   */
  attributes: { [attribute: string]: any };
}
```

## Data structure

```ts
interface ILabelNode {
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
   * list of children
   */
  children?: ISubLabelNode[];
}

/**
 * a label entry can be a single string or a complex ILabelNode
 */
declare type ISubLabelNode = ILabelNode | string;

interface IValueNode<T> {
  /**
   * the actual value of this node
   */
  value: T;
  /**
   * list of children
   */
  children?: ISubValueNode<T>[];
}

/**
 * a value entry can be a single value or a complex IValueNode
 */
declare type ISubValueNode<T> = IValueNode<T> | T;
```

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
yarn set version berry
cat .yarnrc_patch.yml >> .yarnrc.yml
yarn install
yarn pnpify --sdk vscode
```

### Common commands

```sh
yarn compile
yarn test
yarn lint
yarn fix
yarn build
yarn docs
yarn release
yarn release:pre
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
