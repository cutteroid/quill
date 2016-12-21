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

import { IndentClass as Indent } from './formats/indent';
import List, { ListItem } from './formats/list';

import Bold from './formats/bold';
import Italic from './formats/italic';
import Link from './formats/link';
import Script from './formats/script';
import Strike from './formats/strike';
import Underline from './formats/underline';

import Clipboard from './modules/clipboard';
import History from './modules/history';
import Keyboard from './modules/keyboard';

import SnowTheme from './themes/snow';
import Toolbar from './modules/toolbar';
import Entities from './modules/entities';
import ObjectNode from './formats/objectnode';
import ObjectLink from './formats/objectlink';

import Images from './modules/images';
import ObjectImage from './formats/objectimage';

import Filler from './formats/filler';
import DropZone from './formats/dropzone';

import CleanPaste from './modules/cleanpaste';

Quill.register({

  'formats/indent': Indent,
  'formats/list': List,
  'formats/bold': Bold,
  'formats/italic': Italic,
  'formats/script': Script,
  'formats/strike': Strike,
  'formats/underline': Underline,

  'formats/list/item': ListItem,

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
  'formats/objectimage': ObjectImage,
  'formats/objectlink' : ObjectLink,
  'formats/objectnode' : ObjectNode,
  'formats/dropzone'   : DropZone,
  'formats/filler'     : Filler,

  'modules/cleanpaste' : CleanPaste,
  'modules/toolbar'    : Toolbar,
  'modules/images'     : Images,
  'modules/entities'   : Entities
});

Parchment.register(Block, Break, Cursor, Inline, Scroll, TextBlot);

module.exports = Quill;
