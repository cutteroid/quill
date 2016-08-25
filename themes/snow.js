import extend from 'extend';
import Emitter from '../core/emitter';
import BaseTheme from './base';
import LinkBlot from '../formats/link';

import { Range } from '../core/selection';

const TOOLBAR_CONFIG = [
  [ 'bold', 'italic', 'underline' ],
  [ { list: 'ordered' }, { list: 'unordered' } ],
  [ { script: 'sub' }, { script: 'sup' } ],
  [ 'link' ], [ 'image' ], [ 'fullscreen' ]
];

class SnowTheme extends BaseTheme {
  constructor(quill, options) {
    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
      options.modules.toolbar.container = TOOLBAR_CONFIG;
    }
    super(quill, options);
  }

  extendToolbar(toolbar) {
    // if (toolbar.container.querySelector('.ql-link')) {
    //   this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
    //     toolbar.handlers['link'].call(toolbar, !context.format.link);
    //   });
    // }
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
