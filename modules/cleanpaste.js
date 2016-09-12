import Module from '../core/module';

class CleanPaste extends Module {

	constructor(quill, options) {

		super(quill, options);

		this.TXT_NODE = 3;

		var _this = this;

		this.quill.clipboard.preprocess.push(_this.cleanPasteData);
	}

	cleanPasteData(container, quill) {
		var
			_this = quill.cleanpaste,
			data = container.innerHTML
		;

		if (!data || data == '')
			return;

		if (_this.isWordCleanNeeded(data)) {
			quill.cleanpaste.cleanUpWordStuff(container);
		}

		var nodes = container.querySelectorAll('*');
		if ( nodes.length ) {
			for( var i = 0; i < nodes.length; i++ ) {
				var	node = nodes[i], nodeName = node.nodeName.toUpperCase();

				if ( node && node.parentNode ) {

					var unwrap = false;

					switch(nodeName) {

						case 'TR':
							_this.wrapNode(node, 'P');
							unwrap = true;
							break;

						case 'LI':
							var pName = node.parentNode.nodeName.toUpperCase();
							if (pName && (pName != 'UL' && pName != 'OL')) {
								node.parentNode.removeChild(node);
							}
							break;

						case 'IFRAME':
							node.parentNode.removeChild(node);
							unwrap = false;
							break;

						case 'H1':
						case 'H2':
						case 'H3':
						case 'H4':
						case 'H5':
						case 'H6':
							unwrap = true;
							_this.wrapNode(node, 'B');
							_this.wrapNode(node.parentNode, 'P');
					}

					if (unwrap) {
						_this.unwrapNode(node);
					}
				}
			}
		}
	}

	isWordCleanNeeded(data) {
		return (
			( /<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i ).test(data) ||
			( /class="OutlineElement/ ).test(data) ||
			( /id="?docs\-internal\-guid\-/ ).test(data)
		);
	};

	isNumericList(text) {
		var found, patterns;

		patterns = [
			/^[IVXLMCD]{1,5}\.[ \u00a0]/,  // Roman upper case
			/^[ivxlmcd]{1,5}\.[ \u00a0]/,  // Roman lower case
			/^[a-z]{1,2}[\.\)][ \u00a0]/,  // Alphabetical a-z
			/^[A-Z]{1,2}[\.\)][ \u00a0]/,  // Alphabetical A-Z
			/^[0-9]+\.[ \u00a0]/, /\d+/,   // Numeric lists
			/^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/, // Japanese
			/^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/  // Chinese
		];

		text = text.replace(/^[\u00a0 ]+/, '');

		this.forEach(patterns, function(pattern) {
			if (pattern.test(text)) {
				found = true;
				return false;
			}
		});

		return found;
	};

	isBulletList(text) {
		return /^[\s\u00a0]*[\u2022\u00b7\u00a7\u25CF]\s*/.test(text);
	};

	filter(content, items) {
		this.forEach(items, function(v) {
			if (v.constructor == RegExp) {
				content = content.replace(v, '');
			} else {
				content = content.replace(v[0], v[1]);
			}
		});

		return content;
	};

	parseStyle(str) {

		var res = {};

		if (!str)
			return res;

		var styles = str.split(';');

		for (var i = 0; i < styles.length; i++) {
			var	style = styles[i].split(':');
			if ( style.length < 2 )
				continue;

			res[style[0]] = style[1];
		}

		return res;
	};

	cleanNodeStyle(node) {

		if ( !node || !node.parentNode )
			return;

		var
			styles = this.parseStyle( node.getAttribute('style') ),
			parsedStyles = {}
		;

		this.forEach(styles, function(value, name){

			switch(name) {

				case 'mso-list':

					var matches = /\w+ \w+([0-9]+)/i.exec(value);

					if (matches) {
						node._listLevel = parseInt(matches[1], 10);
					}

					if (/Ignore/i.test(value) && node.firstChild) {
						node._listIgnore = true;
						node.firstChild._listIgnore = true;
					}
					break;

				case "mso-element":

					if (/^(comment|comment-list)$/i.test(value)) {
						node.parentNode.removeChild(node);
						return;
					}
					break;

				case "font-weight":
				case "font-style":
					if (value != "normal") {
						parsedStyles[name] = value;
					}
					return;

			}

			if (name.indexOf('mso-comment') === 0) {
				node.parentNode.removeChild(node);
				return;
			}

		});

		if (/(bold)/i.test(parsedStyles["font-weight"])) {
			delete parsedStyles["font-weight"];
			wrapNode(node, "b")
		}

		if (/(italic)/i.test(parsedStyles["font-style"])) {
			delete parsedStyles["font-style"];
			wrapNode(node, "i")
		}

		node.removeAttribute('style');

	};

