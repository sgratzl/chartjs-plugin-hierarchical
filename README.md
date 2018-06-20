# Chart.js Hierarchical Scale Plugin
[![datavisyn][datavisyn-image]][datavisyn-url] [![NPM Package][npm-image]][npm-url] [![CircleCI][circleci-image]][circleci-url]

Chart.js module for adding a new categorical scale which mimics a hierarchical tree.

![hierarchy](https://user-images.githubusercontent.com/4129778/41499042-81438f26-717a-11e8-8458-e50b08db5f32.gif)

## Install
```bash
npm install --save chart.js chartjs-scale-hierarchical
```

## Usage
see [Samples](https://github.com/datavisyn/chartjs-scale-hierarchical/tree/master/samples) on Github

## Scale

a new scale type `hierarchical`.

## Styling

The `hierarchical` axis scale has the following styling options

```typescript
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
   * object of attributes that should be managed and extacted from the tree datastrutures such as `backgroundColor` for coloring individual bars
   * the object conainst the key and default value
   * @default {}
   */
  attributes: {[attribute: string]: any};
}
```

## Data structure


```typescript
interface ILabelNode {
  /**
   * label
   */
  label: string;
  /**
   * defines whether this node is collapsed or expanded
   * @default false
   */
  expand?: boolean;
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


## Building

```sh
npm install
npm run build
```


***

<div style="display:flex;align-items:center">
  <a href="http://datavisyn.io"><img src="https://user-images.githubusercontent.com/1711080/37700685-bcbb18c6-2cec-11e8-9b6f-f49c9ef6c167.png" align="left" width="50px" hspace="10" vspace="6"></a>
  Developed by&nbsp;<strong><a href="http://datavisyn.io">datavisyn</a></strong>.
</div>

[datavisyn-image]: https://img.shields.io/badge/datavisyn-io-black.svg
[datavisyn-url]: http://datavisyn.io
[npm-image]: https://badge.fury.io/js/chartjs-scale-hierarchical.svg
[npm-url]: https://npmjs.org/package/chartjs-scale-hierarchical
[circleci-image]: https://circleci.com/gh/datavisyn/chartjs-scale-hierarchical.svg?style=shield
[circleci-url]: https://circleci.com/gh/datavisyn/chartjs-scale-hierarchical

