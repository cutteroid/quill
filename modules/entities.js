import Emitter from '../core/emitter';
import Module from '../core/module';
import Selection, { Range } from '../core/selection';
import Parchment from 'parchment';

class Entities extends Module {

	constructor(quill, options) {

		super(quill, options);

		var _this = this;

		this.selection = this.quill.selection;
		this.document = this.quill.root.ownerDocument;
		this.dzID = "dropZone";
		this.entityPopup = null;
		this.spacer = "\u200B";
		this.filler = null;

		this.fixCaret = true;

		this.listen();

		this.quill.on('CONTENTS-CHANGE', function(node) {
			_this.initRefresh(node);
		});
	}

	getRange() {
		var range = this.selection.getRange();
		return  (range[0])? range[0] : { index: null, length: null };
	}

	listen() {

		var _this = this;

		this.quill.root.addEventListener('keypress', function(evt) {

			var
				key = evt.which || evt.keyCode || 0,
				charCode = evt.charCode || 0,
				hidePopup = true
			;

			if ( ( charCode == 40 || charCode == 41 ) && evt.shiftKey ) {
				_this.handleBrackets(evt, (charCode == 40));
			} else {
				if (_this.entityPopup) _this.processPopupKeys(evt);
			}

			_this.fixCaretPosition(evt);

		});

		this.quill.root.addEventListener('keydown', function(evt) {
			var
				key = evt.which || evt.keyCode || 0
			;

			if (key == 8 || key == 46) {
				_this.handleDelete(evt, key);
			}

			if (_this.entityPopup) _this.processPopupKeys(evt);

			_this.fixCaretPosition(evt);
			_this.removeTooltips();
		});

		this.quill.root.addEventListener('keyup', function(evt) {
			var
				key = evt.which || evt.keyCode || 0
			;

			if (_this.entityPopup) _this.processPopupKeys(evt);
			else _this.cleanUp();

			_this.fixCaretPosition(evt);
		});

		this.quill.root.addEventListener('dragover', function(evt) {
			_this.handleDragOver(evt);
		});

		this.quill.root.addEventListener('dragleave', function(evt) {
			_this.handleDragLeave(evt);
		});

		this.quill.root.addEventListener('mousedown', function(evt) {
			_this.handleMouseDown(evt);
		});

		this.quill.root.addEventListener('click', function(evt) {
			_this.fixCaretPosition(evt);
			_this.handleMouseUp(evt);
		});

		this.quill.root.addEventListener('drop', function(evt) {
			_this.handleDrop(evt);
		});
	}

