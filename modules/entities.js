import Emitter from '../core/emitter';
import Module from '../core/module';
import Selection, { Range } from '../core/selection';

class Entities extends Module {

	constructor(quill, options) {

		super(quill, options);

		var _this = this;

		this.selection = this.quill.selection;
		this.document = this.quill.root.ownerDocument;
		this.dzID = "dropZone";
		this.entityPopup = null;
		this.spacer = "";
		this.filler = null;

		this.fixCaret = false;

		this.listen();

		this.quill.clipboard.preprocess.push(this.cleanObjectNodes);

		this.quill.root.addEventListener('scroll', function() {
			if (_this.entityPopup) zEditor.EntityPopup.fixPopupPosition(_this.entityPopup);
		});

		this.quill.on('CONTENTS-CHANGE', function(node) {
			_this.initRefresh(node);
		});
	}

	cleanObjectNodes(container) {
		try { // object nodes cleanup
			var nodeList = container.querySelectorAll('.objectImage,.objectNode');

			for (var i = 0; i < nodeList.length; i++) {
				var iNode = nodeList[i];
				iNode.innerHTML = '';
			}
		} catch (e) { }
	}

	getRange() {
		var range = this.selection.getRange();
		return  (range[0])? range[0] : { index: null, length: null };
	}

	setRange(index, length) {
		this.selection.setRange(new Range(index, length));
	}

	listen() {

		var _this = this;

		if (this.quill.theme.options.formats.indexOf('objectnode') !== -1 ) {
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
		}

		this.quill.root.addEventListener('keydown', function(evt) {
			var
				key = evt.which || evt.keyCode || 0
			;

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

		this.quill.theme.modules.toolbar.container.addEventListener('mouseup', function (evt) {
			_this.handleMouseUp(evt, 'ql-link');
		});

	}

	fixCaretPosition(evt) { // FIX caret positioning in various cases

		if (!this.fixCaret)
			return;

		var _this = this;

		// zEditor.fixCaret(evt, _this, Parchment);
	}

	getIndexBlots(index) {
		var
			leaf1 = this.quill.scroll.leaf(index),
			leaf2 = this.quill.scroll.leaf(index+1),
			identical = (leaf1[0] === leaf2[0])? true : false
		;

		return { a: leaf1[0], b: leaf2[0], ai: leaf1[1], bi: leaf2[1], identical: identical };
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
		zEditor.EntityPopup.hidePopups();
	}

	cleanUp() {
		var brs = this.quill.root.querySelectorAll('[type="_moz"]');
		for (var i = 0; i < brs.length; i++) {
			var br = brs[i];
			br.parentNode.removeChild(br);
		}
	}

	handleMouseUp(evt, exclude) {
		if (exclude) {
			if ( evt.target.classList.contains(exclude) || evt.target.parentNode.classList.contains(exclude) ) {
				evt.stopPropagation();
				evt.preventDefault();
				return;
			}
		}

		var target = evt.target.parentNode;
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

			} catch (e) { }
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
		if (blot && blot.immutable === true) {
			return false;
		}

		var parentBlot = cont.parentNode.__blot.blot;
		if (parentBlot && parentBlot.immutable === true) {
			return false;
		}

		return true;
	}

	createEntityNode(position, data) {

		var
			text = data.text || "",
			uid = data.uid || md5(Date.now().toString()),
			is_new = (!data.is_new && data.uid)? false : true,
			entityData = { object: 'entity', uid: uid, text: text, is_new: is_new }
		;

		if (position === undefined || text.length == 0)
			return;

		if (data.type) entityData.type = data.type;
		if (data.index) entityData.index = data.index;

		entityData.blotType = 'objectnode';
		this.createDomNode(position, entityData);
	}

	createDomNode(index, data, noRange) {
		this.quill.insertEmbed(index, data.blotType, data, Emitter.sources.USER);
		if (!noRange) {
			this.quill.selection.setRange(new Range(index+1, 0));
			this.fixCaretPosition({ type: "click" });
		}
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
			zEditor.EntityPopup.hidePopups();
			return;
		}

		if ( isOpening && prevSymbol == '(' ) {
			this.__startIndex = index - 1;
			if (!this.entityPopup) {
				this.quill.deleteText(this.__startIndex, 1, Emitter.sources.USER);
				zEditor.EntityPopup.entityListPopup(false, this.quill, this.__startIndex);
				evt.preventDefault();
			}
		}
	}

	openLinkDialog(evt, blot) {

		var
			_this = this,
			range = this.getRange(),
			id = 'createLinkPopup',
			data = { type: "link" },
			tmpE = { c: this.quill.root.parentNode, data: data },

			popup, x, y, target, xOffset, yOffset, isButton,
			selectedText = ''
		;

		// this.quill.entities.hidePopups();
		zEditor.EntityPopup.hidePopups();
		this.hideEditorPopup();

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
			var format = blot.value().objectlink;
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

		this.openedPopup = popup;

		var nodeRect = target.getBoundingClientRect();
		var contRect = this.quill.root.getBoundingClientRect();

		popup.style.left = (nodeRect.left - contRect.left + 35) + 'px';
		popup.style.top = (nodeRect.bottom - contRect.top + 40) + 'px';

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

	hideEditorPopup() {
		var res = false;
		if (this.openedPopup) {
			if (this.openedPopup.parentNode) this.openedPopup.parentNode.removeChild(this.openedPopup);
			this.openedPopup = null;
			res = true;
		}
		return res;
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
			// this.quill.focus();
			if (blot) blot.remove();
			this.quill.insertEmbed(range.index, 'objectlink', data, Emitter.sources.USER);
			// this.quill.insertText(range.index, data.text, 'objectlink', data, Emitter.sources.USER);
			this.quill.selection.setRange(new Range(range.index + 1, 0));
		}

		popup.parentNode.removeChild(popup);
	}

	handleLinkRemove(popup, blot) {
		var offset = blot.offset(this.quill.root);
		var format = blot.value().objectlink;
		var text = format.text;

		text = text.split(this.spacer).join('');

		blot.remove();
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
