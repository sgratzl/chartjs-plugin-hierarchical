
/**
 * bulids up recursivly the label tree
 * @param {string|ILabelNode} label
 * @param {ILabelNode|null} parent
 * @returns the node itself
 */
export function asNode(label, parent) {
	const node = Object.assign({
		label: '',
		children: [],
		collapse: true,
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
	// node is hidden if parent is visible or not collapsed
	node.hidden = parent ? parent.collapse || !node.collapse : !node.collapse;

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

/**
 * based on the visibility of the nodes computes the last node in the same level that is visible also considering expanded children
 * @param {ILabelNode} node
 * @param {ILabelNode[]} flat flatArray for lookup
 */
export function lastOfLevel(node, flat) {
	let last = flat[node.index];
	while (last && last.level >= node.level && (last.level !== node.level || last.parent === node.parent)) {
		last = flat[last.index + 1];
	}
	return flat[(last ? last.index : flat.length) - 1];
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
	if (node.collapse) {
		return 1;
	}
	return node.children.reduce((acc, d) => acc + countExpanded(d), 0);
}
