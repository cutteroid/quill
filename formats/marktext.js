import Inline from '../blots/inline';

class MarkText extends Inline {
  static create(value) {
    let node = super.create(value);
    return node;
  }

  format(name, value) {
    if (name !== this.statics.blotName || !value) return super.format(name, value);
  }

  formats() {
    return MarkText.tagName;
  }
}

MarkText.blotName = 'marktext';
MarkText.className = 'markText';
MarkText.tagName = 'SPAN';

export default MarkText;
