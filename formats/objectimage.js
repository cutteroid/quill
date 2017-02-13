import Embed from '../blots/embed';

class ObjectImage extends Embed {

	static create(value) {

		var
			tmpFragment = document.createDocumentFragment(),
			tmpNode = document.createElement('div'),
			tmpE = { c: tmpNode, data: value }
		;

		this.immutable = true;

		if (!value.height) value.height = 150;

		tmpFragment.appendChild(tmpNode);
		z.template( tmpE, ["reportForm_imageObjectNode", "add"] );

		var node = tmpNode.querySelector('.objectImage');
		zEditor.Utils.removeEmptyDescendants(node, true);

		var descr = node.querySelector('.description');

		if (descr) {
			node.description = descr;
		}

		node.addEventListener('mouseup', function(evt) {
			zEditor.Utils.handleImageClick(evt, this);
		});

		var resizer = node.querySelector('.resizeBar');
		resizer.addEventListener('mousedown', function(evt) {
			zEditor.Utils.handleImageResize(evt, this);
		});

		return node;
	}

	static value(domNode) {
		var format =
			{
				"preview": domNode.getAttribute('data-preview'),
				"height": domNode.getAttribute('data-height'),
				"description": (domNode.hasAttribute('data-description'))? domNode.getAttribute('data-description') : null,
				"uid": domNode.getAttribute('data-uid')
			};
		return format;
	}

	length() { return 1; }

}

ObjectImage.blotName = 'objectimage';
ObjectImage.tagName = 'DIV';
ObjectImage.className = 'objectImage';

export default ObjectImage;
