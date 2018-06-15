


export function asNode(label, parent) {
	const node = Object.assign({
		label: '',
		children: [],
		collapse: true,
		level: parent ? parent.level + 1 : 0,
		center: NaN,
		width: 0,
		hidden: false,
		major: !Boolean(parent)
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
	node.children.forEach((d, i) => push(d, i, flat, node));
}

export function toNodes(labels) {
	const nodes = labels.map((d) => asNode(d));

	const flat = [];
	nodes.forEach((d, i) => push(d, i, flat));

	return flat;
}
