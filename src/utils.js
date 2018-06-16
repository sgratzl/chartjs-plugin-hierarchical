
export function asNode(label, parent) {
	const node = Object.assign({
		label: '',
		children: [],
		collapse: true,
		level: parent ? parent.level + 1 : 0,
		center: NaN,
		width: 0,
		hidden: false,
		major: !parent
	}, typeof label === 'string' ? {label} : label);

	node.children = node.children.map((d) => asNode(d, node));

	return node;
}

function push(node, i, flat, parent) {
	node.relIndex = i;
	node.index = flat.length;
	node.parent = parent ? parent.index : -1;
	node.hidden = parent ? parent.collapse || !node.collapse : !node.collapse;
	flat.push(node);
	node.children.forEach((d, j) => push(d, j, flat, node));
}

export function toNodes(labels) {
	const nodes = labels.map((d) => asNode(d));

	const flat = [];
	nodes.forEach((d, i) => push(d, i, flat));

	return flat;
}

export function parentsOf(node, flat) {
	const parents = [node];
	while (parents[0].parent >= 0) {
		parents.unshift(flat[parents[0].parent]);
	}
	return parents;
}

export function lastOfLevel(node, flat) {
	let last = flat[node.index];
	while (last && last.level >= node.level && (last.level !== node.level || last.parent === node.parent)) {
		last = flat[last.index + 1];
	}
	return flat[(last ? last.index : flat.length) - 1];
}

export function resolve(label, flat, dataTree) {
	const parents = parentsOf(label, flat);

	let dataItem = {children: dataTree};
	const dataParents = parents.map((p) => dataItem && !(typeof dataItem === 'number' && isNaN(dataItem)) && dataItem.children ? dataItem.children[p.relIndex] : NaN);

	return dataParents[dataParents.length - 1];
}

export function countExpanded(node) {
	if (node.collapse) {
		return 1;
	}
	return node.children.reduce((acc, d) => acc + countExpanded(d), 0);
}
