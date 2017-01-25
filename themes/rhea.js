import extend from 'extend';
import BaseTheme from './base';

const TOOLBAR_CONFIG = [
  [ 'bold', 'italic', 'strike' ],
  [ { script: 'sub' }, { script: 'sup' } ],
  [ 'linkstyle' ],
  { "controls": [ { "alias": "baloon", "customHandler": true, "title": "Show original text preview" } ], "class": "rFloat" }
];

class SnowTheme extends BaseTheme {
  constructor(quill, options) {
    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
      options.modules.toolbar.container = TOOLBAR_CONFIG;
    }
    super(quill, options);

    setTimeout(() => {
      this.toggleBaloonState(true);
    }, 1);
  }


  // extendToolbar(toolbar) {
    extendToolbar() {
    // if (toolbar.container.querySelector('.ql-link')) {
    //   this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
    //     toolbar.handlers['link'].call(toolbar, !context.format.link);
    //   });
    // }

  }

  toggleBaloonState(init) {
    var
      button = this.quill.container.parentNode.querySelector('.ql-baloon'),
      baloonState = localStorage.getItem("RHEA.originalTextBaloon"),
      data = {}
    ;

    if (!init || !baloonState) baloonState = (baloonState == "show")? "hide" : "show";

    if (baloonState == "show") data.show = "show";
    if (button) button.classList.toggle('active', baloonState == "show");

    z.dispatch({ e: "baloonState", f: this.quill.container, p: "parent", data: data });

    localStorage.setItem("RHEA.originalTextBaloon", baloonState);
  }
}
SnowTheme.DEFAULTS = extend(true, {}, BaseTheme.DEFAULTS, {
  modules: {
    toolbar: {
      handlers: {
          baloon: function(value, evt) {
            this.quill.theme.toggleBaloonState();
          }
      }
    }
  }
});

export default SnowTheme;
