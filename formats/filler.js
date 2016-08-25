import Embed from '../blots/embed';
import Parchment from 'parchment';

class Filler extends Embed {

	constructor(domNode) {
		super(domNode);
		this.filler = true;
		this.NotEditable = true;
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
		var node = this.textNode;
		var text = node.data;
		if (text != Filler.contents) {
			var textBlot = Parchment.create('text', text.split(Filler.contents).join(''));
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
