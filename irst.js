import Quill from './core';

import Immutable from './blots/immutable';

import Indent from './formats/indent';
import List from './formats/list';

import Bold from './formats/bold';
import Italic from './formats/italic';
import Link from './formats/link';
import Script from './formats/script';
import Strike from './formats/strike';
import Underline from './formats/underline';

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

  'blots/immutable'    : Immutable,

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

export default Quill;
