import { defaults, toFont, valueOrDefault, IPlugin, Chart, IEvent } from '@sgratzl/chartjs-esm-facade';
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
import { ILabelNodes, ILabelNode, IEnhancedChart, IEnhancedChartDataSet } from '../model';
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

function isValidScaleType(chart: Chart, scale: string) {
  if (!chart.config.options?.scales?.hasOwnProperty(scale)) {
    return false;
  }
  return (chart.config.options!.scales! as any)[scale].hasOwnProperty('type');
}

/**
 * checks whether this plugin needs to be enabled based on whether one is a hierarchical axis
 */
function enabled(chart: Chart) {
  if (!chart.config.options?.hasOwnProperty('scales')) {
    return null;
  }
  const scales = chart.config.options!.scales! as any;
  if (isValidScaleType(chart, 'x') && scales.x.type === 'hierarchical') {
    return 'x';
  }
  if (isValidScaleType(chart, 'y') && scales.y.type === 'hierarchical') {
    return 'y';
  }
  return null;
}

/**
 * checks whether the data has been changed by the user and all caches are invalid
 */
function check(chart: IEnhancedChart) {
  if (chart.data.labels && chart.data._verify === generateCode(chart.data.labels)) {
    return;
  }

  // convert labels to nodes
  const flat = (chart.data.flatLabels = toNodes(chart.data.labels));
  chart.data.rootNodes = flat.filter((d) => d.parent === -1);

  const labels = determineVisible(flat);

  (chart.data.labels as any) = labels;
  updateVerifyCode(chart);

  // convert the data tree to the flat visible counterpart
  chart.data.datasets.forEach((dataset: IEnhancedChartDataSet) => {
    if (dataset.tree == null) {
      dataset.tree = (dataset.data as any[]).slice();
    }
    dataset.data = labels.map((l) => resolve(l, flat, dataset.tree));
  });

  updateAttributes(chart);
}

/**
 * a verify code is used to recognize when the user changes the data
 * @param {*} chart
 */
function updateVerifyCode(chart: IEnhancedChart) {
  chart.data._verify = generateCode(chart.data.labels);
}

/**
 * updates the attributes according to config, similar to data sync
 */
function updateAttributes(chart: IEnhancedChart) {
  const scale = findScale(chart);
  if (!scale) {
    return;
  }
  const attributes = scale.options.attributes;

  const nodes = chart.data.labels as ILabelNodes;
  const flat = chart.data.flatLabels!;

  Object.keys(attributes).forEach((attr) => {
    chart.data.datasets.forEach((d) => {
      const v = nodes.map((n: ILabelNode | null) => {
        while (n) {
          if (n.hasOwnProperty(attr)) {
            return (n as any)[attr];
          }
          // walk up the hierarchy
          n = n.parent >= 0 ? flat[n.parent] : null;
        }
        return attributes[attr]; // default value
      });

      // check if all values are the same, if so replace with a single value
      (d as any)[attr] = v.length >= 1 && v.every((vi) => vi === v[0]) ? v[0] : v;
    });
  });
}

function findScale(chart: Chart) {
  const scales = Object.keys(chart.scales).map((d) => chart.scales[d]);
  return scales.find((d) => d.type === 'hierarchical') as HierarchicalScale | undefined;
}

function postDataUpdate(chart: IEnhancedChart) {
  updateVerifyCode(chart);
  updateAttributes(chart);

  chart.update();
}

function expandCollapse(chart: IEnhancedChart, index: number, count: number, toAdd: ILabelNodes) {
  const labels = chart.data.labels;
  const flatLabels = chart.data.flatLabels!;
  const data = chart.data.datasets as IEnhancedChartDataSet[];

  // use splice since Chart.js is tracking the array using this method to have a proper animation
  const removed = labels.splice(index, count, ...toAdd);
  removed.forEach((d) => {
    d.hidden = true;
  });
  toAdd.forEach((d) => {
    d.hidden = false;
  });
  // update since line doesn't call it by itself
  findScale(chart)!.determineDataLimits();

  data.forEach((dataset) => {
    const toAddData = toAdd.map((d) => resolve(d, flatLabels, dataset.tree));
    dataset.data!.splice(index, count, ...toAddData);
  });
}

