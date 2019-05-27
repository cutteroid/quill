import Module from '../core/module';
import Emitter from '../core/emitter';

class SaveState extends Module {

	constructor(quill, options) {

		super(quill, options);

		var _this = this;

		this.STORAGE_KEY = this.quill.alias + ".savedEditorContents";
		this.currentKey = null;

		this.quill.on(Emitter.events.EDITOR_CHANGE, function(node) {
			_this.saveEditorState(_this.currentKey);
		});

		 setTimeout(() => {
	      this._cleanOldStates();
	    }, 1);
	}

	checkSavedState(subKey, restore) {
		if (!subKey) return;

		var
			savedData = this._getSavedState(),
			result
		;

		this.subKey = subKey;

		result = (savedData[subKey])? true : false;

		if (result && restore) this.restoreEditorState(subKey);

		return result;
	}

	saveEditorState(subKey) {
		if (!subKey) return;

		var
			savedData = this._getSavedState(),
			editorContents = this.quill.getContents(),
			timestamp = Date.now()
		;

		savedData[this.subKey] = {
			timestamp: timestamp,
			content: editorContents
		}

		this._setSavedState(savedData);
	}

	restoreEditorState(subKey) {
		if (!subKey) return;

		var savedData = this._getSavedState();

		if (savedData[subKey]) this.quill.setContents(savedData[subKey].content, Emitter.sources.USER);
	}

	clearEditorState(subKey) {
		if (!subKey) return;

		var savedData = this._getSavedState();

		if (savedData[subKey]) {
			delete savedData[subKey];
			this._setSavedState(savedData);
		}
	}

	_getSavedState() {
		var
			savedContents = localStorage.getItem(this.STORAGE_KEY),
			data = {}
		;

		try {
			data = (savedContents)? JSON.parse(savedContents) : {};
		} catch(e) {}

		return data;
	}

	_setSavedState(data) {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
		} catch (e) {}
	}

	_cleanOldStates() {
		var
			savedContents = this._getSavedState(),
			keys = (savedContents)? Object.keys(savedContents) : [],
			timestamp = Date.now()
		;

		if (!keys.length) return;

		for (var i = 0; i < keys.length; i++) {
			var
				content = savedContents[keys[i]],
				tsDiff = timestamp - content.timestamp;
			;
			if (tsDiff > 86400000) { //One day
				this.clearEditorState(keys[i]);
			}
		}
	}
}

export default SaveState;