	cleanNodeClass(node) {

		if ( !node || !node.parentNode )
			return;

		var nodeClass = node.getAttribute('class');

		if (!nodeClass)
			return;

		if (nodeClass && /^(MsoCommentReference|MsoCommentText|msoDel)$/i.test(nodeClass)) {
			node.parentNode.removeChild(node);
		} else {
			node.removeAttribute('class');
		}
	};

	cleanLinkNode(node) {

		if ( !node || !node.parentNode )
			return;

		var
			href = node.getAttribute('href'),
			name = node.getAttribute('name')
		;

		if (href && href.indexOf('#_msocom_') != -1) {
			node.parentNode.removeChild(node);
			return;
		}

		if (href && href.indexOf('file://') === 0) {
			href = href.split('#')[1];
			if (href) {
				href = '#' + href;
			}
		}

		if (!href && !name) {
			this.unwrapNode(node);
		} else {
			if (name) {
				if(!/^_?(?:toc|edn|ftn)/i.test(name)) {
					this.unwrapNode(node);
					return;
				}
			}

			node.setAttribute('href', href);
			if (name) node.setAttribute('name', name);
		}
	};

	convertLists(node) {

		var _this = this.quill.cleanpaste, currentListNode, prevListNode, lastLevel = 1;

		Node.prototype.walk = function(prev) {
			return walk(this, null, prev);
		};

		function walk(node, root_node, prev) {

			var sibling, parent, startName = prev ? 'lastChild' : 'firstChild', siblingName = prev ? 'previousSibling' : 'nextSibling';

			if (node[startName]) {
				return node[startName];
			}

			if (node !== root_node) {
				sibling = node[siblingName];

				if (sibling) {
					return sibling;
				}

				for (parent = node.parentNode; parent && parent !== root_node; parent = parent.parentNode) {
					sibling = parent[siblingName];

					if (sibling) {
						return sibling;
					}
				}
			}
		};

		function getText(node) {
			var txt = '';

			if (node.nodeType === _this.TXT_NODE) {
				return node.nodeValue;
			}

			if ((node = node.firstChild)) {
				do {
					txt += getText(node);
				} while ((node = node.nextSibling));
			}

			return txt;
		};

		function trimListStart(node, regExp) {
			if (node.nodeType === _this.TXT_NODE) {
				if (regExp.test(node.nodeValue)) {
					node.nodeValue = node.nodeValue.replace(regExp, '');
					return false;
				}
			}

			if ((node = node.firstChild)) {
				do {
					if (!trimListStart(node, regExp)) {
						return false;
					}
				} while ((node = node.nextSibling));
			}

			return true;
		};

		function removeIgnoredNodes(node) {
			if (node._listIgnore) {
				node.parentNode.removeChild(node);
				return;
			}

			if ((node = node.firstChild)) {
				do {
					removeIgnoredNodes(node);
				} while ((node = node.nextSibling));
			}
		};

		function convertParagraphToLi(paragraphNode, listName, start) {
			var level = paragraphNode._listLevel || lastLevel;

			if (level != lastLevel) {

				if (level < lastLevel) {

					if (currentListNode) {
						currentListNode = currentListNode.parentNode.parentNode;
					}
				} else {

					prevListNode = currentListNode;
					currentListNode = null;
				}
			}

			if (!currentListNode || currentListNode.nodeName.toUpperCase() != listName.toUpperCase()) {
				prevListNode = prevListNode || currentListNode;
				currentListNode = document.createElement(listName);

				if (start > 1) {
					currentListNode.setAttribute('start', '' + start);
				}

				_this.wrapNode(paragraphNode, currentListNode);

			} else {
				currentListNode.appendChild(paragraphNode);
			}

			_this.wrapNode(paragraphNode, 'li');

			var newNode = paragraphNode.parentNode;
			if ( paragraphNode._listLevel )
				newNode._listLevel = paragraphNode._listLevel;

			_this.unwrapNode(paragraphNode);

			var paragraphNode = newNode;

			if (level > lastLevel && prevListNode) {
				prevListNode.lastChild.appendChild(currentListNode);
			}

			lastLevel = level;

			removeIgnoredNodes(paragraphNode);
			trimListStart(paragraphNode, /^\u00a0+/);
			trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
			trimListStart(paragraphNode, /^\u00a0+/);
		};

		var elements = [], child = node.firstChild;
		while (typeof child !== 'undefined' && child !== null) {
			if( child.nodeType !== 3) elements.push(child);
			child = child.walk();

			if (child !== null) {
				while (typeof child !== 'undefined' && child.parentNode !== node) {
					child = child.walk();
				}
			}
		};

		for (var i = 0; i < elements.length; i++) {

			var
				node = elements[i],
				nodeName = node.nodeName.toUpperCase()
			;

			if (nodeName == 'P' && node.firstChild) {
				var nodeText = getText(node);

				if (this.isBulletList(nodeText)) {
					convertParagraphToLi(node, 'ul');
					continue;
				}

				if (this.isNumericList(nodeText)) {

					var
						matches = /([0-9]+)\./.exec(nodeText),
						start = 1
					;

					if (matches) {
						start = parseInt(matches[1], 10);
					}

					convertParagraphToLi(node, 'ol', start);
					continue;
				}

				if (node._listLevel) {
					convertParagraphToLi(node, 'ul', 1);
					continue;
				}

				currentListNode = null;

			} else {
				prevListNode = currentListNode;
				currentListNode = null;
			}
		};
	};

