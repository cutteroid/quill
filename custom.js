import Quill from './core';

import { IndentClass as Indent } from './formats/indent';

import List, { ListItem } from './formats/list';

import Bold from './formats/bold';
import Italic from './formats/italic';
import Script from './formats/script';
import Strike from './formats/strike';
import Underline from './formats/underline';

import Toolbar from './modules/toolbar';

import Entities from './modules/entities';
import ObjectNode from './formats/objectnode';
import ObjectLink from './formats/objectlink';

import Images from './modules/images';
import ObjectImage from './formats/objectimage';

import Filler from './formats/filler';
import DropZone from './formats/dropzone';

import SnowTheme from './themes/snow';

import PasteFromWord from './modules/word';

Quill.register({
  'formats/indent': Indent,

  'formats/list': List,

  'formats/bold': Bold,
  'formats/italic': Italic,
  'formats/script': Script,
  'formats/strike': Strike,
  'formats/underline': Underline,

  'formats/list/item': ListItem,

  'formats/objectimage': ObjectImage,
  'formats/objectlink': ObjectLink,
  'formats/objectnode': ObjectNode,
  'formats/dropzone': DropZone,
  'formats/filler': Filler,

  'modules/word': PasteFromWord,
  'modules/toolbar': Toolbar,
  'modules/images': Images,
  'modules/entities': Entities,

  'themes/snow': SnowTheme

}, true);


module.exports = Quill;
