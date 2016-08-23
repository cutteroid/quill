import Quill from './core';

import { IndentClass as Indent } from './formats/indent';

import List, { ListItem } from './formats/list';

import Bold from './formats/bold';
import Italic from './formats/italic';
import Script from './formats/script';
import Strike from './formats/strike';
import Underline from './formats/underline';

import Toolbar from './modules/toolbar';

import SnowTheme from './themes/snow';

Quill.register({
  'formats/indent': Indent,

  'formats/list': List,

  'formats/bold': Bold,
  'formats/italic': Italic,
  'formats/script': Script,
  'formats/strike': Strike,
  'formats/underline': Underline,

  'formats/list/item': ListItem,

  'modules/toolbar': Toolbar,

  'themes/snow': SnowTheme

}, true);


module.exports = Quill;
