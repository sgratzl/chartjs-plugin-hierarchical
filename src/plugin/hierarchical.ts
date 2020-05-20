import { Chart, defaults, registerPlugin, _parseFont, valueOrDefault } from '../chart';
import {
  toNodes,
  countExpanded,
  resolve,
  parentsOf,
  preOrderTraversal,
  lastOfLevel,
  spanLogic,
  determineVisible,
  flatChildren,
} from '../utils';
import { ILabelNodes, ILabelNode } from '../model';
import { HierarchicalScale } from '../scale';

function generateCode(labels: ReadonlyArray<ILabelNode | string>) {
  // label, expand, children
  let code = '';
  const encode = (label: string | ILabelNode) => {
    if (typeof label === 'string') {
      code += label;
      return;
    }
    code += `(l=${label.label},e=${label.expand},c=[`;
    (label.children || []).forEach(encode);
    code += '])';
  };

  labels.forEach(encode);
  return code;
}

export const HierarchicalPlugin = {
  id: 'hierarchical',

  _isValidScaleType(chart: Chart, scale: string) {
    if (!chart.config.options?.scales?.hasOwnProperty(scale)) {
      return false;
    }
    return (chart.config.options!.scales! as any)[scale].hasOwnProperty('type');
  },

  /**
   * checks whether this plugin needs to be enabled based on whether one is a hierarchical axis
   */
  _enabled(chart: Chart) {
    if (!chart.config.options?.hasOwnProperty('scales')) {
      return null;
    }
    if (this._isValidScaleType(chart, 'x') && chart.config.options!.scales!.x.type === 'hierarchical') {
      return 'x';
    }
    if (this._isValidScaleType(chart, 'y') && chart.config.options!.scales!.y.type === 'hierarchical') {
      return 'y';
    }
    return null;
  },

  /**
   * checks whether the data has been changed by the user and all caches are invalid
   */
  _check(chart: Chart) {
    if (chart.data.labels && chart.data._verify === generateCode(chart.data.labels)) {
      return;
    }

    // convert labels to nodes
    const flat = (chart.data.flatLabels = toNodes(chart.data.labels));
    chart.data.rootNodes = flat.filter((d) => d.parent === -1);

    const labels = (chart.data.labels = determineVisible(flat));

    chart.data.labels = labels;
    this._updateVerifyCode(chart);

    // convert the data tree to the flat visible counterpart
    chart.data.datasets.forEach((dataset) => {
      if (dataset.tree == null) {
        dataset.tree = dataset.data.slice();
      }
      dataset.data = labels.map((l) => resolve(l, flat, dataset.tree));
    });

    this._updateAttributes(chart);
  },

  /**
   * a verify code is used to recognize when the user changes the data
   * @param {*} chart
   */
  _updateVerifyCode(chart: Chart) {
    chart.data._verify = generateCode(chart.data.labels);
  },

  /**
   * updates the attributes according to config, similar to data sync
   */
  _updateAttributes(chart: Chart) {
    const scale = this._findScale(chart);
    if (!scale) {
      return;
    }
    const attributes = scale.options.attributes;

    const nodes = chart.data.labels;
    const flat = chart.data.flatLabels;

    Object.keys(attributes).forEach((attr) => {
      chart.data.datasets.forEach((d) => {
        const v = nodes.map((n) => {
          while (n) {
            if (n.hasOwnProperty(attr)) {
              return n[attr];
            }
            // walk up the hierarchy
            n = n.parent >= 0 ? flat[n.parent] : null;
          }
          return attributes[attr]; // default value
        });

        // check if all values are the same, if so replace with a single value
        d[attr] = v.length >= 1 && v.every((vi) => vi === v[0]) ? v[0] : v;
      });
    });
  },

  _findScale(chart: Chart) {
    const scales = Object.keys(chart.scales).map((d) => chart.scales[d]);
    return scales.find((d) => d.type === 'hierarchical');
  },

  beforeUpdate(chart: Chart) {
    if (!this._enabled(chart)) {
      return;
    }
    this._check(chart);
  },

  /**
   * draw the hierarchy indicators
   */
  beforeDatasetsDraw(chart: Chart) {
    if (!this._enabled(chart)) {
      return;
    }
    const scale = this._findScale(chart);
    const flat = chart.data.flatLabels;
    const visible = chart.data.labels as ILabelNodes;
    const roots = chart.data.rootNodes;
    const visibles = new Set(visible);
    const ctx = chart.ctx!;
    const hor = scale.isHorizontal();

    const boxSize = scale.options.hierarchyBoxSize;
    const boxSize05 = boxSize * 0.5;
    const boxSize01 = boxSize * 0.1;
    const boxRow = scale.options.hierarchyBoxLineHeight;
    const boxColor = scale.options.hierarchyBoxColor;
    const boxWidth = scale.options.hierarchyBoxWidth;
    const boxSpanColor = scale.options.hierarchySpanColor;
    const boxSpanWidth = scale.options.hierarchySpanWidth;
    const renderLabel = scale.options.hierarchyLabelPosition;

    const scaleLabel = scale.options.scaleLabel;
    const scaleLabelFontColor = valueOrDefault(scaleLabel.fontColor, defaults.fontColor);
    const scaleLabelFont = _parseFont(scaleLabel);

    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = boxWidth;
    ctx.fillStyle = scaleLabelFontColor; // render in correct color
    ctx.font = scaleLabelFont.string;

    const renderHorLevel = (node: ILabelNode) => {
      if (node.children.length === 0) {
        return false;
      }
      const offset = node.level * boxRow;

      if (!node.expand) {
        if (visibles.has(node)) {
          // expand button
          ctx.strokeRect(node.center - boxSize05, offset + 0, boxSize, boxSize);
          ctx.fillRect(node.center - boxSize05 + 2, offset + boxSize05 - 1, boxSize - 4, 2);
          ctx.fillRect(node.center - 1, offset + 2, 2, boxSize - 4);
        }
        return false;
      }
      const r = spanLogic(node, flat, visibles);
      if (!r) {
        return false;
      }
      const {
        hasFocusBox,
        hasCollapseBox,
        leftVisible,
        rightVisible,
        leftFirstVisible,
        rightLastVisible,
        groupLabelCenter,
      } = r;

      // render group label
      if (renderLabel === 'below') {
        ctx.fillText(node.label, groupLabelCenter, offset + boxSize);
      } else if (renderLabel === 'above') {
        ctx.fillText(node.label, groupLabelCenter, offset - boxSize);
      }

      if (hasCollapseBox) {
        // collapse button
        ctx.strokeRect(leftVisible.center - boxSize05, offset + 0, boxSize, boxSize);
        ctx.fillRect(leftVisible.center - boxSize05 + 2, offset + boxSize05 - 1, boxSize - 4, 2);
      }

      if (hasFocusBox) {
        // focus button
        ctx.strokeRect(rightVisible.center - boxSize05, offset + 0, boxSize, boxSize);
        ctx.fillRect(rightVisible.center - 2, offset + boxSize05 - 2, 4, 4);
      }

      if (leftVisible !== rightVisible) {
        // helper span line
        ctx.strokeStyle = boxSpanColor;
        ctx.lineWidth = boxSpanWidth;
        ctx.beginPath();
        if (hasCollapseBox) {
          // stitch to box
          ctx.moveTo(leftVisible.center + boxSize05, offset + boxSize05);
        } else if (leftFirstVisible) {
          // add starting group hint
          ctx.moveTo(leftVisible.center, offset + boxSize01);
          ctx.lineTo(leftVisible.center, offset + boxSize05);
        } else {
          // just a line
          ctx.moveTo(leftVisible.center, offset + boxSize05);
        }

        if (hasFocusBox) {
          ctx.lineTo(rightVisible.center - boxSize05, offset + boxSize05);
        } else if (rightLastVisible) {
          ctx.lineTo(rightVisible.center, offset + boxSize05);
          ctx.lineTo(rightVisible.center, offset + boxSize01);
        } else {
          ctx.lineTo(rightVisible.center, offset + boxSize05);
        }
        ctx.stroke();
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = boxWidth;
      }

      return true;
    };

    const renderVertLevel = (node: ILabelNode) => {
      if (node.children.length === 0) {
        return false;
      }
      const offset = node.level * boxRow * -1;

      if (!node.expand) {
        if (visibles.has(node)) {
          ctx.strokeRect(offset - boxSize, node.center - boxSize05, boxSize, boxSize);
          ctx.fillRect(offset - boxSize + 2, node.center - 1, boxSize - 4, 2);
          ctx.fillRect(offset - boxSize05 - 1, node.center - boxSize05 + 2, 2, boxSize - 4);
        }
        return false;
      }
      const r = spanLogic(node, flat, visibles);
      if (!r) {
        return false;
      }
      const {
        hasFocusBox,
        hasCollapseBox,
        leftVisible,
        rightVisible,
        leftFirstVisible,
        rightLastVisible,
        groupLabelCenter,
      } = r;

      // render group label
      ctx.fillText(node.label, offset - boxSize, groupLabelCenter);

      if (hasCollapseBox) {
        // collapse button
        ctx.strokeRect(offset - boxSize, leftVisible.center - boxSize05, boxSize, boxSize);
        ctx.fillRect(offset - boxSize + 2, leftVisible.center - 1, boxSize - 4, 2);
      }

      if (hasFocusBox) {
        // focus
        ctx.strokeRect(offset - boxSize, rightVisible.center - boxSize05, boxSize, boxSize);
        ctx.fillRect(offset - boxSize05 - 2, rightVisible.center - 2, 4, 4);
      }

      if (leftVisible !== rightVisible) {
        // helper span line
        ctx.strokeStyle = boxSpanColor;
        ctx.lineWidth = boxSpanWidth;
        ctx.beginPath();
        if (hasCollapseBox) {
          // stitch to box
          ctx.moveTo(offset - boxSize05, leftVisible.center + boxSize05);
        } else if (leftFirstVisible) {
          // add starting group hint
          ctx.moveTo(offset - boxSize01, leftVisible.center);
          ctx.lineTo(offset - boxSize05, leftVisible.center);
        } else {
          // just a line
          ctx.lineTo(offset - boxSize05, leftVisible.center);
        }

        if (hasFocusBox) {
          ctx.lineTo(offset - boxSize05, rightVisible.center - boxSize05);
        } else if (rightLastVisible) {
          ctx.lineTo(offset - boxSize05, rightVisible.center - boxSize05);
          ctx.lineTo(offset - boxSize01, rightVisible.center - boxSize05);
        } else {
          ctx.lineTo(offset - boxSize05, rightVisible.center);
        }
        ctx.stroke();
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = boxWidth;
      }

      return true;
    };

    if (hor) {
      ctx.textAlign = 'center';
      ctx.textBaseline = renderLabel === 'above' ? 'bottom' : 'top';
      ctx.translate(scale.left, scale.top + scale.options.padding);
      roots.forEach((n) => preOrderTraversal(n, renderHorLevel));
    } else {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.translate(scale.left - scale.options.padding, scale.top);

      roots.forEach((n) => preOrderTraversal(n, renderVertLevel));
    }

    ctx.restore();
  },

  _postDataUpdate(chart: Chart) {
    this._updateVerifyCode(chart);
    this._updateAttributes(chart);

    chart.update();
  },

  _expandCollapse(chart: Chart, index: number, count: number, toAdd: ILabelNodes) {
    const labels = chart.data.labels;
    const flatLabels = chart.data.flatLabels;
    const data = chart.data.datasets;

    // use splice since Chart.js is tracking the array using this method to have a proper animation
    const removed = labels.splice(index, count, ...toAdd);
    removed.forEach((d) => {
      d.hidden = true;
    });
    toAdd.forEach((d) => {
      d.hidden = false;
    });
    // update since line doesn't call it by itself
    this._findScale(chart).determineDataLimits();

    data.forEach((dataset) => {
      const toAddData = toAdd.map((d) => resolve(d, flatLabels, dataset.tree));
      dataset.data.splice(index, count, ...toAddData);
    });
  },

  _collapse(chart: Chart, index: number, parent: ILabelNode) {
    const count = countExpanded(parent);
    // collapse sub structures, too
    parent.children.forEach((c) =>
      preOrderTraversal(c, (d) => {
        d.expand = false;
      })
    );
    this._expandCollapse(chart, index, count, [parent]);
    parent.expand = false;

    this._postDataUpdate(chart);
  },

  _expand(chart: Chart, index: number, node: ILabelNode) {
    this._expandCollapse(chart, index, 1, node.children);
    node.expand = true;

    this._postDataUpdate(chart);
  },

  _zoomIn(chart: Chart, lastIndex: number, parent: ILabelNode, flat: ILabelNodes) {
    const count = countExpanded(parent);
    // reset others
    flat.forEach((d) => {
      if (d.expand === 'focus') {
        d.expand = true;
      }
    });
    parent.expand = 'focus';

    const index = lastIndex - count + 1;

    const labels = chart.data.labels;
    labels.splice(lastIndex + 1, labels.length);
    labels.splice(0, index);
    // update since line doesn't call it by itself
    this._findScale(chart).determineDataLimits();

    const data = chart.data.datasets;
    data.forEach((dataset) => {
      dataset.data.splice(lastIndex + 1, dataset.data.length);
      dataset.data.splice(0, index);
    });

    this._postDataUpdate(chart);
  },

  _zoomOut(chart: Chart, parent: ILabelNode) {
    const labels = chart.data.labels;
    const flatLabels = chart.data.flatLabels;

    parent.expand = true;
    const nextLabels = flatLabels.filter((d) => !d.hidden);
    const index = nextLabels.indexOf(labels[0]);
    const count = labels.length;

    labels.splice.apply(labels, [labels.length, 0].concat(nextLabels.slice(index + count)));
    labels.splice.apply(labels, [0, 0].concat(nextLabels.slice(0, index)));
    // update since line doesn't call it by itself
    this._findScale(chart).determineDataLimits();

    const data = chart.data.datasets;
    data.forEach((dataset) => {
      const toAddBefore = nextLabels.slice(0, index).map((d) => resolve(d, flatLabels, dataset.tree));
      const toAddAfter = nextLabels.slice(index + count).map((d) => resolve(d, flatLabels, dataset.tree));

      dataset.data.splice.apply(dataset.data, [dataset.data.length, 0].concat(toAddAfter));
      dataset.data.splice.apply(dataset.data, [0, 0].concat(toAddBefore));
    });

    this._postDataUpdate(chart);
  },

  _resolveElement(event: { x: number; y: number }, scale: HierarchicalScale) {
    const hor = scale.isHorizontal();
    let offset = hor ? scale.top + scale.options.padding : scale.left - scale.options.padding;
    if ((hor && event.y <= offset) || (!hor && event.x > offset)) {
      return null;
    }
    const index = scale.getValueForPixel(hor ? event.x - scale.left : event.y - scale.top);
    return {
      offset,
      index,
    };
  },

  _handleClickEvents(
    chart: Chart,
    _event: unknown,
    elem: { offset: number; index: number },
    offsetDelta: number,
    inRange: (v: number) => boolean
  ) {
    let offset = elem.offset;

    const index = elem.index;
    const flat = chart.data.flatLabels;
    const label = chart.data.labels[index];
    if (!label) {
      return;
    }
    const parents = parentsOf(label, flat);

    for (let i = 1; i < parents.length; ++i, offset += offsetDelta) {
      if (!inRange(offset)) {
        continue;
      }
      const node = parents[i];
      const isParentOfFirstChild = node.children[0] === parents[i + 1] || i === parents.length - 1;

      const parent = flat[node.parent];

      // first child of expanded parent
      if (isParentOfFirstChild && node.relIndex === 0 && parent.expand === true) {
        this._collapse(chart, index, parent);
        return;
      }
      const isLastChildOfParent = lastOfLevel(node, flat) === label; // leaf = current node

      // last index of focussed parent
      if (isLastChildOfParent && parent.expand === 'focus') {
        this._zoomOut(chart, parent);
        return;
      }
      // last index of expanded parent
      if (
        isLastChildOfParent &&
        parent.expand === true &&
        flatChildren(parent, flat).every((d) => d.expand !== 'focus')
      ) {
        this._zoomIn(chart, index, parent, flat);
        return;
      }
    }

    if (label.children.length > 0 && inRange(offset)) {
      // expand
      this._expand(chart, index, label);
      return;
    }
  },

  beforeEvent(chart: Chart, event: { x: number; y: number; type: string }) {
    if (event.type !== 'click' || !this._enabled(chart)) {
      return;
    }

    const scale = this._findScale(chart);
    const hor = scale.isHorizontal();

    const elem = this._resolveElement(event, scale);
    if (!elem) {
      return;
    }

    const boxRow = scale.options.hierarchyBoxLineHeight;

    const inRange = hor
      ? (o: number) => event.y >= o && event.y <= o + boxRow
      : (o: number) => event.x <= o && event.x >= o - boxRow;
    const offsetDelta = hor ? boxRow : -boxRow;
    this._handleClickEvents(chart, event, elem, offsetDelta, inRange);
  },
};

HierarchicalPlugin.register = () => registerPlugin(HierarchicalPlugin);
