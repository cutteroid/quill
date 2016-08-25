import Emitter from '../core/emitter';
import Module from '../core/module';

class Images extends Module {

	constructor(quill, options) {
		super(quill, options);

		this.selection = this.quill.selection;
		this.document = this.quill.root.ownerDocument;
		this.openedPanel = null;
		this.openedTools = null;

		this.listen();
	}

	listen() {

		var _this = this;

		this.quill.root.addEventListener('scroll', function() {
			// _this.fixImgToolsPosition();
		});

		this.quill.root.addEventListener('mousedown', function() {
			_this.hideImgTools();
		});

		this.quill.root.addEventListener('mousemove', function(evt) {
			_this.doImgResize(evt);
		});

		this.quill.root.addEventListener('mouseup', function(evt) {
			_this.stopImgResize(evt);
		});

		this.quill.root.addEventListener('mouseleave', function(evt) {
			_this.stopImgResize(evt);
		});
	}

	getRange() {
		var range = this.selection.getRange();
		return  (range[0])? range[0] : { index: null, length: null };
	}

	openImagePanel(evt) {

		var
			data = {},
			target = z.getParentNode(this.quill.root, '.handleTarget'),
			tmpFragment = this.document.createDocumentFragment(),
			tmpNode = this.document.createElement('div'),
			tmpE = { c: tmpNode, data: data },
			container = this.quill.root.parentNode,
			eTarget = evt.target
		;
		if (this.openedPanel) {
			this.openedPanel.parentNode.removeChild(this.openedPanel);
			this.openedPanel.button.classList.remove('active');
			this.openedPanel = null;
			return;
		}

		this.quill.entities.hidePopups();
		z.dispatch(	{ e: "collectImagesData", f: target, p: ".attachmentRow", data: data } );

		tmpFragment.appendChild(tmpNode);
		z.template( tmpE, ["reportForm_editorImageList", "add"] );

		var list = tmpNode.querySelector('.editorImagesPanel');
		container.parentNode.insertBefore(list, container);

		this.openedPanel = list;

		if (!eTarget.classList.contains('button'))
			eTarget = z.getParentNode(eTarget, '.button');

		this.openedPanel.button = eTarget;
		eTarget.classList.add('active');

		var images = list.querySelectorAll('.imageBox');

		var _this = this;
		for (var i = 0; i < images.length; i++) {
			(function(img){
				img.addEventListener('click', function(evt) {
					_this.handleImageAdd(img);
				});
			})(images[i]);
		}
	}

	handleImageAdd(image) {

		var
			data = {},
			range
		;

		z.dispatch(	{ e: "collectAsObj", f: image, p: "HIDDEN", data: data } );

		try {
			this.quill.focus();
			range = this.getRange();
			this.quill.insertEmbed(range.index, 'objectimage', data, Emitter.sources.USER);
			if (this.openedPanel) {
				this.openedPanel.parentNode.removeChild(this.openedPanel);
				this.openedPanel.button.classList.remove('active');
				this.openedPanel = null;
				return;
			}
		} catch (e) { }
	}

	openImageTools(evt, imgNode) {

		var
			popupID = 'editorDialogPopup',
			cont = this.quill.root.parentNode,
			data = { id: popupID, type: "img" },
			tmpE = { c: cont, data: data }
		;

		if (this.openedTools && this.openedTools.parentNode && imgNode == this.openedTools.imageNode)
			return;

		if (this.hideImgTools())
			return;

		if(this.resizingData)
			return;

		if (evt.target.classList.contains('close'))
			return;

		if (imgNode.hasAttribute('description')) {
			data.text = imgNode.getAttribute('description');
			data.edit = true;
		}

		z.template( tmpE, ["reportForm_editorDialogPopup", "add"] );

		this.openedTools = cont.querySelector('#' + popupID);
		this.openedTools.imageNode = imgNode;

		var buttons = this.openedTools.querySelectorAll('button[action]');
		var _this = this;

		for (var i = 0; i < buttons.length; i++) {
			(function(button){
				var action = button.getAttribute('action');

				if (action == "save") {
					button.addEventListener('click', function(evt) {
						_this.updateImgDescription();
					});
				}
				if (action == "remove") {
					button.addEventListener('click', function(evt) {
						_this.updateImgDescription(true);
					});
				}
			})(buttons[i]);
		}

		evt.stopPropagation();
		evt.preventDefault();

		this.fixImgToolsPosition();
	}

	updateImgDescription(remove) {

		var
			data = {},
			popup = this.openedTools,
			imgNode = this.openedTools.imageNode,
			uid = imgNode.getAttribute('uid'),
			descr = ""
		;

		this.hideImgTools();

		if (!remove) {
			z.dispatch(	{ e: "collectData", f: popup, p: "INPUT,HIDDEN,.requestBox,.formAction", data: data } );
			if (data.text) descr = data.text;
		}

		var from = z.getParentNode(imgNode, '.handleTarget');
		z.dispatch(	{ e: "updateDescription", f: from, p: ".attachmentRow[uid='" + uid + "'] .descriptionField", data: { description: descr } } );
	}

	fixImgToolsPosition() {
		var
			rootNode = this.quill.root,
			popup = this.openedTools,
			target = (popup)? this.openedTools.imageNode : null,
			xOffset = 30,
			yOffset = 15,
			delta = 40
		;

		if (!popup)
			return;

		var bounds = target.getBoundingClientRect();
		var rootBounds = rootNode.getBoundingClientRect();

		var x = target.offsetLeft + xOffset;
		var y = target.offsetTop + yOffset - rootNode.scrollTop;

		// if(rootNode.scrollTop - target.offsetHeight - target.offsetTop + delta > 0 || y > rootNode.offsetHeight + delta ) {
		// 	popup.classList.add('hiddenBlock');
		// } else {
		// 	popup.classList.remove('hiddenBlock');
		// }

		// if (y < delta) y = delta;
		// if (y > rootNode.offsetHeight + 30) y = rootNode.offsetHeight + 30;

		popup.style.left = x + 'px';
		popup.style.top = y + 'px';
	}

	hideImgTools() {
		var res = false;
		if (this.openedTools) {
			if (this.openedTools.parentNode) this.openedTools.parentNode.removeChild(this.openedTools);
			this.openedTools = null;
			res = true;
		}
		return res;
	}

	handleImageResize(evt, node) {
		var
			imgNode = z.getParentNode(node, '.objectImage')
		;

		this.hideImgTools();

		if (!imgNode)
			return;

		var h = parseInt(imgNode.getAttribute('height'), 10);

		this.resizingData = {
			"startHeight": h,
			"newHeight": h,
			"startY": evt.clientY,
			"resizer": node,
			"imgNode": imgNode
		};

		evt.stopPropagation();
		evt.preventDefault();
	}

	stopImgResize(evt) {

		if (!this.resizingData)
			return;

		this.resizingData.imgNode.setAttribute('height', this.resizingData.newHeight);
		this.resizingData = null;
	}

	doImgResize(evt) {
		if (!this.resizingData)
			return;

		var
			y = evt.clientY - this.resizingData.startY,
			newHeight = this.resizingData.startHeight + y
		;

		if (newHeight <  Images.minImageHeight) newHeight =  Images.minImageHeight;
		if (newHeight > this.resizingData.imgNode.offsetWidth) newHeight = this.resizingData.imgNode.offsetWidth; // is this check needed?

		this.resizingData.newHeight = newHeight;
		this.resizingData.imgNode.style.height = newHeight + 'px';
	}
}

Images.minImageHeight = 100;

export default Images;
