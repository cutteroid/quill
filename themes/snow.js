import extend from 'extend';
import BaseTheme from './base';

const TOOLBAR_CONFIG = [];

class SnowTheme extends BaseTheme {
  constructor(quill, options) {
    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
      options.modules.toolbar.container = TOOLBAR_CONFIG;
    }
    super(quill, options);
  }

  // extendToolbar(toolbar) {
  // if (toolbar.container.querySelector('.ql-link')) {
  //   this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
  //     toolbar.handlers['link'].call(toolbar, !context.format.link);
  //   });
  // }

  extendToolbar() {
  }

  fullscreenMode() {
    var
      container = this.quill.container.parentNode,
      body = this.quill.root.ownerDocument.body
    ;


    if (body.classList.contains('fullscreenEditor')) {
      body.classList.remove('fullscreenEditor');
      container.classList.remove('fullscreen');
      body.scrollTop = body.__scrollTop;
      delete body.__scrollTop;
    } else {
      body.__scrollTop = body.scrollTop;
      body.classList.add('fullscreenEditor');
      container.classList.add('fullscreen');
    }
  }
}
SnowTheme.DEFAULTS = extend(true, {}, BaseTheme.DEFAULTS, {
  modules: {
    toolbar: {
      handlers: { }
    }
  }
});

export default SnowTheme;
