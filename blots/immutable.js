import Embed from '../blots/embed';

class Immutable extends Embed {

	constructor(domNode) {
		super(domNode);
		this.immutable = true;
	}

}

export default Immutable;
