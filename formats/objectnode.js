import Immutable from '../blots/immutable';

class ObjectNode extends Immutable {

	constructor(domNode) {
		super(domNode);

		if (this.domNode.hasAttribute("type")) {
			this.contentNode.setAttribute('type', this.domNode.getAttribute("type"));
			this.contentNode.setAttribute('icon', this.domNode.getAttribute("type"));
		}
		if (this.domNode.hasAttribute("index")) this.contentNode.setAttribute('index', this.domNode.getAttribute("index"));
	}

	static create(value) {

		let node = super.create(value.text);

		node.classList.add("objectNode");

		if (value.type) {
			node.setAttribute('type', value.type);
			node.setAttribute('icon', value.type);
			node.setAttribute('data-type', value.type);
		}

		node.setAttribute('data-uid', value.uid);
		node.setAttribute('data-object', value.object);

		if (value.index) node.setAttribute('index', value.index);
		if (value.is_new) node.classList.add('new');

		node.innerText = value.text;

		node.addEventListener('mouseover', function (evt) {
			zEditor.Utils.handleEntityHover(evt, node);
		});

		node.addEventListener('mouseout', function (evt) {
			zEditor.Utils.handleEntityHover(evt, node);
		});

		return node;
	}

	static value(domNode) {

		var data = {
			"uid": domNode.getAttribute('data-uid'),
			"type": domNode.getAttribute('data-type'),
			"object": domNode.getAttribute('data-object'),
			"length": 1
		};

		var text = domNode.innerText.trim();

		if (domNode.classList.contains('new')) data.is_new = true;
		if (domNode.hasAttribute('index')) data.index = domNode.getAttribute('index');

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
			text = node.innerText,
			parent = this.parent.domNode
		;

		this.leftGuard.parentNode.removeChild(this.leftGuard);
		this.rightGuard.parentNode.removeChild(this.rightGuard);

		var textNode = document.createTextNode(node.innerText.replace('\uFEFF', ''));

		parent.insertBefore(textNode, node);
		parent.removeChild(node);

		this.remove();
	}

	refreshData(data) {
		if (data.index) {
			this.contentNode.setAttribute('index', data.index);
		}
		else {
			this.contentNode.removeAttribute('index');
		}

		if (data.type) {
			this.domNode.setAttribute('data-type', data.type);
			this.contentNode.setAttribute('type', data.type);
			this.contentNode.setAttribute('icon', data.type);
		} else {
			this.domNode.removeAttribute('data-type');
			this.contentNode.removeAttribute('type');
			this.contentNode.removeAttribute('icon');
		}

		if (data.text) {
			this.contentNode.innerText = data.text;
		}
	}

}

ObjectNode.blotName = 'objectnode';
ObjectNode.tagName = 'SPAN';
ObjectNode.className = 'objectNode';

export default ObjectNode;
