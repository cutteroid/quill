import Inline from '../blots/inline';

class LinkStyle extends Inline {
  static create(value) {
    let node = super.create(value);
    return node;
  }

  format(name, value) {
    if (name !== this.statics.blotName || !value) return super.format(name, value);
  }
}

LinkStyle.blotName = 'linkstyle';
LinkStyle.className = 'linkStyle';
LinkStyle.tagName = 'A';

export default LinkStyle;