	fixCaretPosition(evt) { // FIX caret positioning in various cases

		if (!this.fixCaret)
			return;

		var
			downArr = [37, 39],
			blacklist = [16, 17, 18, 91, 224],
			key = evt.which || evt.keyCode || 0,
			type = evt.type,
			range = this.getRange(),
			needFix = false,
			setRange = null,
			fixTarget = null,
			anchor, tIndex
		;

		var index = (range.index !== null)? range.index : this.quill.getLength() - 1;

		if (type == 'click' || type == 'keyup') {

			if (type == 'keyup' && ( downArr.indexOf(key) != -1 || blacklist.indexOf(key) != -1 ) )
				return;

			if (this.filler) {
				this.filler.remove();
				this.filler = null;
			}

			var blots = this.getIndexBlots(index);

			if (blots.a.NotEditable) {
				fixTarget = blots.a;
				tIndex = blots.ai;
			}
			else if (blots.b && blots.b.NotEditable) {
				if (blots.b.prev == blots.a) {
					fixTarget = blots.b;
					tIndex = blots.bi;
				}
			}

			if (blots.a.NotEditable && blots.b && blots.b.NotEditable && blots.a.next) {
				fixTarget = blots.b;
				tIndex = blots.bi;
			}

			if (blots.a.NotEditable && !blots.b) {
				fixTarget = blots.a;
				tIndex = null;
			}

			if (blots.a.NotEditable && !blots.a.next) {
				fixTarget = blots.a;
				tIndex = null;
			}

			if (blots.a.NotEditable && !blots.a.next && blots.a == blots.b) {
				fixTarget = blots.a;
				tIndex = 0;
			}

			if (fixTarget) {

				if (tIndex == 0 || tIndex == 1) {
					needFix = true;
					anchor = fixTarget;
				}
				else {
					if (fixTarget.next) {
						needFix = true;
						anchor = fixTarget.next;

					} else {
						needFix = 'append';
						anchor = fixTarget;
					}
				}
				setRange = 0;
			}
		}

		if (type == 'keydown') {

			if (this.filler) {
				this.filler.remove();
				this.filler = null;
			}

			if (downArr.indexOf(key) == -1)
				return;

			index = (key == 39)? index + 1 : index - 1;

			var blots = this.getIndexBlots(index);

			if (!blots.a && !blots.b) {
				if (key == 39) {
					index = range.index;
					var blots = this.getIndexBlots(index);
				}

				if (!blots.a && !blots.b) {
					return;
				}
			}

			if (key == 39) { //ARR RIGHT

				if (blots.a && blots.a.NotEditable && !blots.a.next) {
					needFix = 'append';
					anchor = blots.a;
				}

				if (blots.a == blots.b && blots.b.NotEditable) {
					needFix = true;
					anchor = blots.b;
					setRange = 0;
				}

				if (blots.a && blots.b && blots.a != blots.b && blots.b.NotEditable && blots.a.next == blots.b) {
					needFix = true;
					anchor = blots.b;
					setRange = 0;
				}
			}

			if (key == 37) { //ARR LEFT

				if (blots.a && blots.a.NotEditable && !blots.a.prev && (blots.a == blots.b || !blots.b)) {
					needFix = true;
					anchor = blots.a;
				}

				if (blots.a && blots.a.NotEditable && !blots.a.next && blots.b && blots.b != blots.a) {
					needFix = 'append';
					anchor = blots.a;
				}

				if (blots.a && blots.b && blots.a.NotEditable && blots.b.NotEditable && blots.a.next == blots.b) {
					needFix = true;
					anchor = blots.b;
				}
			}
		}

		if (needFix) {

			var fillerBlot = Parchment.create('filler');

			fillerBlot.filler = true;
			this.filler = fillerBlot;

			if (needFix === 'append')
				anchor.parent.appendChild(fillerBlot);
			else
				anchor.parent.insertBefore(fillerBlot, anchor);

			var _this = this;
			if (setRange !== null) {
				setTimeout(function(){ _this.selection.setNativeRange(fillerBlot.domNode, setRange); }, 1);
			}
		}
	}

	getIndexBlots(index) {
		var leaf1 = this.quill.scroll.leaf(index);
		var leaf2 = this.quill.scroll.leaf(index+1);

		return { a: leaf1[0], b: leaf2[0], ai: leaf1[1], bi: leaf2[1] };
	}

	getEventCaretRange(evt) {

		var caretRange = {};

		if (this.document.caretPositionFromPoint) {

			var pos = this.document.caretPositionFromPoint(evt.clientX, evt.clientY);
			if (pos.offsetNode) {
				caretRange = this.document.createRange();
				caretRange.setStart(pos.offsetNode, pos.offset);
				caretRange.collapse();
			}

		} else if (this.document.caretRangeFromPoint) {
			caretRange = this.document.caretRangeFromPoint(evt.clientX, evt.clientY);
		}

		return caretRange;
	}

	handleMouseDown(evt) {
		this.hidePopups();
	}

	cleanUp() {
		var brs = this.quill.root.querySelectorAll('[type="_moz"]');
		for (var i = 0; i < brs.length; i++) {
			var br = brs[i];
			br.parentNode.removeChild(br);
		}
	}

