// import Inline from '../blots/inline';
// import Embed from '../blots/embed';
import Immutable from '../blots/immutable';

class ObjectLink extends Immutable {

	constructor(domNode) {
		super(domNode);
		// this.immutable = true;
		// this._length = 1;
	}

	static create(value) {
		// var node = Inline.create.call(this, value.text);
		let node = super.create(value.text);

		node.setAttribute('href', value.min);
		node.setAttribute('data-original', value.original);
		node.setAttribute('target', '_blank');
		node.setAttribute('title', value.text);
		// node.setAttribute('contenteditable', 'false');
		node.textContent = value.text;
		return node;
	}

	static value(domNode) {
		var format = {
			"min": domNode.getAttribute('href'),
			"original": (domNode.hasAttribute('data-original'))? domNode.getAttribute('data-original') : domNode.getAttribute('href'),
			"contenteditable": false,
			"text": domNode.textContent,
			"length": domNode.textContent.length
		};
		return format;
	}

	length() { return 1; }
}

ObjectLink.blotName = 'objectlink';
ObjectLink.tagName = 'A';
ObjectLink.className = 'objectLink';

export default ObjectLink;

