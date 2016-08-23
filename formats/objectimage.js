import Embed from '../blots/embed';

class ObjectImage extends Embed {

	create(value) {
		var
			tmpFragment = document.createDocumentFragment(),
			tmpNode = document.createElement('div'),
			tmpE = { c: tmpNode, data: value }
		;

		// this.NotEditable = true;

		if (!value.height) value.height = zEditor.Modules.Images.minImageHeight;

		tmpFragment.appendChild(tmpNode);
		z.template( tmpE, ["reportForm_imageObjectNode", "add"] );

		var node = tmpNode.querySelector('.objectImage');
		zEditor.Utils.removeEmptyDescendants(node, true);

		var descr = node.querySelector('.description');

		if (descr) {
			node.description = descr;
		}

		node.addEventListener('mouseup', function(evt) {
			zEditor.Entity.handleImageClick(evt, this);
		});

		var resizer = node.querySelector('.resizeBar');
		resizer.addEventListener('mousedown', function(evt) {
			zEditor.Entity.handleImageResize(evt, this);
		});

		return node;
	}

	value(domNode) {
		var format =
			{
				"preview": domNode.getAttribute('preview'),
				"height": domNode.getAttribute('height'),
				"description": (domNode.hasAttribute('description'))? domNode.getAttribute('description') : null,
				"uid": domNode.getAttribute('uid')
			};
		return format;
	}

	length() { return 1; }

}

ObjectImage.blotName = 'objectimage';
ObjectImage.tagName = 'DIV';
ObjectImage.className = 'objectImage';

export default ObjectImage;
