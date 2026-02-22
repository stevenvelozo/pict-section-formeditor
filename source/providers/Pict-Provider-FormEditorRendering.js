const libPictProvider = require('pict-provider');

class FormEditorRendering extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';

		// Back-reference to the parent FormEditor view (set after construction)
		this._ParentFormEditor = null;
	}

	_renderTabShell()
	{
		let tmpParent = this._ParentFormEditor;
		let tmpHash = tmpParent.Hash;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpHTML = '';

		// Tab bar
		tmpHTML += '<div class="pict-fe-tabbar">';
		tmpHTML += `<button class="pict-fe-tab pict-fe-tab-active" id="FormEditor-Tab-Visual-${tmpHash}" onclick="${tmpViewRef}.switchTab('visual')">Visual Editor</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-SolverEditor-${tmpHash}" onclick="${tmpViewRef}.switchTab('solvereditor')">Solver Editor</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-Solvers-${tmpHash}" onclick="${tmpViewRef}.switchTab('solvers')">Solvers</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-ListData-${tmpHash}" onclick="${tmpViewRef}.switchTab('listdata')">List Data</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-EntityData-${tmpHash}" onclick="${tmpViewRef}.switchTab('entitydata')">Providers</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-ObjectEditor-${tmpHash}" onclick="${tmpViewRef}.switchTab('objecteditor')">Object Editor</button>`;
		tmpHTML += `<button class="pict-fe-tab" id="FormEditor-Tab-JSON-${tmpHash}" onclick="${tmpViewRef}.switchTab('json')">JSON</button>`;
		tmpHTML += '</div>';

		// Editor layout: tab content panels + resize handle + properties panel
		tmpHTML += '<div class="pict-fe-editor-layout">';

		// Tab content panels (stacked, only one active at a time)
		tmpHTML += '<div class="pict-fe-editor-content">';

		// Visual editor panel
		tmpHTML += `<div class="pict-fe-tabcontent pict-fe-tabcontent-active" id="FormEditor-Panel-Visual-${tmpHash}"></div>`;

		// Solver editor tab panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-SolverEditor-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-SolverEditorTab-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// Solvers tab panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-Solvers-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-SolversTab-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// List Data tab panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-ListData-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-ListDataTab-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// Entity Data tab panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-EntityData-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-EntityDataTab-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// Object editor panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-ObjectEditor-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-ObjectEditor-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		// JSON panel
		tmpHTML += `<div class="pict-fe-tabcontent" id="FormEditor-Panel-JSON-${tmpHash}">`;
		tmpHTML += `<div id="FormEditor-CodeEditor-Container-${tmpHash}"></div>`;
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // pict-fe-editor-content

		// Resize handle / collapse toggle (double-click to toggle)
		tmpHTML += `<div class="pict-fe-panel-toggle" onmousedown="${tmpViewRef}._UtilitiesProvider.onPanelResizeStart(event)" ondblclick="${tmpViewRef}._UtilitiesProvider.togglePropertiesPanel()">`;
		tmpHTML += '<div class="pict-fe-panel-toggle-grip"></div>';
		tmpHTML += '</div>';

		// Properties panel container
		let tmpPanelOpenClass = tmpParent._PanelCollapsed ? '' : ' pict-fe-properties-panel-open';
		let tmpPanelStyle = tmpParent._PanelCollapsed ? '' : ` style="width: ${tmpParent._PanelWidth}px;"`;
		tmpHTML += `<div class="pict-fe-properties-panel${tmpPanelOpenClass}"${tmpPanelStyle} id="FormEditor-PropertiesPanel-${tmpHash}"></div>`;

		tmpHTML += '</div>'; // pict-fe-editor-layout

		this.pict.ContentAssignment.assignContent(`#FormEditor-Wrap-${tmpHash}`, tmpHTML);
	}

	renderVisualEditor()
	{
		let tmpParent = this._ParentFormEditor;
		let tmpManifest = tmpParent._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		// Ensure Rows/Inputs arrays are populated from Descriptors
		tmpParent._ManifestOpsProvider._reconcileManifestStructure();

		let tmpViewRef = tmpParent._browserViewRef();
		let tmpHTML = '';

		// Header with toolbar buttons
		tmpHTML += '<div class="pict-fe-visual-header">';
		tmpHTML += '<h3>Form Sections</h3>';
		tmpHTML += '<div style="display:flex;gap:6px;align-items:center;">';

		// Drag-and-drop toggle
		let tmpDragActive = tmpParent._DragAndDropEnabled;
		let tmpDragClass = tmpDragActive ? 'pict-fe-btn pict-fe-btn-sm pict-fe-btn-primary' : 'pict-fe-btn pict-fe-btn-sm';
		tmpHTML += `<button class="${tmpDragClass}" onclick="${tmpViewRef}._DragDropProvider.setDragAndDropEnabled(${!tmpDragActive})" title="${tmpDragActive ? 'Disable' : 'Enable'} drag &amp; drop">${tmpParent._IconographyProvider.getIcon('Action', 'DragHandle', 12)} ${tmpDragActive ? 'Drag On' : 'Drag Off'}</button>`;

		// Input display mode toggle (name vs hash)
		let tmpShowHash = (tmpParent._InputDisplayMode === 'hash');
		let tmpHashClass = tmpShowHash ? 'pict-fe-btn pict-fe-btn-sm pict-fe-btn-primary' : 'pict-fe-btn pict-fe-btn-sm';
		let tmpNextMode = tmpShowHash ? 'name' : 'hash';
		tmpHTML += `<button class="${tmpHashClass}" onclick="${tmpViewRef}._UtilitiesProvider.setInputDisplayMode('${tmpNextMode}')" title="${tmpShowHash ? 'Show input names' : 'Show input hashes'}">${tmpShowHash ? 'Hashes' : 'Names'}</button>`;

		// Add Section button
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-primary" onclick="${tmpViewRef}._ManifestOpsProvider.addSection()"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 12)}</span> Add Section</button>`;
		tmpHTML += '</div>';
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

		// Preserve the main content scroll position across the DOM replacement
		let tmpPreviousMainScroll = 0;
		if (typeof document !== 'undefined')
		{
			let tmpVisualPanel = document.getElementById(`FormEditor-Panel-Visual-${tmpParent.Hash}`);
			if (tmpVisualPanel)
			{
				tmpPreviousMainScroll = tmpVisualPanel.scrollTop;
			}
		}

		this.pict.ContentAssignment.assignContent(`#FormEditor-Panel-Visual-${tmpParent.Hash}`, tmpHTML);

		// Restore the main content scroll position after DOM replacement
		if (typeof document !== 'undefined' && tmpPreviousMainScroll > 0)
		{
			let tmpVisualPanel = document.getElementById(`FormEditor-Panel-Visual-${tmpParent.Hash}`);
			if (tmpVisualPanel)
			{
				tmpVisualPanel.scrollTop = tmpPreviousMainScroll;
			}
		}

		// Always render the properties panel content
		if (tmpParent._PropertiesPanelView)
		{
			tmpParent._PropertiesPanelView.renderPanel();

			// Keep the top-level data tab content in sync
			if (tmpParent._ActiveTab === 'listdata')
			{
				tmpParent._PropertiesPanelView.renderListDataTabPanel();
			}
			else if (tmpParent._ActiveTab === 'entitydata')
			{
				tmpParent._PropertiesPanelView.renderEntityDataTabPanel();
			}
		}
	}

	_renderSectionCard(pSection, pIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpHash = tmpParent.Hash;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpName = pSection.Name || 'Untitled Section';
		let tmpSectionHash = pSection.Hash || '';

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-section-card"${tmpParent._DragDropProvider._buildDragAttributes('section', [pIndex])}>`;

		// Section header
		tmpHTML += `<div class="pict-fe-section-header" style="cursor:pointer;" onclick="${tmpViewRef}._UtilitiesProvider.selectSection(${pIndex})">`;
		tmpHTML += '<div class="pict-fe-section-header-labels">';
		tmpHTML += tmpParent._DragDropProvider._buildDragHandleHTML(14);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-section">${tmpParent._IconographyProvider.getIcon('Section', 'Default', 14)}</span>`;
		tmpHTML += `<span class="pict-fe-section-title" id="FormEditor-SectionName-${tmpHash}-${pIndex}" title="Section Name: ${tmpParent._UtilitiesProvider._escapeAttr(tmpName)}" onclick="event.stopPropagation(); ${tmpViewRef}._InlineEditingView.beginEditProperty('Section', ${pIndex}, -1, 'Name')">${tmpParent._UtilitiesProvider._escapeHTML(tmpName)}</span>`;
		tmpHTML += `<span class="pict-fe-section-hash" id="FormEditor-SectionHash-${tmpHash}-${pIndex}" title="Section Hash: ${tmpParent._UtilitiesProvider._escapeAttr(tmpSectionHash)}" onclick="event.stopPropagation(); ${tmpViewRef}._InlineEditingView.beginEditProperty('Section', ${pIndex}, -1, 'Hash')">${tmpParent._UtilitiesProvider._escapeHTML(tmpSectionHash)}</span>`;
		tmpHTML += '</div>';
		tmpHTML += '<div class="pict-fe-section-actions" onclick="event.stopPropagation()">';
		if (pIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveSectionUp(${pIndex})" title="Move up">\u25B2</button>`;
		}
		if (pIndex < (tmpParent._resolveManifestData().Sections.length - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveSectionDown(${pIndex})" title="Move down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}._ManifestOpsProvider.removeSection(${pIndex})" title="Remove section">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Section body
		tmpHTML += '<div class="pict-fe-section-body">';

		// Groups
		tmpHTML += '<div class="pict-fe-groups-header">';
		tmpHTML += '<h4>Groups</h4>';
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.addGroup(${pIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Group</button>`;
		tmpHTML += '</div>';

		let tmpGroups = pSection.Groups;
		if (!tmpGroups || !Array.isArray(tmpGroups) || tmpGroups.length === 0)
		{
			tmpHTML += `<div class="pict-fe-empty"${tmpParent._DragDropProvider._buildContainerDropAttributes('group', [pIndex])}>No groups in this section.</div>`;
		}
		else
		{
			tmpHTML += `<div class="pict-fe-groups-list"${tmpParent._DragDropProvider._buildContainerDropAttributes('group', [pIndex])}>`;
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
		let tmpParent = this._ParentFormEditor;
		let tmpHash = tmpParent.Hash;
		let tmpViewRef = tmpParent._browserViewRef();
		let tmpSection = tmpParent._resolveManifestData().Sections[pSectionIndex];
		let tmpGroupCount = tmpSection.Groups ? tmpSection.Groups.length : 0;

		let tmpGroupName = pGroup.Name || 'Untitled Group';
		let tmpGroupHash = pGroup.Hash || '';

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-group-card"${tmpParent._DragDropProvider._buildDragAttributes('group', [pSectionIndex, pGroupIndex])}>`;

		// Group header
		tmpHTML += `<div class="pict-fe-group-header" style="cursor:pointer;" onclick="${tmpViewRef}._UtilitiesProvider.selectGroup(${pSectionIndex}, ${pGroupIndex})">`;
		tmpHTML += '<div class="pict-fe-group-header-labels">';
		tmpHTML += tmpParent._DragDropProvider._buildDragHandleHTML(12);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-group">${tmpParent._IconographyProvider.getIcon('Group', 'Default', 14)}</span>`;
		tmpHTML += `<span class="pict-fe-group-title" id="FormEditor-GroupName-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Name: ${tmpParent._UtilitiesProvider._escapeAttr(tmpGroupName)}" onclick="event.stopPropagation(); ${tmpViewRef}._InlineEditingView.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Name')">${tmpParent._UtilitiesProvider._escapeHTML(tmpGroupName)}</span>`;
		tmpHTML += `<span class="pict-fe-group-hash" id="FormEditor-GroupHash-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Hash: ${tmpParent._UtilitiesProvider._escapeAttr(tmpGroupHash)}" onclick="event.stopPropagation(); ${tmpViewRef}._InlineEditingView.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Hash')">${tmpParent._UtilitiesProvider._escapeHTML(tmpGroupHash)}</span>`;
		let tmpCurrentLayout = pGroup.Layout || 'Record';
		tmpHTML += `<span class="pict-fe-group-layout" id="FormEditor-GroupLayout-${tmpHash}-${pSectionIndex}-${pGroupIndex}" title="Group Layout: ${tmpParent._UtilitiesProvider._escapeAttr(tmpCurrentLayout)}" onclick="event.stopPropagation(); ${tmpViewRef}._InlineEditingView.beginEditProperty('Group', ${pSectionIndex}, ${pGroupIndex}, 'Layout')">${tmpParent._UtilitiesProvider._escapeHTML(tmpCurrentLayout)}</span>`;
		tmpHTML += '</div>';
		tmpHTML += '<div class="pict-fe-group-actions" onclick="event.stopPropagation()">';
		if (pGroupIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveGroupUp(${pSectionIndex}, ${pGroupIndex})" title="Move up">\u25B2</button>`;
		}
		if (pGroupIndex < (tmpGroupCount - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveGroupDown(${pSectionIndex}, ${pGroupIndex})" title="Move down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}._ManifestOpsProvider.removeGroup(${pSectionIndex}, ${pGroupIndex})" title="Remove group">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Group body — render based on layout type
		if (tmpCurrentLayout === 'Record')
		{
			tmpHTML += this._renderGroupBody(pGroup, pSectionIndex, pGroupIndex);
		}
		else if (tmpCurrentLayout === 'Tabular' || tmpCurrentLayout === 'RecordSet')
		{
			tmpHTML += this._renderSubmanifestGroupBody(pGroup, pSectionIndex, pGroupIndex);
		}

		tmpHTML += '</div>'; // group-card

		return tmpHTML;
	}

	_renderGroupBody(pGroup, pSectionIndex, pGroupIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();
		let tmpRows = pGroup.Rows;

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-group-body"${tmpParent._DragDropProvider._buildContainerDropAttributes('row', [pSectionIndex, pGroupIndex])}>`;

		if (Array.isArray(tmpRows) && tmpRows.length > 0)
		{
			for (let k = 0; k < tmpRows.length; k++)
			{
				tmpHTML += this._renderRow(tmpRows[k], pSectionIndex, pGroupIndex, k);
			}
		}

		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-row" onclick="${tmpViewRef}._ManifestOpsProvider.addRow(${pSectionIndex}, ${pGroupIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Row</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/* ---------- Submanifest (Tabular / RecordSet) body rendering ---------- */

	_renderSubmanifestGroupBody(pGroup, pSectionIndex, pGroupIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();
		let tmpHash = tmpParent.Hash;

		let tmpRecordSetAddress = pGroup.RecordSetAddress || '';
		let tmpRecordManifestName = pGroup.RecordManifest || '';
		let tmpCurrentLayout = pGroup.Layout || 'Tabular';

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-group-body pict-fe-tabular-body">';

		// Tabular configuration fields
		tmpHTML += '<div class="pict-fe-tabular-fields">';

		// RecordSetAddress field
		tmpHTML += '<div class="pict-fe-tabular-field">';
		tmpHTML += '<div class="pict-fe-field-label">RecordSetAddress</div>';
		tmpHTML += `<input class="pict-fe-field-input" type="text" value="${tmpParent._UtilitiesProvider._escapeAttr(tmpRecordSetAddress)}" onchange="${tmpViewRef}._ManifestOpsProvider.updateGroupProperty(${pSectionIndex}, ${pGroupIndex}, 'RecordSetAddress', this.value); ${tmpViewRef}.renderVisualEditor();" placeholder="e.g. FruitData.FruityVice" />`;
		tmpHTML += '</div>';

		// RecordManifest selector
		tmpHTML += '<div class="pict-fe-tabular-field">';
		tmpHTML += '<div class="pict-fe-field-label">RecordManifest</div>';
		tmpHTML += this._renderReferenceManifestSelector(pSectionIndex, pGroupIndex, tmpRecordManifestName);
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // tabular-fields

		// Column editing area (only if a ReferenceManifest is bound)
		if (tmpRecordManifestName)
		{
			let tmpRefManifest = tmpParent._ManifestOpsProvider._resolveReferenceManifest(tmpRecordManifestName);
			if (tmpRefManifest)
			{
				let tmpDescriptors = tmpRefManifest.Descriptors;
				let tmpHasColumns = tmpDescriptors && typeof tmpDescriptors === 'object' && Object.keys(tmpDescriptors).length > 0;

				if (tmpCurrentLayout === 'RecordSet')
				{
					tmpHTML += this._renderSubmanifestRowsView(tmpRefManifest, pSectionIndex, pGroupIndex);
				}
				else
				{
					// Tabular: flat column list
					tmpHTML += this._renderSubmanifestColumnList(tmpRefManifest, pSectionIndex, pGroupIndex);
				}
			}
			else
			{
				tmpHTML += `<div class="pict-fe-empty">ReferenceManifest "${tmpParent._UtilitiesProvider._escapeHTML(tmpRecordManifestName)}" not found. Create it or select an existing one.</div>`;
			}
		}

		tmpHTML += '</div>'; // tabular-body

		return tmpHTML;
	}

	_renderReferenceManifestSelector(pSectionIndex, pGroupIndex, pCurrentManifestName)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();
		let tmpNames = tmpParent._ManifestOpsProvider.getReferenceManifestNames();

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-refmanifest-selector">';

		// Select dropdown for existing ReferenceManifests
		tmpHTML += `<select class="pict-fe-field-select" onchange="${tmpViewRef}._ManifestOpsProvider.bindReferenceManifest(${pSectionIndex}, ${pGroupIndex}, this.value)">`;
		tmpHTML += '<option value="">-- Select or Create --</option>';
		for (let i = 0; i < tmpNames.length; i++)
		{
			let tmpSelected = (tmpNames[i] === pCurrentManifestName) ? ' selected' : '';
			tmpHTML += `<option value="${tmpParent._UtilitiesProvider._escapeAttr(tmpNames[i])}"${tmpSelected}>${tmpParent._UtilitiesProvider._escapeHTML(tmpNames[i])}</option>`;
		}
		tmpHTML += '</select>';

		// Create New button
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.createAndBindReferenceManifest(${pSectionIndex}, ${pGroupIndex})" title="Create a new ReferenceManifest"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> New</button>`;

		// Unbind button (only show if currently bound)
		if (pCurrentManifestName)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}._ManifestOpsProvider.unbindReferenceManifest(${pSectionIndex}, ${pGroupIndex})" title="Unbind ReferenceManifest">\u00D7</button>`;
		}

		tmpHTML += '</div>';

		return tmpHTML;
	}

	_renderSubmanifestColumnList(pRefManifest, pSectionIndex, pGroupIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpHTML = '';

		// Header
		tmpHTML += '<div class="pict-fe-tabular-columns-header">';
		tmpHTML += `<span class="pict-fe-row-label">Columns</span>`;
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-input" onclick="${tmpViewRef}._ManifestOpsProvider.addSubmanifestColumn(${pSectionIndex}, ${pGroupIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Column</button>`;
		tmpHTML += '</div>';

		let tmpDescriptors = pRefManifest.Descriptors;
		if (tmpDescriptors && typeof tmpDescriptors === 'object')
		{
			let tmpColumnKeys = Object.keys(tmpDescriptors);
			if (tmpColumnKeys.length > 0)
			{
				tmpHTML += '<div class="pict-fe-tabular-columns-list">';
				for (let c = 0; c < tmpColumnKeys.length; c++)
				{
					tmpHTML += this._renderSubmanifestColumn(
						tmpColumnKeys[c],
						tmpDescriptors[tmpColumnKeys[c]],
						pSectionIndex,
						pGroupIndex,
						c,
						tmpColumnKeys.length
					);
				}
				tmpHTML += '</div>';
			}
			else
			{
				tmpHTML += '<div class="pict-fe-empty">No columns defined. Click "Add Column" to create one.</div>';
			}
		}

		return tmpHTML;
	}

	_renderSubmanifestRowsView(pRefManifest, pSectionIndex, pGroupIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpHTML = '';

		let tmpRows = tmpParent._ManifestOpsProvider._getSubmanifestRows(pRefManifest);

		if (tmpRows.length === 0)
		{
			// Header with Add Row button
			tmpHTML += '<div class="pict-fe-tabular-columns-header">';
			tmpHTML += `<span class="pict-fe-row-label">Rows &amp; Columns</span>`;
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-row" onclick="${tmpViewRef}._ManifestOpsProvider.addSubmanifestRow(${pSectionIndex}, ${pGroupIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Row</button>`;
			tmpHTML += '</div>';
			tmpHTML += '<div class="pict-fe-empty">No rows or columns defined. Click "Add Row" to create one.</div>';
		}
		else
		{
			// Header
			tmpHTML += '<div class="pict-fe-tabular-columns-header">';
			tmpHTML += `<span class="pict-fe-row-label">Rows &amp; Columns</span>`;
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-row" onclick="${tmpViewRef}._ManifestOpsProvider.addSubmanifestRow(${pSectionIndex}, ${pGroupIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Row</button>`;
			tmpHTML += '</div>';

			for (let r = 0; r < tmpRows.length; r++)
			{
				let tmpRowData = tmpRows[r];
				let tmpRowNum = tmpRowData.Row;
				let tmpColumns = tmpRowData.Columns;

				tmpHTML += '<div class="pict-fe-row">';

				// Row header
				tmpHTML += '<div class="pict-fe-row-header">';
				tmpHTML += `<span class="pict-fe-icon pict-fe-icon-row">${tmpParent._IconographyProvider.getIcon('Row', 'Default', 12)}</span>`;
				tmpHTML += `<span class="pict-fe-row-label">Row ${tmpRowNum}</span>`;
				tmpHTML += '</div>';

				// Columns as input cards
				tmpHTML += '<div class="pict-fe-row-inputs">';
				for (let c = 0; c < tmpColumns.length; c++)
				{
					tmpHTML += this._renderSubmanifestColumn(
						tmpColumns[c].Address,
						tmpColumns[c].Descriptor,
						pSectionIndex,
						pGroupIndex,
						c,
						tmpColumns.length
					);
				}
				tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-input" onclick="${tmpViewRef}._ManifestOpsProvider.addSubmanifestColumn(${pSectionIndex}, ${pGroupIndex}, ${tmpRowNum})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Column</button>`;
				tmpHTML += '</div>';

				tmpHTML += '</div>'; // row
			}
		}

		return tmpHTML;
	}

	_renderSubmanifestColumn(pColumnAddress, pDescriptor, pSectionIndex, pGroupIndex, pColumnIndex, pColumnCount)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpHash = tmpParent.Hash;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpName = pDescriptor ? (pDescriptor.Name || '') : '';
		let tmpColumnHash = pDescriptor ? (pDescriptor.Hash || pColumnAddress) : pColumnAddress;
		let tmpType = pDescriptor ? (pDescriptor.DataType || 'String') : 'String';
		let tmpOrdinal = pColumnIndex + 1;

		// Build tooltip
		let tmpTooltipParts = [];
		tmpTooltipParts.push('Address: ' + pColumnAddress);
		tmpTooltipParts.push('Hash: ' + tmpColumnHash);
		if (tmpName)
		{
			tmpTooltipParts.push('Name: ' + tmpName);
		}
		tmpTooltipParts.push('DataType: ' + tmpType);
		let tmpTooltip = tmpTooltipParts.join('&#10;');

		// Display text
		let tmpDisplayText = '';
		if (tmpParent._InputDisplayMode === 'hash')
		{
			tmpDisplayText = tmpColumnHash;
		}
		else
		{
			tmpDisplayText = tmpName || tmpColumnHash;
		}

		// Selected state
		let tmpIsSelected = false;
		if (tmpParent._SelectedTabularColumn &&
			tmpParent._SelectedTabularColumn.SectionIndex === pSectionIndex &&
			tmpParent._SelectedTabularColumn.GroupIndex === pGroupIndex &&
			tmpParent._SelectedTabularColumn.ColumnAddress === pColumnAddress)
		{
			tmpIsSelected = true;
		}

		let tmpSelectedClass = tmpIsSelected ? ' pict-fe-input-selected' : '';

		// DataType icon
		let tmpDataTypeIconHTML = tmpParent._IconographyProvider.getDataTypeIcon(tmpType, 12);
		if (!tmpDataTypeIconHTML)
		{
			tmpDataTypeIconHTML = tmpParent._IconographyProvider.getIcon('Input', 'Default', 12);
		}

		// Escape the column address for use in onclick
		let tmpEscapedAddress = tmpParent._UtilitiesProvider._escapeAttr(pColumnAddress).replace(/'/g, "\\'");

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-input${tmpSelectedClass}" id="FormEditor-SubCol-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pColumnIndex}" title="${tmpTooltip}" onclick="${tmpViewRef}._ManifestOpsProvider.selectSubmanifestColumn(${pSectionIndex}, ${pGroupIndex}, '${tmpEscapedAddress}')">`;
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-datatype">${tmpDataTypeIconHTML}</span>`;
		tmpHTML += `<span class="pict-fe-input-ordinal">${tmpOrdinal}</span>`;
		tmpHTML += `<span class="pict-fe-input-name">${tmpParent._UtilitiesProvider._escapeHTML(tmpParent._UtilitiesProvider._truncateMiddle(tmpDisplayText, 20))}</span>`;

		// Remove button
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger pict-fe-input-remove" onclick="event.stopPropagation(); ${tmpViewRef}._ManifestOpsProvider.removeSubmanifestColumn(${pSectionIndex}, ${pGroupIndex}, '${tmpEscapedAddress}')" title="Remove column">\u00D7</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	_renderRow(pRow, pSectionIndex, pGroupIndex, pRowIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpViewRef = tmpParent._browserViewRef();

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-row"${tmpParent._DragDropProvider._buildDragAttributes('row', [pSectionIndex, pGroupIndex, pRowIndex])}>`;

		// Row header with index and actions
		tmpHTML += '<div class="pict-fe-row-header">';
		tmpHTML += tmpParent._DragDropProvider._buildDragHandleHTML(10);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-row">${tmpParent._IconographyProvider.getIcon('Row', 'Default', 12)}</span>`;
		tmpHTML += `<span class="pict-fe-row-label">Row ${pRowIndex + 1}</span>`;
		tmpHTML += '<div class="pict-fe-row-actions">';

		let tmpManifest = tmpParent._resolveManifestData();
		let tmpGroup = tmpManifest.Sections[pSectionIndex].Groups[pGroupIndex];
		let tmpRowCount = tmpGroup.Rows ? tmpGroup.Rows.length : 0;

		if (pRowIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveRowUp(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Move row up">\u25B2</button>`;
		}
		if (pRowIndex < (tmpRowCount - 1))
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveRowDown(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Move row down">\u25BC</button>`;
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger" onclick="${tmpViewRef}._ManifestOpsProvider.removeRow(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})" title="Remove row">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// Row inputs
		tmpHTML += `<div class="pict-fe-row-inputs"${tmpParent._DragDropProvider._buildContainerDropAttributes('input', [pSectionIndex, pGroupIndex, pRowIndex])}>`;
		let tmpInputs = pRow.Inputs;
		if (Array.isArray(tmpInputs) && tmpInputs.length > 0)
		{
			for (let m = 0; m < tmpInputs.length; m++)
			{
				tmpHTML += this._renderInput(tmpInputs[m], pSectionIndex, pGroupIndex, pRowIndex, m);
			}
		}
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-add-input" onclick="${tmpViewRef}._ManifestOpsProvider.addInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex})"><span class="pict-fe-icon pict-fe-icon-add">${tmpParent._IconographyProvider.getIcon('Action', 'Add', 10)}</span> Add Input</button>`;
		tmpHTML += '</div>';

		tmpHTML += '</div>';

		return tmpHTML;
	}

	_renderInput(pInputAddress, pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpParent = this._ParentFormEditor;
		let tmpHash = tmpParent.Hash;
		let tmpViewRef = tmpParent._browserViewRef();
		let tmpManifest = tmpParent._resolveManifestData();

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
		if (tmpParent._InputDisplayMode === 'hash')
		{
			tmpDisplayText = tmpInputHash;
		}
		else
		{
			tmpDisplayText = tmpName || tmpInputHash;
		}

		// Check if this input is currently selected
		let tmpIsSelected = false;
		if (tmpParent._SelectedInputIndices &&
			tmpParent._SelectedInputIndices[0] === pSectionIndex &&
			tmpParent._SelectedInputIndices[1] === pGroupIndex &&
			tmpParent._SelectedInputIndices[2] === pRowIndex &&
			tmpParent._SelectedInputIndices[3] === pInputIndex)
		{
			tmpIsSelected = true;
		}

		let tmpSelectedClass = tmpIsSelected ? ' pict-fe-input-selected' : '';

		// DataType icon
		let tmpDataTypeIconHTML = tmpParent._IconographyProvider.getDataTypeIcon(tmpType, 12);
		if (!tmpDataTypeIconHTML)
		{
			// Fallback to generic Input icon if no DataType icon
			tmpDataTypeIconHTML = tmpParent._IconographyProvider.getIcon('Input', 'Default', 12);
		}

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-input${tmpSelectedClass}" id="FormEditor-Input-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${pInputIndex}" title="${tmpTooltip}"${tmpParent._DragDropProvider._buildDragAttributes('input', [pSectionIndex, pGroupIndex, pRowIndex, pInputIndex])} onclick="${tmpViewRef}._UtilitiesProvider.selectInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex}, ${pInputIndex})">`;
		tmpHTML += tmpParent._DragDropProvider._buildDragHandleHTML(10);
		tmpHTML += `<span class="pict-fe-icon pict-fe-icon-datatype">${tmpDataTypeIconHTML}</span>`;
		tmpHTML += `<span class="pict-fe-input-ordinal">${tmpOrdinal}</span>`;
		tmpHTML += `<span class="pict-fe-input-name">${tmpParent._UtilitiesProvider._escapeHTML(tmpParent._UtilitiesProvider._truncateMiddle(tmpDisplayText, 20))}</span>`;
		tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm pict-fe-btn-danger pict-fe-input-remove" onclick="event.stopPropagation(); ${tmpViewRef}._ManifestOpsProvider.removeInput(${pSectionIndex}, ${pGroupIndex}, ${pRowIndex}, ${pInputIndex})" title="Remove input">\u00D7</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}
}

module.exports = FormEditorRendering;

module.exports.default_configuration = {};