	cleanUpWordStuff(container) {

		var html = container.innerHTML;

		html = this.filter(
				html,
				[
					/<b[^>]+id="?docs-internal-[^>]*>/gi,
					/<br class="?Apple-interchange-newline"?>/gi,
					/<!--[\s\S]+?-->/gi,
					/<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|img|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi,
					[/<(\/?)s>/gi, "<$1strike>"],
					[/&nbsp;/gi, "\u00a0"],
					[/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi,
						function(str, spaces) {
							return (spaces.length > 0) ?
								spaces.replace(/./, " ").slice(Math.floor(spaces.length / 2)).split("").join("\u00a0") : "";
						}
					]
				]
			);

		container.innerHTML = html;

		var nodes = container.querySelectorAll('*');
		if ( nodes.length ) {

			for( var i = 0; i < nodes.length; i++ ) {
				var
					node = nodes[i],
					nodeName = node.nodeName.toUpperCase(),
					parsedStyles = {}
				;

				this.cleanNodeStyle(node);
				this.cleanNodeClass(node);

				if ( node && node.parentNode ) {

					switch( nodeName ) {

						case 'SPAN':
						case 'FONT':
							this.unwrapNode(node);
							break;

						case 'DEL':
							node.parentNode.removeChild(node);
							break;

						case 'A':
							this.cleanLinkNode(node);
							break;

					}
				}
			}
		}

		this.convertLists(container);
	};


	// UTILS

	forEach(o, cb, s) {
		var n, l;

		if (!o) {
			return 0;
		}

		s = s || o;

		if (o.length !== undefined) {
			// Indexed arrays, needed for Safari
			for (n = 0, l = o.length; n < l; n++) {
				if (cb.call(s, o[n], n, o) === false) {
					return 0;
				}
			}
		} else {
			// Hashtables
			for (n in o) {
				if (o.hasOwnProperty(n)) {
					if (cb.call(s, o[n], n, o) === false) {
						return 0;
					}
				}
			}
		}

		return 1;
	};

	wrapNode(node, wrapperNode, wrapperAttrs) {
		if (typeof wrapperNode === 'string') {
			wrapperNode = document.createElement(wrapperNode);
		}
		node.parentNode.insertBefore(wrapperNode, node);
		wrapperNode.appendChild(node);

		if ( wrapperAttrs ) {
			for (attr in wrapperAttrs) {
				wrapperNode.setAttribute( attr, wrapperAttrs[attr] )
			}
		}
		return wrapperNode;
	};

	unwrapNode(node) {
		var parent = node.parentNode;
		while (node.firstChild) parent.insertBefore(node.firstChild, node);
		parent.removeChild(node);
	}

	filter(content, items) {
		this.forEach(items, function(v) {
			if (v.constructor == RegExp) {
				content = content.replace(v, '');
			} else {
				content = content.replace(v[0], v[1]);
			}
		});

		return content;
	};
}

export default CleanPaste;

