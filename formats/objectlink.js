import Inline from '../blots/inline';
import Cursor from '../blots/cursor';
import Text from '../blots/text';

class ObjectLink extends Inline {

	constructor(domNode) {
		super(domNode);
		this.NotEditable = true;
	}

	static create(value) {
		var node = Inline.create.call(this, value.text);
		node.setAttribute('href', value.min);
		node.setAttribute('original', value.original);
		node.setAttribute('target', '_blank');
		node.setAttribute('title', value.text);
		node.setAttribute('contenteditable', 'false');
		return node;
	}

	static formats(domNode) {
		var format = {
			"min": domNode.getAttribute('href'),
			"original": domNode.getAttribute('original'),
			"contenteditable": false,
			"text": domNode.textContent,
			"length": domNode.textContent.length
		};
		return format;
	}

	insertAt() {
		return false;
	}

	deleteAt() {
		return false;
	}

	formatAt() {
		return false;
	}
}

ObjectLink.blotName = 'objectlink';
ObjectLink.tagName = 'A';
ObjectLink.className = 'objectLink';
ObjectLink.allowedChildren = [ Text, Cursor ];

export default ObjectLink;

