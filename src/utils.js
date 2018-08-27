
/**
 * builds up recursivly the label tree
 * @param {string|ILabelNode} label
 * @param {ILabelNode|null} parent
 * @returns the node itself
 */
export function asNode(label, parent) {
  const node = Object.assign({
    label: '',
    children: [],
    expand: false,
    level: parent ? parent.level + 1 : 0,
    center: NaN,
    width: 0,
    hidden: false,
    major: !parent // for ticks
  }, typeof label === 'string' ? {label} : label);

  node.children = node.children.map((d) => asNode(d, node));

  return node;
}

/**
 * pushses a node into the given flat array and updates the index information to avoid parent links
 *
 * @param {ILabelNode} node
 * @param {number} i relative index of this node to its parent
 * @param {ILabelNode[]} flat flat array to push
 * @param {ILabelNode|null} parent
 */
function push(node, i, flat, parent) {
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
 * @param {Partial<ILabelNode>|string} labels
 */
export function toNodes(labels) {
  const nodes = labels.map((d) => asNode(d));

  const flat = [];
  nodes.forEach((d, i) => push(d, i, flat));

  return flat;
}

/**
 * computes the parents (including itself) of the given node
 * @param {ILabelNode} node
 * @param {ILabelNode[]} flat flatArray for lookup
 */
export function parentsOf(node, flat) {
  const parents = [node];
  while (parents[0].parent >= 0) {
    parents.unshift(flat[parents[0].parent]);
  }
  return parents;
}


function rightMost(node) {
  if (!node.expand || node.children.length === 0) {
    return node;
  }
  return rightMost(node.children[node.children.length - 1]);
}


/**
 * based on the visibility of the nodes computes the last node in the same level that is visible also considering expanded children
 * @param {ILabelNode} node
 * @param {ILabelNode[]} flat flatArray for lookup
 */
export function lastOfLevel(node, flat) {
  if (node.parent > -1) {
    const parent = flat[node.parent];
    return rightMost(parent.children[parent.children.length - 1]);
  }
  // top level search last top level sibling
  const sibling = flat.slice().reverse().find((d) => d.parent === -1);
  return rightMost(sibling);
}

export function preOrderTraversal(node, callback) {
  const goDeep = callback(node);
  if (goDeep !== false) {
    for (const child of node.children) {
      preOrderTraversal(child, callback);
    }
  }
}

/**
 * resolves for the given label node its value node
 * @param {ILabelNode} label
 * @param {ILabelNode[]} flat
 * @param {(IValueNode|any)[]} dataTree
 */
export function resolve(label, flat, dataTree) {
  const parents = parentsOf(label, flat);

  let dataItem = {children: dataTree};
  const dataParents = parents.map((p) => {
    dataItem = dataItem && !(typeof dataItem === 'number' && isNaN(dataItem)) && dataItem.children ? dataItem.children[p.relIndex] : NaN;
    return dataItem;
  });

  const value = dataParents[dataParents.length - 1];
  // convert to value
  if (typeof value !== 'number' && value.hasOwnProperty('value')) {
    return value.value;
  }
  return value;
}

/**
 * counts the number of nodes that are visible when the given node is expanded
 * @param {ILabelNode} node
 */
export function countExpanded(node) {
  if (!node.expand) {
    return 1;
  }
  return node.children.reduce((acc, d) => acc + countExpanded(d), 0);
}
