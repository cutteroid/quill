import Parchment from 'parchment';
import Quill from './core/quill';

import Block, { BlockEmbed } from './blots/block';
import Break from './blots/break';
import Container from './blots/container';
import Cursor from './blots/cursor';
import Embed from './blots/embed';
import Inline from './blots/inline';
import Scroll from './blots/scroll';
import TextBlot from './blots/text';

import Bold from './formats/bold';
import Italic from './formats/italic';
import Script from './formats/script';
import Strike from './formats/strike';
import LinkStyle from './formats/linkstyle';

import Clipboard from './modules/clipboard';
import History from './modules/history';
import Keyboard from './modules/keyboard';

import SnowTheme from './themes/rhea';
import Toolbar from './modules/toolbar';


Quill.register({

  'formats/bold': Bold,
  'formats/italic': Italic,
  'formats/script': Script,
  'formats/strike': Strike,
  'formats/linkstyle': LinkStyle,

  'blots/block'        : Block,
  'blots/block/embed'  : BlockEmbed,
  'blots/break'        : Break,
  'blots/container'    : Container,
  'blots/cursor'       : Cursor,
  'blots/embed'        : Embed,
  'blots/inline'       : Inline,
  'blots/scroll'       : Scroll,
  'blots/text'         : TextBlot,

  'modules/clipboard'  : Clipboard,
  'modules/history'    : History,
  'modules/keyboard'   : Keyboard,

  'themes/snow'        : SnowTheme,

  'modules/toolbar'    : Toolbar
});

Parchment.register(Block, Break, Cursor, Inline, Scroll, TextBlot);

module.exports = Quill;
