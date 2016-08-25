import Embed from '../blots/embed';

class DropZone extends Embed {

	constructor(domNode) {
		super(domNode);
		this._length = 0;
		this.textNode = document.createTextNode(DropZone.CONTENTS);
		this.domNode.appendChild(this.textNode);
	}

	static value() {
		return undefined;
	}

	remove() {
		console.debug('remove');
		super.remove();
		this.parent = null;
	}

	length() {
		return this._length;
	}
}

DropZone.blotName = 'dropzone';
DropZone.tagName = 'div';
DropZone.className = 'dropZone';
DropZone.CONTENTS = "\uFEFF";

export default DropZone;
