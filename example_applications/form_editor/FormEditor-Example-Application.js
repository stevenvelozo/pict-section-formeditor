const libPict = require('pict');
const libPictApplication = require('pict-application');
const libPictSectionFormEditor = require('../../source/Pict-Section-FormEditor.js');

// The list of available manifests for the selector
const _ManifestList =
[
	{ Name: 'New Form', File: false },
	{ Name: 'Simple Form', File: 'manifests/Simple-Form.json' },
	{ Name: 'Simple Table', File: 'manifests/Simple-Table.json' },
	{ Name: 'Complex Table', File: 'manifests/Complex-Table.json' },
	{ Name: 'Manyfest Editor', File: 'manifests/Manyfest-Editor.json' },
	{ Name: 'Gradebook - Student', File: 'manifests/Gradebook-Student.json' },
	{ Name: 'Gradebook - Assignment', File: 'manifests/Gradebook-Assignment.json' },
	{ Name: 'Distill (Entity Bundles)', File: 'manifests/Distill-Example.json' }
];

class FormEditorExampleApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._ManifestList = _ManifestList;
		this._FormEditorView = null;
		this._DragDropEnabled = false;
		this._ShowHashes = false;
	}

	onAfterInitializeAsync(fCallback)
	{
		// Start with "New Form" (empty manifest)
		this.pict.AppData.FormConfig =
		{
			Scope: 'NewForm',
			Sections: [],
			Descriptors: {}
		};

		// Store the manifest list for the selector template
		this.pict.AppData.ManifestList = this._ManifestList;

		// Add the FormEditor view
		this._FormEditorView = this.pict.addView('FormEditor',
		{
			ViewIdentifier: 'FormEditor',
			ManifestDataAddress: 'AppData.FormConfig',
			DefaultDestinationAddress: '#FormEditor-Container',
			ActiveTab: 'visual',
			Renderables:
			[
				{
					RenderableHash: 'FormEditor-Container',
					TemplateHash: 'FormEditor-Container-Template',
					DestinationAddress: '#FormEditor-Container',
					RenderMethod: 'replace'
				}
			]
		}, libPictSectionFormEditor);

		this._FormEditorView.initialize();
		this._FormEditorView.render();

		// Render the selector bar
		this.renderSelector();

		return super.onAfterInitializeAsync(fCallback);
	}

	renderSelector()
	{
		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-selector-bar">';
		tmpHTML += '<label class="pict-fe-selector-label" for="FormEditor-ManifestSelect">Load Configuration:</label>';
		tmpHTML += '<select class="pict-fe-selector-select" id="FormEditor-ManifestSelect">';
		for (let i = 0; i < this._ManifestList.length; i++)
		{
			tmpHTML += `<option value="${i}">${this._escapeHTML(this._ManifestList[i].Name)}</option>`;
		}
		tmpHTML += '</select>';
		tmpHTML += `<button class="pict-fe-selector-btn" onclick="${this.pict.browserAddress}.PictApplication.loadSelectedManifest()">Load</button>`;
		tmpHTML += `<button class="pict-fe-selector-btn" id="FormEditor-DragDropToggle" onclick="${this.pict.browserAddress}.PictApplication.toggleDragAndDrop()" style="margin-left:auto; background:#8A7F72;">Enable Drag &amp; Drop</button>`;
		tmpHTML += `<button class="pict-fe-selector-btn" id="FormEditor-DisplayModeToggle" onclick="${this.pict.browserAddress}.PictApplication.toggleDisplayMode()" style="background:#8A7F72;">Show Hashes</button>`;
		tmpHTML += '</div>';

		this.pict.ContentAssignment.assignContent('#FormEditor-Selector', tmpHTML);
	}

	toggleDragAndDrop()
	{
		this._DragDropEnabled = !this._DragDropEnabled;

		if (this._FormEditorView)
		{
			this._FormEditorView._DragDropProvider.setDragAndDropEnabled(this._DragDropEnabled);
		}

		let tmpToggleBtn = document.getElementById('FormEditor-DragDropToggle');
		if (tmpToggleBtn)
		{
			tmpToggleBtn.textContent = this._DragDropEnabled ? 'Disable Drag & Drop' : 'Enable Drag & Drop';
			tmpToggleBtn.style.background = this._DragDropEnabled ? '#E76F51' : '#8A7F72';
		}
	}

	toggleDisplayMode()
	{
		this._ShowHashes = !this._ShowHashes;

		if (this._FormEditorView)
		{
			this._FormEditorView._UtilitiesProvider.setInputDisplayMode(this._ShowHashes ? 'hash' : 'name');
		}

		let tmpToggleBtn = document.getElementById('FormEditor-DisplayModeToggle');
		if (tmpToggleBtn)
		{
			tmpToggleBtn.textContent = this._ShowHashes ? 'Show Names' : 'Show Hashes';
			tmpToggleBtn.style.background = this._ShowHashes ? '#5B6E5D' : '#8A7F72';
		}
	}

	loadSelectedManifest()
	{
		let tmpSelect = document.getElementById('FormEditor-ManifestSelect');
		if (tmpSelect)
		{
			this.loadManifest(parseInt(tmpSelect.value, 10));
		}
	}

	loadManifest(pIndex)
	{
		if (pIndex < 0 || pIndex >= this._ManifestList.length)
		{
			return;
		}

		let tmpEntry = this._ManifestList[pIndex];

		if (!tmpEntry.File)
		{
			// "New Form" — empty manifest
			this.pict.AppData.FormConfig =
			{
				Scope: 'NewForm',
				Sections: [],
				Descriptors: {}
			};
			this._refreshEditor();
			return;
		}

		// Fetch the manifest JSON
		let tmpXHR = new XMLHttpRequest();
		tmpXHR.open('GET', tmpEntry.File, true);
		tmpXHR.onreadystatechange = () =>
		{
			if (tmpXHR.readyState === 4)
			{
				if (tmpXHR.status === 200)
				{
					try
					{
						this.pict.AppData.FormConfig = JSON.parse(tmpXHR.responseText);
						this._refreshEditor();
					}
					catch (pError)
					{
						this.log.error(`Error parsing manifest JSON from ${tmpEntry.File}: ${pError.message}`);
					}
				}
				else
				{
					this.log.error(`Error loading manifest from ${tmpEntry.File}: HTTP ${tmpXHR.status}`);
				}
			}
		};
		tmpXHR.send();
	}

	_refreshEditor()
	{
		if (this._FormEditorView)
		{
			this._FormEditorView.render();
		}
	}

	_escapeHTML(pString)
	{
		if (typeof pString !== 'string')
		{
			return '';
		}
		return pString
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

module.exports = FormEditorExampleApplication;

module.exports.default_configuration = (
{
	Name: 'FormEditorExample',
	Hash: 'FormEditorExample',
	MainViewportViewIdentifier: 'FormEditor',
	AutoSolveAfterInitialize: false,
	AutoRenderMainViewportViewAfterInitialize: false,
	pict_configuration:
	{
		Product: 'FormEditorExample'
	}
});
