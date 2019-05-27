import Embed from '../blots/embed';

class Filler extends Embed {

	constructor(domNode) {
		super(domNode);
		this.filler = true;
		this.textNode = document.createTextNode(Filler.contents);
		this.domNode.appendChild(this.textNode);
		this._length = 0;
	}

	value() {
		return undefined;
	}

	index(node, offset) {
		if (node === this.textNode) return 0;
		return super.index(node, offset);
	}

	length() {
		return this._length;
	}

	optimize() {
		var
			node = this.domNode,
			text = node.textContent
		;

		if (text != Filler.contents) {
			var textBlot = this.scroll.create('text', text.replace(Filler.contents, ''));
			this.parent.insertBefore(textBlot, this);
			node.textContent = Filler.contents;
		}
	};
}

Filler.blotName = 'filler';
Filler.className = 'filler';
Filler.tagName = 'span';
Filler.contents = "\uFEFF";

export default Filler;