	handleMouseUp(evt) {
		var target = evt.target;
		if (target.__blot && target.classList.contains('objectLink')) {
			this.openLinkDialog(evt, target.__blot.blot);
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	handleDragOver(evt) {
		var
			evtData = window.__dragData || null,
			savedRange = this.savedRange || null,
			savedCursor = this.savedCursor || null,
			caretRange = this.getEventCaretRange(evt);
		;

		if (!evtData)
			return;

		if (savedCursor) {
			if ( savedCursor.x == evt.clientX && savedCursor.y == evt.clientY ) {
				evt.preventDefault();
				return false;
			}
		} else {
			this.quill.blur();
		}

		try {
			if ( !savedRange || savedRange.startOffset != caretRange.startOffset || savedRange.endOffset != caretRange.endOffset ) {
				this.savedRange = caretRange;
				this.savedCursor = { x: evt.clientX, y: evt.clientY };

				var
					dz = this.quill.root.querySelector('#' + this.dzID)
				;

				if ( evtData && !dz ) {
					var dz = this.document.createElement('div');
					dz.setAttribute( 'id', this.dzID );
					dz.classList.add('dropZone');
				}

				var canDrop = this.canDrop(caretRange);

				if (canDrop) {
					caretRange.insertNode(dz);
				}

			}
		} catch (e) { }

		evt.preventDefault();
	}

	handleDragLeave(evt) {

		var
			dz = this.quill.root.querySelector('#' + this.dzID),
			inEditor = false,
			parentNode = evt.target.parentNode
		;

		while ( parentNode && parentNode != this.quill.root ) parentNode = parentNode.parentNode;

		if ( parentNode )
			inEditor = true;

		if ( dz && !inEditor ) {
			this.savedCursor = null;
			dz.parentNode.removeChild(dz);
		}
	}

	handleDrop(evt) {
		var
			dz = this.quill.root.querySelector('#' + this.dzID),
			dragData = window.__dragData,
			eData = (dragData)? zEditor.Utils.getEntityData(dragData.uid) : null
		;

		evt.preventDefault();

		if (dz && eData) {

			var index = dz.__blot.blot.offset(this.quill.root);

			try {

				// this.quill.blur();
				this.savedCursor = null;

				dz.parentNode.removeChild(dz);
				eData.blotType = 'objectnode';
				this.createDomNode(index, eData, true);
				dz = null;

			} catch (e) { console.debug(e) }
		}

		window.__dragData = null;

		if (dz) dz.parentNode.removeChild(dz);
	}

	canDrop(range) {
		var
			cont = (range && range.commonAncestorContainer)? range.commonAncestorContainer : null
		;

		if (!cont || !cont.__blot) {
			return false;
		}

		var blot = cont.__blot.blot;
		if (blot && blot.NotEditable === true) {
			return false;
		}

		var parentBlot = cont.parentNode.__blot.blot;
		if (parentBlot && parentBlot.NotEditable === true) {
			return false;
		}

		return true;
	}

	handleDelete(evt, key) {

		var range = this.getRange();

		if (range.index === null)
			return;

		if (key == 8) { // BACKSPACE handling
			var format = this.quill.getFormat(range.index-1, 1);

			if (format.objectnode || format.objectlink) {

				var len = (format.objectnode)? format.objectnode.length : format.objectlink.length;

				this.quill.deleteText(range.index-1, 1, Emitter.sources.USER);
				this.quill.selection.setRange(new Range(range.index - len, 0));

				evt.preventDefault();
				evt.stopPropagation();
			}
		}

		if (key == 46) { // DEL handling
			// working as intended???
		}
	}

	createEntityNode(evt, data) {

		if (this.__startIndex === null) return;

		var
			sIndex = this.__startIndex,
			eIndex = this.__endIndex,
			length = eIndex - sIndex,
			entityText = this.quill.getText(sIndex, length),
			text = (data)? data.text : entityText.slice(2,-1).trim()
		;

		this.__startIndex = null;
		this.__endIndex = null;

		if (text.length == 0)
			return;

		var
			uid = (data)? null : md5(Date.now().toString()),
			obj = (data)? data : { object: 'entity', uid: uid, text: text, isNew: true }
		;

		this.quill.deleteText(sIndex, length, Emitter.sources.USER);

		obj.blotType = 'objectnode';
		this.createDomNode(sIndex, obj);

		if (data)
			this.hidePopups();
		else
			zEditor.Utils.listAddItem(obj);

		if (evt) evt.preventDefault();
	}

	createDomNode(index, data, noRange) {
		this.quill.insertEmbed(index, data.blotType, data, Emitter.sources.USER);
		if (!noRange) this.quill.selection.setRange(new Range(index+1, 0));
	}

	createEntityFromPopup(evt, node) {

		var
			uid = node.getAttribute('uid'),
			data = zEditor.Utils.getEntityData(uid),
			range = this.quill.selection.getRange()[0];
		;

		if (!data)
			return;

		this.__endIndex = range.index;
		this.createEntityNode(evt, data);
	}

	entityListPopup(isSub) {

		var
			popup,
			cont = this.createEntityPopup(isSub)
		;

		popup = cont.querySelector('.editorSuggest');

		if (!popup)
			return false;

		popup.classList.add('open');
		this.quill.root.classList.add('popupOpen');

		this.entityPopup = popup;

		popup.editor = this;

		this.fixPopupPosition(popup);
		if (isSub) this.filterPopupItems();
	}

	createEntityPopup(isSub) {

		var
			res,
			tmpE = {},
			popupData = { "isSub": (isSub), "entities": [] },
			list = document.querySelector('.editorEntityList'),
			event = "collectEntityData",
			propagation = ".entityBox>.spItem"
		;

		if (this.subPopupData) {
			var
				parentData = {},
				parentUID = this.subPopupData.node.getAttribute('uid')
			;

			propagation = ".linkedEntities>.spItem[parentuid='"+parentUID+"']";
			z.dispatch( { e: event, f: list, p: ".entityBox>.spItem[uid='"+parentUID+"']", data: parentData } );

			popupData['itemUID'] = parentUID;
			popupData['parentInfo'] = parentData.entities[0];
		}

		z.dispatch( { e: event, f: list, p: propagation, data: popupData } );

		if (this.entityPopup)
			this.entityPopup.parentNode.removeChild(this.entityPopup);

		tmpE.c = this.quill.root.parentNode;
		tmpE.data = popupData;

		res = z.template( tmpE, ["reportForm_entitySuggestPopup", "add"] );

		if (res) {
			var popup = res.querySelector('.editorSuggest');
			popup._data_ = popupData;
		}

		return res;
	}

	processPopupKeys(e) {

		var
			direction,
			entityName = '',
			eType = e.type,
			key = e.which || e.keyCode || 0,
			charCode = e.charCode || 0
		;

		switch (key) {
			case 90:
				// ctrl/cmd + Z
				if (e.metaKey || e.ctrlKey) {
					this.hidePopups()
					return;
				}
			case 27:
				// ESC
				//e.preventDefault();
				this.hidePopups()
				break;

			case 13:
				// ENTER
				if ( this.entityPopup.classList.contains('hiddenBlock') ) {
					this.hidePopups()
					return;
				}

				var selected = this.getSelectedSuggest();

				if (selected) {
					this.createEntityFromPopup(e, selected);
				} else {
					e.preventDefault();
				}

				break;

			case 38:
			case 40:
				// up/down logic
				if ( eType == 'keydown' && !this.entityPopup.classList.contains('hiddenBlock') ) {
					e.preventDefault();
					direction = (key == 38)? 'up' : 'down';

					z.dispatch(	{ e: "processArrowKeys", f: this.entityPopup, p: "parent", data: { direction: direction } } );
				}
				break;

			case 37:
			case 39:
				// left/right logic
				if ( !this.entityPopup.classList.contains('hiddenBlock') ) {

					if ( eType == 'keyup' ) {
						if ( key == 37 ) this.handleSuggestBack();
						if ( key == 39 ) this.handleSuggestForward();
						this.fixPopupPosition(this.entityPopup);
					}

					e.preventDefault();
				}
				break;

			default:
				if ( eType == 'keyup' ) {
					this.filterPopupItems(charCode);
				}
		}
	}

	fixPopupPosition(popup) {

		var
			coords = {},
			range = this.getRange(),
			container = this.quill.root
		;

		if (!popup || range.index == null)
			return;

		var bounds = this.quill.getBounds(range.index);

		coords.x = container.offsetLeft + bounds.left;
		coords.y = container.offsetTop + bounds.top + bounds.height + 2;

		popup.style.left = coords.x + 'px';
		popup.style.top = coords.y + 'px';
	}

	getSelectedSuggest(node) {
		var selected = (node)? node : this.quill.root.parentNode.querySelector('.editorSuggest.open .active');
		return selected;
	}

	filterPopupItems(charCode) {

		var
			range = this.quill.selection.getRange()[0],
			data = { matches: [] },
			subText = null,
			charCode = charCode || 0,
			textStart = 0,
			start = this.__startIndex,
			text
		;

		if (range.length == 0) {
			var textLength = range.index - start;
			text = this.quill.getText(start, textLength);

			data.text = text.split('((').pop();
		}

		z.dispatch( { e: "filterEditorSuggest", f: this.visiblePopup, p: ".suggestItem", data: data } );

		if ( data.matches[0] ) {

			if ( this.entityPopup.classList.contains('hiddenBlock') ) {
				this.entityPopup.classList.remove('hiddenBlock');
			}

			this.fixPopupPosition(this.visiblePopup);
			data.matches[0].classList.add('active');

		} else {
			if ( text.indexOf('((') != -1 || textStart > 0 )
				this.entityPopup.classList.add('hiddenBlock');
			else
				this.hidePopups();
		}
	}

	hidePopups() {

		var openPopups = document.querySelectorAll('.editorSuggest.open');

		for (var i = 0; i < openPopups.length; ++i) {
			var popup = openPopups[i];
			popup.parentNode.removeChild(popup);
		}

		this.subPopupData = null;
		this.entityPopup = null;

		this.quill.root.classList.remove('popupOpen');
	}

	handleBrackets(evt, isOpening) {

		var
			range = this.quill.selection.getRange(),
			index = (range[0])? range[0].index : null,
			prevSymbol = null
		;

		if (index) {
			prevSymbol = this.quill.getText(index-1, 1);
		}

		if (!prevSymbol) {
			this.hidePopups();
			return;
		}

		if ( isOpening && prevSymbol == '(' ) {
			this.__startIndex = index - 1;
			if (!this.entityPopup) this.entityListPopup();
		}

		if ( !isOpening && prevSymbol == ')' ) {
			this.hidePopups();
			this.__endIndex = index;
			var obj = this;
			this.createEntityNode(evt);
		}
	}

	handleSuggestForward(force) {

		var
			selected = this.getSelectedSuggest(force),
			range = this.getRange(),
			textStart = this.__startIndex + 2
		;

		if (range.index === null)
			return;

		if ( this.entityPopup.classList.contains('isSub') ) {
			return;
		}

		if ( selected && selected.hasAttribute('hasSubs')) {

			this.hidePopups();

			this.subPopupData = {
				'node': selected,
				'start': textStart,
				'index': range.index,
				'text' : this.quill.getText(textStart, range.index - textStart)
			};

			this.quill.deleteText(textStart, range.index - textStart, Emitter.sources.USER);
			this.selection.setRange(new Range(textStart, 0));

			this.entityListPopup(true);
		} else {
			this.subPopupData = null;
		}
	}

	handleSuggestBack() {

		var
			data = this.subPopupData,
			text = (data)? data.text.trim() : null,
			range = this.getRange()
		;

		if (!data || range.index === null)
			return;

		if ( !this.entityPopup.classList.contains('isSub') ) {
			return;
		}

		this.quill.deleteText(data.start, range.index - data.start, Emitter.sources.USER);

		if ( text != '' ) {
			this.quill.insertText(data.start, text, Emitter.sources.USER);
		}

		this.selection.setRange(new Range(data.index, 0));

		this.subPopupData = null;
		this.entityListPopup();
		this.filterPopupItems()
	}

	openLinkDialog(evt, blot) {

		var
			_this = this,
			range = this.getRange(),
			id = 'createLinkPopup',
			data = { type: "link" },
			tmpE = { c: this.quill.root.parentNode, data: data },

			popup, x, y, target, xOffset,
			selectedText = ''
		;

		if (blot) {
			target = blot.domNode;
			xOffset = 0;
			yOffset = this.quill.root.scrollTop;
		} else {
			target = (evt.target.classList.contains('button'))? evt.target : z.getParentNode(evt.target, '.button');
			isButton = true;
			xOffset = target.offsetWidth/2;
			yOffset = 0;
		}

		if (!target) return;

		if (range.index !== null && range.length > 0) {
			var selectedText = this.quill.getText(range.index, range.length);
		}

		if (selectedText != '') {
			range.preselected = true;
			data.text = selectedText;
		}

		if (blot) {
			var format = blot.formats().objectlink;
			data.text = format.text;
			data.url = format.original;
			data.edit = true;
		}

		data.id = id;
		data.alias = this.quill.alias + '_editor';
		if (data.text)
			data.text = data.text.split(this.spacer).join('');

		z.template( tmpE, ["reportForm_editorDialogPopup", "add"] );

		popup = this.quill.root.parentNode.querySelector('#' + id);

		if (!popup)
			return;

		x = target.offsetLeft + xOffset;
		y = target.offsetTop + target.offsetHeight - yOffset;

		popup.style.left = x + 'px';
		popup.style.top = y + 'px';

		var saveButton = popup.querySelector('[action="save"]');
		var removeButton = popup.querySelector('[action="remove"]');

		if (saveButton) {
			saveButton.addEventListener('mouseup', function(evt) {
				_this.handleLinkSave(popup, range, blot);
			});
		}

		if (removeButton) {
			removeButton.addEventListener('mouseup', function(evt) {
				_this.handleLinkRemove(popup, blot);
			});
		}
	}

	handleLinkSave(popup, range, blot) {
		var data = {};
		z.dispatch(	{ e: "collectData", f: popup, p: "INPUT,HIDDEN,.requestBox,.formAction", data: data } );
		if (blot) {
			var offset = blot.offset(this.quill.root);
			var length = blot.length();

			range = { index: offset, length: length};
		}

		if (range.length > 0)
			this.quill.deleteText(range.index, range.length, Emitter.sources.USER);

		data.original = data.url;

		var linkLength = data.text.length;
		if (linkLength > 0) {
			this.quill.insertText(range.index, data.text, 'objectlink', data, Emitter.sources.USER);
			this.quill.selection.setRange(new Range(range.index + linkLength, 0));
		}

		popup.parentNode.removeChild(popup);
	}

	handleLinkRemove(popup, blot) {
		var offset = blot.offset(this.quill.root);
		var format = blot.formats().objectlink;
		var text = format.text;

		text = text.split(this.spacer).join('');

		this.quill.deleteText(offset, format.length, Emitter.sources.USER);
		this.quill.insertText(offset, text, Emitter.sources.USER);

		this.quill.selection.setRange(new Range(offset + text.length, 0));

		popup.parentNode.removeChild(popup);
	}

	removeTooltips() {
		var tooltips = document.querySelectorAll('.entityTooltip');
		var editors = document.querySelectorAll('.editorTooltipActivator');

		for (var i = 0; i < tooltips.length; i++) {
			tooltips[i].parentNode.removeChild(tooltips[i]);
		}
		for (var j = 0; j < editors.length; j++) {
			editors[j].classList.remove('editorTooltipActivator');
		}
	}

	initRefresh() {
		var editorNode = this.quill.root;
		var container = z.getParentNode(editorNode, '.editorsContainer');
		z.dispatch( { e: "refreshEntityData", f: container, p: "parent", data: { editor: true } } );
	}
}

export default Entities;
