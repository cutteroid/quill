import Immutable from '../blots/immutable';

class ObjectNode extends Immutable {

	constructor(domNode) {
		super(domNode);

		this._length = 1;
	}

	static create(value) {

		var node = document.createElement('span');

		node.classList.add("objectNode");

		if (value.type) {
			node.setAttribute('type', value.type);
			node.setAttribute('icon', value.type);
			node.setAttribute('data-type', value.type);
		}

		node.setAttribute('data-uid', value.uid);
		node.setAttribute('data-object', value.object);
		node.setAttribute('contenteditable', 'false');

		if (value.index) node.setAttribute('index', value.index);
		if (value.is_new) node.classList.add('new');

		node.innerHTML = value.text;

		node.addEventListener('mouseover', function (evt) {
			zEditor.Utils.handleEntityHover(evt);
		});

		node.addEventListener('mouseout', function (evt) {
			zEditor.Utils.handleEntityHover(evt);
		});

		return node;
	}

	static value(domNode) {

		var data = {
			"uid": domNode.getAttribute('data-uid'),
			"type": domNode.getAttribute('data-type'),
			"object": domNode.getAttribute('data-object'),
			"index": domNode.getAttribute('index'),
			"is_new": domNode.classList.contains('new'),
			"length": 1
		};

		var text = domNode.innerHTML.trim();
		if (text != '') {
			data['text'] = text;
		} else {
			var entityData = zEditor.Utils.getEntityData(data.uid);
			if (entityData) {
				data['text'] = entityData.text;
				domNode.entityText = entityData.text;
			}
		}
		if(!data['object']) data['object'] = 'entity';
		return data;
	}

	unwrap(domNode) {
		var
			node = this.domNode,
			parent = this.parent.domNode
		;
		while (node.firstChild) parent.insertBefore(node.firstChild, node);
			parent.removeChild(node);
		this.remove();
	}

	length() {
		return this._length;
	}

	refreshData(data) {
		if (data.index) {
			this.domNode.setAttribute('index', data.index);
		}
		else {
			this.domNode.removeAttribute('index');
		}

		this.domNode.setAttribute('type', data.type);
		this.domNode.setAttribute('icon', data.type);
	}

}

ObjectNode.blotName = 'objectnode';
ObjectNode.tagName = 'SPAN';
ObjectNode.className = 'objectNode';

export default ObjectNode;
