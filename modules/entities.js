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

		this.fixCaret = false;

		this.listen();

		this.quill.clipboard.preprocess.push(this.cleanObjectNodes);

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
			blacklist = [16, 17, 18, 48, 91, 224],
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
		zEditor.EntityPopup.hidePopups();
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

	createEntityNode(position, data) {

		var
			text = data.text || "",
			uid = data.uid || md5(Date.now().toString()),
			isNew = (data.uid)? false : true,
			entityData = { object: 'entity', uid: uid, text: text, isNew: isNew }
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
