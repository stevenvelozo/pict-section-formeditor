const libPict = require('pict');
const libPictApplication = require('pict-application');
const libPictSectionFormEditor = require('../../source/Pict-Section-FormEditor.js');

// The list of available manifests for the selector
const _ManifestList =
[
	{ Name: 'New Form', File: false },
	{ Name: 'Patient Intake (large)', File: 'manifests/Patient-Intake.json' },
	{ Name: 'Project Proposal (large)', File: 'manifests/Project-Proposal.json' },
	{ Name: 'Complex Table', File: 'manifests/Complex-Table.json' },
	{ Name: 'Manyfest Editor', File: 'manifests/Manyfest-Editor.json' },
	{ Name: 'Simple Form', File: 'manifests/Simple-Form.json' },
	{ Name: 'Gradebook - Student', File: 'manifests/Gradebook-Student.json' },
	{ Name: 'Gradebook - Assignment', File: 'manifests/Gradebook-Assignment.json' },
	{ Name: 'Distill (Entity Bundles)', File: 'manifests/Distill-Example.json' }
];

class FormEditorFlexExampleApplication extends libPictApplication
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
		// Start with an empty manifest; the first sample will be loaded after render
		this.pict.AppData.FormConfig =
		{
			Scope: 'NewForm',
			Sections: [],
			Descriptors: {}
		};

		// Store the manifest list for the selector template
		this.pict.AppData.ManifestList = this._ManifestList;

		// Override the default CSS to remove the fixed height and use natural flow
		let tmpDefaultConfig = JSON.parse(JSON.stringify(libPictSectionFormEditor.default_configuration));

		// Replace the fixed-height .pict-formeditor rule with a flow-friendly version
		// The key change: remove `height: calc(100vh - 120px)` and `overflow: hidden`
		// so the editor flows with the page.  The properties panel gets `position: sticky`.
		let tmpCSS = tmpDefaultConfig.CSS;

		// Patch: .pict-formeditor — remove fixed height, allow natural flow
		tmpCSS = tmpCSS.replace(
			/\.pict-formeditor\s*\{[^}]*\}/,
			`.pict-formeditor
{
	position: relative;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	font-size: 14px;
	color: #3D3229;
	background: #FDFCFA;
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	display: flex;
	flex-direction: column;
}`
		);

		// Patch: .pict-fe-editor-layout — remove overflow:hidden and min-height:0
		// so the two-column layout can grow naturally
		tmpCSS = tmpCSS.replace(
			/\.pict-fe-editor-layout\s*\{[^}]*\}/,
			`.pict-fe-editor-layout
{
	display: flex;
	gap: 0;
	flex: 1;
	position: relative;
}`
		);

		// Patch: .pict-fe-editor-content — let it grow naturally
		tmpCSS = tmpCSS.replace(
			/\.pict-fe-editor-content\s*\{[^}]*\}/,
			`.pict-fe-editor-content
{
	flex: 1;
	min-width: 300px;
	display: flex;
	flex-direction: column;
}`
		);

		// Patch: .pict-fe-tabcontent — remove min-height:0 and overflow:auto
		// so content flows naturally instead of scrolling internally
		tmpCSS = tmpCSS.replace(
			/\.pict-fe-tabcontent\s*\{[^}]*\}/,
			`.pict-fe-tabcontent
{
	display: none;
	padding: 16px;
	flex: 1;
}`
		);

		// Add sticky properties panel CSS
		tmpCSS += `

/* === Flex-height sticky panel overrides === */
.pict-fe-properties-panel-open
{
	position: sticky;
	top: 0;
	align-self: flex-start;
	max-height: 100vh;
	overflow-y: auto;
}
`;

		tmpDefaultConfig.CSS = tmpCSS;

		// Add the FormEditor view with our patched configuration
		this._FormEditorView = this.pict.addView('FormEditor',
		Object.assign({}, tmpDefaultConfig,
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
		}), libPictSectionFormEditor);

		this._FormEditorView.initialize();
		this._FormEditorView.render();

		// Wire up the import event
		let tmpSelf = this;
		this._FormEditorView.onImport = function(pManifests, pFileName)
		{
			tmpSelf._handleImportedManifests(pManifests, pFileName);
		};

		// Render the selector bar
		this.renderSelector();

		// Load the first file-based sample by default
		let tmpDefaultIndex = 1;
		let tmpSelect = document.getElementById('FormEditor-ManifestSelect');
		if (tmpSelect)
		{
			tmpSelect.value = String(tmpDefaultIndex);
		}
		this.loadManifest(tmpDefaultIndex);

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

		if (tmpEntry.ManifestData)
		{
			this.pict.AppData.FormConfig = tmpEntry.ManifestData;
			this._refreshEditor();
			return;
		}

		if (!tmpEntry.File)
		{
			this.pict.AppData.FormConfig =
			{
				Scope: 'NewForm',
				Sections: [],
				Descriptors: {}
			};
			this._refreshEditor();
			return;
		}

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

	_handleImportedManifests(pManifests, pFileName)
	{
		let tmpManifestKeys = Object.keys(pManifests);
		if (tmpManifestKeys.length <= 1)
		{
			return;
		}

		let tmpSourceLabel = pFileName.toLowerCase().endsWith('.json') ? 'JSON' : 'CSV';

		for (let i = 1; i < tmpManifestKeys.length; i++)
		{
			let tmpKey = tmpManifestKeys[i];
			let tmpFormName = pManifests[tmpKey].FormName || tmpKey;
			let tmpEntry = { Name: `${tmpSourceLabel}: ${tmpFormName}`, File: false, ManifestData: pManifests[tmpKey] };
			this._ManifestList.push(tmpEntry);
		}

		this.renderSelector();
	}

	loadManifestDirect(pManifestData)
	{
		this.pict.AppData.FormConfig = pManifestData;
		this._refreshEditor();
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

module.exports = FormEditorFlexExampleApplication;

module.exports.default_configuration = (
{
	Name: 'FormEditorFlexExample',
	Hash: 'FormEditorFlexExample',
	MainViewportViewIdentifier: 'FormEditor',
	AutoSolveAfterInitialize: false,
	AutoRenderMainViewportViewAfterInitialize: false,
	pict_configuration:
	{
		Product: 'FormEditorFlexExample'
	}
});