function collapse(chart: IEnhancedChart, index: number, parent: ILabelNode) {
  const count = countExpanded(parent);
  // collapse sub structures, too
  parent.children.forEach((c) =>
    preOrderTraversal(c, (d) => {
      d.expand = false;
    })
  );
  expandCollapse(chart, index, count, [parent]);
  parent.expand = false;

  postDataUpdate(chart);
}

function expand(chart: IEnhancedChart, index: number, node: ILabelNode) {
  expandCollapse(chart, index, 1, node.children);
  node.expand = true;

  postDataUpdate(chart);
}

function zoomIn(chart: IEnhancedChart, lastIndex: number, parent: ILabelNode, flat: ILabelNodes) {
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
  findScale(chart)!.determineDataLimits();

  const data = chart.data.datasets;
  data.forEach((dataset) => {
    dataset.data!.splice(lastIndex + 1, dataset.data!.length);
    dataset.data!.splice(0, index);
  });

  postDataUpdate(chart);
}

function zoomOut(chart: IEnhancedChart, parent: ILabelNode) {
  const labels = chart.data.labels as ILabelNode[];
  const flatLabels = chart.data.flatLabels!;

  parent.expand = true;
  const nextLabels = flatLabels.filter((d) => !d.hidden);
  const index = nextLabels.indexOf(labels[0]);
  const count = labels.length;

  labels.splice(labels.length, 0, ...nextLabels.slice(index + count));
  labels.splice(0, 0, ...nextLabels.slice(0, index));
  // update since line doesn't call it by itself
  findScale(chart)!.determineDataLimits();

  const data = chart.data.datasets as IEnhancedChartDataSet[];
  data.forEach((dataset) => {
    const toAddBefore = nextLabels.slice(0, index).map((d) => resolve(d, flatLabels, dataset.tree));
    const toAddAfter = nextLabels.slice(index + count).map((d) => resolve(d, flatLabels, dataset.tree));

    dataset.data!.splice(dataset.data!.length, 0, ...toAddAfter);
    dataset.data!.splice(0, 0, ...toAddBefore);
  });

  postDataUpdate(chart);
}

function resolveElement(event: { x: number; y: number }, scale: HierarchicalScale) {
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
}

function handleClickEvents(
  chart: Chart,
  _event: unknown,
  elem: { offset: number; index: number },
  offsetDelta: number,
  inRange: (v: number) => boolean
) {
  const cc = chart as IEnhancedChart;
  let offset = elem.offset;

  const index = elem.index;
  const flat = cc.data.flatLabels!;
  const label = (cc.data.labels![index] as unknown) as ILabelNode;
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
      collapse(cc, index, parent);
      return;
    }
    const isLastChildOfParent = lastOfLevel(node, flat) === label; // leaf = current node

    // last index of focussed parent
    if (isLastChildOfParent && parent.expand === 'focus') {
      zoomOut(cc, parent);
      return;
    }
    // last index of expanded parent
    if (
      isLastChildOfParent &&
      parent.expand === true &&
      flatChildren(parent, flat).every((d) => d.expand !== 'focus')
    ) {
      zoomIn(cc, index, parent, flat);
      return;
    }
  }

  if (label.children.length > 0 && inRange(offset)) {
    // expand
    expand(cc, index, label);
    return;
  }
}

