const libPictView = require('pict-view');
const libPictSectionObjectEditor = require('pict-section-objecteditor');
const libPictSectionCode = require('pict-section-code');

const _DefaultConfiguration = require('../Pict-Section-FormEditor-DefaultConfiguration.js');
const libFormEditorIconography = require('../providers/Pict-Provider-FormEditorIconography.js');

class PictViewFormEditor extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultConfiguration)), pOptions);

		if (!tmpOptions.ManifestDataAddress)
		{
			tmpOptions.ManifestDataAddress = 'FormEditor.Manifest';
		}

		super(pFable, tmpOptions, pServiceHash);

		this._ActiveTab = tmpOptions.ActiveTab || 'visual';

		// Child view references
		this._ObjectEditorView = null;
		this._CodeEditorView = null;

		// Supported Manyfest DataTypes
		this._ManyfestDataTypes =
		[
			'String',
			'Number',
			'Float',
			'Integer',
			'PreciseNumber',
			'Boolean',
			'Binary',
			'DateTime',
			'Array',
			'Object',
			'Null'
		];

		// Build the InputType definitions from defaults + any embedder overrides
		this._InputTypeDefinitions = this._buildInputTypeDefinitions(tmpOptions);

		// Create the iconography provider
		this._IconographyProvider = new libFormEditorIconography(tmpOptions.Iconography || {});

		// Drag-and-drop state (opt-in, disabled by default)
		this._DragAndDropEnabled = false;
		this._DragState = null;

		// Input display mode: 'name' shows Name, 'hash' shows Hash
		this._InputDisplayMode = 'name';

		// Selected input for the properties panel
		this._SelectedInputIndices = null;

		// Properties panel child view reference
		this._PropertiesPanelView = null;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Initialization                           */
	/* -------------------------------------------------------------------------- */

	onBeforeInitialize()
	{
		super.onBeforeInitialize();

		// Ensure the manifest data address exists in AppData
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			this._setManifestData(this._createEmptyManifest());
		}
	}

	onAfterInitialize()
	{
		super.onAfterInitialize();

		// Register the object editor service type if not already registered
		if (!this.fable.servicesMap.hasOwnProperty('PictSectionObjectEditor'))
		{
			this.fable.addServiceType('PictSectionObjectEditor', libPictSectionObjectEditor);
		}

		// Create the object editor child view
		let tmpViewHash = `${this.Hash}-ObjectEditor`;
		this._ObjectEditorView = this.pict.addView(
			tmpViewHash,
			{
				ViewIdentifier: tmpViewHash,
				ObjectDataAddress: this.options.ManifestDataAddress,
				DefaultDestinationAddress: `#FormEditor-ObjectEditor-Container-${this.Hash}`,
				InitialExpandDepth: 2,
				Editable: true,
				ShowTypeIndicators: true,
				AutoRender: false,
				Renderables:
				[
					{
						RenderableHash: 'ObjectEditor-Container',
						TemplateHash: 'ObjectEditor-Container-Template',
						DestinationAddress: `#FormEditor-ObjectEditor-Container-${this.Hash}`,
						RenderMethod: 'replace'
					}
				]
			},
			libPictSectionObjectEditor
		);
		this._ObjectEditorView.initialize();

		// Create the properties panel child view
		let tmpPropertiesPanelView = require('./PictView-FormEditor-PropertiesPanel.js');
		let tmpPropsPanelHash = `${this.Hash}-PropertiesPanel`;
		this._PropertiesPanelView = this.pict.addView(
			tmpPropsPanelHash,
			{
				ViewIdentifier: tmpPropsPanelHash,
				DefaultDestinationAddress: `#FormEditor-PropertiesPanel-${this.Hash}`,
				AutoRender: false
			},
			tmpPropertiesPanelView
		);
		this._PropertiesPanelView._ParentFormEditor = this;
		this._PropertiesPanelView.initialize();

		// Create the code editor child view (pict-section-code for JSON tab)
		let tmpCodeEditorHash = `${this.Hash}-CodeEditor`;
		this._CodeEditorView = this.pict.addView(
			tmpCodeEditorHash,
			{
				ViewIdentifier: tmpCodeEditorHash,
				TargetElementAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`,
				Language: 'json',
				ReadOnly: false,
				LineNumbers: true,
				DefaultCode: '{}',
				AutoRender: false,
				RenderOnLoad: false,
				DefaultRenderable: 'CodeEditor-Wrap',
				DefaultDestinationAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`,
				Renderables:
				[
					{
						RenderableHash: 'CodeEditor-Wrap',
						TemplateHash: 'CodeEditor-Container',
						DestinationAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`
					}
				]
			},
			libPictSectionCode
		);
		this._CodeEditorView.initialize();

		// Override onCodeChange to sync edits back to manifest
		let tmpSelf = this;
		this._CodeEditorView.onCodeChange = function(pCode)
		{
			// Try to parse; silently ignore invalid JSON while user is typing
			try
			{
				let tmpParsed = JSON.parse(pCode);
				tmpSelf._setManifestData(tmpParsed);
			}
			catch (e)
			{
				// JSON not yet valid — no-op until user finishes editing
			}
		};
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Rendering                                */
	/* -------------------------------------------------------------------------- */

	onAfterRender()
	{
		super.onAfterRender();

		// Inject CSS
		if (this.options.CSS)
		{
			this.pict.CSSMap.injectCSS(this.options.ViewIdentifier, this.options.CSS);
		}

		// Build the full tab bar and content panels programmatically
		this._renderTabShell();

		this.renderVisualEditor();
		this._syncTabState();
	}

	_renderTabShell()
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();

		let tmpHTML = '';

		// Tab bar
		tmpHTML += '<div class="pict-fe-tabbar">';
		tmpHTML += `<button class="pict-fe-tab pict-fe-tab-active" id="FormEditor-Tab-Visual-${tmpHash}" onclick="${tmpViewRef}.switchTab('visual')">Visual Editor</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-ObjectEditor-${tmpHash}" onclick="${tmpViewRef}.switchTab('objecteditor')">Object Editor</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-JSON-${tmpHash}" onclick="${tmpViewRef}.switchTab('json')">JSON</button>`;
		tmpHTML += '</div>';

		// Visual editor panel
		tmpHTML += `<div class="pict-fe-tabcontent pict-fe-tabcontent-active" id="FormEditor-Panel-Visual-${tmpHash}"></div>`;

		// Object editor panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-ObjectEditor-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-ObjectEditor-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// JSON panel — uses pict-section-code
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-JSON-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-CodeEditor-Container-${this.Hash}"></div>`;
		tmpHTML += '</div>';

		this.pict.ContentAssignment.assignContent(`#FormEditor-Wrap-${tmpHash}`, tmpHTML);
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Tab Management                           */
	/* -------------------------------------------------------------------------- */

	switchTab(pTabName)
	{
		this._ActiveTab = pTabName;
		this._syncTabState();

		if (pTabName === 'objecteditor')
		{
			// Render the object editor container first, then expand to 2 levels
			this._ObjectEditorView.render();
			this._ObjectEditorView.expandToDepth(2);
		}
		else if (pTabName === 'json')
		{
			this._updateCodeEditor();
		}
		else if (pTabName === 'visual')
		{
			this.renderVisualEditor();
		}
	}

	_syncTabState()
	{
		let tmpHash = this.Hash;
		let tmpTabs = ['visual', 'objecteditor', 'json'];
		let tmpTabNames = ['Visual', 'ObjectEditor', 'JSON'];

		for (let i = 0; i < tmpTabs.length; i++)
		{
			// getElement returns an array; grab the first match
			let tmpTabButtonSet = this.pict.ContentAssignment.getElement(`#FormEditor-Tab-${tmpTabNames[i]}-${tmpHash}`);
			let tmpTabPanelSet = this.pict.ContentAssignment.getElement(`#FormEditor-Panel-${tmpTabNames[i]}-${tmpHash}`);

			let tmpTabButton = (Array.isArray(tmpTabButtonSet) && tmpTabButtonSet.length > 0) ? tmpTabButtonSet[0] : tmpTabButtonSet;
			let tmpTabPanel = (Array.isArray(tmpTabPanelSet) && tmpTabPanelSet.length > 0) ? tmpTabPanelSet[0] : tmpTabPanelSet;

			if (tmpTabButton && tmpTabButton.className !== undefined)
			{
				if (tmpTabs[i] === this._ActiveTab)
				{
					tmpTabButton.className = 'pict-fe-tab pict-fe-tab-active';
				}
				else
				{
					tmpTabButton.className = 'pict-fe-tab';
				}
			}
			if (tmpTabPanel && tmpTabPanel.className !== undefined)
			{
				if (tmpTabs[i] === this._ActiveTab)
				{
					tmpTabPanel.className = 'pict-fe-tabcontent pict-fe-tabcontent-active';
				}
				else
				{
					tmpTabPanel.className = 'pict-fe-tabcontent';
				}
			}
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Visual Editor                            */
	/* -------------------------------------------------------------------------- */

	/**
	 * Reconcile the manifest structure so that every Descriptor's PictForm
	 * reference is reflected in its Section's Group's Rows[].Inputs[] arrays.
	 *
	 * Existing manifests store layout information entirely in the Descriptors'
	 * PictForm objects (Section, Group, Row) and do not carry Rows/Inputs
	 * arrays on the Groups.  This method builds those arrays from the
	 * Descriptors so the visual editor can render them.
	 *
	 * It is safe to call repeatedly — it only adds missing structure and never
	 * removes or duplicates entries.
	 */
	_reconcileManifestStructure()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		if (!Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		if (!tmpManifest.Descriptors || typeof tmpManifest.Descriptors !== 'object')
		{
			return;
		}

		// Build a quick lookup: SectionHash -> section index
		let tmpSectionMap = {};
		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			if (tmpSection.Hash)
			{
				tmpSectionMap[tmpSection.Hash] = i;
			}

			// Ensure every section has a Groups array
			if (!Array.isArray(tmpSection.Groups))
			{
				tmpSection.Groups = [];
			}
		}

		// Build a lookup: SectionHash -> GroupHash -> group index
		let tmpGroupMap = {};
		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			let tmpSectionHash = tmpSection.Hash || '';
			tmpGroupMap[tmpSectionHash] = {};
			for (let j = 0; j < tmpSection.Groups.length; j++)
			{
				let tmpGroup = tmpSection.Groups[j];
				if (tmpGroup.Hash)
				{
					tmpGroupMap[tmpSectionHash][tmpGroup.Hash] = j;
				}
			}
		}

		// Build a set of all Addresses already present in any Rows[].Inputs[]
		let tmpExistingAddresses = {};
		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			for (let j = 0; j < tmpSection.Groups.length; j++)
			{
				let tmpGroup = tmpSection.Groups[j];
				if (Array.isArray(tmpGroup.Rows))
				{
					for (let k = 0; k < tmpGroup.Rows.length; k++)
					{
						let tmpRow = tmpGroup.Rows[k];
						if (tmpRow && Array.isArray(tmpRow.Inputs))
						{
							for (let m = 0; m < tmpRow.Inputs.length; m++)
							{
								tmpExistingAddresses[tmpRow.Inputs[m]] = true;
							}
						}
					}
				}
			}
		}

		// Walk every Descriptor and place it into the correct Rows[].Inputs[]
		let tmpDescriptorKeys = Object.keys(tmpManifest.Descriptors);
		for (let d = 0; d < tmpDescriptorKeys.length; d++)
		{
			let tmpAddress = tmpDescriptorKeys[d];

			// Skip if already placed
			if (tmpExistingAddresses[tmpAddress])
			{
				continue;
			}

			let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
			if (!tmpDescriptor || !tmpDescriptor.PictForm)
			{
				continue;
			}

			let tmpPictForm = tmpDescriptor.PictForm;
			let tmpSectionHash = tmpPictForm.Section;
			if (!tmpSectionHash || !tmpSectionMap.hasOwnProperty(tmpSectionHash))
			{
				continue;
			}

			let tmpSectionIndex = tmpSectionMap[tmpSectionHash];
			let tmpSection = tmpManifest.Sections[tmpSectionIndex];

			// Resolve the group — if PictForm.Group is missing, use the first
			// group; create a default group if none exist.
			let tmpGroupHash = tmpPictForm.Group || null;
			let tmpGroupIndex = -1;

			if (tmpGroupHash && tmpGroupMap[tmpSectionHash].hasOwnProperty(tmpGroupHash))
			{
				tmpGroupIndex = tmpGroupMap[tmpSectionHash][tmpGroupHash];
			}
			else if (!tmpGroupHash && tmpSection.Groups.length > 0)
			{
				// Default to first group when PictForm.Group is omitted
				tmpGroupIndex = 0;
			}

			if (tmpGroupIndex < 0)
			{
				// Create a default group for this section
				let tmpNewGroupHash = tmpGroupHash || (tmpSectionHash + 'Group_Default');
				let tmpNewGroupName = tmpGroupHash || 'Default';
				tmpSection.Groups.push(
				{
					Hash: tmpNewGroupHash,
					Name: tmpNewGroupName,
					Layout: 'Record'
				});
				tmpGroupIndex = tmpSection.Groups.length - 1;
				tmpGroupMap[tmpSectionHash][tmpNewGroupHash] = tmpGroupIndex;
			}

			let tmpGroup = tmpSection.Groups[tmpGroupIndex];

			// Ensure the group has a Rows array
			if (!Array.isArray(tmpGroup.Rows))
			{
				tmpGroup.Rows = [];
			}

			// PictForm.Row is 1-based; pad with empty rows if necessary
			let tmpRowNumber = (typeof tmpPictForm.Row === 'number' && tmpPictForm.Row > 0) ? tmpPictForm.Row : 1;
			let tmpRowIndex = tmpRowNumber - 1;
			while (tmpGroup.Rows.length <= tmpRowIndex)
			{
				tmpGroup.Rows.push({ Inputs: [] });
			}

			let tmpRow = tmpGroup.Rows[tmpRowIndex];
			if (!Array.isArray(tmpRow.Inputs))
			{
				tmpRow.Inputs = [];
			}

			tmpRow.Inputs.push(tmpAddress);
		}
	}

	renderVisualEditor()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		// Ensure Rows/Inputs arrays are populated from Descriptors
		this._reconcileManifestStructure();

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-visual-layout">';

		// Main content area
		tmpHTML += '<div class="pict-fe-visual-main">';

		tmpHTML += '<div class="pict-fe-visual-header">';
		tmpHTML += '<h3>Form Sections</h3>';
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-primary" onclick="${this._browserViewRef()}.addSection()"><span class="pict-fe-icon pict-fe-icon-add">${this._IconographyProvider.getIcon('Action', 'Add', 12)}</span> Add Section</button>`;
		tmpHTML += '</div>';

		let tmpSections = tmpManifest.Sections;
		if (!tmpSections || !Array.isArray(tmpSections) || tmpSections.length === 0)
		{
			tmpHTML += '<div class="pict-fe-empty">No sections defined. Click "Add Section" to create one.</div>';
		}
		else
		{
			tmpHTML += '<div class="pict-fe-sections-list">';
			for (let i = 0; i < tmpSections.length; i++)
			{
				tmpHTML += this._renderSectionCard(tmpSections[i], i);
			}
			tmpHTML += '</div>';
		}

		tmpHTML += '</div>'; // pict-fe-visual-main

		// Properties panel container
		let tmpPanelOpenClass = this._SelectedInputIndices ? ' pict-fe-properties-panel-open' : '';
		tmpHTML += `<div class="pict-fe-properties-panel${tmpPanelOpenClass}" id="FormEditor-PropertiesPanel-${this.Hash}"></div>`;

		tmpHTML += '</div>'; // pict-fe-visual-layout

		this.pict.ContentAssignment.assignContent(`#FormEditor-Panel-Visual-${this.Hash}`, tmpHTML);

		// If a property panel is selected, render its content
		if (this._PropertiesPanelView && this._SelectedInputIndices)
		{
			this._PropertiesPanelView.renderPanel();
		}
	}

	_renderSectionCard(pSection, pIndex)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();

		let tmpName = pSection.Name || 'Untitled Section';
		let tmpSectionHash = pSection.Hash || '';

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-section-card"${this._buildDragAttributes('section', [pIndex])}>`;

		// Section header with inline-editable name and hash
		tmpHTML += '<div class="pict-fe-section-header">';
		tmpHTML += '<div class="pict-fe-section-header-labels">';
		tmpHTML += this._buildDragHandleHTML(14);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-section">${this._IconographyProvider.getIcon('Section', 'Default', 14)}</span>`;
		tmpHTML += `<span class="pict-fe-section-title" id="FormEditor-SectionName-${tmpHash}-${pIndex}" title="Section Name: ${this._escapeAttr(tmpName)}" onclick="${tmpViewRef}.beginEditProperty('Section', ${pIndex}, -1, 'Name')">${this._escapeHTML(tmpName)}</span>`;
		tmpHTML += `<span class="pict-fe-section-hash" id="FormEditor-SectionHash-${tmpHash}-${pIndex}" title="Section Hash: ${this._escapeAttr(tmpSectionHash)}" onclick="${tmpViewRef}.beginEditProperty('Section', ${pIndex}, -1, 'Hash')">${this._escapeHTML(tmpSectionHash)}</span>`;
		tmpHTML += '</div>';
		tmpHTML += '<div class="pict-fe-section-actions">';
		if (pIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveSectionUp(${pIndex})" title="Move up">\u25B2</button>`;
		}
		if (pIndex < (this._resolveManifestData().Sections.length - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveSectionDown(${pIndex})" title="Move down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}.removeSection(${pIndex})" title="Remove section">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Section body
		tmpHTML += '<div class="pict-fe-section-body">';

		// Groups
		tmpHTML += '<div class="pict-fe-groups-header">';
		tmpHTML += '<h4>Groups</h4>';
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.addGroup(${pIndex})"><span class="pict-fe-icon pict-fe-icon-add">${this._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Group</button>`;
		tmpHTML += '</div>';

		let tmpGroups = pSection.Groups;
		if (!tmpGroups || !Array.isArray(tmpGroups) || tmpGroups.length === 0)
		{
			tmpHTML += `<div class="pict-fe-empty"${this._buildContainerDropAttributes('group', [pIndex])}>No groups in this section.</div>`;
		}
		else
		{
			tmpHTML += `<div class="pict-fe-groups-list"${this._buildContainerDropAttributes('group', [pIndex])}>`;
			for (let j = 0; j < tmpGroups.length; j++)
			{
				tmpHTML += this._renderGroupCard(tmpGroups[j], pIndex, j);
			}
			tmpHTML += '</div>';
		}

		tmpHTML += '</div>'; // section-body
		tmpHTML += '</div>'; // section-card

		return tmpHTML;
	}

	_renderGroupCard(pGroup, pSectionIndex, pGroupIndex)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();
		let tmpSection = this._resolveManifestData().Sections[pSectionIndex];
		let tmpGroupCount = tmpSection.Groups ? tmpSection.Groups.length : 0;

		let tmpGroupName = pGroup.Name || 'Untitled Group';
		let tmpGroupHash = pGroup.Hash || '';

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-group-card"${this._buildDragAttributes('group', [pSectionIndex, pGroupIndex])}>`;

		// Group header with inline-editable name and hash
		tmpHTML += '<div class="pict-fe-group-header">';
		tmpHTML += '<div class="pict-fe-group-header-labels">';
		tmpHTML += this._buildDragHandleHTML(12);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-group">${this._IconographyProvider.getIcon('Group', 'Default', 14)}</span>`;
		tmpHTML += `<span class="pict-fe-group-title" id="FormEditor-GroupName-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Name: ${this._escapeAttr(tmpGroupName)}" onclick="${tmpViewRef}.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Name')">${this._escapeHTML(tmpGroupName)}</span>`;
		tmpHTML += `<span class="pict-fe-group-hash" id="FormEditor-GroupHash-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Hash: ${this._escapeAttr(tmpGroupHash)}" onclick="${tmpViewRef}.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Hash')">${this._escapeHTML(tmpGroupHash)}</span>`;
		let tmpCurrentLayout = pGroup.Layout || 'Record';
		tmpHTML += `<span class="pict-fe-group-layout" id="FormEditor-GroupLayout-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Layout: ${this._escapeAttr(tmpCurrentLayout)}" onclick="${tmpViewRef}.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Layout')">${this._escapeHTML(tmpCurrentLayout)}</span>`;
		tmpHTML += '</div>';
		tmpHTML += '<div class="pict-fe-group-actions">';
		if (pGroupIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveGroupUp(${pSectionIndex}, ${pGroupIndex})" title="Move up">\u25B2</button>`;
		}
		if (pGroupIndex < (tmpGroupCount - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveGroupDown(${pSectionIndex}, ${pGroupIndex})" title="Move down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}.removeGroup(${pSectionIndex}, ${pGroupIndex})" title="Remove group">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Group body — render rows for Record layout groups
		if (tmpCurrentLayout === 'Record')
		{
			tmpHTML += this._renderGroupBody(pGroup, pSectionIndex, pGroupIndex);
		}

		tmpHTML += '</div>'; // group-card

		return tmpHTML;
	}

	_renderGroupBody(pGroup, pSectionIndex, pGroupIndex)
	{
		let tmpViewRef = this._browserViewRef();
		let tmpRows = pGroup.Rows;

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-group-body"${this._buildContainerDropAttributes('row', [pSectionIndex, pGroupIndex])}>`;

		if (Array.isArray(tmpRows) && tmpRows.length > 0)
		{
			for (let k = 0; k < tmpRows.length; k++)
			{
				tmpHTML += this._renderRow(tmpRows[k], pSectionIndex, pGroupIndex, k);
			}
		}

		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-row" onclick="${tmpViewRef}.addRow(${pSectionIndex}, ${pGroupIndex})"><span class="pict-fe-icon pict-fe-icon-add">${this._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Row</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	_renderRow(pRow, pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpViewRef = this._browserViewRef();

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-row"${this._buildDragAttributes('row', [pSectionIndex, pGroupIndex, pRowIndex])}>`;

		// Row header with index and actions
		tmpHTML += '<div class="pict-fe-row-header">';
		tmpHTML += this._buildDragHandleHTML(10);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-row">${this._IconographyProvider.getIcon('Row', 'Default', 12)}</span>`;
		tmpHTML += `<span class="pict-fe-row-label">Row ${pRowIndex + 1}</span>`;
		tmpHTML += '<div class="pict-fe-row-actions">';

		let tmpManifest = this._resolveManifestData();
		let tmpGroup = tmpManifest.Sections[pSectionIndex].Groups[pGroupIndex];
		let tmpRowCount = tmpGroup.Rows ? tmpGroup.Rows.length : 0;

		if (pRowIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveRowUp(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Move row up">\u25B2</button>`;
		}
		if (pRowIndex < (tmpRowCount - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveRowDown(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Move row down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}.removeRow(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Remove row">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Row inputs
		tmpHTML += `<div class="pict-fe-row-inputs"${this._buildContainerDropAttributes('input', [pSectionIndex, pGroupIndex, pRowIndex])}>`;
		let tmpInputs = pRow.Inputs;
		if (Array.isArray(tmpInputs) && tmpInputs.length > 0)
		{
			for (let m = 0; m < tmpInputs.length; m++)
			{
				tmpHTML += this._renderInput(tmpInputs[m], pSectionIndex, pGroupIndex, pRowIndex, m);
			}
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-input" onclick="${tmpViewRef}.addInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})"><span class="pict-fe-icon pict-fe-icon-add">${this._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Input</button>`;
		tmpHTML += '</div>';

		tmpHTML += '</div>';

		return tmpHTML;
	}

	_renderInput(pInputAddress, pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();
		let tmpManifest = this._resolveManifestData();

		// Look up the Descriptor by address
		let tmpDescriptor = null;
		if (typeof pInputAddress === 'string' && tmpManifest && tmpManifest.Descriptors)
		{
			tmpDescriptor = tmpManifest.Descriptors[pInputAddress];
		}

		let tmpInputHash = tmpDescriptor ? (tmpDescriptor.Hash || pInputAddress) : (typeof pInputAddress === 'string' ? pInputAddress : 'input');
		let tmpName = tmpDescriptor ? (tmpDescriptor.Name || '') : '';
		let tmpType = tmpDescriptor ? (tmpDescriptor.DataType || 'String') : 'String';
		let tmpInputType = (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
		let tmpWidth = (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.Width) ? tmpDescriptor.PictForm.Width : '';

		// Ordinal number (1-based position in the row)
		let tmpOrdinal = pInputIndex + 1;

		// Build the rich tooltip
		let tmpTooltipParts = [];
		tmpTooltipParts.push('Hash: ' + tmpInputHash);
		if (tmpName)
		{
			tmpTooltipParts.push('Name: ' + tmpName);
		}
		tmpTooltipParts.push('DataType: ' + tmpType);
		if (tmpInputType)
		{
			tmpTooltipParts.push('InputType: ' + tmpInputType);
		}
		if (tmpWidth)
		{
			tmpTooltipParts.push('Width: ' + tmpWidth);
		}
		let tmpTooltip = tmpTooltipParts.join('&#10;');

		// Determine display text based on _InputDisplayMode
		let tmpDisplayText = '';
		if (this._InputDisplayMode === 'hash')
		{
			tmpDisplayText = tmpInputHash;
		}
		else
		{
			tmpDisplayText = tmpName || tmpInputHash;
		}

		// Check if this input is currently selected
		let tmpIsSelected = false;
		if (this._SelectedInputIndices &&
			this._SelectedInputIndices[0] === pSectionIndex &&
			this._SelectedInputIndices[1] === pGroupIndex &&
			this._SelectedInputIndices[2] === pRowIndex &&
			this._SelectedInputIndices[3] === pInputIndex)
		{
			tmpIsSelected = true;
		}

		let tmpSelectedClass = tmpIsSelected ? ' pict-fe-input-selected' : '';

		// DataType icon
		let tmpDataTypeIconHTML = this._IconographyProvider.getDataTypeIcon(tmpType, 12);
		if (!tmpDataTypeIconHTML)
		{
			// Fallback to generic Input icon if no DataType icon
			tmpDataTypeIconHTML = this._IconographyProvider.getIcon('Input', 'Default', 12);
		}

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-input${tmpSelectedClass}" title="${tmpTooltip}"${this._buildDragAttributes('input', [pSectionIndex, pGroupIndex, pRowIndex, pInputIndex])} onclick="${tmpViewRef}.selectInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex}, ${pInputIndex})">`;
		tmpHTML += this._buildDragHandleHTML(10);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-datatype">${tmpDataTypeIconHTML}</span>`;
		tmpHTML += `<span class="pict-fe-input-ordinal">${tmpOrdinal}</span>`;
		tmpHTML += `<span class="pict-fe-input-name">${this._escapeHTML(this._truncateMiddle(tmpDisplayText, 20))}</span>`;
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger pict-fe-input-remove" onclick="event.stopPropagation(); ${tmpViewRef}.removeInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex}, ${pInputIndex})" title="Remove input">\u00D7</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Section Operations                       */
	/* -------------------------------------------------------------------------- */

	addSection()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		if (!Array.isArray(tmpManifest.Sections))
		{
			tmpManifest.Sections = [];
		}

		let tmpIndex = tmpManifest.Sections.length;
		let tmpSectionNum = tmpIndex + 1;
		let tmpSectionName = `Section ${tmpSectionNum}`;
		let tmpSectionHash = `S${tmpSectionNum}`;
		let tmpGroupName = 'Group 1';
		let tmpGroupHash = `${tmpSectionHash}_G1`;

		tmpManifest.Sections.push(
		{
			Hash: tmpSectionHash,
			Name: tmpSectionName,
			Groups:
			[
				{
					Hash: tmpGroupHash,
					Name: tmpGroupName,
					Layout: 'Record'
				}
			]
		});

		this.renderVisualEditor();
	}

	removeSection(pIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		if (pIndex >= 0 && pIndex < tmpManifest.Sections.length)
		{
			// Clean up Descriptor entries for all inputs in this section
			let tmpSection = tmpManifest.Sections[pIndex];
			this._removeDescriptorsForSection(tmpManifest, tmpSection);

			tmpManifest.Sections.splice(pIndex, 1);
			this.renderVisualEditor();
		}
	}

	moveSectionUp(pIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections) || pIndex <= 0)
		{
			return;
		}

		let tmpSection = tmpManifest.Sections.splice(pIndex, 1)[0];
		tmpManifest.Sections.splice(pIndex - 1, 0, tmpSection);
		this.renderVisualEditor();
	}

	moveSectionDown(pIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections) || pIndex >= tmpManifest.Sections.length - 1)
		{
			return;
		}

		let tmpSection = tmpManifest.Sections.splice(pIndex, 1)[0];
		tmpManifest.Sections.splice(pIndex + 1, 0, tmpSection);
		this.renderVisualEditor();
	}

	updateSectionProperty(pSectionIndex, pProperty, pValue)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (tmpSection)
		{
			let tmpOldValue = tmpSection[pProperty];
			tmpSection[pProperty] = pValue;

			// When the section Hash changes, cascade to group hashes that
			// are still auto-generated.  Auto-generated group hashes follow
			// the pattern {SectionHash}_G{...}.  If the user has overridden
			// a group hash the "_G" prefix after the old section hash will
			// no longer be present, so it is skipped.
			if (pProperty === 'Hash' && tmpOldValue !== pValue && Array.isArray(tmpSection.Groups))
			{
				let tmpOldPrefix = tmpOldValue + '_G';
				let tmpNewPrefix = pValue + '_G';
				for (let i = 0; i < tmpSection.Groups.length; i++)
				{
					let tmpGroup = tmpSection.Groups[i];
					if (tmpGroup.Hash && tmpGroup.Hash.indexOf(tmpOldPrefix) === 0)
					{
						tmpGroup.Hash = tmpNewPrefix + tmpGroup.Hash.substring(tmpOldPrefix.length);
					}
				}
			}
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Group Operations                         */
	/* -------------------------------------------------------------------------- */

	addGroup(pSectionIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection)
		{
			return;
		}

		if (!Array.isArray(tmpSection.Groups))
		{
			tmpSection.Groups = [];
		}

		let tmpIndex = tmpSection.Groups.length;
		let tmpSectionHash = tmpSection.Hash || '';
		let tmpGroupNum = tmpIndex + 1;
		let tmpGroupName = `Group ${tmpGroupNum}`;
		let tmpGroupHash = `${tmpSectionHash}_G${tmpGroupNum}`;

		tmpSection.Groups.push(
		{
			Hash: tmpGroupHash,
			Name: tmpGroupName,
			Layout: 'Record'
		});

		this.renderVisualEditor();
	}

	removeGroup(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		if (pGroupIndex >= 0 && pGroupIndex < tmpSection.Groups.length)
		{
			// Clean up Descriptor entries for all inputs in this group
			let tmpGroup = tmpSection.Groups[pGroupIndex];
			this._removeDescriptorsForGroup(tmpManifest, tmpGroup);

			tmpSection.Groups.splice(pGroupIndex, 1);
			this.renderVisualEditor();
		}
	}

	moveGroupUp(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups) || pGroupIndex <= 0)
		{
			return;
		}

		let tmpGroup = tmpSection.Groups.splice(pGroupIndex, 1)[0];
		tmpSection.Groups.splice(pGroupIndex - 1, 0, tmpGroup);
		this.renderVisualEditor();
	}

	moveGroupDown(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups) || pGroupIndex >= tmpSection.Groups.length - 1)
		{
			return;
		}

		let tmpGroup = tmpSection.Groups.splice(pGroupIndex, 1)[0];
		tmpSection.Groups.splice(pGroupIndex + 1, 0, tmpGroup);
		this.renderVisualEditor();
	}

	updateGroupProperty(pSectionIndex, pGroupIndex, pProperty, pValue)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (tmpGroup)
		{
			tmpGroup[pProperty] = pValue;
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Row Operations                           */
	/* -------------------------------------------------------------------------- */

	addRow(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup)
		{
			return;
		}

		if (!Array.isArray(tmpGroup.Rows))
		{
			tmpGroup.Rows = [];
		}

		tmpGroup.Rows.push({ Inputs: [] });

		this.renderVisualEditor();
	}

	removeRow(pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows))
		{
			return;
		}

		if (pRowIndex >= 0 && pRowIndex < tmpGroup.Rows.length)
		{
			// Clean up Descriptor entries for all inputs in this row
			let tmpRow = tmpGroup.Rows[pRowIndex];
			if (tmpRow && Array.isArray(tmpRow.Inputs) && tmpManifest.Descriptors)
			{
				for (let i = 0; i < tmpRow.Inputs.length; i++)
				{
					let tmpAddress = tmpRow.Inputs[i];
					if (typeof tmpAddress === 'string' && tmpManifest.Descriptors.hasOwnProperty(tmpAddress))
					{
						delete tmpManifest.Descriptors[tmpAddress];
					}
				}
			}

			tmpGroup.Rows.splice(pRowIndex, 1);

			// Update PictForm.Row for inputs in subsequent rows
			this._syncRowIndices(tmpManifest, tmpGroup);

			this.renderVisualEditor();
		}
	}

	moveRowUp(pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows) || pRowIndex <= 0)
		{
			return;
		}

		let tmpRow = tmpGroup.Rows.splice(pRowIndex, 1)[0];
		tmpGroup.Rows.splice(pRowIndex - 1, 0, tmpRow);

		this._syncRowIndices(tmpManifest, tmpGroup);
		this.renderVisualEditor();
	}

	moveRowDown(pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows) || pRowIndex >= tmpGroup.Rows.length - 1)
		{
			return;
		}

		let tmpRow = tmpGroup.Rows.splice(pRowIndex, 1)[0];
		tmpGroup.Rows.splice(pRowIndex + 1, 0, tmpRow);

		this._syncRowIndices(tmpManifest, tmpGroup);
		this.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Input Operations                         */
	/* -------------------------------------------------------------------------- */

	addInput(pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows))
		{
			return;
		}

		let tmpRow = tmpGroup.Rows[pRowIndex];
		if (!tmpRow)
		{
			return;
		}

		if (!Array.isArray(tmpRow.Inputs))
		{
			tmpRow.Inputs = [];
		}

		if (!tmpManifest.Descriptors || typeof tmpManifest.Descriptors !== 'object')
		{
			tmpManifest.Descriptors = {};
		}

		// Generate a unique address for this input using short format
		let tmpInputNum = tmpRow.Inputs.length + 1;
		let tmpSectionHash = tmpSection.Hash || 'S';
		let tmpGroupHash = tmpGroup.Hash || 'G';
		let tmpRowNum = pRowIndex + 1;
		let tmpInputHash = `${tmpGroupHash}_R${tmpRowNum}_Input${tmpInputNum}`;
		let tmpAddress = tmpInputHash;

		// Ensure the address is unique in the Descriptors
		while (tmpManifest.Descriptors.hasOwnProperty(tmpAddress))
		{
			tmpInputNum++;
			tmpInputHash = `${tmpGroupHash}_R${tmpRowNum}_Input${tmpInputNum}`;
			tmpAddress = tmpInputHash;
		}

		let tmpInputName = `Input ${tmpInputNum}`;

		// Create the Descriptor entry
		tmpManifest.Descriptors[tmpAddress] =
		{
			Name: tmpInputName,
			Hash: tmpInputHash,
			DataType: 'String',
			PictForm:
			{
				Section: tmpSectionHash,
				Group: tmpGroupHash,
				Row: tmpRowNum
			}
		};

		// Store the Address reference in the row's Inputs array
		tmpRow.Inputs.push(tmpAddress);

		this.renderVisualEditor();
	}

	removeInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return;
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows))
		{
			return;
		}

		let tmpRow = tmpGroup.Rows[pRowIndex];
		if (!tmpRow || !Array.isArray(tmpRow.Inputs))
		{
			return;
		}

		if (pInputIndex >= 0 && pInputIndex < tmpRow.Inputs.length)
		{
			// Remove the corresponding Descriptor entry
			let tmpAddress = tmpRow.Inputs[pInputIndex];
			if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors.hasOwnProperty(tmpAddress))
			{
				delete tmpManifest.Descriptors[tmpAddress];
			}

			tmpRow.Inputs.splice(pInputIndex, 1);
			this.renderVisualEditor();
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Input Selection & Display                */
	/* -------------------------------------------------------------------------- */

	/**
	 * Select an input to open it in the properties panel.
	 *
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group
	 * @param {number} pRowIndex - Index of the row
	 * @param {number} pInputIndex - Index of the input within the row
	 */
	selectInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		this._SelectedInputIndices = [pSectionIndex, pGroupIndex, pRowIndex, pInputIndex];

		if (this._PropertiesPanelView)
		{
			this._PropertiesPanelView.selectInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex);
		}

		this.renderVisualEditor();
	}

	/**
	 * Deselect the current input and close the properties panel.
	 */
	deselectInput()
	{
		this._SelectedInputIndices = null;

		if (this._PropertiesPanelView)
		{
			this._PropertiesPanelView.deselectInput();
		}

		this.renderVisualEditor();
	}

	/**
	 * Set the input display mode for all input cards.
	 *
	 * @param {string} pMode - 'name' or 'hash'
	 */
	setInputDisplayMode(pMode)
	{
		if (pMode === 'name' || pMode === 'hash')
		{
			this._InputDisplayMode = pMode;
			this.renderVisualEditor();
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Drag and Drop                            */
	/* -------------------------------------------------------------------------- */

	/**
	 * Enable or disable drag-and-drop reordering.
	 *
	 * When enabled, drag handles and HTML5 drag attributes are added to sections,
	 * groups, rows, and inputs.  When disabled, all drag hooks are removed from
	 * the DOM.  Disabled by default.
	 *
	 * @param {boolean} pEnabled - true to enable, false to disable
	 */
	setDragAndDropEnabled(pEnabled)
	{
		this._DragAndDropEnabled = !!pEnabled;
		this._DragState = null;
		this.renderVisualEditor();
	}

	onDragStart(pEvent, pType, pIndex0, pIndex1, pIndex2, pIndex3)
	{
		if (!this._DragAndDropEnabled)
		{
			return;
		}

		// Stop propagation so nested draggable parents don't overwrite _DragState
		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		this._DragState =
		{
			Type: pType,
			Indices: [pIndex0, pIndex1, pIndex2, pIndex3].filter((pVal) => { return typeof pVal === 'number'; })
		};

		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.effectAllowed = 'move';
			// Required for Firefox
			pEvent.dataTransfer.setData('text/plain', '');
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.add('pict-fe-dragging');
		}
	}

	onDragOver(pEvent, pType, pIndex0, pIndex1, pIndex2, pIndex3)
	{
		if (!this._DragAndDropEnabled || !this._DragState)
		{
			return;
		}

		// Only allow drops of the same type
		if (this._DragState.Type !== pType)
		{
			return;
		}

		// Stop propagation so parent containers don't also highlight
		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		pEvent.preventDefault();
		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.dropEffect = 'move';
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.add('pict-fe-drag-over');
		}
	}

	onDragLeave(pEvent)
	{
		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-drag-over');
		}
	}

	onDrop(pEvent, pType, pIndex0, pIndex1, pIndex2, pIndex3)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
			if (pEvent.stopPropagation)
			{
				pEvent.stopPropagation();
			}
		}

		if (!this._DragAndDropEnabled || !this._DragState || this._DragState.Type !== pType)
		{
			this._DragState = null;
			return;
		}

		let tmpTargetIndices = [pIndex0, pIndex1, pIndex2, pIndex3].filter((pVal) => { return typeof pVal === 'number'; });
		let tmpSourceIndices = this._DragState.Indices;
		this._DragState = null;

		// Check if source and target are identical
		if (tmpSourceIndices.length === tmpTargetIndices.length && tmpSourceIndices.every((pVal, pIdx) => { return pVal === tmpTargetIndices[pIdx]; }))
		{
			return;
		}

		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		switch (pType)
		{
			case 'section':
			{
				let tmpFromIdx = tmpSourceIndices[0];
				let tmpToIdx = tmpTargetIndices[0];
				if (tmpFromIdx === tmpToIdx)
				{
					return;
				}
				let tmpItem = tmpManifest.Sections.splice(tmpFromIdx, 1)[0];
				tmpManifest.Sections.splice(tmpToIdx, 0, tmpItem);
				break;
			}
			case 'group':
			{
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpTargetIndices[0]];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection)
				{
					return;
				}
				if (!Array.isArray(tmpTargetSection.Groups))
				{
					tmpTargetSection.Groups = [];
				}

				let tmpItem = tmpSourceSection.Groups.splice(tmpSourceIndices[1], 1)[0];

				// If moving within the same section and target index is after source,
				// adjust for the removal
				let tmpInsertIdx = tmpTargetIndices[1];
				if (tmpSourceIndices[0] === tmpTargetIndices[0] && tmpSourceIndices[1] < tmpTargetIndices[1])
				{
					tmpInsertIdx--;
				}
				tmpTargetSection.Groups.splice(tmpInsertIdx, 0, tmpItem);
				break;
			}
			case 'row':
			{
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpTargetIndices[0]];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection || !Array.isArray(tmpTargetSection.Groups))
				{
					return;
				}
				let tmpSourceGroup = tmpSourceSection.Groups[tmpSourceIndices[1]];
				let tmpTargetGroup = tmpTargetSection.Groups[tmpTargetIndices[1]];
				if (!tmpSourceGroup || !Array.isArray(tmpSourceGroup.Rows) || !tmpTargetGroup)
				{
					return;
				}
				if (!Array.isArray(tmpTargetGroup.Rows))
				{
					tmpTargetGroup.Rows = [];
				}

				let tmpItem = tmpSourceGroup.Rows.splice(tmpSourceIndices[2], 1)[0];

				let tmpInsertIdx = tmpTargetIndices[2];
				let tmpSameContainer = (tmpSourceIndices[0] === tmpTargetIndices[0]) && (tmpSourceIndices[1] === tmpTargetIndices[1]);
				if (tmpSameContainer && tmpSourceIndices[2] < tmpTargetIndices[2])
				{
					tmpInsertIdx--;
				}
				tmpTargetGroup.Rows.splice(tmpInsertIdx, 0, tmpItem);

				// Sync row indices on both source and target groups
				this._syncRowIndices(tmpManifest, tmpSourceGroup);
				if (!tmpSameContainer)
				{
					this._syncRowIndices(tmpManifest, tmpTargetGroup);
				}
				break;
			}
			case 'input':
			{
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpTargetIndices[0]];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection || !Array.isArray(tmpTargetSection.Groups))
				{
					return;
				}
				let tmpSourceGroup = tmpSourceSection.Groups[tmpSourceIndices[1]];
				let tmpTargetGroup = tmpTargetSection.Groups[tmpTargetIndices[1]];
				if (!tmpSourceGroup || !Array.isArray(tmpSourceGroup.Rows) || !tmpTargetGroup || !Array.isArray(tmpTargetGroup.Rows))
				{
					return;
				}
				let tmpSourceRow = tmpSourceGroup.Rows[tmpSourceIndices[2]];
				let tmpTargetRow = tmpTargetGroup.Rows[tmpTargetIndices[2]];
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs) || !tmpTargetRow)
				{
					return;
				}
				if (!Array.isArray(tmpTargetRow.Inputs))
				{
					tmpTargetRow.Inputs = [];
				}

				let tmpAddress = tmpSourceRow.Inputs.splice(tmpSourceIndices[3], 1)[0];

				let tmpInsertIdx = tmpTargetIndices[3];
				let tmpSameContainer = (tmpSourceIndices[0] === tmpTargetIndices[0]) && (tmpSourceIndices[1] === tmpTargetIndices[1]) && (tmpSourceIndices[2] === tmpTargetIndices[2]);
				if (tmpSameContainer && tmpSourceIndices[3] < tmpTargetIndices[3])
				{
					tmpInsertIdx--;
				}
				tmpTargetRow.Inputs.splice(tmpInsertIdx, 0, tmpAddress);

				// Update the Descriptor's PictForm metadata for the new location
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
					if (!tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm = {};
					}
					tmpDescriptor.PictForm.Section = tmpTargetSection.Hash || '';
					tmpDescriptor.PictForm.Group = tmpTargetGroup.Hash || '';
					tmpDescriptor.PictForm.Row = tmpTargetIndices[2] + 1;
				}
				break;
			}
			default:
				return;
		}

		this.renderVisualEditor();
	}

	onDragEnd(pEvent)
	{
		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-dragging');
		}

		this._DragState = null;

		// Clean up any leftover drag-over highlights
		let tmpContainer = this.pict.ContentAssignment.getElement(`#FormEditor-Panel-Visual-${this.Hash}`);
		if (tmpContainer && tmpContainer[0])
		{
			let tmpHighlighted = tmpContainer[0].querySelectorAll('.pict-fe-drag-over');
			for (let i = 0; i < tmpHighlighted.length; i++)
			{
				tmpHighlighted[i].classList.remove('pict-fe-drag-over');
			}
		}
	}

	/**
	 * Check whether two index arrays share the same parent container.
	 * Utility method — cross-container moves are allowed so this is
	 * not used as a gate in onDragOver/onDrop, but it remains available
	 * for callers that need to distinguish same-container vs cross-container moves.
	 */
	_dragIndicesShareParent(pSourceIndices, pTargetIndices)
	{
		if (pSourceIndices.length !== pTargetIndices.length)
		{
			return false;
		}

		// Compare all indices except the last one (which is the item's own position)
		for (let i = 0; i < pSourceIndices.length - 1; i++)
		{
			if (pSourceIndices[i] !== pTargetIndices[i])
			{
				return false;
			}
		}
		return true;
	}

	/**
	 * Build the drag attribute string for a container element.
	 * Returns an empty string when drag-and-drop is disabled.
	 */
	_buildDragAttributes(pType, pIndices)
	{
		if (!this._DragAndDropEnabled)
		{
			return '';
		}

		let tmpViewRef = this._browserViewRef();
		let tmpArgs = pIndices.join(', ');

		return ` draggable="true"` +
			` ondragstart="${tmpViewRef}.onDragStart(event, '${pType}', ${tmpArgs})"` +
			` ondragover="${tmpViewRef}.onDragOver(event, '${pType}', ${tmpArgs})"` +
			` ondragleave="${tmpViewRef}.onDragLeave(event)"` +
			` ondrop="${tmpViewRef}.onDrop(event, '${pType}', ${tmpArgs})"` +
			` ondragend="${tmpViewRef}.onDragEnd(event)"`;
	}

	/**
	 * Build drag attributes for a container element that accepts child drops.
	 * When a child type is dropped on the container (rather than on a specific
	 * sibling), the item is appended to the end of the container's array.
	 *
	 * @param {string} pChildType - The type of child items this container accepts ('group', 'row', 'input')
	 * @param {Array} pContainerIndices - Indices identifying the parent container
	 */
	_buildContainerDropAttributes(pChildType, pContainerIndices)
	{
		if (!this._DragAndDropEnabled)
		{
			return '';
		}

		let tmpViewRef = this._browserViewRef();
		let tmpArgs = pContainerIndices.join(', ');

		return ` ondragover="${tmpViewRef}.onContainerDragOver(event, '${pChildType}')"` +
			` ondragleave="${tmpViewRef}.onDragLeave(event)"` +
			` ondrop="${tmpViewRef}.onContainerDrop(event, '${pChildType}', ${tmpArgs})"`;
	}

	onContainerDragOver(pEvent, pChildType)
	{
		if (!this._DragAndDropEnabled || !this._DragState)
		{
			return;
		}

		if (this._DragState.Type !== pChildType)
		{
			return;
		}

		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		pEvent.preventDefault();
		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.dropEffect = 'move';
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.add('pict-fe-drag-over');
		}
	}

	onContainerDrop(pEvent, pChildType, pIndex0, pIndex1, pIndex2)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
			if (pEvent.stopPropagation)
			{
				pEvent.stopPropagation();
			}
		}

		if (!this._DragAndDropEnabled || !this._DragState || this._DragState.Type !== pChildType)
		{
			this._DragState = null;
			return;
		}

		let tmpContainerIndices = [pIndex0, pIndex1, pIndex2].filter((pVal) => { return typeof pVal === 'number'; });
		let tmpSourceIndices = this._DragState.Indices;
		this._DragState = null;

		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		switch (pChildType)
		{
			case 'group':
			{
				// Container is a section; indices = [sectionIndex]
				let tmpTargetSectionIdx = tmpContainerIndices[0];
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpTargetSectionIdx];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection)
				{
					return;
				}
				if (!Array.isArray(tmpTargetSection.Groups))
				{
					tmpTargetSection.Groups = [];
				}

				let tmpItem = tmpSourceSection.Groups.splice(tmpSourceIndices[1], 1)[0];
				tmpTargetSection.Groups.push(tmpItem);
				break;
			}
			case 'row':
			{
				// Container is a group; indices = [sectionIndex, groupIndex]
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpContainerIndices[0]];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection || !Array.isArray(tmpTargetSection.Groups))
				{
					return;
				}
				let tmpSourceGroup = tmpSourceSection.Groups[tmpSourceIndices[1]];
				let tmpTargetGroup = tmpTargetSection.Groups[tmpContainerIndices[1]];
				if (!tmpSourceGroup || !Array.isArray(tmpSourceGroup.Rows) || !tmpTargetGroup)
				{
					return;
				}
				if (!Array.isArray(tmpTargetGroup.Rows))
				{
					tmpTargetGroup.Rows = [];
				}

				let tmpItem = tmpSourceGroup.Rows.splice(tmpSourceIndices[2], 1)[0];
				tmpTargetGroup.Rows.push(tmpItem);

				this._syncRowIndices(tmpManifest, tmpSourceGroup);
				if (tmpSourceGroup !== tmpTargetGroup)
				{
					this._syncRowIndices(tmpManifest, tmpTargetGroup);
				}
				break;
			}
			case 'input':
			{
				// Container is a row; indices = [sectionIndex, groupIndex, rowIndex]
				let tmpSourceSection = tmpManifest.Sections[tmpSourceIndices[0]];
				let tmpTargetSection = tmpManifest.Sections[tmpContainerIndices[0]];
				if (!tmpSourceSection || !Array.isArray(tmpSourceSection.Groups) || !tmpTargetSection || !Array.isArray(tmpTargetSection.Groups))
				{
					return;
				}
				let tmpSourceGroup = tmpSourceSection.Groups[tmpSourceIndices[1]];
				let tmpTargetGroup = tmpTargetSection.Groups[tmpContainerIndices[1]];
				if (!tmpSourceGroup || !Array.isArray(tmpSourceGroup.Rows) || !tmpTargetGroup || !Array.isArray(tmpTargetGroup.Rows))
				{
					return;
				}
				let tmpSourceRow = tmpSourceGroup.Rows[tmpSourceIndices[2]];
				let tmpTargetRow = tmpTargetGroup.Rows[tmpContainerIndices[2]];
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs) || !tmpTargetRow)
				{
					return;
				}
				if (!Array.isArray(tmpTargetRow.Inputs))
				{
					tmpTargetRow.Inputs = [];
				}

				let tmpAddress = tmpSourceRow.Inputs.splice(tmpSourceIndices[3], 1)[0];
				tmpTargetRow.Inputs.push(tmpAddress);

				// Update Descriptor metadata
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
					if (!tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm = {};
					}
					tmpDescriptor.PictForm.Section = tmpTargetSection.Hash || '';
					tmpDescriptor.PictForm.Group = tmpTargetGroup.Hash || '';
					tmpDescriptor.PictForm.Row = tmpContainerIndices[2] + 1;
				}
				break;
			}
			default:
				return;
		}

		this.renderVisualEditor();
	}

	/**
	 * Build the drag handle HTML for a container element.
	 * Returns an empty string when drag-and-drop is disabled.
	 */
	_buildDragHandleHTML(pSize)
	{
		if (!this._DragAndDropEnabled)
		{
			return '';
		}

		return `<span class="pict-fe-drag-handle">${this._IconographyProvider.getIcon('Action', 'DragHandle', pSize || 12)}</span>`;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Inline Editing                           */
	/* -------------------------------------------------------------------------- */

	/**
	 * Begin inline editing of a Section or Group property (Name or Hash).
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group (-1 for section properties)
	 * @param {string} pProperty - 'Name' or 'Hash'
	 */
	beginEditProperty(pType, pSectionIndex, pGroupIndex, pProperty)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();

		// Build the element ID that matches what we rendered
		let tmpElementId = '';
		if (pType === 'Section')
		{
			tmpElementId = `FormEditor-Section${pProperty}-${tmpHash}-${pSectionIndex}`;
		}
		else
		{
			tmpElementId = `FormEditor-Group${pProperty}-${tmpHash}-${pSectionIndex}-${pGroupIndex}`;
		}

		// Get the current value
		let tmpManifest = this._resolveManifestData();
		let tmpCurrentValue = '';
		if (pType === 'Section' && tmpManifest && tmpManifest.Sections && tmpManifest.Sections[pSectionIndex])
		{
			tmpCurrentValue = tmpManifest.Sections[pSectionIndex][pProperty] || '';
		}
		else if (pType === 'Group' && tmpManifest && tmpManifest.Sections && tmpManifest.Sections[pSectionIndex] && tmpManifest.Sections[pSectionIndex].Groups && tmpManifest.Sections[pSectionIndex].Groups[pGroupIndex])
		{
			tmpCurrentValue = tmpManifest.Sections[pSectionIndex].Groups[pGroupIndex][pProperty] || '';
		}

		// Replace the span with an inline editor
		let tmpEditorHTML = '';

		if (pProperty === 'Layout')
		{
			// Layout uses a select dropdown
			// onclick stopPropagation prevents the parent span's onclick from re-calling beginEditProperty
			let tmpLayouts = ['Record', 'Tabular'];
			let tmpCommitCall = `${tmpViewRef}.commitEditProperty('${pType}', ${pSectionIndex}, ${pGroupIndex}, '${pProperty}')`;
			tmpEditorHTML += `<select class="pict-fe-inline-edit-select" id="${tmpElementId}-Input" onclick="event.stopPropagation()" onchange="${tmpCommitCall}" onblur="setTimeout(function(){${tmpCommitCall}},150)" onkeydown="if(event.key==='Escape'){this.dataset.cancelled='true';this.blur();}">`;
			for (let i = 0; i < tmpLayouts.length; i++)
			{
				let tmpSelected = (tmpLayouts[i] === tmpCurrentValue) ? ' selected' : '';
				tmpEditorHTML += `<option value="${tmpLayouts[i]}"${tmpSelected}>${tmpLayouts[i]}</option>`;
			}
			tmpEditorHTML += '</select>';
		}
		else
		{
			// Name and Hash use a text input
			// onclick stopPropagation prevents the parent span's onclick from re-calling beginEditProperty
			let tmpHashClass = (pProperty === 'Hash') ? ' pict-fe-inline-edit-hash' : '';
			tmpEditorHTML += `<input class="pict-fe-inline-edit-input${tmpHashClass}" id="${tmpElementId}-Input" type="text" value="${this._escapeAttr(tmpCurrentValue)}" onclick="event.stopPropagation()" onblur="${tmpViewRef}.commitEditProperty('${pType}', ${pSectionIndex}, ${pGroupIndex}, '${pProperty}')" onkeydown="if(event.key==='Enter'){this.blur();}if(event.key==='Escape'){this.dataset.cancelled='true';this.blur();}" />`;
		}

		this.pict.ContentAssignment.assignContent(`#${tmpElementId}`, tmpEditorHTML);

		// Focus the editor
		let tmpInputSet = this.pict.ContentAssignment.getElement(`#${tmpElementId}-Input`);
		let tmpInput = (Array.isArray(tmpInputSet) && tmpInputSet.length > 0) ? tmpInputSet[0] : tmpInputSet;
		if (tmpInput && tmpInput.focus)
		{
			tmpInput.focus();
			if (tmpInput.select)
			{
				tmpInput.select();
			}
		}
	}

	/**
	 * Commit the inline edit, updating the property and re-rendering.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group (-1 for section properties)
	 * @param {string} pProperty - 'Name' or 'Hash'
	 */
	commitEditProperty(pType, pSectionIndex, pGroupIndex, pProperty)
	{
		let tmpHash = this.Hash;

		let tmpElementId = '';
		if (pType === 'Section')
		{
			tmpElementId = `FormEditor-Section${pProperty}-${tmpHash}-${pSectionIndex}`;
		}
		else
		{
			tmpElementId = `FormEditor-Group${pProperty}-${tmpHash}-${pSectionIndex}-${pGroupIndex}`;
		}

		let tmpInputSet = this.pict.ContentAssignment.getElement(`#${tmpElementId}-Input`);
		let tmpInput = (Array.isArray(tmpInputSet) && tmpInputSet.length > 0) ? tmpInputSet[0] : tmpInputSet;

		if (!tmpInput || tmpInput.value === undefined)
		{
			// Element already gone from a previous commit; nothing to do
			return;
		}

		// Guard against double-commit (onchange + onblur on selects)
		if (tmpInput.dataset && tmpInput.dataset.committed === 'true')
		{
			return;
		}

		// Check if the edit was cancelled via Escape
		if (tmpInput.dataset && tmpInput.dataset.cancelled === 'true')
		{
			this.renderVisualEditor();
			return;
		}

		// Mark as committed so a second call is a no-op
		if (tmpInput.dataset)
		{
			tmpInput.dataset.committed = 'true';
		}

		let tmpNewValue = tmpInput.value;

		if (pType === 'Section')
		{
			// Capture the old hash before updating, so we can detect
			// whether the hash was auto-generated.
			let tmpOldHash = null;
			if (pProperty === 'Name')
			{
				let tmpSection = this._resolveManifestData().Sections[pSectionIndex];
				if (tmpSection)
				{
					tmpOldHash = tmpSection.Hash || '';
				}
			}

			this.updateSectionProperty(pSectionIndex, pProperty, tmpNewValue);

			// When the user edits the Name, auto-generate the Hash if the
			// current hash still matches the auto-generated format (S{n}).
			// If the user has manually overridden the hash it will no
			// longer match and we leave it alone.
			if (pProperty === 'Name' && tmpOldHash !== null)
			{
				if (this._isAutoGeneratedSectionHash(tmpOldHash))
				{
					let tmpAutoHash = this.sanitizeObjectKey(tmpNewValue);
					this.updateSectionProperty(pSectionIndex, 'Hash', tmpAutoHash);
				}
			}
		}
		else
		{
			this.updateGroupProperty(pSectionIndex, pGroupIndex, pProperty, tmpNewValue);

			// When the user edits the Name, auto-generate the Hash if it
			// still follows the auto-generated pattern ({SectionHash}_G...).
			if (pProperty === 'Name')
			{
				let tmpManifest = this._resolveManifestData();
				let tmpSection = tmpManifest.Sections[pSectionIndex];
				let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[pGroupIndex] : null;
				if (tmpGroup)
				{
					let tmpSectionHash = tmpSection.Hash || '';
					let tmpAutoPrefix = tmpSectionHash + '_G';
					if (tmpGroup.Hash && tmpGroup.Hash.indexOf(tmpAutoPrefix) === 0)
					{
						let tmpAutoHash = tmpAutoPrefix + this.sanitizeObjectKey(tmpNewValue);
						this.updateGroupProperty(pSectionIndex, pGroupIndex, 'Hash', tmpAutoHash);
					}
				}
			}
		}

		this.renderVisualEditor();
	}

	/**
	 * Begin inline editing of an Input's DataType via a select dropdown.
	 *
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group
	 * @param {number} pRowIndex - Index of the row
	 * @param {number} pInputIndex - Index of the input within the row
	 */
	beginEditInputDataType(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();
		let tmpElementId = `FormEditor-InputType-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${pInputIndex}`;

		// Resolve the current DataType from the Descriptor
		let tmpManifest = this._resolveManifestData();
		let tmpCurrentValue = 'String';
		if (tmpManifest && tmpManifest.Sections)
		{
			let tmpSection = tmpManifest.Sections[pSectionIndex];
			let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[pGroupIndex] : null;
			let tmpRow = tmpGroup && tmpGroup.Rows ? tmpGroup.Rows[pRowIndex] : null;
			if (tmpRow && Array.isArray(tmpRow.Inputs))
			{
				let tmpAddress = tmpRow.Inputs[pInputIndex];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					tmpCurrentValue = tmpManifest.Descriptors[tmpAddress].DataType || 'String';
				}
			}
		}

		let tmpCommitCall = `${tmpViewRef}.commitEditInputDataType(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex}, ${pInputIndex})`;
		let tmpEditorHTML = `<select class="pict-fe-inline-edit-select" id="${tmpElementId}-Input" onclick="event.stopPropagation()" onchange="${tmpCommitCall}" onblur="setTimeout(function(){${tmpCommitCall}},150)" onkeydown="if(event.key==='Escape'){this.dataset.cancelled='true';this.blur();}">`;
		for (let i = 0; i < this._ManyfestDataTypes.length; i++)
		{
			let tmpSelected = (this._ManyfestDataTypes[i] === tmpCurrentValue) ? ' selected' : '';
			tmpEditorHTML += `<option value="${this._ManyfestDataTypes[i]}"${tmpSelected}>${this._ManyfestDataTypes[i]}</option>`;
		}
		tmpEditorHTML += '</select>';

		this.pict.ContentAssignment.assignContent(`#${tmpElementId}`, tmpEditorHTML);

		// Focus the select
		let tmpInputSet = this.pict.ContentAssignment.getElement(`#${tmpElementId}-Input`);
		let tmpInput = (Array.isArray(tmpInputSet) && tmpInputSet.length > 0) ? tmpInputSet[0] : tmpInputSet;
		if (tmpInput && tmpInput.focus)
		{
			tmpInput.focus();
		}
	}

	/**
	 * Commit the inline DataType edit, updating the Descriptor and re-rendering.
	 *
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group
	 * @param {number} pRowIndex - Index of the row
	 * @param {number} pInputIndex - Index of the input within the row
	 */
	commitEditInputDataType(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpHash = this.Hash;
		let tmpElementId = `FormEditor-InputType-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${pInputIndex}`;

		let tmpInputSet = this.pict.ContentAssignment.getElement(`#${tmpElementId}-Input`);
		let tmpInput = (Array.isArray(tmpInputSet) && tmpInputSet.length > 0) ? tmpInputSet[0] : tmpInputSet;

		if (!tmpInput || tmpInput.value === undefined)
		{
			return;
		}

		// Guard against double-commit
		if (tmpInput.dataset && tmpInput.dataset.committed === 'true')
		{
			return;
		}

		// Check if cancelled via Escape
		if (tmpInput.dataset && tmpInput.dataset.cancelled === 'true')
		{
			this.renderVisualEditor();
			return;
		}

		if (tmpInput.dataset)
		{
			tmpInput.dataset.committed = 'true';
		}

		let tmpNewValue = tmpInput.value;

		// Update the Descriptor's DataType
		let tmpManifest = this._resolveManifestData();
		if (tmpManifest && tmpManifest.Sections)
		{
			let tmpSection = tmpManifest.Sections[pSectionIndex];
			let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[pGroupIndex] : null;
			let tmpRow = tmpGroup && tmpGroup.Rows ? tmpGroup.Rows[pRowIndex] : null;
			if (tmpRow && Array.isArray(tmpRow.Inputs))
			{
				let tmpAddress = tmpRow.Inputs[pInputIndex];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					tmpManifest.Descriptors[tmpAddress].DataType = tmpNewValue;
				}
			}
		}

		this.renderVisualEditor();
	}

	/**
	 * Open the floating InputType picker for an Input.
	 *
	 * Renders a categorized, searchable panel anchored near the InputType chip.
	 * The first option is always "DataType Default" which clears the InputType.
	 *
	 * @param {number} pSectionIndex - Index of the section
	 * @param {number} pGroupIndex - Index of the group
	 * @param {number} pRowIndex - Index of the row
	 * @param {number} pInputIndex - Index of the input within the row
	 */
	beginEditInputType(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		// Close any existing picker first
		this.closeInputTypePicker();

		// Resolve the current InputType from the Descriptor's PictForm
		let tmpManifest = this._resolveManifestData();
		let tmpCurrentValue = '';
		if (tmpManifest && tmpManifest.Sections)
		{
			let tmpSection = tmpManifest.Sections[pSectionIndex];
			let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[pGroupIndex] : null;
			let tmpRow = tmpGroup && tmpGroup.Rows ? tmpGroup.Rows[pRowIndex] : null;
			if (tmpRow && Array.isArray(tmpRow.Inputs))
			{
				let tmpAddress = tmpRow.Inputs[pInputIndex];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
					if (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType)
					{
						tmpCurrentValue = tmpDescriptor.PictForm.InputType;
					}
				}
			}
		}

		// Store the current edit context so commitEditInputType can use it
		this._InputTypePickerContext =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			RowIndex: pRowIndex,
			InputIndex: pInputIndex,
			CurrentValue: tmpCurrentValue
		};

		// Build the picker HTML
		let tmpPickerHTML = this._renderInputTypePicker(tmpCurrentValue, '');

		// Get the chip element to position the picker near it
		let tmpChipElementId = `FormEditor-InputInputType-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${pInputIndex}`;

		// Append overlay + picker to document.body so they are not clipped
		// by the form editor container's overflow:hidden.
		if (typeof document !== 'undefined')
		{
			// Create the full-viewport overlay to catch dismiss clicks
			let tmpOverlay = document.createElement('div');
			tmpOverlay.id = tmpPickerId + '-Overlay';
			tmpOverlay.className = 'pict-fe-inputtype-overlay';
			tmpOverlay.onclick = function() { eval(tmpViewRef + '.closeInputTypePicker()'); };
			// Prevent scroll events on the overlay from reaching the page
			tmpOverlay.addEventListener('wheel', function(pEvent) { pEvent.preventDefault(); }, { passive: false });

			let tmpPickerContainer = document.createElement('div');
			tmpPickerContainer.id = tmpPickerId;
			tmpPickerContainer.className = 'pict-fe-inputtype-picker';
			tmpPickerContainer.innerHTML = tmpPickerHTML;
			tmpPickerContainer.onclick = function(e) { e.stopPropagation(); };
			// Contain scroll within the picker — allow internal scrolling but
			// prevent scroll chaining to the page when at top/bottom boundary
			tmpPickerContainer.addEventListener('wheel', function(pEvent)
			{
				pEvent.stopPropagation();
				// Find the scrollable categories list inside the picker
				let tmpScrollable = tmpPickerContainer.querySelector('.pict-fe-inputtype-picker-categories');
				if (!tmpScrollable)
				{
					pEvent.preventDefault();
					return;
				}
				let tmpAtTop = (tmpScrollable.scrollTop <= 0) && (pEvent.deltaY < 0);
				let tmpAtBottom = (tmpScrollable.scrollTop + tmpScrollable.clientHeight >= tmpScrollable.scrollHeight) && (pEvent.deltaY > 0);
				if (tmpAtTop || tmpAtBottom)
				{
					pEvent.preventDefault();
				}
			}, { passive: false });

			tmpOverlay.appendChild(tmpPickerContainer);
			document.body.appendChild(tmpOverlay);

			// Position the picker using fixed viewport coordinates
			// anchored below the InputType chip (or properties panel button as fallback)
			let tmpAnchorEl = document.getElementById(tmpChipElementId);
			// If the inline chip doesn't exist (e.g. picker opened from properties panel), use the panel button
			if (!tmpAnchorEl)
			{
				tmpAnchorEl = document.getElementById(`FormEditor-PropsInputTypeBtn-${tmpHash}`);
			}
			if (tmpAnchorEl && tmpAnchorEl.getBoundingClientRect)
			{
				let tmpAnchorRect = tmpAnchorEl.getBoundingClientRect();

				tmpPickerContainer.style.position = 'fixed';
				tmpPickerContainer.style.top = (tmpAnchorRect.bottom + 4) + 'px';
				tmpPickerContainer.style.left = tmpAnchorRect.left + 'px';

				// If the picker would overflow the right edge of the viewport,
				// nudge it left
				let tmpPickerWidth = 340;
				if (tmpAnchorRect.left + tmpPickerWidth > window.innerWidth)
				{
					tmpPickerContainer.style.left = Math.max(8, window.innerWidth - tmpPickerWidth - 8) + 'px';
				}

				// If the picker would overflow the bottom of the viewport,
				// open it upward instead
				let tmpPickerMaxHeight = 420;
				if (tmpAnchorRect.bottom + 4 + tmpPickerMaxHeight > window.innerHeight)
				{
					tmpPickerContainer.style.top = '';
					tmpPickerContainer.style.bottom = (window.innerHeight - tmpAnchorRect.top + 4) + 'px';
				}
			}

			// Focus the search input
			let tmpSearchSet = this.pict.ContentAssignment.getElement(`#${tmpPickerId}-Search`);
			let tmpSearch = (Array.isArray(tmpSearchSet) && tmpSearchSet.length > 0) ? tmpSearchSet[0] : tmpSearchSet;
			if (tmpSearch && tmpSearch.focus)
			{
				tmpSearch.focus();
			}
		}
	}

	/**
	 * Render the inner HTML of the InputType picker panel.
	 *
	 * @param {string} pCurrentValue - The currently selected InputType Hash (empty for default)
	 * @param {string} pSearchQuery - Current search/filter text
	 * @return {string} The picker innerHTML
	 */
	_renderInputTypePicker(pCurrentValue, pSearchQuery)
	{
		let tmpHash = this.Hash;
		let tmpViewRef = this._browserViewRef();
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		let tmpHTML = '';

		// Search bar
		tmpHTML += '<div class="pict-fe-inputtype-picker-search">';
		tmpHTML += `<input type="text" class="pict-fe-inputtype-picker-search-input" id="${tmpPickerId}-Search" placeholder="Search input types\u2026" value="${this._escapeAttr(pSearchQuery)}" oninput="${tmpViewRef}._onInputTypePickerSearch(this.value)" onkeydown="if(event.key==='Escape'){${tmpViewRef}.closeInputTypePicker();}" />`;
		tmpHTML += '</div>';

		// Filter definitions by search query
		let tmpDefinitions = this._filterInputTypeDefinitions(pSearchQuery);

		// Separate prominent items from the rest
		let tmpProminentItems = [];
		let tmpRemainingItems = [];
		for (let i = 0; i < tmpDefinitions.length; i++)
		{
			if (tmpDefinitions[i].Prominent)
			{
				tmpProminentItems.push(tmpDefinitions[i]);
			}
			else
			{
				tmpRemainingItems.push(tmpDefinitions[i]);
			}
		}

		// --- Common section: DataType Default + prominent items ---
		tmpHTML += '<div class="pict-fe-inputtype-picker-default">';

		// DataType Default is always shown (not affected by search)
		let tmpDefaultActive = (pCurrentValue === '') ? ' pict-fe-inputtype-picker-item-active' : '';
		tmpHTML += `<div class="pict-fe-inputtype-picker-item${tmpDefaultActive}" onclick="${tmpViewRef}.commitEditInputType('')">`;
		tmpHTML += '<div class="pict-fe-inputtype-picker-item-name">DataType Default</div>';
		tmpHTML += '<div class="pict-fe-inputtype-picker-item-desc">Use the default template for this DataType</div>';
		tmpHTML += '</div>';

		// Prominent items appear right after DataType Default
		for (let p = 0; p < tmpProminentItems.length; p++)
		{
			let tmpDef = tmpProminentItems[p];
			let tmpActive = (tmpDef.Hash === pCurrentValue) ? ' pict-fe-inputtype-picker-item-active' : '';
			let tmpPickerIcon = this._IconographyProvider.getInputTypeIcon(tmpDef.Hash, 16);

			tmpHTML += `<div class="pict-fe-inputtype-picker-item${tmpActive}" onclick="${tmpViewRef}.commitEditInputType('${this._escapeAttr(tmpDef.Hash)}')">`;
			tmpHTML += `<div class="pict-fe-inputtype-picker-item-name">${tmpPickerIcon ? '<span class="pict-fe-icon pict-fe-icon-picker">' + tmpPickerIcon + '</span>' : ''}${this._escapeHTML(tmpDef.Name || tmpDef.Hash)}</div>`;
			if (tmpDef.Description)
			{
				tmpHTML += `<div class="pict-fe-inputtype-picker-item-desc">${this._escapeHTML(tmpDef.Description)}</div>`;
			}
			tmpHTML += '</div>';
		}

		tmpHTML += '</div>';

		// --- Categorized section: all non-prominent items ---
		let tmpCategories = [];
		let tmpCategorySeen = {};
		let tmpCategoryItems = {};

		for (let i = 0; i < tmpRemainingItems.length; i++)
		{
			let tmpDef = tmpRemainingItems[i];
			let tmpCategory = tmpDef.Category || 'Other';

			if (!tmpCategorySeen[tmpCategory])
			{
				tmpCategorySeen[tmpCategory] = true;
				tmpCategories.push(tmpCategory);
				tmpCategoryItems[tmpCategory] = [];
			}
			tmpCategoryItems[tmpCategory].push(tmpDef);
		}

		if (tmpCategories.length === 0 && tmpProminentItems.length === 0 && pSearchQuery)
		{
			tmpHTML += '<div class="pict-fe-inputtype-picker-empty">No input types match your search.</div>';
		}
		else if (tmpCategories.length > 0)
		{
			tmpHTML += '<div class="pict-fe-inputtype-picker-categories">';
			for (let c = 0; c < tmpCategories.length; c++)
			{
				let tmpCategory = tmpCategories[c];
				let tmpItems = tmpCategoryItems[tmpCategory];

				tmpHTML += '<div class="pict-fe-inputtype-picker-category">';
				tmpHTML += `<div class="pict-fe-inputtype-picker-category-label">${this._escapeHTML(tmpCategory)}</div>`;

				for (let j = 0; j < tmpItems.length; j++)
				{
					let tmpDef = tmpItems[j];
					let tmpActive = (tmpDef.Hash === pCurrentValue) ? ' pict-fe-inputtype-picker-item-active' : '';
					let tmpCatIcon = this._IconographyProvider.getInputTypeIcon(tmpDef.Hash, 16);

					tmpHTML += `<div class="pict-fe-inputtype-picker-item${tmpActive}" onclick="${tmpViewRef}.commitEditInputType('${this._escapeAttr(tmpDef.Hash)}')">`;
					tmpHTML += `<div class="pict-fe-inputtype-picker-item-name">${tmpCatIcon ? '<span class="pict-fe-icon pict-fe-icon-picker">' + tmpCatIcon + '</span>' : ''}${this._escapeHTML(tmpDef.Name || tmpDef.Hash)}</div>`;
					if (tmpDef.Description)
					{
						tmpHTML += `<div class="pict-fe-inputtype-picker-item-desc">${this._escapeHTML(tmpDef.Description)}</div>`;
					}
					tmpHTML += '</div>';
				}

				tmpHTML += '</div>';
			}
			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/**
	 * Handle search input changes in the InputType picker.
	 *
	 * @param {string} pQuery - The current search query
	 */
	_onInputTypePickerSearch(pQuery)
	{
		let tmpHash = this.Hash;
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		if (!this._InputTypePickerContext)
		{
			return;
		}

		let tmpCurrentValue = this._InputTypePickerContext.CurrentValue;
		let tmpPickerHTML = this._renderInputTypePicker(tmpCurrentValue, pQuery);

		let tmpPickerSet = this.pict.ContentAssignment.getElement(`#${tmpPickerId}`);
		let tmpPicker = (Array.isArray(tmpPickerSet) && tmpPickerSet.length > 0) ? tmpPickerSet[0] : tmpPickerSet;
		if (tmpPicker)
		{
			tmpPicker.innerHTML = tmpPickerHTML;

			// Re-focus the search input and restore cursor position
			let tmpSearchSet = this.pict.ContentAssignment.getElement(`#${tmpPickerId}-Search`);
			let tmpSearch = (Array.isArray(tmpSearchSet) && tmpSearchSet.length > 0) ? tmpSearchSet[0] : tmpSearchSet;
			if (tmpSearch && tmpSearch.focus)
			{
				tmpSearch.focus();
				// Move cursor to end
				if (tmpSearch.setSelectionRange)
				{
					let tmpLen = tmpSearch.value.length;
					tmpSearch.setSelectionRange(tmpLen, tmpLen);
				}
			}
		}
	}

	/**
	 * Close the floating InputType picker.
	 */
	closeInputTypePicker()
	{
		let tmpHash = this.Hash;
		let tmpOverlayId = `FormEditor-InputTypePicker-${tmpHash}-Overlay`;

		let tmpOverlaySet = this.pict.ContentAssignment.getElement(`#${tmpOverlayId}`);
		let tmpOverlay = (Array.isArray(tmpOverlaySet) && tmpOverlaySet.length > 0) ? tmpOverlaySet[0] : tmpOverlaySet;
		if (tmpOverlay && tmpOverlay.parentNode)
		{
			tmpOverlay.parentNode.removeChild(tmpOverlay);
		}

		this._InputTypePickerContext = null;
	}

	/**
	 * Commit the InputType selection from the picker, updating the Descriptor
	 * and re-rendering the visual editor.
	 *
	 * @param {string} pInputTypeHash - The selected InputType Hash, or '' for DataType Default
	 */
	commitEditInputType(pInputTypeHash)
	{
		if (!this._InputTypePickerContext)
		{
			return;
		}

		let tmpContext = this._InputTypePickerContext;
		let tmpSectionIndex = tmpContext.SectionIndex;
		let tmpGroupIndex = tmpContext.GroupIndex;
		let tmpRowIndex = tmpContext.RowIndex;
		let tmpInputIndex = tmpContext.InputIndex;

		// Close the picker
		this.closeInputTypePicker();

		// Update the Descriptor's PictForm.InputType
		let tmpManifest = this._resolveManifestData();
		if (tmpManifest && tmpManifest.Sections)
		{
			let tmpSection = tmpManifest.Sections[tmpSectionIndex];
			let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[tmpGroupIndex] : null;
			let tmpRow = tmpGroup && tmpGroup.Rows ? tmpGroup.Rows[tmpRowIndex] : null;
			if (tmpRow && Array.isArray(tmpRow.Inputs))
			{
				let tmpAddress = tmpRow.Inputs[tmpInputIndex];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
					if (!tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm = {};
					}

					if (pInputTypeHash === '')
					{
						// "DataType Default" — remove the InputType property
						delete tmpDescriptor.PictForm.InputType;
					}
					else
					{
						tmpDescriptor.PictForm.InputType = pInputTypeHash;
					}
				}
			}
		}

		this.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: JSON Tab                                 */
	/* -------------------------------------------------------------------------- */

	_updateCodeEditor()
	{
		let tmpManifest = this._resolveManifestData();
		let tmpJSON = JSON.stringify(tmpManifest, null, '\t');

		if (this._CodeEditorView)
		{
			if (this._CodeEditorView.codeJar)
			{
				// Code editor already initialized — just update the code
				this._CodeEditorView.setCode(tmpJSON);
			}
			else
			{
				// First time switching to JSON tab — render the code editor
				this._CodeEditorView.render();
				// After render, setCode with current manifest
				if (this._CodeEditorView.codeJar)
				{
					this._CodeEditorView.setCode(tmpJSON);
				}
			}
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Data Helpers                             */
	/* -------------------------------------------------------------------------- */

	_resolveManifestData()
	{
		let tmpAddress = this.options.ManifestDataAddress;
		if (!tmpAddress)
		{
			return null;
		}

		let tmpSegments = tmpAddress.split('.');
		let tmpCurrent = this.fable;

		for (let i = 0; i < tmpSegments.length; i++)
		{
			if (tmpCurrent && typeof tmpCurrent === 'object' && tmpCurrent.hasOwnProperty(tmpSegments[i]))
			{
				tmpCurrent = tmpCurrent[tmpSegments[i]];
			}
			else
			{
				return null;
			}
		}

		return tmpCurrent;
	}

	_setManifestData(pData)
	{
		let tmpAddress = this.options.ManifestDataAddress;
		if (!tmpAddress)
		{
			return;
		}

		let tmpSegments = tmpAddress.split('.');
		let tmpCurrent = this.fable;

		for (let i = 0; i < tmpSegments.length - 1; i++)
		{
			if (!tmpCurrent.hasOwnProperty(tmpSegments[i]) || typeof tmpCurrent[tmpSegments[i]] !== 'object')
			{
				tmpCurrent[tmpSegments[i]] = {};
			}
			tmpCurrent = tmpCurrent[tmpSegments[i]];
		}

		tmpCurrent[tmpSegments[tmpSegments.length - 1]] = pData;
	}

	_createEmptyManifest()
	{
		return (
		{
			Scope: 'NewForm',
			Sections: [],
			Descriptors: {}
		});
	}

	/**
	 * Synchronize PictForm.Row indices for all inputs in a group's rows.
	 *
	 * Called after row reorder or removal so each Descriptor's PictForm.Row
	 * value matches the input's actual position (1-based).
	 *
	 * @param {object} pManifest - The manifest data object
	 * @param {object} pGroup - The group whose rows need syncing
	 */
	_syncRowIndices(pManifest, pGroup)
	{
		if (!pGroup || !Array.isArray(pGroup.Rows) || !pManifest || !pManifest.Descriptors)
		{
			return;
		}

		for (let i = 0; i < pGroup.Rows.length; i++)
		{
			let tmpRow = pGroup.Rows[i];
			if (!tmpRow || !Array.isArray(tmpRow.Inputs))
			{
				continue;
			}

			for (let j = 0; j < tmpRow.Inputs.length; j++)
			{
				let tmpAddress = tmpRow.Inputs[j];
				if (typeof tmpAddress === 'string' && pManifest.Descriptors.hasOwnProperty(tmpAddress))
				{
					let tmpDescriptor = pManifest.Descriptors[tmpAddress];
					if (tmpDescriptor && tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm.Row = i + 1;
					}
				}
			}
		}
	}

	/**
	 * Remove all Descriptor entries for inputs within a group.
	 *
	 * @param {object} pManifest - The manifest data object
	 * @param {object} pGroup - The group being removed
	 */
	_removeDescriptorsForGroup(pManifest, pGroup)
	{
		if (!pGroup || !Array.isArray(pGroup.Rows) || !pManifest || !pManifest.Descriptors)
		{
			return;
		}

		for (let i = 0; i < pGroup.Rows.length; i++)
		{
			let tmpRow = pGroup.Rows[i];
			if (!tmpRow || !Array.isArray(tmpRow.Inputs))
			{
				continue;
			}

			for (let j = 0; j < tmpRow.Inputs.length; j++)
			{
				let tmpAddress = tmpRow.Inputs[j];
				if (typeof tmpAddress === 'string' && pManifest.Descriptors.hasOwnProperty(tmpAddress))
				{
					delete pManifest.Descriptors[tmpAddress];
				}
			}
		}
	}

	/**
	 * Remove all Descriptor entries for inputs within a section.
	 *
	 * @param {object} pManifest - The manifest data object
	 * @param {object} pSection - The section being removed
	 */
	_removeDescriptorsForSection(pManifest, pSection)
	{
		if (!pSection || !Array.isArray(pSection.Groups) || !pManifest)
		{
			return;
		}

		for (let i = 0; i < pSection.Groups.length; i++)
		{
			this._removeDescriptorsForGroup(pManifest, pSection.Groups[i]);
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Utility                                  */
	/* -------------------------------------------------------------------------- */

	_browserViewRef()
	{
		return `${this.pict.browserAddress}.views['${this.Hash}']`;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: InputType Definitions                    */
	/* -------------------------------------------------------------------------- */

	/**
	 * Build the merged list of InputType definitions from built-in defaults and
	 * any embedder-provided overrides/additions in options.InputTypeDefinitions.
	 *
	 * Each definition is an object with:
	 *   Hash        — The InputType value stored in PictForm.InputType
	 *   Name        — A human-readable display name
	 *   Description — A short description of what this type does
	 *   Category    — A grouping category for the picker UI
	 *
	 * Embedders can extend or override by passing InputTypeDefinitions in the
	 * view options.  Entries with matching Hash values override the default;
	 * entries with new Hash values are appended.
	 *
	 * @param {object} pOptions - The merged view options
	 * @return {Array} An array of InputType definition objects
	 */
	_buildInputTypeDefinitions(pOptions)
	{
		// Built-in InputType definitions categorized by function.
		// Each definition can include a Manifest with Descriptors for
		// InputType-specific PictForm properties, rendered in the properties panel.
		let tmpDefaults =
		[
			// Text & Content
			{ Hash: 'TextArea', Name: 'Text Area', Description: 'Multi-line text input', Category: 'Text & Content' },
			{ Hash: 'Markdown', Name: 'Markdown', Description: 'Markdown-formatted text editor', Category: 'Text & Content' },
			{ Hash: 'HTML', Name: 'HTML', Description: 'Rich HTML content block', Category: 'Text & Content' },

			// Selection
			{
				Hash: 'Option', Name: 'Option', Description: 'Dropdown select from a set of choices', Category: 'Selection',
				Manifest:
				{
					Descriptors:
					{
						'SelectOptions': { Name: 'Select Options', Hash: 'SelectOptions', DataType: 'String', Description: 'JSON array of {id, text} option objects' },
						'SelectOptionsPickList': { Name: 'Pick List Name', Hash: 'SelectOptionsPickList', DataType: 'String', Description: 'Dynamic pick list name from AppData' }
					}
				}
			},
			{ Hash: 'Boolean', Name: 'Boolean', Description: 'Checkbox or toggle for true/false values', Category: 'Selection' },
			{ Hash: 'Color', Name: 'Color', Description: 'Color picker input', Category: 'Selection' },

			// Display
			{ Hash: 'DisplayOnly', Name: 'Display Only', Description: 'Read-only display of the value with no input control', Category: 'Display', Prominent: true },
			{ Hash: 'ReadOnly', Name: 'Read Only', Description: 'Input-styled read-only field', Category: 'Display', Prominent: true },
			{
				Hash: 'PreciseNumberReadOnly', Name: 'Precise Number (Read Only)', Description: 'Formatted precise number display with optional prefix/postfix', Category: 'Display', Prominent: true,
				Manifest:
				{
					Descriptors:
					{
						'DecimalPrecision': { Name: 'Decimal Precision', Hash: 'DecimalPrecision', DataType: 'Number', Description: 'Number of decimal places to display' },
						'AddCommas': { Name: 'Add Commas', Hash: 'AddCommas', DataType: 'Boolean', Description: 'Add thousand-separator commas to the number' },
						'DigitsPrefix': { Name: 'Prefix', Hash: 'DigitsPrefix', DataType: 'String', Description: 'Prefix string prepended to the value (e.g. "$")' },
						'DigitsPostfix': { Name: 'Postfix', Hash: 'DigitsPostfix', DataType: 'String', Description: 'Postfix string appended to the value (e.g. " USD")' }
					}
				}
			},
			{ Hash: 'Hidden', Name: 'Hidden', Description: 'Hidden input, not visible to the user', Category: 'Display' },
			{
				Hash: 'Chart', Name: 'Chart', Description: 'Data visualization chart', Category: 'Display',
				Manifest:
				{
					Descriptors:
					{
						'ChartType': { Name: 'Chart Type', Hash: 'ChartType', DataType: 'String', Description: 'Chart.js type (bar, line, pie, doughnut, radar, polarArea)' },
						'ChartLabelsAddress': { Name: 'Labels Address', Hash: 'ChartLabelsAddress', DataType: 'String', Description: 'AppData address to resolve chart labels from' },
						'ChartLabelsSolver': { Name: 'Labels Solver', Hash: 'ChartLabelsSolver', DataType: 'String', Description: 'Fable solver expression for chart labels' },
						'ChartDatasetsAddress': { Name: 'Datasets Address', Hash: 'ChartDatasetsAddress', DataType: 'String', Description: 'AppData address to resolve datasets from' }
					}
				}
			},
			{ Hash: 'Link', Name: 'Link', Description: 'Clickable hyperlink display', Category: 'Display' },

			// Navigation
			{
				Hash: 'TabSectionSelector', Name: 'Tab Section Selector', Description: 'Selector that controls which sections are displayed as tabs', Category: 'Navigation',
				Manifest:
				{
					Descriptors:
					{
						'TabSectionSet': { Name: 'Section Set', Hash: 'TabSectionSet', DataType: 'String', Description: 'JSON array of section hashes to show as tabs' },
						'DefaultTabSectionHash': { Name: 'Default Tab', Hash: 'DefaultTabSectionHash', DataType: 'String', Description: 'Hash of the initially selected tab' },
						'DefaultFromData': { Name: 'Default From Data', Hash: 'DefaultFromData', DataType: 'Boolean', Description: 'Use the data value to determine the default tab' }
					}
				}
			},
			{
				Hash: 'TabGroupSelector', Name: 'Tab Group Selector', Description: 'Selector that controls which groups are displayed as tabs', Category: 'Navigation',
				Manifest:
				{
					Descriptors:
					{
						'TabGroupSet': { Name: 'Group Set', Hash: 'TabGroupSet', DataType: 'String', Description: 'JSON array of group hashes to show as tabs' },
						'DefaultTabGroupHash': { Name: 'Default Tab', Hash: 'DefaultTabGroupHash', DataType: 'String', Description: 'Hash of the initially selected tab' },
						'DefaultFromData': { Name: 'Default From Data', Hash: 'DefaultFromData', DataType: 'Boolean', Description: 'Use the data value to determine the default tab' }
					}
				}
			},

			// Advanced
			{
				Hash: 'Templated', Name: 'Templated', Description: 'Custom template-driven input rendering', Category: 'Advanced',
				Manifest:
				{
					Descriptors:
					{
						'Template': { Name: 'Template', Hash: 'Template', DataType: 'String', Description: 'Template string for custom rendering' }
					}
				}
			},
			{
				Hash: 'TemplatedEntityLookup', Name: 'Templated Entity Lookup', Description: 'Template-driven entity search and selection', Category: 'Advanced',
				Manifest:
				{
					Descriptors:
					{
						'Template': { Name: 'Template', Hash: 'Template', DataType: 'String', Description: 'Template string for rendering the entity display' }
					}
				}
			}
		];

		// If the embedder provided custom InputTypeDefinitions, merge them
		let tmpCustomDefinitions = (pOptions && Array.isArray(pOptions.InputTypeDefinitions)) ? pOptions.InputTypeDefinitions : [];

		if (tmpCustomDefinitions.length === 0)
		{
			return tmpDefaults;
		}

		// Index defaults by Hash for quick lookup
		let tmpDefaultMap = {};
		for (let i = 0; i < tmpDefaults.length; i++)
		{
			tmpDefaultMap[tmpDefaults[i].Hash] = i;
		}

		// Merge: override existing entries by Hash, append new ones
		for (let i = 0; i < tmpCustomDefinitions.length; i++)
		{
			let tmpCustom = tmpCustomDefinitions[i];
			if (!tmpCustom || !tmpCustom.Hash)
			{
				continue;
			}

			if (tmpDefaultMap.hasOwnProperty(tmpCustom.Hash))
			{
				// Override the default entry
				let tmpIndex = tmpDefaultMap[tmpCustom.Hash];
				tmpDefaults[tmpIndex] = Object.assign({}, tmpDefaults[tmpIndex], tmpCustom);
			}
			else
			{
				// Append as a new entry
				tmpDefaults.push(tmpCustom);
				tmpDefaultMap[tmpCustom.Hash] = tmpDefaults.length - 1;
			}
		}

		return tmpDefaults;
	}

	/**
	 * Get the distinct list of InputType categories in display order.
	 *
	 * @return {Array} An array of category name strings
	 */
	_getInputTypeCategories()
	{
		let tmpCategories = [];
		let tmpSeen = {};

		for (let i = 0; i < this._InputTypeDefinitions.length; i++)
		{
			let tmpCategory = this._InputTypeDefinitions[i].Category || 'Other';
			if (!tmpSeen[tmpCategory])
			{
				tmpSeen[tmpCategory] = true;
				tmpCategories.push(tmpCategory);
			}
		}

		return tmpCategories;
	}

	/**
	 * Get the Manifest for a given InputType hash.
	 *
	 * Returns the Manifest object (with Descriptors) or null if the InputType
	 * has no configurable PictForm properties.
	 *
	 * @param {string} pInputTypeHash - The InputType hash (e.g. 'Option', 'Chart')
	 * @return {object|null} The Manifest object or null
	 */
	_getInputTypeManifest(pInputTypeHash)
	{
		if (!pInputTypeHash || typeof pInputTypeHash !== 'string')
		{
			return null;
		}

		for (let i = 0; i < this._InputTypeDefinitions.length; i++)
		{
			if (this._InputTypeDefinitions[i].Hash === pInputTypeHash)
			{
				return this._InputTypeDefinitions[i].Manifest || null;
			}
		}

		return null;
	}

	/**
	 * Get InputType definitions filtered by a search query.
	 *
	 * The search is case-insensitive and matches against Hash, Name,
	 * Description, and Category.
	 *
	 * @param {string} pQuery - The search query (empty string returns all)
	 * @return {Array} Filtered InputType definition objects
	 */
	_filterInputTypeDefinitions(pQuery)
	{
		if (!pQuery || typeof pQuery !== 'string' || pQuery.trim().length === 0)
		{
			return this._InputTypeDefinitions;
		}

		let tmpQuery = pQuery.trim().toLowerCase();

		return this._InputTypeDefinitions.filter(function(pDef)
		{
			return (
				(pDef.Hash && pDef.Hash.toLowerCase().indexOf(tmpQuery) >= 0) ||
				(pDef.Name && pDef.Name.toLowerCase().indexOf(tmpQuery) >= 0) ||
				(pDef.Description && pDef.Description.toLowerCase().indexOf(tmpQuery) >= 0) ||
				(pDef.Category && pDef.Category.toLowerCase().indexOf(tmpQuery) >= 0)
			);
		});
	}

	/**
	 * Sanitize a string into a valid object key.
	 *
	 * Strips non-alphanumeric characters (except underscore), collapses runs of
	 * underscores, and trims leading/trailing underscores so the result is a
	 * clean, human-readable identifier.
	 *
	 * @param {string} pString - The string to sanitize
	 * @return {string} A sanitized key, or 'INVALID' if the input is unusable
	 */
	sanitizeObjectKey(pString)
	{
		if (typeof pString !== 'string' || pString.length < 1)
		{
			return 'INVALID';
		}
		return pString
			.replace(/[^a-zA-Z0-9_]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_|_$/g, '');
	}

	/**
	 * Check whether a hash is an auto-generated section hash (S{n}).
	 */
	_isAutoGeneratedSectionHash(pHash)
	{
		if (typeof pHash !== 'string')
		{
			return false;
		}
		return /^S\d+$/.test(pHash);
	}

	/**
	 * Check whether a hash is an auto-generated input hash.
	 * Auto-generated input hashes end with _Input{n}.
	 */
	_isAutoGeneratedInputHash(pHash)
	{
		if (typeof pHash !== 'string')
		{
			return false;
		}
		return /_Input\d+$/.test(pHash);
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

	_escapeAttr(pString)
	{
		if (typeof pString !== 'string')
		{
			return '';
		}
		return pString
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	_truncateMiddle(pString, pMaxLength)
	{
		if (typeof pString !== 'string')
		{
			return '';
		}
		if (!pMaxLength || pString.length <= pMaxLength)
		{
			return pString;
		}
		// Show more of the beginning than the end
		let tmpEndLength = Math.floor((pMaxLength - 1) / 3);
		let tmpStartLength = pMaxLength - 1 - tmpEndLength;
		return pString.substring(0, tmpStartLength) + '\u2026' + pString.substring(pString.length - tmpEndLength);
	}
}

module.exports = PictViewFormEditor;
