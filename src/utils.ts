import { ILabelNode, ILabelNodes, IValueNode, isValueNode, IRawLabelNode } from './model';

/**
 * builds up recursively the label tree
 * @returns the node itself
 */
export function asNode(label: string | IRawLabelNode, parent?: ILabelNode): ILabelNode {
  const node: ILabelNode = Object.assign(
    {
      label: '',
      index: 0,
      relIndex: 0,
      children: [],
      expand: false,
      parent: parent ? parent.index : -1,
      level: parent ? parent.level + 1 : 0,
      center: Number.NaN,
      width: 0,
      hidden: false,
      major: !parent, // for ticks,
      toString() {
        return this.label;
      },
    },
    typeof label === 'string'
      ? {
          label,
        }
      : label
  );

  node.children = node.children.map((d) => asNode(d, node));

  return node;
}

/**
 * pushes a node into the given flat array and updates the index information to avoid parent links
 */
function push(node: ILabelNode, i: number, flat: ILabelNode[], parent?: ILabelNode) {
  node.relIndex = i;
  node.index = flat.length; // absolute index
  node.parent = parent ? parent.index : -1;
  // node is hidden if parent is visible or not expanded
  node.hidden = Boolean(parent ? parent.expand === false || node.expand : node.expand);

  flat.push(node);

  node.children.forEach((d, j) => push(d, j, flat, node));
}

/**
 * converts the given labels to a flat array of linked nodes
 */
export function toNodes(labels: ReadonlyArray<IRawLabelNode | string>) {
  const nodes = labels.map((d) => asNode(d));

  const flat: ILabelNode[] = [];
  nodes.forEach((d, i) => push(d, i, flat));

  return flat;
}

/**
 * computes the parents (including itself) of the given node
 * @param {ILabelNode} node
 * @param {ILabelNode[]} flat flatArray for lookup
 */
export function parentsOf(node: ILabelNode, flat: ILabelNodes) {
  const parents = [node];
  while (parents[0].parent >= 0) {
    parents.unshift(flat[parents[0].parent]);
  }
  return parents;
}

/**
 * computes the right most grand child of expanded nodes
 */
function rightMost(node: ILabelNode): ILabelNode {
  if (!node.expand || node.children.length === 0) {
    return node;
  }
  return rightMost(node.children[node.children.length - 1]);
}

/**
 * based on the visibility of the nodes computes the last node in the same level that is visible also considering expanded children
 */
export function lastOfLevel(node: ILabelNode, flat: ILabelNodes) {
  if (node.parent > -1) {
    const parent = flat[node.parent];
    return rightMost(parent.children[parent.children.length - 1]);
  }
  // top level search last top level sibling
  const sibling = flat
    .slice()
    .reverse()
    .find((d) => d.parent === -1)!;
  return rightMost(sibling);
}

/**
 * traverses the tree in pre order logic
 * @param {ILabelNode} node
 * @param {} visit return false to skip the traversal of children
 */
export function preOrderTraversal(node: ILabelNode, visit: (node: ILabelNode) => void | boolean) {
  const goDeep = visit(node);
  if (goDeep !== false) {
    node.children.forEach((child) => preOrderTraversal(child, visit));
  }
}

/**
 * resolves for the given label node its value node
 */
export function resolve(label: ILabelNode, flat: ILabelNodes, dataTree: (IValueNode | number)[]) {
  const parents = parentsOf(label, flat);

  let dataItem: IValueNode | number = {
    children: dataTree,
    value: Number.NaN,
  };
  const dataParents = parents.map((p) => {
    dataItem = dataItem && isValueNode(dataItem) ? dataItem.children[p.relIndex] : Number.NaN;
    return dataItem;
  });

  const value = dataParents[dataParents.length - 1];
  // convert to value
  if (isValueNode(value)) {
    return value.value;
  }
  return value;
}

/**
 * counts the number of nodes that are visible when the given node is expanded
 */
export function countExpanded(node: ILabelNode): number {
  if (!node.expand) {
    return 1;
  }
  return node.children.reduce((acc, d) => acc + countExpanded(d), 0);
}

export function flatChildren(node: ILabelNode, flat: ILabelNodes) {
  if (node.children.length === 0) {
    return [];
  }
  const firstChild = node.children[0];
  if (node.parent >= 0 && node.relIndex < flat[node.parent].children.length - 1) {
    // not the last child and have parent, fast track using sibling
    const nextSibling = flat[node.parent].children[node.relIndex + 1];
    return flat.slice(firstChild.index, nextSibling.index);
  }
  // find sibling or next in the hierarchy up
  const nextSibling = flat
    .slice(firstChild.index + 1)
    .find((d) => d.level < node.level || (d.parent === node.parent && d.relIndex === node.relIndex + 1));
  if (nextSibling) {
    return flat.slice(firstChild.index, nextSibling.index);
  }
  // no sibling found = till end
  return flat.slice(firstChild.index);
}

export function determineVisible(flat: ILabelNodes) {
  const focus = flat.find((d) => d.expand === 'focus');

  if (focus) {
    return flat.slice(focus.index + 1).filter((d) => !d.hidden && parentsOf(d, flat).includes(focus));
  }
  // the real labels are the one not hidden in the tree
  return flat.filter((d) => !d.hidden);
}

export interface ISpanLogicResult {
  hasCollapseBox: boolean;
  hasFocusBox: boolean;
  leftVisible: ILabelNode;
  rightVisible: ILabelNode;
  groupLabelCenter: number;
  leftFirstVisible: boolean;
  rightLastVisible: boolean;
}

/**
 */
export function spanLogic(
  node: ILabelNode,
  flat: ILabelNodes,
  visibleNodes: Set<ILabelNode>
): false | ISpanLogicResult {
  if (node.children.length === 0 || !node.expand) {
    return false;
  }
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  const flatSubTree = flatChildren(node, flat);

  const leftVisible = flatSubTree.find((d) => visibleNodes.has(d));
  const rightVisible = flatSubTree
    .slice()
    .reverse()
    .find((d) => visibleNodes.has(d));

  if (!leftVisible || !rightVisible) {
    return false;
  }

  const leftParents = parentsOf(leftVisible, flat);
  const rightParents = parentsOf(rightVisible, flat);
  // is the left visible one also a child of my first child = whole starting range is visible?
  const leftFirstVisible = leftParents[node.level + 1] === firstChild;
  // is the right visible one also my last child = whole end range is visible?
  const rightLastVisible = rightParents[node.level + 1] === lastChild;

  const hasCollapseBox = leftFirstVisible && node.expand !== 'focus';
  const hasFocusBox = leftFirstVisible && rightLastVisible && node.children.length > 1;
  // the next visible after the left one
  const nextVisible = flat.slice(leftVisible.index + 1, rightVisible.index + 1).find((d) => visibleNodes.has(d));
  const groupLabelCenter = !nextVisible ? leftVisible.center : (leftVisible.center + nextVisible.center) / 2;

  return {
    hasCollapseBox,
    hasFocusBox,
    leftVisible,
    rightVisible,
    groupLabelCenter,
    leftFirstVisible,
    rightLastVisible,
  };
}