export const hierarchicalPlugin: IPlugin = {
  id: 'hierarchical',

  beforeUpdate(chart: Chart) {
    if (!enabled(chart)) {
      return;
    }
    check((chart as unknown) as IEnhancedChart);
  },

  /**
   * draw the hierarchy indicators
   */
  beforeDatasetsDraw(chart: Chart) {
    if (!enabled(chart)) {
      return;
    }
    const cc = (chart as unknown) as IEnhancedChart;
    const scale = findScale(chart)!;
    const flat = cc.data.flatLabels!;
    const visible = (chart.data.labels as unknown) as ILabelNodes;
    const roots = cc.data.rootNodes!;
    const visibleNodes = new Set(visible);
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
    const groupLabelPosition = scale.options.hierarchyGroupLabelPosition;
    const isStatic = scale.options.static;

    const scaleLabel = scale.options.scaleLabel!;
    const scaleLabelFontColor = valueOrDefault(scaleLabel.font?.color, defaults.font.color);
    const scaleLabelFont = toFont(scaleLabel.font);

    function renderButton(type: 'expand' | 'collapse' | 'focus', vert: boolean, x: number, y: number) {
      if (isStatic) {
        if (type === 'expand') {
          return;
        }
        ctx.save();
        ctx.strokeStyle = boxSpanColor;
        ctx.lineWidth = boxSpanWidth;
        ctx.beginPath();
        if (vert) {
          ctx.moveTo(x - boxSize01, y);
          ctx.lineTo(x - boxSize05, y);
        } else {
          ctx.moveTo(x, y + boxSize01);
          ctx.lineTo(x, y + boxSize05);
          ctx.lineTo(x + (type === 'collapse' ? boxSize05 : -boxSize05), y + boxSize05);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }
      const x0 = x - (vert ? boxSize : boxSize05);
      const y0 = y - (vert ? boxSize05 : 0);

      ctx.strokeRect(x0, y0, boxSize, boxSize);

      switch (type) {
        case 'expand':
          // +
          ctx.fillRect(x0 + 2, y0 + boxSize05 - 1, boxSize - 4, 2);
          ctx.fillRect(x0 + boxSize05 - 1, y0 + 2, 2, boxSize - 4);
          break;
        case 'collapse':
          // -
          ctx.fillRect(x0 + 2, y0 + boxSize05 - 1, boxSize - 4, 2);
          break;
        case 'focus':
          // .
          ctx.fillRect(x0 + boxSize05 - 2, y0 + boxSize05 - 2, 4, 4);
      }
    }

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
        if (visibleNodes.has(node)) {
          renderButton('expand', false, node.center, offset);
        }
        return false;
      }
      const r = spanLogic(node, flat, visibleNodes, groupLabelPosition);
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
        renderButton('collapse', false, leftVisible.center, offset);
      }
      if (hasFocusBox) {
        renderButton('focus', false, rightVisible.center, offset);
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
        if (visibleNodes.has(node)) {
          renderButton('expand', true, offset, node.center);
        }
        return false;
      }
      const r = spanLogic(node, flat, visibleNodes, groupLabelPosition);
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
        renderButton('collapse', true, offset, leftVisible.center);
      }
      if (hasFocusBox) {
        renderButton('focus', true, offset, rightVisible.center);
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

  beforeEvent(chart: Chart, event: IEvent) {
    if (event.type !== 'click' || !enabled(chart)) {
      return;
    }
    const clickEvent = event as { x: number; y: number };

    const scale = findScale(chart)!;
    if (scale.options.static) {
      return;
    }
    const hor = scale.isHorizontal();

    const elem = resolveElement(clickEvent, scale);
    if (!elem) {
      return;
    }

    const boxRow = scale.options.hierarchyBoxLineHeight;

    const inRange = hor
      ? (o: number) => clickEvent.y >= o && clickEvent.y <= o + boxRow
      : (o: number) => clickEvent.x <= o && clickEvent.x >= o - boxRow;
    const offsetDelta = hor ? boxRow : -boxRow;
    handleClickEvents(chart, event, elem, offsetDelta, inRange);
  },
};
