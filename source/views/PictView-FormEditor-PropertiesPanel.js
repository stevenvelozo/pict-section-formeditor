const libPictView = require('pict-view');

/**
 * Properties Panel for the Form Editor
 *
 * Displays and edits properties of the currently selected input Descriptor.
 * Designed to live inside the visual editor tab as a side panel.
 *
 * @license MIT
 * @author Steven Velozo <steven@velozo.com>
 */
class PictViewFormEditorPropertiesPanel extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Reference to the parent FormEditor view (set externally after construction)
		this._ParentFormEditor = null;

		// Currently selected input: { SectionIndex, GroupIndex, RowIndex, InputIndex }
		this._SelectedInput = null;

		// Currently selected submanifest column: { SectionIndex, GroupIndex, ColumnAddress }
		this._SelectedTabularColumn = null;

		// Currently selected section: { SectionIndex } or null
		this._SelectedSection = null;

		// Currently selected group: { SectionIndex, GroupIndex } or null
		this._SelectedGroup = null;

		// Drag state for solver reordering
		this._SolverDragState = null;

		// Solver editor context: { Type, SectionIndex, SolverIndex, GroupIndex, Expression, Ordinal }
		this._SolverEditorContext = null;

		// Currently expanded reference item hash in the solver editor
		this._SolverEditorExpandedHash = null;

		// Navigation stack for solver editor (for breadcrumb-back behavior)
		this._SolverEditorStack = [];

		// Drag state for option entry reordering
		this._OptionsDragState = null;

		// Currently expanded named option list (by Hash)
		this._ExpandedNamedList = null;

		// Data tab: PickList state
		this._ExpandedPickList = null;
		this._PickListScope = 'manifest';

		// Data tab: Providers drag state
		this._ProvidersDragState = null;

		// Data tab: Entity Bundle state
		this._ExpandedEntityBundleStep = null;
		this._EntityBundleDragState = null;

		// Data tab: Autofill Trigger Group state
		this._ExpandedAutofillTrigger = null;

		// Data tab: List Filter Rules state
		this._ExpandedFilterRule = null;
	}

	/**
	 * Select an input to display in the properties panel.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} pRowIndex
	 * @param {number} pInputIndex
	 */
	selectInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		this._SelectedInput =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			RowIndex: pRowIndex,
			InputIndex: pInputIndex
		};
		this._SelectedTabularColumn = null;
		// Also select the containing section and group
		this._SelectedSection = { SectionIndex: pSectionIndex };
		this._SelectedGroup = { SectionIndex: pSectionIndex, GroupIndex: pGroupIndex };
	}

	/**
	 * Select a submanifest column (Tabular/RecordSet) for the properties panel.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pColumnAddress
	 */
	selectTabularColumn(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		this._SelectedInput = null;
		this._SelectedTabularColumn =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			ColumnAddress: pColumnAddress
		};
		// Also select the containing section and group
		this._SelectedSection = { SectionIndex: pSectionIndex };
		this._SelectedGroup = { SectionIndex: pSectionIndex, GroupIndex: pGroupIndex };
	}

	/**
	 * Deselect the current input and hide the panel.
	 */
	deselectInput()
	{
		this._SelectedInput = null;
		this._SelectedTabularColumn = null;
	}

	/**
	 * Deselect all selections (input, tabular, section, group).
	 */
	deselectAll()
	{
		this._SelectedInput = null;
		this._SelectedTabularColumn = null;
		this._SelectedSection = null;
		this._SelectedGroup = null;
	}

	/**
	 * Select a section to display its properties.
	 *
	 * @param {number} pSectionIndex
	 */
	selectSection(pSectionIndex)
	{
		this._SelectedSection = { SectionIndex: pSectionIndex };
		this._SelectedInput = null;
		this._SelectedTabularColumn = null;
		this._SelectedGroup = null;
	}

	/**
	 * Select a group to display its properties.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	selectGroup(pSectionIndex, pGroupIndex)
	{
		this._SelectedGroup = { SectionIndex: pSectionIndex, GroupIndex: pGroupIndex };
		this._SelectedInput = null;
		this._SelectedTabularColumn = null;
		// Also select the containing section
		this._SelectedSection = { SectionIndex: pSectionIndex };
	}

	/**
	 * Resolve the Descriptor and input address for the currently selected input.
	 *
	 * @return {object|null} { Address, Descriptor, Section, Group, Row } or null
	 */
	_resolveSelectedDescriptor()
	{
		if (!this._SelectedInput || !this._ParentFormEditor)
		{
			return null;
		}

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return null;
		}

		let tmpSection = tmpManifest.Sections[this._SelectedInput.SectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return null;
		}

		let tmpGroup = tmpSection.Groups[this._SelectedInput.GroupIndex];
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows))
		{
			return null;
		}

		let tmpRow = tmpGroup.Rows[this._SelectedInput.RowIndex];
		if (!tmpRow || !Array.isArray(tmpRow.Inputs))
		{
			return null;
		}

		let tmpAddress = tmpRow.Inputs[this._SelectedInput.InputIndex];
		if (typeof tmpAddress !== 'string')
		{
			return null;
		}

		let tmpDescriptor = (tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress]) ? tmpManifest.Descriptors[tmpAddress] : null;

		return {
			Address: tmpAddress,
			Descriptor: tmpDescriptor,
			Manifest: tmpManifest,
			Section: tmpSection,
			Group: tmpGroup,
			Row: tmpRow
		};
	}

	/**
	 * Resolve the Descriptor for the currently selected submanifest column.
	 *
	 * @return {object|null} { Address, Descriptor, RefManifest, RefManifestName, Section, Group, IsTabular }
	 */
	_resolveSelectedTabularDescriptor()
	{
		if (!this._SelectedTabularColumn || !this._ParentFormEditor)
		{
			return null;
		}

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return null;
		}

		let tmpSection = tmpManifest.Sections[this._SelectedTabularColumn.SectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return null;
		}

		let tmpGroup = tmpSection.Groups[this._SelectedTabularColumn.GroupIndex];
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return null;
		}

		let tmpRefManifest = this._ParentFormEditor._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest || !tmpRefManifest.Descriptors)
		{
			return null;
		}

		let tmpAddress = this._SelectedTabularColumn.ColumnAddress;
		let tmpDescriptor = tmpRefManifest.Descriptors[tmpAddress] || null;

		return {
			Address: tmpAddress,
			Descriptor: tmpDescriptor,
			Manifest: tmpManifest,
			RefManifest: tmpRefManifest,
			RefManifestName: tmpGroup.RecordManifest,
			Section: tmpSection,
			Group: tmpGroup,
			IsTabular: true
		};
	}

	/**
	 * Render the properties panel content into the DOM.
	 * Called directly by the parent FormEditor after the panel container is in the DOM.
	 *
	 * The panel has four tabs:
	 *   - "Form Stats" — summary counts (sections, groups, inputs, descriptors)
	 *   - "Input" — input selector dropdown + editable properties
	 *   - "Section" — section properties
	 *   - "Group" — group properties
	 */
	renderPanel()
	{
		if (!this._ParentFormEditor)
		{
			return;
		}

		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpActiveTab = this._ParentFormEditor._PanelActiveTab || 'form';

		let tmpHTML = '';

		// Panel header
		tmpHTML += '<div class="pict-fe-props-header">';
		tmpHTML += '<div class="pict-fe-props-header-title">Properties</div>';
		tmpHTML += `<button class="pict-fe-props-close" onclick="${tmpViewRef}._UtilitiesProvider.togglePropertiesPanel()" title="Collapse panel">\u00D7</button>`;
		tmpHTML += '</div>';

		// Panel tab bar
		let tmpFormActive = (tmpActiveTab === 'form') ? ' pict-fe-panel-tab-active' : '';
		let tmpPropsActive = (tmpActiveTab === 'properties') ? ' pict-fe-panel-tab-active' : '';
		let tmpSectionActive = (tmpActiveTab === 'section') ? ' pict-fe-panel-tab-active' : '';
		let tmpGroupActive = (tmpActiveTab === 'group') ? ' pict-fe-panel-tab-active' : '';
		let tmpOptionsActive = (tmpActiveTab === 'options') ? ' pict-fe-panel-tab-active' : '';
		tmpHTML += '<div class="pict-fe-panel-tabbar">';
		tmpHTML += `<button class="pict-fe-panel-tab${tmpFormActive}" onclick="${tmpViewRef}._UtilitiesProvider.setPanelTab('form')">Form</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpSectionActive}" onclick="${tmpViewRef}._UtilitiesProvider.setPanelTab('section')">Section</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpGroupActive}" onclick="${tmpViewRef}._UtilitiesProvider.setPanelTab('group')">Group</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpPropsActive}" onclick="${tmpViewRef}._UtilitiesProvider.setPanelTab('properties')">Input</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpOptionsActive}" onclick="${tmpViewRef}._UtilitiesProvider.setPanelTab('options')">Options</button>`;
		tmpHTML += '</div>';

		// Tab content: Form Dashboard
		let tmpFormDisplay = (tmpActiveTab === 'form') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpFormDisplay}">`;
		tmpHTML += this._renderFormTab();
		tmpHTML += '</div>';

		// Tab content: Section Properties
		let tmpSectionDisplay = (tmpActiveTab === 'section') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpSectionDisplay}">`;
		tmpHTML += this._renderSectionSelectorDropdown();
		tmpHTML += this._renderSectionProperties();
		tmpHTML += '</div>';

		// Tab content: Group Properties
		let tmpGroupDisplay = (tmpActiveTab === 'group') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpGroupDisplay}">`;
		tmpHTML += this._renderGroupSelectorDropdown();
		tmpHTML += this._renderGroupProperties();
		tmpHTML += '</div>';

		// Tab content: Input Properties
		let tmpPropsDisplay = (tmpActiveTab === 'properties') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpPropsDisplay}">`;
		tmpHTML += this._renderInputSelectorDropdown();
		tmpHTML += this._renderInputProperties();
		tmpHTML += '</div>';

		// Tab content: Options
		let tmpOptionsDisplay = (tmpActiveTab === 'options') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpOptionsDisplay}">`;
		tmpHTML += this._renderOptionsTab();
		tmpHTML += '</div>';

		let tmpPanelEl = `#FormEditor-PropertiesPanel-${this._ParentFormEditor.Hash}`;
		this.pict.ContentAssignment.assignContent(tmpPanelEl, tmpHTML);

		// Wire up the searchable selector dropdowns
		this._wireSearchableSelector('Section');
		this._wireSearchableSelector('Group');
		this._wireSearchableSelector('Input');

		// Wire up the address input if an input is selected
		if (this._SelectedInput && tmpActiveTab === 'properties')
		{
			let tmpResolved = this._resolveSelectedDescriptor();
			if (tmpResolved && tmpResolved.Address)
			{
				this._wireAddressConfirmation(tmpResolved.Address);
			}
		}
		// Wire up the address input if a tabular column is selected
		else if (this._SelectedTabularColumn && tmpActiveTab === 'properties')
		{
			let tmpResolved = this._resolveSelectedTabularDescriptor();
			if (tmpResolved && tmpResolved.Address)
			{
				this._wireAddressConfirmation(tmpResolved.Address);
			}
		}
	}

	/**
	 * Render the Form Dashboard tab content.
	 *
	 * Provides an extended overview of the form manifest including:
	 * - Scope and Description editing
	 * - Summary stat cards
	 * - DataType and InputType breakdowns
	 *
	 * @returns {string} HTML string
	 */
	_renderFormTab()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpStats = this._ParentFormEditor._UtilitiesProvider.getFormStats();
		let tmpPanelViewRef = this._browserViewRef();

		let tmpScope = (tmpManifest && tmpManifest.Scope) ? tmpManifest.Scope : '';
		let tmpDescription = (tmpManifest && tmpManifest.Description) ? tmpManifest.Description : '';

		let tmpHTML = '';

		// ---- Form Identity ----
		tmpHTML += '<div class="pict-fe-form-identity">';
		tmpHTML += '<div class="pict-fe-form-identity-heading">Form Identity</div>';

		tmpHTML += '<div class="pict-fe-form-field">';
		tmpHTML += '<label class="pict-fe-form-field-label">Scope</label>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpScope)}" placeholder="e.g. MyFormScope" onchange="${tmpPanelViewRef}.commitFormScopeChange(this.value)" />`;
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-form-field">';
		tmpHTML += '<label class="pict-fe-form-field-label">Description</label>';
		tmpHTML += `<textarea class="pict-fe-props-textarea" rows="2" placeholder="Describe this form\u2026" onchange="${tmpPanelViewRef}.commitFormDescriptionChange(this.value)">${this._escapeHTML(tmpDescription)}</textarea>`;
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // pict-fe-form-identity

		// ---- Summary Stats Grid ----
		tmpHTML += '<div class="pict-fe-form-dashboard-heading">Overview</div>';
		tmpHTML += '<div class="pict-fe-stats-grid">';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #D4A373">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#D4A373">${tmpStats.Sections}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Sections</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #9E6B47">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#9E6B47">${tmpStats.Groups}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Groups</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #E76F51">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#E76F51">${tmpStats.Inputs}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Inputs</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #5A7F9E">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#5A7F9E">${tmpStats.Descriptors}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Descriptors</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #6B8F5A">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#6B8F5A">${tmpStats.ReferenceManifests}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Ref Manifests</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #B07BAC">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#B07BAC">${tmpStats.TabularColumns}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Tabular Cols</div>';
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // pict-fe-stats-grid

		// ---- DataType Breakdown ----
		let tmpDataTypeKeys = Object.keys(tmpStats.DataTypes);
		if (tmpDataTypeKeys.length > 0)
		{
			tmpHTML += '<div class="pict-fe-form-dashboard-heading">Data Types</div>';
			tmpHTML += '<div class="pict-fe-histogram">';
			// Sort by count descending
			tmpDataTypeKeys.sort(function(a, b) { return tmpStats.DataTypes[b] - tmpStats.DataTypes[a]; });
			let tmpDataTypeColors = ['#D4A373', '#9E6B47', '#E76F51', '#6B8F5A', '#5A7F9E', '#B07BAC', '#C4965A', '#7B9E6B', '#8F6B5A', '#5A8F8F', '#C47B5A', '#7B6BC4'];
			for (let i = 0; i < tmpDataTypeKeys.length; i++)
			{
				let tmpType = tmpDataTypeKeys[i];
				let tmpCount = tmpStats.DataTypes[tmpType];
				let tmpMaxCount = tmpStats.DataTypes[tmpDataTypeKeys[0]];
				let tmpBarPct = (tmpMaxCount > 0) ? Math.round((tmpCount / tmpMaxCount) * 100) : 0;
				let tmpBarColor = tmpDataTypeColors[i % tmpDataTypeColors.length];
				tmpHTML += '<div class="pict-fe-histogram-row">';
				tmpHTML += `<span class="pict-fe-histogram-label">${this._escapeHTML(tmpType)}</span>`;
				tmpHTML += `<span class="pict-fe-histogram-bar-wrap"><span class="pict-fe-histogram-bar" style="width:${tmpBarPct}%;background:${tmpBarColor}"></span></span>`;
				tmpHTML += `<span class="pict-fe-histogram-count">${tmpCount}</span>`;
				tmpHTML += '</div>';
			}
			tmpHTML += '</div>'; // pict-fe-histogram
		}

		// ---- InputType Breakdown ----
		let tmpInputTypeKeys = Object.keys(tmpStats.InputTypes);
		if (tmpInputTypeKeys.length > 0)
		{
			tmpHTML += '<div class="pict-fe-form-dashboard-heading">Input Types</div>';
			tmpHTML += '<div class="pict-fe-histogram">';
			// Sort by count descending
			tmpInputTypeKeys.sort(function(a, b) { return tmpStats.InputTypes[b] - tmpStats.InputTypes[a]; });
			let tmpInputTypeColors = ['#5A7F9E', '#9E6B47', '#6B8F5A', '#E76F51', '#B07BAC', '#D4A373', '#8F6B5A', '#7B9E6B', '#C4965A', '#5A8F8F', '#7B6BC4', '#C47B5A'];
			for (let i = 0; i < tmpInputTypeKeys.length; i++)
			{
				let tmpType = tmpInputTypeKeys[i];
				let tmpCount = tmpStats.InputTypes[tmpType];
				let tmpMaxCount = tmpStats.InputTypes[tmpInputTypeKeys[0]];
				let tmpBarPct = (tmpMaxCount > 0) ? Math.round((tmpCount / tmpMaxCount) * 100) : 0;
				let tmpBarColor = tmpInputTypeColors[i % tmpInputTypeColors.length];
				tmpHTML += '<div class="pict-fe-histogram-row">';
				tmpHTML += `<span class="pict-fe-histogram-label">${this._escapeHTML(tmpType)}</span>`;
				tmpHTML += `<span class="pict-fe-histogram-bar-wrap"><span class="pict-fe-histogram-bar" style="width:${tmpBarPct}%;background:${tmpBarColor}"></span></span>`;
				tmpHTML += `<span class="pict-fe-histogram-count">${tmpCount}</span>`;
				tmpHTML += '</div>';
			}
			tmpHTML += '</div>'; // pict-fe-histogram
		}

		return tmpHTML;
	}

	/**
	 * Commit a Scope change from the Form dashboard.
	 *
	 * @param {string} pValue - new Scope value
	 */
	commitFormScopeChange(pValue)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}
		tmpManifest.Scope = pValue;
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Commit a Description change from the Form dashboard.
	 *
	 * @param {string} pValue - new Description value
	 */
	commitFormDescriptionChange(pValue)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}
		tmpManifest.Description = pValue;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Section Properties Tab                                 */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the section selector dropdown for the Section tab.
	 *
	 * @returns {string} HTML string
	 */
	_renderSectionSelectorDropdown()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return '';
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpSelectedLabel = '';
		if (this._SelectedSection)
		{
			let tmpSection = tmpManifest.Sections[this._SelectedSection.SectionIndex];
			if (tmpSection)
			{
				tmpSelectedLabel = (tmpSection.Name || 'Unnamed') + ' (' + (tmpSection.Hash || '') + ')';
			}
		}

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-searchable-selector" id="FormEditor-SectionSelector-Wrap-${tmpEditorHash}">`;
		tmpHTML += `<input class="pict-fe-searchable-selector-input" id="FormEditor-SectionSelector-${tmpEditorHash}" type="text" placeholder="\u2014 Select a section \u2014" value="${this._escapeAttr(tmpSelectedLabel)}" autocomplete="off" />`;
		tmpHTML += `<div class="pict-fe-searchable-selector-list" id="FormEditor-SectionSelector-List-${tmpEditorHash}">`;

		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			let tmpLabel = (tmpSection.Name || 'Unnamed') + ' (' + (tmpSection.Hash || '') + ')';
			let tmpActiveClass = (this._SelectedSection && this._SelectedSection.SectionIndex === i) ? ' pict-fe-searchable-selector-item-active' : '';
			tmpHTML += `<div class="pict-fe-searchable-selector-item${tmpActiveClass}" data-value="${i}" data-label="${this._escapeAttr(tmpLabel)}" onclick="${tmpPanelViewRef}.onSectionSelectorChange(${i})">${this._escapeHTML(tmpLabel)}</div>`;
		}

		if (tmpManifest.Sections.length === 0)
		{
			tmpHTML += '<div class="pict-fe-searchable-selector-empty">No sections</div>';
		}

		tmpHTML += '</div>'; // list
		tmpHTML += '</div>'; // wrap

		return tmpHTML;
	}

	/**
	 * Handle a change in the section selector.
	 *
	 * @param {number} pSectionIndex
	 */
	onSectionSelectorChange(pSectionIndex)
	{
		if (!this._ParentFormEditor)
		{
			return;
		}

		this._ParentFormEditor._UtilitiesProvider.selectSection(pSectionIndex);
	}

	/**
	 * Render the Section Properties tab content.
	 *
	 * @returns {string} HTML string
	 */
	_renderSectionProperties()
	{
		if (!this._SelectedSection)
		{
			return '<div class="pict-fe-props-placeholder">Click a section icon to view its properties.</div>';
		}

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return '<div class="pict-fe-props-placeholder">No manifest data available.</div>';
		}

		let tmpSection = tmpManifest.Sections[this._SelectedSection.SectionIndex];
		if (!tmpSection)
		{
			return '<div class="pict-fe-props-placeholder">Section not found.</div>';
		}

		let tmpPanelViewRef = this._browserViewRef();

		let tmpName = tmpSection.Name || '';
		let tmpHash = tmpSection.Hash || '';
		let tmpDescription = tmpSection.Description || '';
		let tmpCSSClass = tmpSection.CSSClass || '';
		let tmpCustomCSS = tmpSection.CustomCSS || '';

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-body">';

		// Name field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Name</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpName)}" onchange="${tmpPanelViewRef}.commitSectionPropertyChange('Name', this.value)" />`;
		tmpHTML += '</div>';

		// Hash field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpHash)}" onchange="${tmpPanelViewRef}.commitSectionPropertyChange('Hash', this.value)" />`;
		tmpHTML += '</div>';

		// Description field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Description</div>';
		tmpHTML += `<textarea class="pict-fe-props-textarea" rows="3" onchange="${tmpPanelViewRef}.commitSectionPropertyChange('Description', this.value)">${this._escapeHTML(tmpDescription)}</textarea>`;
		tmpHTML += '</div>';

		// CSSClass field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">CSSClass</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpCSSClass)}" placeholder="e.g. MyCustomSection" onchange="${tmpPanelViewRef}.commitSectionPropertyChange('CSSClass', this.value)" />`;
		tmpHTML += '</div>';

		// CustomCSS field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">CustomCSS</div>';
		tmpHTML += `<textarea class="pict-fe-props-textarea" rows="4" placeholder="e.g. h3 { color: red; }" onchange="${tmpPanelViewRef}.commitSectionPropertyChange('CustomCSS', this.value)">${this._escapeHTML(tmpCustomCSS)}</textarea>`;
		tmpHTML += '</div>';

		// Solvers
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += this._renderSolverList('Section', tmpSection.Solvers, this._SelectedSection.SectionIndex);

		tmpHTML += '</div>'; // pict-fe-props-body

		return tmpHTML;
	}

	/**
	 * Commit a section property change.
	 *
	 * @param {string} pProperty - 'Name', 'Hash', 'Description', 'CSSClass', or 'CustomCSS'
	 * @param {string} pValue - The new value
	 */
	commitSectionPropertyChange(pProperty, pValue)
	{
		if (!this._SelectedSection || !this._ParentFormEditor)
		{
			return;
		}

		this._ParentFormEditor._ManifestOpsProvider.updateSectionProperty(this._SelectedSection.SectionIndex, pProperty, pValue);
		this._ParentFormEditor.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*                     Solver List (shared by Section & Group)                 */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render a solver list UI.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {Array} pSolvers - The solvers array (may be undefined)
	 * @param {number} pSectionIndex - Section index
	 * @param {number} [pGroupIndex] - Group index (for Group type only)
	 * @returns {string} HTML string
	 */
	_renderSolverList(pType, pSolvers, pSectionIndex, pGroupIndex)
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpSolverArray = Array.isArray(pSolvers) ? pSolvers : [];
		let tmpDragEnabled = this._ParentFormEditor._DragAndDropEnabled;

		// Build reusable arg fragments for onclick handlers
		let tmpGroupArg = (pType === 'Group') ? (', ' + pGroupIndex) : '';

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-field">';

		// Header with title and add button
		tmpHTML += '<div class="pict-fe-solver-list-header">';
		tmpHTML += `<div class="pict-fe-solver-list-title">${pType === 'Group' ? 'RecordSetSolvers' : 'Solvers'}</div>`;
		tmpHTML += `<button class="pict-fe-solver-add-btn" onclick="${tmpPanelViewRef}.addSolver('${pType}', ${pSectionIndex}${tmpGroupArg})">+ Add</button>`;
		tmpHTML += '</div>';

		if (tmpSolverArray.length === 0)
		{
			tmpHTML += '<div class="pict-fe-solver-empty">No solvers defined.</div>';
		}
		else
		{
			for (let i = 0; i < tmpSolverArray.length; i++)
			{
				let tmpSolver = tmpSolverArray[i];
				let tmpExpression = '';
				let tmpOrdinal = '';
				let tmpIsObject = false;

				if (typeof tmpSolver === 'string')
				{
					tmpExpression = tmpSolver;
				}
				else if (typeof tmpSolver === 'object' && tmpSolver !== null)
				{
					tmpExpression = tmpSolver.Expression || '';
					tmpOrdinal = (tmpSolver.Ordinal !== undefined && tmpSolver.Ordinal !== null) ? String(tmpSolver.Ordinal) : '';
					tmpIsObject = true;
				}

				// Display ordinal: show the actual ordinal for objects, show "1" for strings (implicit default)
				let tmpDisplayOrdinal = tmpIsObject ? tmpOrdinal : '1';

				// Drag attributes for the entry
				let tmpDragAttrs = '';
				if (tmpDragEnabled)
				{
					tmpDragAttrs = ` draggable="true"` +
						` ondragstart="${tmpPanelViewRef}.onSolverDragStart(event, '${pType}', ${pSectionIndex}, ${i}${tmpGroupArg})"` +
						` ondragover="${tmpPanelViewRef}.onSolverDragOver(event, '${pType}', ${i})"` +
						` ondragleave="${tmpPanelViewRef}.onSolverDragLeave(event)"` +
						` ondrop="${tmpPanelViewRef}.onSolverDrop(event, '${pType}', ${pSectionIndex}, ${i}${tmpGroupArg})"` +
						` ondragend="${tmpPanelViewRef}.onSolverDragEnd(event)"`;
				}

				tmpHTML += `<div class="pict-fe-solver-entry"${tmpDragAttrs}>`;

				// Top row: full-width expression input
				tmpHTML += `<input class="pict-fe-solver-expression" type="text" value="${this._escapeAttr(tmpExpression)}" placeholder="Expression..." onchange="${tmpPanelViewRef}.updateSolverExpression('${pType}', ${pSectionIndex}, ${i}, this.value${tmpGroupArg})" />`;

				// Bottom row: delete on left, arrows + ordinal on right
				tmpHTML += '<div class="pict-fe-solver-bottom-row">';

				// Left side: drag handle (if enabled) + remove button
				tmpHTML += '<div class="pict-fe-solver-bottom-left">';
				if (tmpDragEnabled)
				{
					tmpHTML += '<span class="pict-fe-solver-drag-handle" title="Drag to reorder">&#9776;</span>';
				}
				tmpHTML += `<button class="pict-fe-solver-btn pict-fe-solver-btn-expand" title="Edit in Solver Editor" onclick="${tmpPanelViewRef}.openSolverEditor('${pType}', ${pSectionIndex}, ${i}${tmpGroupArg})">Edit</button>`;
				tmpHTML += `<button class="pict-fe-solver-btn pict-fe-solver-btn-remove" title="Remove" onclick="if(this.dataset.armed){${tmpPanelViewRef}.removeSolver('${pType}', ${pSectionIndex}, ${i}${tmpGroupArg})}else{this.dataset.armed='1';this.textContent='Sure?';this.classList.add('pict-fe-solver-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='\\u2715';b.classList.remove('pict-fe-solver-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='\\u2715';this.classList.remove('pict-fe-solver-btn-armed');clearTimeout(this._armTimer)}">&#10005;</button>`;
				tmpHTML += '</div>';

				// Right side: up/down arrows + ordinal
				tmpHTML += '<div class="pict-fe-solver-bottom-right">';
				if (i > 0)
				{
					tmpHTML += `<button class="pict-fe-solver-btn" title="Move up" onclick="${tmpPanelViewRef}.moveSolver('${pType}', ${pSectionIndex}, ${i}, -1${tmpGroupArg})">&#9650;</button>`;
				}
				if (i < tmpSolverArray.length - 1)
				{
					tmpHTML += `<button class="pict-fe-solver-btn" title="Move down" onclick="${tmpPanelViewRef}.moveSolver('${pType}', ${pSectionIndex}, ${i}, 1${tmpGroupArg})">&#9660;</button>`;
				}
				tmpHTML += `<input class="pict-fe-solver-ordinal" type="text" value="${this._escapeAttr(tmpDisplayOrdinal)}" title="Ordinal (execution order)" onchange="${tmpPanelViewRef}.updateSolverOrdinal('${pType}', ${pSectionIndex}, ${i}, this.value${tmpGroupArg})" />`;
				tmpHTML += '</div>';

				tmpHTML += '</div>'; // bottom-row
				tmpHTML += '</div>'; // solver-entry
			}
		}

		tmpHTML += '</div>'; // pict-fe-props-field

		return tmpHTML;
	}

	/**
	 * Resolve the solvers array for a given type and indices.
	 * Returns the parent object and the property name so callers can
	 * read or write the array.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} [pGroupIndex]
	 * @returns {{ Parent: object, Property: string, Solvers: Array }|null}
	 */
	_resolveSolverTarget(pType, pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return null;
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection)
		{
			return null;
		}

		if (pType === 'Group')
		{
			if (!Array.isArray(tmpSection.Groups))
			{
				return null;
			}
			let tmpGroup = tmpSection.Groups[pGroupIndex];
			if (!tmpGroup)
			{
				return null;
			}
			if (!Array.isArray(tmpGroup.RecordSetSolvers))
			{
				tmpGroup.RecordSetSolvers = [];
			}
			return { Parent: tmpGroup, Property: 'RecordSetSolvers', Solvers: tmpGroup.RecordSetSolvers };
		}
		else
		{
			if (!Array.isArray(tmpSection.Solvers))
			{
				tmpSection.Solvers = [];
			}
			return { Parent: tmpSection, Property: 'Solvers', Solvers: tmpSection.Solvers };
		}
	}

	/**
	 * Add a new solver entry.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} [pGroupIndex]
	 */
	addSolver(pType, pSectionIndex, pGroupIndex)
	{
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget)
		{
			return;
		}

		// Add as a simple empty string expression
		tmpTarget.Solvers.push('');
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Add a solver from the "Add Solver" dropdown helper.
	 * Reads the selected target from the dropdown, adds an empty solver,
	 * then opens it in the solver editor tab.
	 *
	 * @param {string} pSelectId - DOM ID of the select element
	 */
	addSolverFromHelper(pSelectId)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpSelectEl = document.getElementById(pSelectId);
		if (!tmpSelectEl || !tmpSelectEl.value)
		{
			return;
		}

		// Parse the encoded value: "Section:sectionIndex" or "Group:sectionIndex:groupIndex"
		let tmpParts = tmpSelectEl.value.split(':');
		let tmpType = tmpParts[0];
		let tmpSectionIndex = parseInt(tmpParts[1], 10);
		let tmpGroupIndex = (tmpParts.length > 2) ? parseInt(tmpParts[2], 10) : undefined;

		let tmpTarget = this._resolveSolverTarget(tmpType, tmpSectionIndex, tmpGroupIndex);
		if (!tmpTarget)
		{
			return;
		}

		// Add an empty solver expression
		tmpTarget.Solvers.push('');
		let tmpNewSolverIndex = tmpTarget.Solvers.length - 1;

		// Open the new solver in the editor
		this.openSolverEditor(tmpType, tmpSectionIndex, tmpNewSolverIndex, tmpGroupIndex);
	}

	/**
	 * Render the "Add Solver" helper widget with a section/group dropdown and add button.
	 * Used at the bottom of both the Solvers tab and the Solver Editor list.
	 *
	 * @param {string} pSelectId - Unique DOM ID for the select element
	 * @returns {string} HTML string
	 */
	_renderAddSolverHelper(pSelectId)
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpHTML = '';

		tmpHTML += '<div class="pict-fe-data-section-divider"></div>';
		tmpHTML += '<div class="pict-fe-add-solver-helper">';
		tmpHTML += `<select id="${pSelectId}">`;
		tmpHTML += '<option value="">Select target\u2026</option>';

		if (tmpManifest && Array.isArray(tmpManifest.Sections))
		{
			for (let s = 0; s < tmpManifest.Sections.length; s++)
			{
				let tmpSection = tmpManifest.Sections[s];
				let tmpSectionName = tmpSection.Name || tmpSection.Hash || ('Section ' + (s + 1));

				// Section-level solver target
				tmpHTML += `<option value="Section:${s}">${this._escapeHTML(tmpSectionName)}</option>`;

				// Tabular group solver targets
				if (Array.isArray(tmpSection.Groups))
				{
					for (let g = 0; g < tmpSection.Groups.length; g++)
					{
						let tmpGroup = tmpSection.Groups[g];
						let tmpLayout = tmpGroup.Layout || 'Record';
						if (tmpLayout === 'Record')
						{
							continue;
						}
						let tmpGroupName = tmpGroup.Name || tmpGroup.Hash || ('Group ' + (g + 1));
						tmpHTML += `<option value="Group:${s}:${g}">\u00A0\u00A0\u00A0\u203A ${this._escapeHTML(tmpGroupName)}</option>`;
					}
				}
			}
		}

		tmpHTML += '</select>';
		tmpHTML += `<button class="pict-fe-solver-add-btn" onclick="${tmpPanelViewRef}.addSolverFromHelper('${pSelectId}')">+ Add Solver</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/**
	 * Remove a solver entry.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {number} [pGroupIndex]
	 */
	removeSolver(pType, pSectionIndex, pSolverIndex, pGroupIndex)
	{
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget || pSolverIndex < 0 || pSolverIndex >= tmpTarget.Solvers.length)
		{
			return;
		}

		tmpTarget.Solvers.splice(pSolverIndex, 1);
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Move a solver entry up or down.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {number} pDirection - -1 for up, +1 for down
	 * @param {number} [pGroupIndex]
	 */
	moveSolver(pType, pSectionIndex, pSolverIndex, pDirection, pGroupIndex)
	{
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget)
		{
			return;
		}

		let tmpNewIndex = pSolverIndex + pDirection;
		if (tmpNewIndex < 0 || tmpNewIndex >= tmpTarget.Solvers.length)
		{
			return;
		}

		let tmpSolver = tmpTarget.Solvers.splice(pSolverIndex, 1)[0];
		tmpTarget.Solvers.splice(tmpNewIndex, 0, tmpSolver);
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Update a solver's expression value.
	 * If the solver was a string, keep it as a string.
	 * If it was an object, update the Expression property.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {string} pExpression
	 * @param {number} [pGroupIndex]
	 */
	updateSolverExpression(pType, pSectionIndex, pSolverIndex, pExpression, pGroupIndex)
	{
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget || pSolverIndex < 0 || pSolverIndex >= tmpTarget.Solvers.length)
		{
			return;
		}

		let tmpSolver = tmpTarget.Solvers[pSolverIndex];

		if (typeof tmpSolver === 'object' && tmpSolver !== null)
		{
			// Object format — update the Expression property
			tmpSolver.Expression = pExpression;
		}
		else
		{
			// String format — replace with the new string
			tmpTarget.Solvers[pSolverIndex] = pExpression;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Update a solver's ordinal value.
	 * If the ordinal is set on a string solver, promote it to object format.
	 * If the ordinal is cleared on an object solver, demote it to string format.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {string} pOrdinalStr
	 * @param {number} [pGroupIndex]
	 */
	updateSolverOrdinal(pType, pSectionIndex, pSolverIndex, pOrdinalStr, pGroupIndex)
	{
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget || pSolverIndex < 0 || pSolverIndex >= tmpTarget.Solvers.length)
		{
			return;
		}

		let tmpSolver = tmpTarget.Solvers[pSolverIndex];
		let tmpOrdinalTrimmed = (pOrdinalStr || '').trim();

		if (tmpOrdinalTrimmed === '' || tmpOrdinalTrimmed === '1')
		{
			// Ordinal is 1 (the default) or empty — demote to string if it was an object
			if (typeof tmpSolver === 'object' && tmpSolver !== null)
			{
				tmpTarget.Solvers[pSolverIndex] = tmpSolver.Expression || '';
			}
			// If already a string, nothing to do — 1 is the implicit default
		}
		else
		{
			let tmpOrdinalValue = parseInt(tmpOrdinalTrimmed, 10);
			if (isNaN(tmpOrdinalValue))
			{
				return;
			}

			if (typeof tmpSolver === 'string')
			{
				// Promote string to object format
				tmpTarget.Solvers[pSolverIndex] = { Ordinal: tmpOrdinalValue, Expression: tmpSolver };
			}
			else if (typeof tmpSolver === 'object' && tmpSolver !== null)
			{
				tmpSolver.Ordinal = tmpOrdinalValue;
			}
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*                     Solver Drag and Drop                                   */
	/* -------------------------------------------------------------------------- */

	/**
	 * Handle dragstart on a solver entry.
	 *
	 * @param {Event} pEvent
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {number} [pGroupIndex]
	 */
	onSolverDragStart(pEvent, pType, pSectionIndex, pSolverIndex, pGroupIndex)
	{
		if (!this._ParentFormEditor._DragAndDropEnabled)
		{
			return;
		}

		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		this._SolverDragState =
		{
			Type: pType,
			SectionIndex: pSectionIndex,
			SolverIndex: pSolverIndex,
			GroupIndex: pGroupIndex
		};

		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.effectAllowed = 'move';
			pEvent.dataTransfer.setData('text/plain', '');
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.add('pict-fe-dragging');
		}
	}

	/**
	 * Handle dragover on a solver entry.
	 *
	 * @param {Event} pEvent
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSolverIndex
	 */
	onSolverDragOver(pEvent, pType, pSolverIndex)
	{
		if (!this._ParentFormEditor._DragAndDropEnabled || !this._SolverDragState)
		{
			return;
		}

		if (this._SolverDragState.Type !== pType)
		{
			return;
		}

		if (pEvent)
		{
			pEvent.preventDefault();
			pEvent.stopPropagation();
		}

		if (pEvent && pEvent.currentTarget && this._SolverDragState.SolverIndex !== pSolverIndex)
		{
			pEvent.currentTarget.classList.add('pict-fe-drag-over');
		}
	}

	/**
	 * Handle dragleave on a solver entry.
	 *
	 * @param {Event} pEvent
	 */
	onSolverDragLeave(pEvent)
	{
		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-drag-over');
		}
	}

	/**
	 * Handle drop on a solver entry — reorder the solver.
	 *
	 * @param {Event} pEvent
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pTargetIndex
	 * @param {number} [pGroupIndex]
	 */
	onSolverDrop(pEvent, pType, pSectionIndex, pTargetIndex, pGroupIndex)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
			pEvent.stopPropagation();
		}

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-drag-over');
		}

		if (!this._ParentFormEditor._DragAndDropEnabled || !this._SolverDragState)
		{
			this._SolverDragState = null;
			return;
		}

		if (this._SolverDragState.Type !== pType)
		{
			this._SolverDragState = null;
			return;
		}

		let tmpSourceIndex = this._SolverDragState.SolverIndex;
		this._SolverDragState = null;

		if (tmpSourceIndex === pTargetIndex)
		{
			return;
		}

		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget)
		{
			return;
		}

		// Move the solver from source to target position
		let tmpSolver = tmpTarget.Solvers.splice(tmpSourceIndex, 1)[0];
		tmpTarget.Solvers.splice(pTargetIndex, 0, tmpSolver);
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Handle dragend on a solver entry — clean up.
	 *
	 * @param {Event} pEvent
	 */
	onSolverDragEnd(pEvent)
	{
		this._SolverDragState = null;

		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-dragging');
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Solver Editor Tab                                      */
	/* -------------------------------------------------------------------------- */

	/**
	 * Open the solver editor for a given solver entry.
	 * Switches to the Solver Editor tab and loads the solver for editing.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {number} [pGroupIndex]
	 */
	openSolverEditor(pType, pSectionIndex, pSolverIndex, pGroupIndex)
	{
		// If an editor context already exists, push it onto the navigation stack
		if (this._SolverEditorContext)
		{
			this._SolverEditorStack.push(
			{
				Context: JSON.parse(JSON.stringify(this._SolverEditorContext)),
				ExpandedHash: this._SolverEditorExpandedHash
			});
		}
		else
		{
			// Fresh open — clear any stale stack
			this._SolverEditorStack = [];
		}

		// Reset expanded reference state
		this._SolverEditorExpandedHash = null;

		// Resolve the solver entry
		let tmpTarget = this._resolveSolverTarget(pType, pSectionIndex, pGroupIndex);
		if (!tmpTarget || pSolverIndex < 0 || pSolverIndex >= tmpTarget.Solvers.length)
		{
			return;
		}

		let tmpSolver = tmpTarget.Solvers[pSolverIndex];
		let tmpExpression = '';
		let tmpOrdinal = '';

		if (typeof tmpSolver === 'string')
		{
			tmpExpression = tmpSolver;
		}
		else if (typeof tmpSolver === 'object' && tmpSolver !== null)
		{
			tmpExpression = tmpSolver.Expression || '';
			tmpOrdinal = (tmpSolver.Ordinal !== undefined && tmpSolver.Ordinal !== null) ? String(tmpSolver.Ordinal) : '';
		}

		// Display ordinal: show "1" for strings (implicit default)
		let tmpDisplayOrdinal = tmpOrdinal || '1';

		// Store context
		this._SolverEditorContext =
		{
			Type: pType,
			SectionIndex: pSectionIndex,
			SolverIndex: pSolverIndex,
			GroupIndex: pGroupIndex,
			Expression: tmpExpression,
			Ordinal: tmpDisplayOrdinal
		};

		// Switch to the Solver Editor tab (this triggers renderSolverEditorTabPanel)
		this._ParentFormEditor.switchTab('solvereditor');
	}

	/**
	 * Render the reference list content for the solver editor.
	 * Each entry shows two rows:
	 *   Row 1: Name (left) + Hash: XYZ (right)
	 *   Row 2: Address (left) + Insert button (right)
	 *
	 * @param {string} pFilterText - Search filter text
	 * @returns {string} HTML for the reference list items
	 */
	_renderSolverEditorReference(pFilterText)
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpEntries = this._ParentFormEditor._UtilitiesProvider.getAllInputEntries();
		let tmpFilter = (pFilterText || '').toLowerCase().trim();

		// Build a map of hash → { assignment, references[] }
		let tmpSolverMap = this._buildSolverHashMapAll();

		// Group entries by section
		let tmpGrouped = {};
		let tmpSectionOrder = [];

		for (let i = 0; i < tmpEntries.length; i++)
		{
			let tmpEntry = tmpEntries[i];
			let tmpAddress = tmpEntry.Address || '';
			let tmpLabel = tmpEntry.Label || '';
			let tmpHash = tmpEntry.Hash || '';
			let tmpGroupName = tmpEntry.GroupName || '';
			let tmpSectionName = tmpEntry.SectionName || '';

			// Apply filter
			if (tmpFilter)
			{
				let tmpSearchable = (tmpAddress + ' ' + tmpLabel + ' ' + tmpHash + ' ' + tmpGroupName + ' ' + tmpSectionName).toLowerCase();
				if (tmpSearchable.indexOf(tmpFilter) < 0)
				{
					continue;
				}
			}

			// Build a group key — for tabular entries include the group name
			let tmpGroupKey = tmpSectionName;
			if (tmpEntry.IsTabular)
			{
				tmpGroupKey = tmpSectionName + ' \u203A ' + tmpGroupName + ' (Tabular)';
			}

			if (!tmpGrouped[tmpGroupKey])
			{
				tmpGrouped[tmpGroupKey] = [];
				tmpSectionOrder.push(tmpGroupKey);
			}

			tmpGrouped[tmpGroupKey].push(tmpEntry);
		}

		if (tmpSectionOrder.length === 0)
		{
			return '<div class="pict-fe-solver-empty">No matching entries.</div>';
		}

		let tmpHTML = '';

		for (let g = 0; g < tmpSectionOrder.length; g++)
		{
			let tmpKey = tmpSectionOrder[g];
			let tmpItems = tmpGrouped[tmpKey];

			tmpHTML += `<div class="pict-fe-solver-modal-reference-group">${this._escapeHTML(tmpKey)}</div>`;

			for (let j = 0; j < tmpItems.length; j++)
			{
				let tmpItem = tmpItems[j];
				let tmpAddress = tmpItem.Address || '';
				let tmpHash = tmpItem.Hash || '';
				let tmpLabel = tmpItem.Label || tmpAddress;
				let tmpEscapedAddress = this._escapeAttr(tmpAddress).replace(/'/g, "\\'");
				let tmpEscapedHash = this._escapeAttr(tmpHash).replace(/'/g, "\\'");

				// Determine solver data for this hash
				let tmpSolverData = tmpHash ? tmpSolverMap[tmpHash] : null;
				let tmpIsExpanded = (this._SolverEditorExpandedHash === tmpHash && tmpHash);

				tmpHTML += `<div class="pict-fe-solver-modal-reference-item${tmpIsExpanded ? ' pict-fe-solver-modal-reference-item-expanded' : ''}" onclick="${tmpPanelViewRef}.toggleSolverReferenceDetail('${tmpEscapedHash}')">`;

				// Row 1: Name (left) + Hash (right)
				tmpHTML += '<div class="pict-fe-solver-modal-reference-row">';
				tmpHTML += `<span class="pict-fe-solver-modal-reference-name">${this._escapeHTML(tmpLabel)}</span>`;
				if (tmpHash)
				{
					tmpHTML += `<span class="pict-fe-solver-modal-reference-hash">Hash: ${this._escapeHTML(tmpHash)}</span>`;
				}
				tmpHTML += '</div>';

				// Row 2: Address (left) + Insert button (right)
				tmpHTML += '<div class="pict-fe-solver-modal-reference-row">';
				tmpHTML += `<span class="pict-fe-solver-modal-reference-address">Address: ${this._escapeHTML(tmpAddress)}</span>`;
				tmpHTML += `<button class="pict-fe-solver-modal-reference-insert-btn" onclick="event.stopPropagation();${tmpPanelViewRef}.insertSolverReference('${tmpEscapedAddress}')">Insert</button>`;
				tmpHTML += '</div>';

				// Expanded detail section (shown only when this hash is expanded)
				if (tmpIsExpanded && tmpSolverData)
				{
					tmpHTML += '<div class="pict-fe-solver-modal-reference-detail">';

					if (tmpSolverData.assignment)
					{
						let tmpAssign = tmpSolverData.assignment;
						let tmpAssignGroupArg = (tmpAssign.Type === 'Group') ? `, ${tmpAssign.GroupIndex}` : '';
						tmpHTML += '<div class="pict-fe-solver-modal-reference-detail-label">ASSIGNED BY</div>';
						tmpHTML += `<div class="pict-fe-solver-modal-reference-detail-equation pict-fe-solver-modal-reference-detail-assignment pict-fe-solver-modal-reference-detail-link" onclick="event.stopPropagation();${tmpPanelViewRef}.openSolverEditor('${tmpAssign.Type}', ${tmpAssign.SectionIndex}, ${tmpAssign.SolverIndex}${tmpAssignGroupArg})">${this._escapeHTML(tmpAssign.Expression)}</div>`;
					}

					if (tmpSolverData.references.length > 0)
					{
						tmpHTML += '<div class="pict-fe-solver-modal-reference-detail-label">REFERENCED IN</div>';
						for (let r = 0; r < tmpSolverData.references.length; r++)
						{
							let tmpRefExpr = tmpSolverData.references[r];
							let tmpRefGroupArg = (tmpRefExpr.Type === 'Group') ? `, ${tmpRefExpr.GroupIndex}` : '';
							tmpHTML += `<div class="pict-fe-solver-modal-reference-detail-equation pict-fe-solver-modal-reference-detail-link" onclick="event.stopPropagation();${tmpPanelViewRef}.openSolverEditor('${tmpRefExpr.Type}', ${tmpRefExpr.SectionIndex}, ${tmpRefExpr.SolverIndex}${tmpRefGroupArg})">${this._escapeHTML(tmpRefExpr.Expression)}</div>`;
						}
					}

					if (!tmpSolverData.assignment && tmpSolverData.references.length === 0)
					{
						tmpHTML += '<div class="pict-fe-solver-modal-reference-detail-empty">No solver equations reference this hash.</div>';
					}

					tmpHTML += '</div>';
				}

				tmpHTML += '</div>';
			}
		}

		return tmpHTML;
	}

	/**
	 * Build a comprehensive map of Hash → { assignment, references[] } from all solver expressions.
	 * Scans all section solvers and group RecordSetSolvers in the manifest.
	 *
	 * For each hash, the assignment is the expression where the hash appears on the left side of '='.
	 * All other expressions containing the hash are references. Results are sorted by ordinal.
	 *
	 * Each expression entry includes source location: { Expression, Ordinal, Type, SectionIndex, SolverIndex, GroupIndex }
	 * so the UI can open the correct solver editor when clicked.
	 *
	 * @returns {Object} Map of hash string → { assignment: { Expression, Ordinal, Type, SectionIndex, SolverIndex, GroupIndex } | null, references: [{ Expression, Ordinal, Type, SectionIndex, SolverIndex, GroupIndex }] }
	 */
	_buildSolverHashMapAll()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpMap = {};

		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return tmpMap;
		}

		// Collect all solver expressions as { Expression, Ordinal, Type, SectionIndex, SolverIndex, GroupIndex }
		let tmpAllExpressions = [];

		for (let s = 0; s < tmpManifest.Sections.length; s++)
		{
			let tmpSection = tmpManifest.Sections[s];

			// Section solvers
			if (Array.isArray(tmpSection.Solvers))
			{
				for (let i = 0; i < tmpSection.Solvers.length; i++)
				{
					let tmpSolver = tmpSection.Solvers[i];
					if (typeof tmpSolver === 'string')
					{
						if (tmpSolver)
						{
							tmpAllExpressions.push({ Expression: tmpSolver, Ordinal: 1, Type: 'Section', SectionIndex: s, SolverIndex: i, GroupIndex: -1 });
						}
					}
					else if (tmpSolver && tmpSolver.Expression)
					{
						tmpAllExpressions.push({ Expression: tmpSolver.Expression, Ordinal: tmpSolver.Ordinal || 1, Type: 'Section', SectionIndex: s, SolverIndex: i, GroupIndex: -1 });
					}
				}
			}

			// Group RecordSetSolvers
			if (Array.isArray(tmpSection.Groups))
			{
				for (let g = 0; g < tmpSection.Groups.length; g++)
				{
					let tmpGroup = tmpSection.Groups[g];
					if (Array.isArray(tmpGroup.RecordSetSolvers))
					{
						for (let i = 0; i < tmpGroup.RecordSetSolvers.length; i++)
						{
							let tmpSolver = tmpGroup.RecordSetSolvers[i];
							if (typeof tmpSolver === 'string')
							{
								if (tmpSolver)
								{
									tmpAllExpressions.push({ Expression: tmpSolver, Ordinal: 1, Type: 'Group', SectionIndex: s, SolverIndex: i, GroupIndex: g });
								}
							}
							else if (tmpSolver && tmpSolver.Expression)
							{
								tmpAllExpressions.push({ Expression: tmpSolver.Expression, Ordinal: tmpSolver.Ordinal || 1, Type: 'Group', SectionIndex: s, SolverIndex: i, GroupIndex: g });
							}
						}
					}
				}
			}
		}

		// Sort all expressions by Ordinal ascending
		tmpAllExpressions.sort(function (a, b) { return a.Ordinal - b.Ordinal; });

		// For each Descriptor hash, scan all expressions to find assignment and references
		if (tmpManifest.Descriptors && typeof tmpManifest.Descriptors === 'object')
		{
			let tmpAddresses = Object.keys(tmpManifest.Descriptors);
			for (let a = 0; a < tmpAddresses.length; a++)
			{
				let tmpDescriptor = tmpManifest.Descriptors[tmpAddresses[a]];
				let tmpHash = tmpDescriptor ? tmpDescriptor.Hash : null;
				if (!tmpHash || tmpMap[tmpHash])
				{
					continue;
				}

				let tmpEntry = { assignment: null, references: [] };

				for (let e = 0; e < tmpAllExpressions.length; e++)
				{
					let tmpExprObj = tmpAllExpressions[e];
					if (tmpExprObj.Expression.indexOf(tmpHash) < 0)
					{
						continue;
					}

					// Check if this is an assignment (hash is on the left side of '=')
					let tmpEqIndex = tmpExprObj.Expression.indexOf('=');
					if (tmpEqIndex >= 0)
					{
						let tmpLeftSide = tmpExprObj.Expression.substring(0, tmpEqIndex).trim();
						if (tmpLeftSide === tmpHash && !tmpEntry.assignment)
						{
							tmpEntry.assignment = { Expression: tmpExprObj.Expression, Ordinal: tmpExprObj.Ordinal, Type: tmpExprObj.Type, SectionIndex: tmpExprObj.SectionIndex, SolverIndex: tmpExprObj.SolverIndex, GroupIndex: tmpExprObj.GroupIndex };
							continue;
						}
					}

					tmpEntry.references.push({ Expression: tmpExprObj.Expression, Ordinal: tmpExprObj.Ordinal, Type: tmpExprObj.Type, SectionIndex: tmpExprObj.SectionIndex, SolverIndex: tmpExprObj.SolverIndex, GroupIndex: tmpExprObj.GroupIndex });
				}

				tmpMap[tmpHash] = tmpEntry;
			}
		}

		return tmpMap;
	}

	/**
	 * Handle search input in the solver editor reference panel.
	 * Re-renders only the reference list, preserving the rest of the editor.
	 *
	 * @param {string} pSearchText
	 */
	_onSolverEditorReferenceSearch(pSearchText)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpRefList = document.getElementById(`PictFE-SolverEditor-RefList-${tmpEditorHash}`);
		if (!tmpRefList)
		{
			return;
		}

		tmpRefList.innerHTML = this._renderSolverEditorReference(pSearchText);
	}

	/**
	 * Toggle the expanded detail view for a reference item in the solver editor.
	 * If the given hash is already expanded, collapse it. Otherwise expand it
	 * (collapsing any previously expanded item).
	 *
	 * @param {string} pHash - The hash of the reference item to toggle
	 */
	toggleSolverReferenceDetail(pHash)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		// Toggle: if already expanded, collapse; otherwise expand
		if (this._SolverEditorExpandedHash === pHash)
		{
			this._SolverEditorExpandedHash = null;
		}
		else
		{
			this._SolverEditorExpandedHash = pHash;
		}

		// Read the current search filter and re-render the reference list
		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpSearchInput = document.getElementById(`PictFE-SolverEditor-RefSearch-${tmpEditorHash}`);
		let tmpFilterText = tmpSearchInput ? tmpSearchInput.value : '';

		let tmpRefList = document.getElementById(`PictFE-SolverEditor-RefList-${tmpEditorHash}`);
		if (tmpRefList)
		{
			tmpRefList.innerHTML = this._renderSolverEditorReference(tmpFilterText);
		}
	}

	/**
	 * Insert a reference address at the cursor position in the solver editor expression textarea.
	 *
	 * @param {string} pAddress - The address string to insert
	 */
	insertSolverReference(pAddress)
	{
		let tmpSolverEditor = this._ParentFormEditor._SolverCodeEditorView;
		if (!tmpSolverEditor || !tmpSolverEditor.codeJar)
		{
			return;
		}

		// Append the reference address to the end of the current code
		let tmpCurrentCode = tmpSolverEditor.getCode();
		tmpSolverEditor.setCode(tmpCurrentCode + pAddress);
	}

	/**
	 * Close the solver editor.
	 * If there is a previous context on the navigation stack, pop and restore it.
	 * Otherwise clear the context and show the solver list.
	 */
	closeSolverEditor()
	{
		// Check if we should navigate back instead of fully closing
		if (this._SolverEditorStack.length > 0)
		{
			let tmpPrevious = this._SolverEditorStack.pop();

			// Restore previous context
			this._SolverEditorContext = tmpPrevious.Context;
			this._SolverEditorExpandedHash = tmpPrevious.ExpandedHash;

			// Re-render the editor tab with the restored context
			this.renderSolverEditorTabPanel();
			return;
		}

		// No stack entries — go back to solver list
		this._SolverEditorContext = null;
		this._SolverEditorExpandedHash = null;
		this.renderSolverEditorTabPanel();
	}

	/**
	 * Close the solver editor entirely, clearing the navigation stack.
	 * Returns to the solver list view.
	 */
	closeSolverEditorFull()
	{
		this._SolverEditorStack = [];
		this._SolverEditorContext = null;
		this._SolverEditorExpandedHash = null;
		this.renderSolverEditorTabPanel();
	}

	/**
	 * Navigate the solver editor breadcrumb to a specific stack index.
	 * If pIndex is -1, go to the solver list (clear everything).
	 * Otherwise, truncate the stack to pIndex and restore that entry.
	 *
	 * @param {number} pIndex - The breadcrumb index to navigate to (-1 for list)
	 */
	navigateSolverEditorBreadcrumb(pIndex)
	{
		if (pIndex < 0)
		{
			// Go to solver list
			this._SolverEditorStack = [];
			this._SolverEditorContext = null;
			this._SolverEditorExpandedHash = null;
		}
		else if (pIndex < this._SolverEditorStack.length)
		{
			// Restore the entry at pIndex
			let tmpEntry = this._SolverEditorStack[pIndex];
			this._SolverEditorContext = tmpEntry.Context;
			this._SolverEditorExpandedHash = tmpEntry.ExpandedHash;
			// Truncate stack to before this entry
			this._SolverEditorStack = this._SolverEditorStack.slice(0, pIndex);
		}

		this.renderSolverEditorTabPanel();
	}

	/**
	 * Save the solver editor values and close.
	 * Reads expression and ordinal from the editor, updates the solver,
	 * navigates back (or to list), and re-renders.
	 */
	saveSolverEditor()
	{
		if (!this._SolverEditorContext)
		{
			return;
		}

		let tmpContext = this._SolverEditorContext;

		if (typeof document !== 'undefined')
		{
			let tmpEditorHash = this._ParentFormEditor.Hash;

			// Read expression from the code editor
			let tmpSolverEditor = this._ParentFormEditor._SolverCodeEditorView;
			let tmpExpression = (tmpSolverEditor && tmpSolverEditor.codeJar)
				? tmpSolverEditor.getCode()
				: tmpContext.Expression;

			let tmpOrdinalEl = document.getElementById(`PictFE-SolverEditor-Ordinal-${tmpEditorHash}`);
			let tmpOrdinal = tmpOrdinalEl ? tmpOrdinalEl.value : tmpContext.Ordinal;

			// Update the solver expression first, then ordinal
			// (ordinal may promote/demote the solver format)
			this.updateSolverExpression(tmpContext.Type, tmpContext.SectionIndex, tmpContext.SolverIndex, tmpExpression, tmpContext.GroupIndex);
			this.updateSolverOrdinal(tmpContext.Type, tmpContext.SectionIndex, tmpContext.SolverIndex, tmpOrdinal, tmpContext.GroupIndex);
		}

		this.closeSolverEditor();
		this._ParentFormEditor.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*                     Group Properties Tab                                   */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the group selector dropdown for the Group tab.
	 * Groups are organized by section using group labels.
	 *
	 * @returns {string} HTML string
	 */
	_renderGroupSelectorDropdown()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return '';
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpSelectedLabel = '';
		if (this._SelectedGroup)
		{
			let tmpSection = tmpManifest.Sections[this._SelectedGroup.SectionIndex];
			if (tmpSection && Array.isArray(tmpSection.Groups))
			{
				let tmpGroup = tmpSection.Groups[this._SelectedGroup.GroupIndex];
				if (tmpGroup)
				{
					tmpSelectedLabel = (tmpGroup.Name || 'Unnamed') + ' (' + (tmpGroup.Hash || '') + ')';
				}
			}
		}

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-searchable-selector" id="FormEditor-GroupSelector-Wrap-${tmpEditorHash}">`;
		tmpHTML += `<input class="pict-fe-searchable-selector-input" id="FormEditor-GroupSelector-${tmpEditorHash}" type="text" placeholder="\u2014 Select a group \u2014" value="${this._escapeAttr(tmpSelectedLabel)}" autocomplete="off" />`;
		tmpHTML += `<div class="pict-fe-searchable-selector-list" id="FormEditor-GroupSelector-List-${tmpEditorHash}">`;

		let tmpHasGroups = false;
		for (let s = 0; s < tmpManifest.Sections.length; s++)
		{
			let tmpSection = tmpManifest.Sections[s];
			if (!Array.isArray(tmpSection.Groups) || tmpSection.Groups.length === 0)
			{
				continue;
			}

			tmpHTML += `<div class="pict-fe-searchable-selector-group-label">${this._escapeHTML(tmpSection.Name || tmpSection.Hash || 'Section ' + s)}</div>`;

			for (let g = 0; g < tmpSection.Groups.length; g++)
			{
				let tmpGroup = tmpSection.Groups[g];
				let tmpLabel = (tmpGroup.Name || 'Unnamed') + ' (' + (tmpGroup.Hash || '') + ')';
				let tmpActiveClass = (this._SelectedGroup && this._SelectedGroup.SectionIndex === s && this._SelectedGroup.GroupIndex === g) ? ' pict-fe-searchable-selector-item-active' : '';
				tmpHTML += `<div class="pict-fe-searchable-selector-item${tmpActiveClass}" data-value="${s},${g}" data-label="${this._escapeAttr(tmpLabel)}" data-section="${this._escapeAttr(tmpSection.Name || tmpSection.Hash || '')}" onclick="${tmpPanelViewRef}.onGroupSelectorChange(${s}, ${g})">${this._escapeHTML(tmpLabel)}</div>`;
				tmpHasGroups = true;
			}
		}

		if (!tmpHasGroups)
		{
			tmpHTML += '<div class="pict-fe-searchable-selector-empty">No groups</div>';
		}

		tmpHTML += '</div>'; // list
		tmpHTML += '</div>'; // wrap

		return tmpHTML;
	}

	/**
	 * Handle a change in the group selector.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	onGroupSelectorChange(pSectionIndex, pGroupIndex)
	{
		if (!this._ParentFormEditor)
		{
			return;
		}

		this._ParentFormEditor._UtilitiesProvider.selectGroup(pSectionIndex, pGroupIndex);
	}

	/**
	 * Render the Group Properties tab content.
	 *
	 * @returns {string} HTML string
	 */
	_renderGroupProperties()
	{
		if (!this._SelectedGroup)
		{
			return '<div class="pict-fe-props-placeholder">Click a group icon to view its properties.</div>';
		}

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return '<div class="pict-fe-props-placeholder">No manifest data available.</div>';
		}

		let tmpSection = tmpManifest.Sections[this._SelectedGroup.SectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return '<div class="pict-fe-props-placeholder">Section not found.</div>';
		}

		let tmpGroup = tmpSection.Groups[this._SelectedGroup.GroupIndex];
		if (!tmpGroup)
		{
			return '<div class="pict-fe-props-placeholder">Group not found.</div>';
		}

		let tmpPanelViewRef = this._browserViewRef();

		let tmpName = tmpGroup.Name || '';
		let tmpHash = tmpGroup.Hash || '';
		let tmpLayout = tmpGroup.Layout || 'Record';
		let tmpCSSClass = tmpGroup.CSSClass || '';

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-body">';

		// Name field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Name</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpName)}" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('Name', this.value)" />`;
		tmpHTML += '</div>';

		// Hash field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpHash)}" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('Hash', this.value)" />`;
		tmpHTML += '</div>';

		// Layout dropdown
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Layout</div>';
		tmpHTML += `<select class="pict-fe-props-input" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('Layout', this.value)">`;
		let tmpLayouts = ['Record', 'Tabular', 'RecordSet'];
		for (let i = 0; i < tmpLayouts.length; i++)
		{
			let tmpSelected = (tmpLayouts[i] === tmpLayout) ? ' selected' : '';
			tmpHTML += `<option value="${tmpLayouts[i]}"${tmpSelected}>${tmpLayouts[i]}</option>`;
		}
		tmpHTML += '</select>';
		tmpHTML += '</div>';

		// CSSClass field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">CSSClass</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpCSSClass)}" placeholder="e.g. MyCustomGroup" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('CSSClass', this.value)" />`;
		tmpHTML += '</div>';

		// Tabular/RecordSet-specific fields
		if (tmpLayout === 'Tabular' || tmpLayout === 'RecordSet')
		{
			let tmpRecordSetAddress = tmpGroup.RecordSetAddress || '';
			let tmpRecordManifest = tmpGroup.RecordManifest || '';

			tmpHTML += '<div class="pict-fe-props-section-divider"></div>';

			// RecordSetAddress field
			tmpHTML += '<div class="pict-fe-props-field">';
			tmpHTML += '<div class="pict-fe-props-label">RecordSetAddress</div>';
			tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpRecordSetAddress)}" placeholder="e.g. FruitData.FruityVice" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('RecordSetAddress', this.value)" />`;
			tmpHTML += '</div>';

			// RecordManifest dropdown
			tmpHTML += '<div class="pict-fe-props-field">';
			tmpHTML += '<div class="pict-fe-props-label">RecordManifest</div>';
			let tmpManifestNames = this._ParentFormEditor._ManifestOpsProvider.getReferenceManifestNames();
			tmpHTML += `<select class="pict-fe-props-input" onchange="${tmpPanelViewRef}.commitGroupPropertyChange('RecordManifest', this.value)">`;
			tmpHTML += `<option value=""${tmpRecordManifest ? '' : ' selected'}>\u2014 None \u2014</option>`;
			for (let m = 0; m < tmpManifestNames.length; m++)
			{
				let tmpSelected = (tmpManifestNames[m] === tmpRecordManifest) ? ' selected' : '';
				tmpHTML += `<option value="${this._escapeAttr(tmpManifestNames[m])}"${tmpSelected}>${this._escapeHTML(tmpManifestNames[m])}</option>`;
			}
			tmpHTML += '</select>';
			tmpHTML += this._renderRecordManifestSummary(tmpRecordManifest);
			tmpHTML += '</div>';

			// RecordSetSolvers
			tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
			tmpHTML += this._renderSolverList('Group', tmpGroup.RecordSetSolvers, this._SelectedGroup.SectionIndex, this._SelectedGroup.GroupIndex);
		}

		tmpHTML += '</div>'; // pict-fe-props-body

		return tmpHTML;
	}

	/**
	 * Render a small summary of the selected RecordManifest.
	 * Shows column count, data types, and scope.
	 *
	 * @param {string} pManifestName - The RecordManifest name
	 * @returns {string} HTML string
	 */
	_renderRecordManifestSummary(pManifestName)
	{
		if (!pManifestName)
		{
			return '';
		}

		let tmpRefManifest = this._ParentFormEditor._ManifestOpsProvider._resolveReferenceManifest(pManifestName);

		if (!tmpRefManifest)
		{
			return '<div class="pict-fe-manifest-summary pict-fe-manifest-summary-error">Manifest not found</div>';
		}

		let tmpDescriptors = tmpRefManifest.Descriptors;
		let tmpColumnKeys = (tmpDescriptors && typeof tmpDescriptors === 'object') ? Object.keys(tmpDescriptors) : [];
		let tmpColumnCount = tmpColumnKeys.length;

		// Count data types
		let tmpDataTypes = {};
		for (let i = 0; i < tmpColumnKeys.length; i++)
		{
			let tmpDesc = tmpDescriptors[tmpColumnKeys[i]];
			let tmpType = (tmpDesc && tmpDesc.DataType) ? tmpDesc.DataType : 'Unknown';
			tmpDataTypes[tmpType] = (tmpDataTypes[tmpType] || 0) + 1;
		}

		// Count how many have PictForm configuration
		let tmpConfiguredCount = 0;
		for (let i = 0; i < tmpColumnKeys.length; i++)
		{
			let tmpDesc = tmpDescriptors[tmpColumnKeys[i]];
			if (tmpDesc && tmpDesc.PictForm)
			{
				tmpConfiguredCount++;
			}
		}

		let tmpHTML = '<div class="pict-fe-manifest-summary">';

		// Stats row
		tmpHTML += '<div class="pict-fe-manifest-summary-stats">';
		tmpHTML += `<span class="pict-fe-manifest-summary-stat"><strong>${tmpColumnCount}</strong> column${tmpColumnCount !== 1 ? 's' : ''}</span>`;
		if (tmpConfiguredCount > 0)
		{
			tmpHTML += `<span class="pict-fe-manifest-summary-stat"><strong>${tmpConfiguredCount}</strong> configured</span>`;
		}
		tmpHTML += '</div>';

		// Data types
		let tmpTypeKeys = Object.keys(tmpDataTypes);
		if (tmpTypeKeys.length > 0)
		{
			tmpHTML += '<div class="pict-fe-manifest-summary-types">';
			for (let t = 0; t < tmpTypeKeys.length; t++)
			{
				tmpHTML += `<span class="pict-fe-manifest-summary-type">${this._escapeHTML(tmpTypeKeys[t])} (${tmpDataTypes[tmpTypeKeys[t]]})</span>`;
			}
			tmpHTML += '</div>';
		}

		tmpHTML += '</div>';

		return tmpHTML;
	}

	/**
	 * Commit a group property change.
	 *
	 * @param {string} pProperty - 'Name', 'Hash', 'Layout', 'CSSClass', 'RecordSetAddress', or 'RecordManifest'
	 * @param {string} pValue - The new value
	 */
	commitGroupPropertyChange(pProperty, pValue)
	{
		if (!this._SelectedGroup || !this._ParentFormEditor)
		{
			return;
		}

		this._ParentFormEditor._ManifestOpsProvider.updateGroupProperty(this._SelectedGroup.SectionIndex, this._SelectedGroup.GroupIndex, pProperty, pValue);
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Render the input selector dropdown as a searchable selector.
	 * Groups options by section name using group labels.
	 *
	 * @returns {string} HTML string
	 */
	_renderInputSelectorDropdown()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpEntries = this._ParentFormEditor._UtilitiesProvider.getAllInputEntries();
		let tmpEditorHash = this._ParentFormEditor.Hash;

		// Determine selected label
		let tmpSelectedLabel = '';
		for (let i = 0; i < tmpEntries.length; i++)
		{
			let tmpEntry = tmpEntries[i];
			if (tmpEntry.IsTabular)
			{
				if (this._SelectedTabularColumn &&
					this._SelectedTabularColumn.SectionIndex === tmpEntry.SectionIndex &&
					this._SelectedTabularColumn.GroupIndex === tmpEntry.GroupIndex &&
					this._SelectedTabularColumn.ColumnAddress === tmpEntry.Address)
				{
					tmpSelectedLabel = tmpEntry.Label + ' (' + tmpEntry.Address + ')';
					break;
				}
			}
			else
			{
				if (this._SelectedInput &&
					this._SelectedInput.SectionIndex === tmpEntry.SectionIndex &&
					this._SelectedInput.GroupIndex === tmpEntry.GroupIndex &&
					this._SelectedInput.RowIndex === tmpEntry.RowIndex &&
					this._SelectedInput.InputIndex === tmpEntry.InputIndex)
				{
					tmpSelectedLabel = tmpEntry.Label + ' (' + tmpEntry.Address + ')';
					break;
				}
			}
		}

		let tmpHTML = '';
		tmpHTML += `<div class="pict-fe-searchable-selector" id="FormEditor-InputSelector-Wrap-${tmpEditorHash}">`;
		tmpHTML += `<input class="pict-fe-searchable-selector-input" id="FormEditor-InputSelector-${tmpEditorHash}" type="text" placeholder="\u2014 Select an input \u2014" value="${this._escapeAttr(tmpSelectedLabel)}" autocomplete="off" />`;
		tmpHTML += `<div class="pict-fe-searchable-selector-list" id="FormEditor-InputSelector-List-${tmpEditorHash}">`;

		// Group entries by section, with group and row context
		let tmpCurrentSection = null;
		let tmpCurrentGroup = null;
		for (let i = 0; i < tmpEntries.length; i++)
		{
			let tmpEntry = tmpEntries[i];

			if (tmpEntry.SectionName !== tmpCurrentSection)
			{
				tmpCurrentSection = tmpEntry.SectionName;
				tmpCurrentGroup = null;
				tmpHTML += `<div class="pict-fe-searchable-selector-group-label">${this._escapeHTML(tmpCurrentSection)}</div>`;
			}

			// Show a sub-header when the group changes within a section
			let tmpGroupKey = tmpEntry.SectionIndex + ',' + tmpEntry.GroupIndex;
			if (tmpGroupKey !== tmpCurrentGroup)
			{
				tmpCurrentGroup = tmpGroupKey;
				let tmpGroupLabel = tmpEntry.GroupName || ('Group ' + (tmpEntry.GroupIndex + 1));
				if (tmpEntry.IsTabular)
				{
					tmpGroupLabel += ' (Tabular)';
				}
				tmpHTML += `<div class="pict-fe-searchable-selector-subgroup-label">${this._escapeHTML(tmpGroupLabel)}</div>`;
			}

			let tmpValue = '';
			let tmpIsActive = false;

			if (tmpEntry.IsTabular)
			{
				tmpValue = `T:${tmpEntry.SectionIndex},${tmpEntry.GroupIndex},${tmpEntry.Address}`;
				tmpIsActive = (this._SelectedTabularColumn &&
					this._SelectedTabularColumn.SectionIndex === tmpEntry.SectionIndex &&
					this._SelectedTabularColumn.GroupIndex === tmpEntry.GroupIndex &&
					this._SelectedTabularColumn.ColumnAddress === tmpEntry.Address);
			}
			else
			{
				tmpValue = `${tmpEntry.SectionIndex},${tmpEntry.GroupIndex},${tmpEntry.RowIndex},${tmpEntry.InputIndex}`;
				tmpIsActive = (this._SelectedInput &&
					this._SelectedInput.SectionIndex === tmpEntry.SectionIndex &&
					this._SelectedInput.GroupIndex === tmpEntry.GroupIndex &&
					this._SelectedInput.RowIndex === tmpEntry.RowIndex &&
					this._SelectedInput.InputIndex === tmpEntry.InputIndex);
			}

			// Build the display label with row context for record inputs
			let tmpDisplayLabel = tmpEntry.Label + ' (' + tmpEntry.Address + ')';
			if (!tmpEntry.IsTabular && tmpEntry.RowNumber)
			{
				tmpDisplayLabel = 'R' + tmpEntry.RowNumber + ': ' + tmpDisplayLabel;
			}
			let tmpSearchLabel = tmpEntry.Label + ' ' + tmpEntry.Address + ' ' + (tmpEntry.GroupName || '');
			let tmpActiveClass = tmpIsActive ? ' pict-fe-searchable-selector-item-active' : '';
			// Escape single quotes in value for onclick attribute
			let tmpEscapedValue = this._escapeAttr(tmpValue).replace(/'/g, "\\'");
			tmpHTML += `<div class="pict-fe-searchable-selector-item pict-fe-searchable-selector-item-indented${tmpActiveClass}" data-value="${this._escapeAttr(tmpValue)}" data-label="${this._escapeAttr(tmpSearchLabel)}" data-section="${this._escapeAttr(tmpEntry.SectionName || '')}" onclick="${tmpPanelViewRef}.onInputSelectorChange('${tmpEscapedValue}')">${this._escapeHTML(tmpDisplayLabel)}</div>`;
		}

		if (tmpEntries.length === 0)
		{
			tmpHTML += '<div class="pict-fe-searchable-selector-empty">No inputs</div>';
		}

		tmpHTML += '</div>'; // list
		tmpHTML += '</div>'; // wrap

		return tmpHTML;
	}

	/**
	 * Render the input properties fields for the currently selected input.
	 *
	 * @returns {string} HTML string
	 */
	_renderInputProperties()
	{
		// Check for tabular column selection first
		if (this._SelectedTabularColumn)
		{
			return this._renderTabularColumnProperties();
		}

		if (!this._SelectedInput)
		{
			return '<div class="pict-fe-props-placeholder">Select an input to view its properties.</div>';
		}

		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return '<div class="pict-fe-props-placeholder">Select an input to view its properties.</div>';
		}

		let tmpDescriptor = tmpResolved.Descriptor;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpPanelViewRef = this._browserViewRef();
		let tmpIconProvider = this._ParentFormEditor._IconographyProvider;

		let tmpName = tmpDescriptor.Name || '';
		let tmpInputHash = tmpDescriptor.Hash || tmpResolved.Address;
		let tmpDataType = tmpDescriptor.DataType || 'String';
		let tmpInputType = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
		let tmpWidth = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.Width) ? tmpDescriptor.PictForm.Width : '';

		let tmpHTML = '';

		tmpHTML += '<div class="pict-fe-props-body">';

		// Name field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Name</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpName)}" onchange="${tmpPanelViewRef}.commitPropertyChange('Name', this.value)" />`;
		tmpHTML += '</div>';

		// Hash field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpInputHash)}" onchange="${tmpPanelViewRef}.commitPropertyChange('Hash', this.value)" />`;
		tmpHTML += '</div>';

		// Address (editable with confirmation)
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Address</div>';
		tmpHTML += '<div class="pict-fe-props-address-row">';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" id="FormEditor-PropsAddress-${this._ParentFormEditor.Hash}" type="text" value="${this._escapeAttr(tmpResolved.Address)}" />`;
		tmpHTML += `<button class="pict-fe-props-address-confirm" id="FormEditor-PropsAddressConfirm-${this._ParentFormEditor.Hash}" onclick="${tmpPanelViewRef}.confirmAddressChange()" title="Confirm address change" style="display:none;">\u2713</button>`;
		tmpHTML += `<button class="pict-fe-props-address-cancel" id="FormEditor-PropsAddressCancel-${this._ParentFormEditor.Hash}" onclick="${tmpPanelViewRef}.cancelAddressChange()" title="Cancel" style="display:none;">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// DataType dropdown
		let tmpDataTypeIcon = tmpIconProvider.getDataTypeIcon(tmpDataType, 14);
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += `<div class="pict-fe-props-label">${tmpDataTypeIcon ? '<span class="pict-fe-icon" style="margin-right:4px; vertical-align:middle; opacity:0.6;">' + tmpDataTypeIcon + '</span>' : ''}DataType</div>`;
		tmpHTML += `<select class="pict-fe-props-input" onchange="${tmpPanelViewRef}.commitPropertyChange('DataType', this.value)">`;
		let tmpDataTypes = this._ParentFormEditor._ManyfestDataTypes;
		for (let i = 0; i < tmpDataTypes.length; i++)
		{
			let tmpSelected = (tmpDataTypes[i] === tmpDataType) ? ' selected' : '';
			tmpHTML += `<option value="${tmpDataTypes[i]}"${tmpSelected}>${tmpDataTypes[i]}</option>`;
		}
		tmpHTML += '</select>';
		tmpHTML += '</div>';

		// InputType picker button
		let tmpInputTypeIcon = tmpInputType ? tmpIconProvider.getInputTypeIcon(tmpInputType, 14) : '';
		let tmpInputTypeLabel = tmpInputType || 'DataType Default';
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += `<div class="pict-fe-props-label">${tmpInputTypeIcon ? '<span class="pict-fe-icon" style="margin-right:4px; vertical-align:middle; opacity:0.6;">' + tmpInputTypeIcon + '</span>' : ''}InputType</div>`;
		tmpHTML += `<button class="pict-fe-props-inputtype-btn" id="FormEditor-PropsInputTypeBtn-${this._ParentFormEditor.Hash}" onclick="${tmpViewRef}._InputTypePickerView.beginEditInputType(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${this._SelectedInput.InputIndex})">${this._escapeHTML(tmpInputTypeLabel)}</button>`;
		tmpHTML += '</div>';

		// Width field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Width</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="number" min="1" max="12" value="${this._escapeAttr(String(tmpWidth))}" placeholder="auto" onchange="${tmpPanelViewRef}.commitPropertyChange('Width', this.value)" />`;
		tmpHTML += '</div>';

		// Position indicator and move buttons
		let tmpInputIndex = this._SelectedInput.InputIndex;
		let tmpInputCount = tmpResolved.Row && Array.isArray(tmpResolved.Row.Inputs) ? tmpResolved.Row.Inputs.length : 0;
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Position</div>';
		tmpHTML += '<div class="pict-fe-props-position-row">';
		if (tmpInputIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveInputLeft(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${tmpInputIndex})" title="Move left">\u25C0</button>`;
		}
		tmpHTML += `<span class="pict-fe-props-position-label">${tmpInputIndex + 1} of ${tmpInputCount}</span>`;
		if (tmpInputIndex < tmpInputCount - 1)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveInputRight(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${tmpInputIndex})" title="Move right">\u25B6</button>`;
		}
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// InputType-specific properties section
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += this._renderInputTypeProperties(tmpInputType, tmpDescriptor, tmpPanelViewRef);

		// Solver assignment and references for this input
		tmpHTML += this._renderInputSolverInfo(tmpInputHash);

		tmpHTML += '</div>'; // pict-fe-props-body

		return tmpHTML;
	}

	/**
	 * Render solver assignment and reference information for a given input hash.
	 * Shows which solver expression assigns to this input, and which expressions
	 * reference it.
	 *
	 * @param {string} pHash - The input descriptor hash
	 * @returns {string} HTML for the solver info section, or empty string if no solver data
	 */
	_renderInputSolverInfo(pHash)
	{
		if (!pHash)
		{
			return '';
		}

		let tmpSolverMap = this._buildSolverHashMapAll();
		let tmpSolverData = tmpSolverMap[pHash];

		if (!tmpSolverData)
		{
			return '';
		}

		let tmpHasAssignment = !!tmpSolverData.assignment;
		let tmpHasReferences = (tmpSolverData.references.length > 0);

		if (!tmpHasAssignment && !tmpHasReferences)
		{
			return '';
		}

		let tmpPanelViewRef = this._browserViewRef();
		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += '<div class="pict-fe-props-solver-info">';
		tmpHTML += '<div class="pict-fe-props-solver-info-heading">Solvers</div>';

		if (tmpHasAssignment)
		{
			let tmpAssign = tmpSolverData.assignment;
			let tmpGroupArg = (tmpAssign.Type === 'Group') ? `, ${tmpAssign.GroupIndex}` : '';
			tmpHTML += '<div class="pict-fe-props-solver-info-label">Assigned by</div>';
			tmpHTML += `<div class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-assignment pict-fe-props-solver-info-link" onclick="${tmpPanelViewRef}.openSolverEditor('${tmpAssign.Type}', ${tmpAssign.SectionIndex}, ${tmpAssign.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpAssign.Expression)}</div>`;
		}

		if (tmpHasReferences)
		{
			tmpHTML += '<div class="pict-fe-props-solver-info-label">Referenced in</div>';
			for (let i = 0; i < tmpSolverData.references.length; i++)
			{
				let tmpRef = tmpSolverData.references[i];
				let tmpGroupArg = (tmpRef.Type === 'Group') ? `, ${tmpRef.GroupIndex}` : '';
				tmpHTML += `<div class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-link" onclick="${tmpPanelViewRef}.openSolverEditor('${tmpRef.Type}', ${tmpRef.SectionIndex}, ${tmpRef.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpRef.Expression)}</div>`;
			}
		}

		tmpHTML += '</div>';
		return tmpHTML;
	}

	/**
	 * Handle a change in the input selector dropdown.
	 * Parses the "s,g,r,i" value and selects + scrolls to the input,
	 * or parses "T:s,g,address" for tabular column selection.
	 *
	 * @param {string} pValue - Comma-separated indices "sectionIndex,groupIndex,rowIndex,inputIndex", "T:s,g,address", or empty
	 */
	onInputSelectorChange(pValue)
	{
		if (!this._ParentFormEditor)
		{
			return;
		}

		if (!pValue)
		{
			this._ParentFormEditor._UtilitiesProvider.deselectInput();
			return;
		}

		// Handle tabular column selection (T:sectionIndex,groupIndex,columnAddress)
		if (pValue.startsWith('T:'))
		{
			let tmpTabularValue = pValue.substring(2);
			let tmpParts = tmpTabularValue.split(',');
			if (tmpParts.length < 3)
			{
				return;
			}
			let tmpS = parseInt(tmpParts[0], 10);
			let tmpG = parseInt(tmpParts[1], 10);
			// The address may contain commas, so rejoin remaining parts
			let tmpAddress = tmpParts.slice(2).join(',');
			if (isNaN(tmpS) || isNaN(tmpG) || !tmpAddress)
			{
				return;
			}
			this._ParentFormEditor._ManifestOpsProvider.selectSubmanifestColumn(tmpS, tmpG, tmpAddress);
			return;
		}

		let tmpParts = pValue.split(',');
		if (tmpParts.length !== 4)
		{
			return;
		}

		let tmpS = parseInt(tmpParts[0], 10);
		let tmpG = parseInt(tmpParts[1], 10);
		let tmpR = parseInt(tmpParts[2], 10);
		let tmpI = parseInt(tmpParts[3], 10);

		if (isNaN(tmpS) || isNaN(tmpG) || isNaN(tmpR) || isNaN(tmpI))
		{
			return;
		}

		this._ParentFormEditor._UtilitiesProvider.selectInput(tmpS, tmpG, tmpR, tmpI);
		this._ParentFormEditor._UtilitiesProvider.scrollToInput(tmpS, tmpG, tmpR, tmpI);
	}

	/**
	 * Wire up a searchable selector dropdown with filter-as-you-type behavior.
	 * Called after the DOM is rendered.
	 *
	 * @param {string} pType - 'Section', 'Group', or 'Input'
	 */
	_wireSearchableSelector(pType)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpInput = document.getElementById(`FormEditor-${pType}Selector-${tmpEditorHash}`);
		let tmpList = document.getElementById(`FormEditor-${pType}Selector-List-${tmpEditorHash}`);
		let tmpWrap = document.getElementById(`FormEditor-${pType}Selector-Wrap-${tmpEditorHash}`);

		if (!tmpInput || !tmpList || !tmpWrap)
		{
			return;
		}

		let tmpSelf = this;

		// Store original value so we can restore on blur without selection
		let tmpOriginalValue = tmpInput.value;

		// Show the dropdown and select all text on focus
		tmpInput.addEventListener('focus', function()
		{
			tmpList.classList.add('pict-fe-searchable-selector-list-open');
			tmpInput.select();
			// Show all items on focus
			tmpSelf._filterSearchableList(tmpList, '');
		});

		// Filter as user types
		tmpInput.addEventListener('input', function()
		{
			tmpSelf._filterSearchableList(tmpList, tmpInput.value);
		});

		// Handle keyboard navigation
		tmpInput.addEventListener('keydown', function(pEvent)
		{
			if (pEvent.key === 'Escape')
			{
				tmpInput.value = tmpOriginalValue;
				tmpInput.blur();
				tmpList.classList.remove('pict-fe-searchable-selector-list-open');
			}
			else if (pEvent.key === 'Enter')
			{
				// Select the first visible item
				let tmpVisible = tmpList.querySelectorAll('.pict-fe-searchable-selector-item');
				for (let i = 0; i < tmpVisible.length; i++)
				{
					if (tmpVisible[i].style.display !== 'none')
					{
						tmpVisible[i].click();
						tmpInput.blur();
						break;
					}
				}
			}
		});

		// Close the dropdown on outside click
		// Use a small delay to allow item click handlers to fire first
		tmpInput.addEventListener('blur', function()
		{
			setTimeout(function()
			{
				tmpList.classList.remove('pict-fe-searchable-selector-list-open');
				// Restore original value if nothing was selected
				tmpInput.value = tmpOriginalValue;
			}, 200);
		});
	}

	/**
	 * Filter items in a searchable selector list by search text.
	 * Handles group labels, subgroup labels, and items.
	 *
	 * @param {HTMLElement} pListElement - The dropdown list container
	 * @param {string} pSearchText - The filter text
	 */
	_filterSearchableList(pListElement, pSearchText)
	{
		if (!pListElement)
		{
			return;
		}

		let tmpSearch = (pSearchText || '').toLowerCase().trim();
		let tmpChildren = pListElement.children;

		// First pass: show/hide items based on search
		for (let i = 0; i < tmpChildren.length; i++)
		{
			let tmpChild = tmpChildren[i];
			if (tmpChild.classList.contains('pict-fe-searchable-selector-item'))
			{
				let tmpLabel = (tmpChild.getAttribute('data-label') || '').toLowerCase();
				let tmpSection = (tmpChild.getAttribute('data-section') || '').toLowerCase();
				let tmpMatch = !tmpSearch || tmpLabel.indexOf(tmpSearch) >= 0 || tmpSection.indexOf(tmpSearch) >= 0;
				tmpChild.style.display = tmpMatch ? '' : 'none';
			}
		}

		// Second pass: show/hide subgroup labels based on whether they have visible items after them
		let tmpCurrentSubgroupLabel = null;
		let tmpSubgroupHasVisibleItems = false;
		for (let i = 0; i < tmpChildren.length; i++)
		{
			let tmpChild = tmpChildren[i];
			let tmpIsGroupLabel = tmpChild.classList.contains('pict-fe-searchable-selector-group-label');
			let tmpIsSubgroupLabel = tmpChild.classList.contains('pict-fe-searchable-selector-subgroup-label');

			if (tmpIsSubgroupLabel || tmpIsGroupLabel)
			{
				// Finalize previous subgroup label
				if (tmpCurrentSubgroupLabel)
				{
					tmpCurrentSubgroupLabel.style.display = tmpSubgroupHasVisibleItems ? '' : 'none';
				}
				tmpCurrentSubgroupLabel = tmpIsSubgroupLabel ? tmpChild : null;
				tmpSubgroupHasVisibleItems = false;
				continue;
			}

			if (tmpChild.classList.contains('pict-fe-searchable-selector-item') && tmpChild.style.display !== 'none')
			{
				tmpSubgroupHasVisibleItems = true;
			}
		}
		// Finalize the last subgroup label
		if (tmpCurrentSubgroupLabel)
		{
			tmpCurrentSubgroupLabel.style.display = tmpSubgroupHasVisibleItems ? '' : 'none';
		}

		// Third pass: show/hide group labels based on whether they have any visible items after them
		let tmpCurrentGroupLabel = null;
		let tmpGroupHasVisibleItems = false;
		for (let i = 0; i < tmpChildren.length; i++)
		{
			let tmpChild = tmpChildren[i];

			if (tmpChild.classList.contains('pict-fe-searchable-selector-group-label'))
			{
				if (tmpCurrentGroupLabel)
				{
					tmpCurrentGroupLabel.style.display = tmpGroupHasVisibleItems ? '' : 'none';
				}
				tmpCurrentGroupLabel = tmpChild;
				tmpGroupHasVisibleItems = false;
				continue;
			}

			if (tmpChild.classList.contains('pict-fe-searchable-selector-item') && tmpChild.style.display !== 'none')
			{
				tmpGroupHasVisibleItems = true;
			}
		}
		if (tmpCurrentGroupLabel)
		{
			tmpCurrentGroupLabel.style.display = tmpGroupHasVisibleItems ? '' : 'none';
		}

		// Show "no results" message if nothing matches
		let tmpEmptyEl = pListElement.querySelector('.pict-fe-searchable-selector-empty');
		if (tmpEmptyEl)
		{
			let tmpVisibleCount = 0;
			let tmpItems = pListElement.querySelectorAll('.pict-fe-searchable-selector-item');
			for (let i = 0; i < tmpItems.length; i++)
			{
				if (tmpItems[i].style.display !== 'none')
				{
					tmpVisibleCount++;
				}
			}
			tmpEmptyEl.style.display = (tmpVisibleCount === 0) ? '' : 'none';
		}
	}

	/**
	 * Wire event listeners on the address input to show confirm/cancel buttons
	 * when the value differs from the original.
	 */
	_wireAddressConfirmation(pOriginalAddress)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpInput = document.getElementById(`FormEditor-PropsAddress-${tmpEditorHash}`);
		let tmpConfirmBtn = document.getElementById(`FormEditor-PropsAddressConfirm-${tmpEditorHash}`);
		let tmpCancelBtn = document.getElementById(`FormEditor-PropsAddressCancel-${tmpEditorHash}`);

		if (!tmpInput || !tmpConfirmBtn || !tmpCancelBtn)
		{
			return;
		}

		tmpInput.addEventListener('input', function()
		{
			let tmpChanged = (tmpInput.value !== pOriginalAddress);
			tmpConfirmBtn.style.display = tmpChanged ? 'inline-flex' : 'none';
			tmpCancelBtn.style.display = tmpChanged ? 'inline-flex' : 'none';
		});

		// Store the original address on the input for cancel
		tmpInput.dataset.originalAddress = pOriginalAddress;
	}

	/**
	 * Confirm the address change — re-keys the Descriptor and updates Row.Inputs[].
	 */
	confirmAddressChange()
	{
		if (!this._SelectedInput || !this._ParentFormEditor)
		{
			return;
		}
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpInput = document.getElementById(`FormEditor-PropsAddress-${tmpEditorHash}`);
		if (!tmpInput)
		{
			return;
		}

		let tmpNewAddress = tmpInput.value.trim();
		if (!tmpNewAddress)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpOldAddress = tmpResolved.Address;
		if (tmpNewAddress === tmpOldAddress)
		{
			return;
		}

		let tmpManifest = tmpResolved.Manifest;

		// Re-key the Descriptor in the Descriptors map
		if (tmpManifest.Descriptors)
		{
			tmpManifest.Descriptors[tmpNewAddress] = tmpManifest.Descriptors[tmpOldAddress];
			delete tmpManifest.Descriptors[tmpOldAddress];
		}

		// Update the address in the Row.Inputs array
		let tmpRow = tmpResolved.Row;
		if (tmpRow && Array.isArray(tmpRow.Inputs))
		{
			let tmpIdx = tmpRow.Inputs.indexOf(tmpOldAddress);
			if (tmpIdx >= 0)
			{
				tmpRow.Inputs[tmpIdx] = tmpNewAddress;
			}
		}

		// Re-render the parent's visual editor (which also re-renders this panel)
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Cancel the address change — revert the input to the original value.
	 */
	cancelAddressChange()
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor ? this._ParentFormEditor.Hash : '';
		let tmpInput = document.getElementById(`FormEditor-PropsAddress-${tmpEditorHash}`);
		let tmpConfirmBtn = document.getElementById(`FormEditor-PropsAddressConfirm-${tmpEditorHash}`);
		let tmpCancelBtn = document.getElementById(`FormEditor-PropsAddressCancel-${tmpEditorHash}`);

		if (tmpInput && tmpInput.dataset.originalAddress)
		{
			tmpInput.value = tmpInput.dataset.originalAddress;
		}
		if (tmpConfirmBtn)
		{
			tmpConfirmBtn.style.display = 'none';
		}
		if (tmpCancelBtn)
		{
			tmpCancelBtn.style.display = 'none';
		}
	}

	/**
	 * Re-key an input address in the manifest (Descriptors map and Row.Inputs array).
	 *
	 * @param {object} pResolved - The resolved descriptor context from _resolveSelectedDescriptor()
	 * @param {string} pNewHash - The new hash/address to use
	 */
	_reKeyAddress(pResolved, pNewHash)
	{
		if (!pResolved || !pResolved.Manifest || !pResolved.Address)
		{
			return;
		}

		let tmpOldAddress = pResolved.Address;
		let tmpNewAddress = pNewHash;
		if (tmpNewAddress === tmpOldAddress)
		{
			return;
		}

		let tmpManifest = pResolved.Manifest;

		// Re-key the Descriptor in the Descriptors map
		if (tmpManifest.Descriptors && tmpManifest.Descriptors[tmpOldAddress])
		{
			tmpManifest.Descriptors[tmpNewAddress] = tmpManifest.Descriptors[tmpOldAddress];
			delete tmpManifest.Descriptors[tmpOldAddress];
		}

		// Update the address in the Row.Inputs array
		let tmpRow = pResolved.Row;
		if (tmpRow && Array.isArray(tmpRow.Inputs))
		{
			let tmpIdx = tmpRow.Inputs.indexOf(tmpOldAddress);
			if (tmpIdx >= 0)
			{
				tmpRow.Inputs[tmpIdx] = tmpNewAddress;
			}
		}
	}

	/**
	 * Render the InputType-specific properties section.
	 *
	 * Looks up the Manifest for the current InputType and renders an editable
	 * field for each descriptor in it.
	 *
	 * @param {string} pInputType - The current InputType hash (e.g. 'Option')
	 * @param {object} pDescriptor - The full Descriptor object for the selected input
	 * @param {string} pPanelViewRef - The browser-accessible view reference string
	 * @return {string} HTML string for the InputType properties section
	 */
	_renderInputTypeProperties(pInputType, pDescriptor, pPanelViewRef)
	{
		if (!pInputType)
		{
			return '<div class="pict-fe-props-placeholder">Select an InputType to see additional properties.</div>';
		}

		let tmpManifest = this._ParentFormEditor._UtilitiesProvider._getInputTypeManifest(pInputType);
		if (!tmpManifest || !tmpManifest.Descriptors || Object.keys(tmpManifest.Descriptors).length === 0)
		{
			return '<div class="pict-fe-props-placeholder">No additional properties for ' + this._escapeHTML(pInputType) + '.</div>';
		}

		let tmpPictForm = (pDescriptor && pDescriptor.PictForm) ? pDescriptor.PictForm : {};
		let tmpHTML = '';

		tmpHTML += `<div class="pict-fe-props-section-header">${this._escapeHTML(pInputType)} Properties</div>`;

		let tmpDescriptorKeys = Object.keys(tmpManifest.Descriptors);
		for (let i = 0; i < tmpDescriptorKeys.length; i++)
		{
			let tmpPropHash = tmpDescriptorKeys[i];
			let tmpPropDescriptor = tmpManifest.Descriptors[tmpPropHash];
			let tmpPropName = tmpPropDescriptor.Name || tmpPropHash;
			let tmpPropDataType = tmpPropDescriptor.DataType || 'String';
			let tmpPropDescription = tmpPropDescriptor.Description || '';
			let tmpCurrentValue = tmpPictForm.hasOwnProperty(tmpPropHash) ? tmpPictForm[tmpPropHash] : '';

			tmpHTML += '<div class="pict-fe-props-field">';
			tmpHTML += `<div class="pict-fe-props-label" title="${this._escapeAttr(tmpPropDescription)}">${this._escapeHTML(tmpPropName)}</div>`;

			if (tmpPropDataType === 'Boolean')
			{
				let tmpChecked = tmpCurrentValue ? ' checked' : '';
				tmpHTML += `<label class="pict-fe-props-checkbox-label">`;
				tmpHTML += `<input type="checkbox" class="pict-fe-props-checkbox"${tmpChecked} onchange="${pPanelViewRef}.commitPictFormChange('${tmpPropHash}', this.checked, 'Boolean')" />`;
				tmpHTML += ` ${this._escapeHTML(tmpPropDescription)}</label>`;
			}
			else if (tmpPropDataType === 'Number')
			{
				let tmpDisplayValue = (typeof tmpCurrentValue === 'number') ? String(tmpCurrentValue) : '';
				tmpHTML += `<input class="pict-fe-props-input" type="number" value="${this._escapeAttr(tmpDisplayValue)}" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitPictFormChange('${tmpPropHash}', this.value, 'Number')" />`;
			}
			else
			{
				// String — use a textarea for values that describe JSON arrays or templates
				let tmpIsMultiline = (tmpPropDescription.indexOf('JSON') >= 0) || (tmpPropHash === 'Template');
				if (tmpIsMultiline)
				{
					let tmpDisplayValue = '';
					if (typeof tmpCurrentValue === 'string')
					{
						tmpDisplayValue = tmpCurrentValue;
					}
					else if (tmpCurrentValue !== null && tmpCurrentValue !== undefined && typeof tmpCurrentValue !== 'string')
					{
						// Stringify arrays/objects for display
						try { tmpDisplayValue = JSON.stringify(tmpCurrentValue, null, 2); }
						catch (e) { tmpDisplayValue = String(tmpCurrentValue); }
					}
					tmpHTML += `<textarea class="pict-fe-props-textarea" rows="4" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitPictFormChange('${tmpPropHash}', this.value, 'String')">${this._escapeHTML(tmpDisplayValue)}</textarea>`;
				}
				else
				{
					let tmpDisplayValue = (typeof tmpCurrentValue === 'string') ? tmpCurrentValue : (tmpCurrentValue !== null && tmpCurrentValue !== undefined ? String(tmpCurrentValue) : '');
					tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpDisplayValue)}" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitPictFormChange('${tmpPropHash}', this.value, 'String')" />`;
				}
			}

			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/**
	 * Commit a PictForm property change for the currently selected input.
	 *
	 * @param {string} pPropertyHash - The PictForm property key (e.g. 'SelectOptions', 'ChartType')
	 * @param {*} pValue - The new value from the form control
	 * @param {string} pDataType - The Manyfest DataType ('String', 'Number', 'Boolean')
	 */
	commitPictFormChange(pPropertyHash, pValue, pDataType)
	{
		if (!this._SelectedInput || !this._ParentFormEditor)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpDescriptor = tmpResolved.Descriptor;

		if (!tmpDescriptor.PictForm)
		{
			tmpDescriptor.PictForm = {};
		}

		switch (pDataType)
		{
			case 'Boolean':
			{
				tmpDescriptor.PictForm[pPropertyHash] = !!pValue;
				break;
			}

			case 'Number':
			{
				let tmpNumValue = parseFloat(pValue);
				if (isNaN(tmpNumValue) || pValue === '')
				{
					delete tmpDescriptor.PictForm[pPropertyHash];
				}
				else
				{
					tmpDescriptor.PictForm[pPropertyHash] = tmpNumValue;
				}
				break;
			}

			default: // String
			{
				if (typeof pValue === 'string' && pValue.length > 0)
				{
					// Try to parse JSON for array/object properties
					let tmpTrimmed = pValue.trim();
					if ((tmpTrimmed.charAt(0) === '[' && tmpTrimmed.charAt(tmpTrimmed.length - 1) === ']') ||
						(tmpTrimmed.charAt(0) === '{' && tmpTrimmed.charAt(tmpTrimmed.length - 1) === '}'))
					{
						try
						{
							tmpDescriptor.PictForm[pPropertyHash] = JSON.parse(tmpTrimmed);
						}
						catch (e)
						{
							// Not valid JSON — store as raw string
							tmpDescriptor.PictForm[pPropertyHash] = pValue;
						}
					}
					else
					{
						tmpDescriptor.PictForm[pPropertyHash] = pValue;
					}
				}
				else
				{
					delete tmpDescriptor.PictForm[pPropertyHash];
				}
				break;
			}
		}

		// Re-render the parent's visual editor (which also re-renders this panel)
		this._ParentFormEditor.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*          Options Tab                                                       */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the full content for the Options tab.
	 * Section A: Input Options (only if an input is selected)
	 * Section B: Named Option Lists (always shown)
	 *
	 * @returns {string} HTML string
	 */
	_renderOptionsTab()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpHTML = '';

		// Section A: Input Options
		let tmpResolved = this._resolveSelectedDescriptor();
		if (tmpResolved && tmpResolved.Descriptor)
		{
			let tmpDescriptor = tmpResolved.Descriptor;
			let tmpPictForm = tmpDescriptor.PictForm || {};
			let tmpSelectOptions = Array.isArray(tmpPictForm.SelectOptions) ? tmpPictForm.SelectOptions : [];

			// Determine if this input uses a named list
			let tmpManifest = this._ParentFormEditor._resolveManifestData();
			let tmpStaticLists = (tmpManifest && Array.isArray(tmpManifest.StaticOptionLists)) ? tmpManifest.StaticOptionLists : [];
			let tmpLinkedList = tmpPictForm.StaticOptionListHash || '';
			let tmpIsNamedSource = (tmpLinkedList && tmpLinkedList.length > 0);

			tmpHTML += '<div class="pict-fe-props-section-header">INPUT OPTIONS</div>';
			tmpHTML += '<div class="pict-fe-props-body">';

			// Source toggle
			tmpHTML += '<div class="pict-fe-option-source-toggle">';
			tmpHTML += '<span class="pict-fe-props-label" style="margin-bottom:0">Source:</span>';
			tmpHTML += `<label class="pict-fe-option-source-radio"><input type="radio" name="pict-fe-option-source" value="inline" ${!tmpIsNamedSource ? 'checked' : ''} onchange="${tmpPanelViewRef}.setInputOptionSource('inline')" /> Inline</label>`;
			tmpHTML += `<label class="pict-fe-option-source-radio"><input type="radio" name="pict-fe-option-source" value="named" ${tmpIsNamedSource ? 'checked' : ''} onchange="${tmpPanelViewRef}.setInputOptionSource('named')" /> Named List</label>`;

			if (tmpIsNamedSource)
			{
				tmpHTML += '<select class="pict-fe-props-input" style="margin-left:4px;flex:1" onchange="' + tmpPanelViewRef + '.assignNamedListToInput(this.value)">';
				tmpHTML += '<option value="">— Select a list —</option>';
				for (let i = 0; i < tmpStaticLists.length; i++)
				{
					let tmpList = tmpStaticLists[i];
					let tmpSelected = (tmpList.Hash === tmpLinkedList) ? ' selected' : '';
					tmpHTML += `<option value="${this._escapeAttr(tmpList.Hash)}"${tmpSelected}>${this._escapeHTML(tmpList.Name || tmpList.Hash)}</option>`;
				}
				tmpHTML += '</select>';
			}

			tmpHTML += '</div>';

			if (tmpIsNamedSource)
			{
				// Read-only preview of the linked named list's entries
				let tmpLinkedListObj = null;
				for (let i = 0; i < tmpStaticLists.length; i++)
				{
					if (tmpStaticLists[i].Hash === tmpLinkedList)
					{
						tmpLinkedListObj = tmpStaticLists[i];
						break;
					}
				}

				if (tmpLinkedListObj && Array.isArray(tmpLinkedListObj.Options))
				{
					tmpHTML += '<div class="pict-fe-option-entries">';
					for (let j = 0; j < tmpLinkedListObj.Options.length; j++)
					{
						let tmpOpt = tmpLinkedListObj.Options[j];
						tmpHTML += '<div class="pict-fe-option-entry pict-fe-option-entry-readonly">';
						tmpHTML += `<span class="pict-fe-option-id-preview">${this._escapeHTML(tmpOpt.id || '')}</span>`;
						tmpHTML += `<span class="pict-fe-option-text-preview">${this._escapeHTML(tmpOpt.text || '')}</span>`;
						tmpHTML += '</div>';
					}
					tmpHTML += '</div>';
				}
				else
				{
					tmpHTML += '<div class="pict-fe-props-placeholder">No named list selected, or list has no entries.</div>';
				}
			}
			else
			{
				// Inline editable entries
				tmpHTML += this._renderOptionEntries(tmpSelectOptions, 'inline', tmpPanelViewRef);
			}

			tmpHTML += '</div>';
		}
		else
		{
			tmpHTML += '<div class="pict-fe-props-section-header">INPUT OPTIONS</div>';
			tmpHTML += '<div class="pict-fe-props-placeholder">Select an input to manage its options.</div>';
		}

		return tmpHTML;
	}

	/**
	 * Render the option entries editor rows.
	 * Used for both inline input options and named list option editing.
	 *
	 * @param {Array} pOptions - Array of {id, text} objects
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {string} pPanelViewRef - Browser view reference string
	 * @returns {string} HTML string
	 */
	_renderOptionEntries(pOptions, pContext, pPanelViewRef)
	{
		let tmpHTML = '';
		let tmpEscapedContext = this._escapeAttr(pContext).replace(/'/g, "\\'");

		tmpHTML += '<div class="pict-fe-option-entries">';

		for (let i = 0; i < pOptions.length; i++)
		{
			let tmpOpt = pOptions[i];
			let tmpIdVal = this._escapeAttr(tmpOpt.id || '');
			let tmpTextVal = this._escapeAttr(tmpOpt.text || '');

			tmpHTML += `<div class="pict-fe-option-entry" draggable="true" data-index="${i}" ondragstart="${pPanelViewRef}.onOptionDragStart('${tmpEscapedContext}',${i},event)" ondragover="${pPanelViewRef}.onOptionDragOver('${tmpEscapedContext}',${i},event)" ondrop="${pPanelViewRef}.onOptionDrop('${tmpEscapedContext}',${i},event)" ondragend="${pPanelViewRef}.onOptionDragEnd(event)">`;
			tmpHTML += '<span class="pict-fe-option-drag-handle">\u2807</span>';
			tmpHTML += `<input class="pict-fe-option-id" type="text" value="${tmpIdVal}" placeholder="id" onchange="${pPanelViewRef}.updateOption('${tmpEscapedContext}',${i},'id',this.value)" />`;
			tmpHTML += `<input class="pict-fe-option-text" type="text" value="${tmpTextVal}" placeholder="text" onchange="${pPanelViewRef}.updateOption('${tmpEscapedContext}',${i},'text',this.value)" />`;
			tmpHTML += `<button class="pict-fe-option-remove" onclick="if(this.dataset.armed){${pPanelViewRef}.removeOption('${tmpEscapedContext}',${i})}else{this.dataset.armed='1';this.textContent='Sure?';this.classList.add('pict-fe-option-remove-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='\\u2715';b.classList.remove('pict-fe-option-remove-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='\\u2715';this.classList.remove('pict-fe-option-remove-armed');clearTimeout(this._armTimer)}">\u2715</button>`;
			tmpHTML += '</div>';
		}

		tmpHTML += '</div>';

		tmpHTML += `<button class="pict-fe-option-add-btn" onclick="${pPanelViewRef}.addOption('${tmpEscapedContext}')">+ Add Option</button>`;

		return tmpHTML;
	}

	/**
	 * Render the Named Option Lists section.
	 *
	 * @param {string} pPanelViewRef - Browser view reference string
	 * @returns {string} HTML string
	 */
	_renderNamedOptionListsSection(pPanelViewRef)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpStaticLists = (tmpManifest && Array.isArray(tmpManifest.StaticOptionLists)) ? tmpManifest.StaticOptionLists : [];

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-header">NAMED OPTION LISTS</div>';

		if (tmpStaticLists.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No named option lists defined yet.</div>';
		}

		for (let i = 0; i < tmpStaticLists.length; i++)
		{
			let tmpList = tmpStaticLists[i];
			let tmpListHash = tmpList.Hash || '';
			let tmpListName = tmpList.Name || tmpListHash;
			let tmpOptions = Array.isArray(tmpList.Options) ? tmpList.Options : [];
			let tmpIsExpanded = (this._ExpandedNamedList === tmpListHash);
			let tmpEscapedHash = this._escapeAttr(tmpListHash).replace(/'/g, "\\'");

			tmpHTML += '<div class="pict-fe-named-list-card">';

			// Header (clickable to expand/collapse)
			tmpHTML += `<div class="pict-fe-named-list-header${tmpIsExpanded ? ' pict-fe-named-list-header-expanded' : ''}" onclick="${pPanelViewRef}.toggleNamedListExpand('${tmpEscapedHash}')">`;
			tmpHTML += `<span class="pict-fe-named-list-arrow">${tmpIsExpanded ? '\u25BE' : '\u25B8'}</span>`;
			tmpHTML += `<span class="pict-fe-named-list-name">${this._escapeHTML(tmpListName)}</span>`;
			tmpHTML += `<span class="pict-fe-named-list-count">(${tmpOptions.length} option${tmpOptions.length !== 1 ? 's' : ''})</span>`;
			tmpHTML += '</div>';

			if (tmpIsExpanded)
			{
				tmpHTML += '<div class="pict-fe-named-list-body">';

				// Option entries editor
				tmpHTML += this._renderOptionEntries(tmpOptions, `named:${tmpListHash}`, pPanelViewRef);

				// Name and Hash fields
				tmpHTML += '<div class="pict-fe-named-list-props">';
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Name</div>';
				tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpListName)}" onchange="${pPanelViewRef}.updateNamedListProperty('${tmpEscapedHash}','Name',this.value)" />`;
				tmpHTML += '</div>';
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
				tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpListHash)}" onchange="${pPanelViewRef}.updateNamedListProperty('${tmpEscapedHash}','Hash',this.value)" />`;
				tmpHTML += '</div>';
				tmpHTML += '</div>';

				// Delete list button
				tmpHTML += `<button class="pict-fe-named-list-delete-btn" onclick="if(this.dataset.armed){${pPanelViewRef}.removeNamedList('${tmpEscapedHash}')}else{this.dataset.armed='1';this.textContent='Sure? Delete List';this.classList.add('pict-fe-named-list-delete-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='Delete List';b.classList.remove('pict-fe-named-list-delete-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='Delete List';this.classList.remove('pict-fe-named-list-delete-btn-armed');clearTimeout(this._armTimer)}">Delete List</button>`;

				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		tmpHTML += `<button class="pict-fe-named-list-add-btn" onclick="${pPanelViewRef}.addNamedList()">+ New List</button>`;

		return tmpHTML;
	}

	/**
	 * Add a new option entry to either inline input options or a named list.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 */
	addOption(pContext)
	{
		let tmpOptions = this._resolveOptionArray(pContext);
		if (!tmpOptions)
		{
			return;
		}

		tmpOptions.push({ id: '', text: '' });
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Update a single field (id or text) of an option entry.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pIndex - Index of the option entry
	 * @param {string} pField - 'id' or 'text'
	 * @param {string} pValue - New value
	 */
	updateOption(pContext, pIndex, pField, pValue)
	{
		let tmpOptions = this._resolveOptionArray(pContext);
		if (!tmpOptions || pIndex < 0 || pIndex >= tmpOptions.length)
		{
			return;
		}

		tmpOptions[pIndex][pField] = pValue;

		// If this is a named list and there are linked inputs, sync them
		if (pContext.indexOf('named:') === 0)
		{
			this._syncLinkedInputs(pContext.substring(6));
		}

		// Don't re-render — the data is mutated in-place and the input
		// retains focus so the user can Tab to the next field.
	}

	/**
	 * Remove an option entry from inline input options or a named list.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pIndex - Index of the option entry to remove
	 */
	removeOption(pContext, pIndex)
	{
		let tmpOptions = this._resolveOptionArray(pContext);
		if (!tmpOptions || pIndex < 0 || pIndex >= tmpOptions.length)
		{
			return;
		}

		tmpOptions.splice(pIndex, 1);

		if (pContext.indexOf('named:') === 0)
		{
			this._syncLinkedInputs(pContext.substring(6));
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Reorder an option entry within its array.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pFromIndex - Source index
	 * @param {number} pToIndex - Destination index
	 */
	reorderOption(pContext, pFromIndex, pToIndex)
	{
		let tmpOptions = this._resolveOptionArray(pContext);
		if (!tmpOptions || pFromIndex < 0 || pFromIndex >= tmpOptions.length || pToIndex < 0 || pToIndex >= tmpOptions.length)
		{
			return;
		}

		let tmpItem = tmpOptions.splice(pFromIndex, 1)[0];
		tmpOptions.splice(pToIndex, 0, tmpItem);

		if (pContext.indexOf('named:') === 0)
		{
			this._syncLinkedInputs(pContext.substring(6));
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Resolve the options array for the given context.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @returns {Array|null} Reference to the options array, or null
	 */
	_resolveOptionArray(pContext)
	{
		if (pContext === 'inline')
		{
			let tmpResolved = this._resolveSelectedDescriptor();
			if (!tmpResolved || !tmpResolved.Descriptor)
			{
				return null;
			}

			if (!tmpResolved.Descriptor.PictForm)
			{
				tmpResolved.Descriptor.PictForm = {};
			}

			if (!Array.isArray(tmpResolved.Descriptor.PictForm.SelectOptions))
			{
				tmpResolved.Descriptor.PictForm.SelectOptions = [];
			}

			return tmpResolved.Descriptor.PictForm.SelectOptions;
		}
		else if (pContext.indexOf('named:') === 0)
		{
			let tmpListHash = pContext.substring(6);
			let tmpManifest = this._ParentFormEditor._resolveManifestData();
			if (!tmpManifest || !Array.isArray(tmpManifest.StaticOptionLists))
			{
				return null;
			}

			for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
			{
				if (tmpManifest.StaticOptionLists[i].Hash === tmpListHash)
				{
					if (!Array.isArray(tmpManifest.StaticOptionLists[i].Options))
					{
						tmpManifest.StaticOptionLists[i].Options = [];
					}
					return tmpManifest.StaticOptionLists[i].Options;
				}
			}
		}

		return null;
	}

	/**
	 * Sync all inputs linked to a named list after the list is modified.
	 * Copies the named list's Options into each input's SelectOptions.
	 *
	 * @param {string} pListHash - Hash of the named list
	 */
	_syncLinkedInputs(pListHash)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Descriptors || !Array.isArray(tmpManifest.StaticOptionLists))
		{
			return;
		}

		// Find the named list
		let tmpList = null;
		for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
		{
			if (tmpManifest.StaticOptionLists[i].Hash === pListHash)
			{
				tmpList = tmpManifest.StaticOptionLists[i];
				break;
			}
		}

		if (!tmpList)
		{
			return;
		}

		let tmpOptionsCopy = Array.isArray(tmpList.Options) ? JSON.parse(JSON.stringify(tmpList.Options)) : [];

		// Scan all descriptors for inputs linked to this named list
		let tmpAddresses = Object.keys(tmpManifest.Descriptors);
		for (let i = 0; i < tmpAddresses.length; i++)
		{
			let tmpDescriptor = tmpManifest.Descriptors[tmpAddresses[i]];
			if (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.StaticOptionListHash === pListHash)
			{
				tmpDescriptor.PictForm.SelectOptions = JSON.parse(JSON.stringify(tmpOptionsCopy));
			}
		}
	}

	/**
	 * Add a new named option list to the manifest.
	 */
	addNamedList()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		if (!Array.isArray(tmpManifest.StaticOptionLists))
		{
			tmpManifest.StaticOptionLists = [];
		}

		// Generate a unique hash
		let tmpIndex = tmpManifest.StaticOptionLists.length + 1;
		let tmpHash = 'OptionList' + tmpIndex;

		// Ensure uniqueness
		let tmpExists = true;
		while (tmpExists)
		{
			tmpExists = false;
			for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
			{
				if (tmpManifest.StaticOptionLists[i].Hash === tmpHash)
				{
					tmpIndex++;
					tmpHash = 'OptionList' + tmpIndex;
					tmpExists = true;
					break;
				}
			}
		}

		tmpManifest.StaticOptionLists.push({
			Hash: tmpHash,
			Name: 'New Option List',
			Options: []
		});

		this._ExpandedNamedList = tmpHash;
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Update a property (Name or Hash) on a named option list.
	 *
	 * @param {string} pListHash - Current hash of the list
	 * @param {string} pProperty - 'Name' or 'Hash'
	 * @param {string} pValue - New value
	 */
	updateNamedListProperty(pListHash, pProperty, pValue)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.StaticOptionLists))
		{
			return;
		}

		for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
		{
			if (tmpManifest.StaticOptionLists[i].Hash === pListHash)
			{
				let tmpOldHash = tmpManifest.StaticOptionLists[i].Hash;
				tmpManifest.StaticOptionLists[i][pProperty] = pValue;

				// If the Hash was changed, update linked inputs and expanded state
				if (pProperty === 'Hash' && tmpOldHash !== pValue)
				{
					// Update any inputs linked to the old hash
					if (tmpManifest.Descriptors)
					{
						let tmpAddresses = Object.keys(tmpManifest.Descriptors);
						for (let d = 0; d < tmpAddresses.length; d++)
						{
							let tmpDescriptor = tmpManifest.Descriptors[tmpAddresses[d]];
							if (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.StaticOptionListHash === tmpOldHash)
							{
								tmpDescriptor.PictForm.StaticOptionListHash = pValue;
							}
						}
					}

					if (this._ExpandedNamedList === tmpOldHash)
					{
						this._ExpandedNamedList = pValue;
					}

					// Hash changes require a full re-render to update references
					this._ParentFormEditor.renderVisualEditor();
				}

				break;
			}
		}

		// Name changes don't need re-render — data is mutated in-place
	}

	/**
	 * Remove a named option list from the manifest.
	 *
	 * @param {string} pListHash - Hash of the list to remove
	 */
	removeNamedList(pListHash)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.StaticOptionLists))
		{
			return;
		}

		for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
		{
			if (tmpManifest.StaticOptionLists[i].Hash === pListHash)
			{
				tmpManifest.StaticOptionLists.splice(i, 1);
				break;
			}
		}

		// Clear any inputs linked to this list
		if (tmpManifest.Descriptors)
		{
			let tmpAddresses = Object.keys(tmpManifest.Descriptors);
			for (let d = 0; d < tmpAddresses.length; d++)
			{
				let tmpDescriptor = tmpManifest.Descriptors[tmpAddresses[d]];
				if (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.StaticOptionListHash === pListHash)
				{
					delete tmpDescriptor.PictForm.StaticOptionListHash;
				}
			}
		}

		if (this._ExpandedNamedList === pListHash)
		{
			this._ExpandedNamedList = null;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Toggle the expanded/collapsed state of a named option list.
	 *
	 * @param {string} pListHash - Hash of the list to toggle
	 */
	toggleNamedListExpand(pListHash)
	{
		if (this._ExpandedNamedList === pListHash)
		{
			this._ExpandedNamedList = null;
		}
		else
		{
			this._ExpandedNamedList = pListHash;
		}

		this.renderListDataTabPanel();
	}

	/**
	 * Set the option source for the currently selected input.
	 *
	 * @param {string} pSource - 'inline' or 'named'
	 */
	setInputOptionSource(pSource)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		if (pSource === 'inline')
		{
			// Remove the named list link
			delete tmpResolved.Descriptor.PictForm.StaticOptionListHash;
		}
		else if (pSource === 'named')
		{
			// Set a placeholder; the user will pick from the dropdown
			if (!tmpResolved.Descriptor.PictForm.StaticOptionListHash)
			{
				tmpResolved.Descriptor.PictForm.StaticOptionListHash = '';
			}
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Assign a named option list to the currently selected input.
	 * Copies the list's Options into the input's SelectOptions.
	 *
	 * @param {string} pListHash - Hash of the named list to assign
	 */
	assignNamedListToInput(pListHash)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		tmpResolved.Descriptor.PictForm.StaticOptionListHash = pListHash;

		// Copy the named list's options to SelectOptions
		if (pListHash)
		{
			let tmpManifest = this._ParentFormEditor._resolveManifestData();
			if (tmpManifest && Array.isArray(tmpManifest.StaticOptionLists))
			{
				for (let i = 0; i < tmpManifest.StaticOptionLists.length; i++)
				{
					if (tmpManifest.StaticOptionLists[i].Hash === pListHash)
					{
						let tmpListOptions = tmpManifest.StaticOptionLists[i].Options || [];
						tmpResolved.Descriptor.PictForm.SelectOptions = JSON.parse(JSON.stringify(tmpListOptions));
						break;
					}
				}
			}
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Handle drag start for option entry reordering.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pIndex - Index of the dragged entry
	 * @param {object} pEvent - The dragstart event
	 */
	onOptionDragStart(pContext, pIndex, pEvent)
	{
		this._OptionsDragState = { Context: pContext, FromIndex: pIndex };
		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.effectAllowed = 'move';
			pEvent.dataTransfer.setData('text/plain', String(pIndex));
		}
		if (pEvent && pEvent.target)
		{
			pEvent.target.style.opacity = '0.5';
		}
	}

	/**
	 * Handle drag over for option entry reordering.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pIndex - Index of the drop target
	 * @param {object} pEvent - The dragover event
	 */
	onOptionDragOver(pContext, pIndex, pEvent)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
			if (pEvent.dataTransfer)
			{
				pEvent.dataTransfer.dropEffect = 'move';
			}
		}
	}

	/**
	 * Handle drop for option entry reordering.
	 *
	 * @param {string} pContext - 'inline' or 'named:ListHash'
	 * @param {number} pIndex - Index of the drop target
	 * @param {object} pEvent - The drop event
	 */
	onOptionDrop(pContext, pIndex, pEvent)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
		}

		if (!this._OptionsDragState || this._OptionsDragState.Context !== pContext)
		{
			return;
		}

		let tmpFromIndex = this._OptionsDragState.FromIndex;
		this._OptionsDragState = null;

		if (tmpFromIndex !== pIndex)
		{
			this.reorderOption(pContext, tmpFromIndex, pIndex);
		}
	}

	/**
	 * Handle drag end for option entry reordering.
	 *
	 * @param {object} pEvent - The dragend event
	 */
	onOptionDragEnd(pEvent)
	{
		this._OptionsDragState = null;
		if (pEvent && pEvent.target)
		{
			pEvent.target.style.opacity = '';
		}
	}

	/* -------------------------------------------------------------------------- */
	/*          Solver Editor Tab                                                 */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the Solver Editor tab content into the top-level Solver Editor tab panel container.
	 * Called by the FormEditor when switching to the Solver Editor tab.
	 * Shows the solver list when no solver is selected, or the active editor when one is.
	 */
	renderSolverEditorTabPanel()
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpContainerEl = `#FormEditor-SolverEditorTab-Container-${tmpHash}`;

		// Tear down existing CodeJar before replacing DOM
		let tmpSolverEditor = this._ParentFormEditor._SolverCodeEditorView;
		if (tmpSolverEditor && tmpSolverEditor.codeJar)
		{
			tmpSolverEditor.destroy();
			tmpSolverEditor.initialRenderComplete = false;
		}

		let tmpHTML = this._SolverEditorContext
			? this._renderSolverEditorActive()
			: this._renderSolverEditorList();

		this.pict.ContentAssignment.assignContent(tmpContainerEl, tmpHTML);

		// Initialize the solver code editor after DOM is ready
		if (this._SolverEditorContext && tmpSolverEditor)
		{
			tmpSolverEditor.render();
			if (tmpSolverEditor.codeJar)
			{
				tmpSolverEditor.setCode(this._SolverEditorContext.Expression || '');
			}
		}
	}

	/**
	 * Render the solver list view (no solver selected).
	 * Shows all solver expressions grouped by ordinal, each clickable to open the editor.
	 *
	 * @returns {string} HTML string
	 */
	_renderSolverEditorList()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpHTML = '';

		tmpHTML += '<div class="pict-fe-solver-editor-list-heading">Select a solver expression to edit</div>';

		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			tmpHTML += '<div class="pict-fe-solver-editor-list-empty">No manifest loaded.</div>';
			return tmpHTML;
		}

		// Collect all expressions (same pattern as _buildSolverHealthReport)
		let tmpAllExpressions = [];

		for (let s = 0; s < tmpManifest.Sections.length; s++)
		{
			let tmpSection = tmpManifest.Sections[s];
			let tmpSectionName = tmpSection.Name || tmpSection.Hash || ('Section ' + (s + 1));

			if (Array.isArray(tmpSection.Solvers))
			{
				for (let i = 0; i < tmpSection.Solvers.length; i++)
				{
					let tmpSolver = tmpSection.Solvers[i];
					let tmpExpr = '';
					let tmpOrdinal = 1;
					if (typeof tmpSolver === 'string')
					{
						tmpExpr = tmpSolver;
					}
					else if (tmpSolver && tmpSolver.Expression)
					{
						tmpExpr = tmpSolver.Expression;
						tmpOrdinal = tmpSolver.Ordinal || 1;
					}
					if (tmpExpr)
					{
						tmpAllExpressions.push({ Expression: tmpExpr, Ordinal: tmpOrdinal, Type: 'Section', SectionIndex: s, SolverIndex: i, GroupIndex: -1, SectionName: tmpSectionName, GroupName: '' });
					}
				}
			}

			if (Array.isArray(tmpSection.Groups))
			{
				for (let g = 0; g < tmpSection.Groups.length; g++)
				{
					let tmpGroup = tmpSection.Groups[g];
					let tmpGroupName = tmpGroup.Name || tmpGroup.Hash || ('Group ' + (g + 1));
					if (Array.isArray(tmpGroup.RecordSetSolvers))
					{
						for (let i = 0; i < tmpGroup.RecordSetSolvers.length; i++)
						{
							let tmpSolver = tmpGroup.RecordSetSolvers[i];
							let tmpExpr = '';
							let tmpOrdinal = 1;
							if (typeof tmpSolver === 'string')
							{
								tmpExpr = tmpSolver;
							}
							else if (tmpSolver && tmpSolver.Expression)
							{
								tmpExpr = tmpSolver.Expression;
								tmpOrdinal = tmpSolver.Ordinal || 1;
							}
							if (tmpExpr)
							{
								tmpAllExpressions.push({ Expression: tmpExpr, Ordinal: tmpOrdinal, Type: 'Group', SectionIndex: s, SolverIndex: i, GroupIndex: g, SectionName: tmpSectionName, GroupName: tmpGroupName });
							}
						}
					}
				}
			}
		}

		if (tmpAllExpressions.length === 0)
		{
			tmpHTML += '<div class="pict-fe-solver-editor-list-empty">No solver expressions defined.</div>';
		}
		else
		{
			// Sort by ordinal ascending
			tmpAllExpressions.sort(function (a, b) { return a.Ordinal - b.Ordinal; });

			// Group by ordinal
			let tmpOrdinalGroups = {};
			let tmpOrdinalOrder = [];
			for (let e = 0; e < tmpAllExpressions.length; e++)
			{
				let tmpOrdinal = tmpAllExpressions[e].Ordinal;
				if (!tmpOrdinalGroups[tmpOrdinal])
				{
					tmpOrdinalGroups[tmpOrdinal] = [];
					tmpOrdinalOrder.push(tmpOrdinal);
				}
				tmpOrdinalGroups[tmpOrdinal].push(tmpAllExpressions[e]);
			}

			for (let o = 0; o < tmpOrdinalOrder.length; o++)
			{
				let tmpOrdinal = tmpOrdinalOrder[o];
				let tmpExprs = tmpOrdinalGroups[tmpOrdinal];

				tmpHTML += '<div class="pict-fe-solvers-ordinal-group">';
				tmpHTML += `<div class="pict-fe-solvers-ordinal-header">Ordinal ${tmpOrdinal} (${tmpExprs.length} expression${tmpExprs.length !== 1 ? 's' : ''})</div>`;

				for (let e = 0; e < tmpExprs.length; e++)
				{
					let tmpExprObj = tmpExprs[e];
					let tmpGroupArg = (tmpExprObj.Type === 'Group') ? (', ' + tmpExprObj.GroupIndex) : '';
					let tmpBadgeClass = (tmpExprObj.Type === 'Section') ? 'pict-fe-solvers-badge-section' : 'pict-fe-solvers-badge-group';
					let tmpContextName = tmpExprObj.SectionName;
					if (tmpExprObj.GroupName)
					{
						tmpContextName += ' \u203A ' + tmpExprObj.GroupName;
					}

					tmpHTML += '<div class="pict-fe-solvers-seq-entry">';
					tmpHTML += '<div class="pict-fe-solvers-seq-meta">';
					tmpHTML += `<span class="${tmpBadgeClass}">${tmpExprObj.Type}</span>`;
					tmpHTML += `<span class="pict-fe-solvers-seq-context">${this._escapeHTML(tmpContextName)}</span>`;
					tmpHTML += '</div>';
					tmpHTML += `<div class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-link" onclick="${tmpPanelViewRef}.openSolverEditor('${tmpExprObj.Type}', ${tmpExprObj.SectionIndex}, ${tmpExprObj.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpExprObj.Expression)}</div>`;
					tmpHTML += '</div>';
				}

				tmpHTML += '</div>';
			}
		}

		// Add Solver helper
		let tmpHash = this._ParentFormEditor.Hash;
		tmpHTML += this._renderAddSolverHelper(`FormEditor-SolverEditorList-AddSolver-${tmpHash}`);

		return tmpHTML;
	}

	/**
	 * Render the active solver editor view (a solver is selected).
	 * Shows breadcrumb, context header, expression textarea, ordinal input,
	 * reference panel, and save/cancel buttons.
	 *
	 * @returns {string} HTML string
	 */
	_renderSolverEditorActive()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpContext = this._SolverEditorContext;
		if (!tmpContext)
		{
			return '';
		}

		// Resolve context labels
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpContextLabel = '';
		let tmpBadgeLabel = '';

		if (tmpManifest && Array.isArray(tmpManifest.Sections))
		{
			let tmpSection = tmpManifest.Sections[tmpContext.SectionIndex];
			let tmpSectionName = tmpSection ? (tmpSection.Name || tmpSection.Hash || ('Section ' + (tmpContext.SectionIndex + 1))) : '';

			if (tmpContext.Type === 'Group')
			{
				tmpBadgeLabel = 'Tabular Group Solver';
				let tmpGroup = (tmpSection && Array.isArray(tmpSection.Groups)) ? tmpSection.Groups[tmpContext.GroupIndex] : null;
				let tmpGroupName = tmpGroup ? (tmpGroup.Name || tmpGroup.Hash || ('Group ' + (tmpContext.GroupIndex + 1))) : '';
				tmpContextLabel = tmpSectionName + ' \u203A ' + tmpGroupName;
			}
			else
			{
				tmpBadgeLabel = 'Section Solver';
				tmpContextLabel = tmpSectionName;
			}
		}

		let tmpHTML = '';

		// ---- Breadcrumb ----
		tmpHTML += '<div class="pict-fe-solver-editor-breadcrumb">';
		tmpHTML += `<span class="pict-fe-solver-editor-breadcrumb-item" onclick="${tmpPanelViewRef}.navigateSolverEditorBreadcrumb(-1)">Solver List</span>`;

		for (let i = 0; i < this._SolverEditorStack.length; i++)
		{
			let tmpStackEntry = this._SolverEditorStack[i];
			let tmpCrumbExpr = tmpStackEntry.Context.Expression || '(empty)';
			// Truncate long expressions for breadcrumb display
			if (tmpCrumbExpr.length > 30)
			{
				tmpCrumbExpr = tmpCrumbExpr.substring(0, 27) + '\u2026';
			}
			tmpHTML += '<span class="pict-fe-solver-editor-breadcrumb-sep">\u203A</span>';
			tmpHTML += `<span class="pict-fe-solver-editor-breadcrumb-item" onclick="${tmpPanelViewRef}.navigateSolverEditorBreadcrumb(${i})">${this._escapeHTML(tmpCrumbExpr)}</span>`;
		}

		// Current entry (not clickable)
		let tmpCurrentExpr = tmpContext.Expression || '(empty)';
		if (tmpCurrentExpr.length > 40)
		{
			tmpCurrentExpr = tmpCurrentExpr.substring(0, 37) + '\u2026';
		}
		tmpHTML += '<span class="pict-fe-solver-editor-breadcrumb-sep">\u203A</span>';
		tmpHTML += `<span class="pict-fe-solver-editor-breadcrumb-current">${this._escapeHTML(tmpCurrentExpr)}</span>`;

		tmpHTML += '</div>';

		// ---- Header ----
		tmpHTML += '<div class="pict-fe-solver-editor-header">';
		let tmpBadgeClass = (tmpContext.Type === 'Section') ? 'pict-fe-solvers-badge-section' : 'pict-fe-solvers-badge-group';
		tmpHTML += `<span class="${tmpBadgeClass}">${this._escapeHTML(tmpBadgeLabel)}</span>`;
		tmpHTML += `<span class="pict-fe-solver-editor-header-context">${this._escapeHTML(tmpContextLabel)}</span>`;
		tmpHTML += '</div>';

		// ---- Body ----
		tmpHTML += '<div class="pict-fe-solver-editor-body">';

		// Expression code editor container
		tmpHTML += '<label class="pict-fe-props-label">Expression</label>';
		tmpHTML += `<div class="pict-fe-solver-code-editor-container" id="FormEditor-SolverCodeEditor-Container-${tmpEditorHash}"></div>`;

		// Ordinal row
		tmpHTML += '<div class="pict-fe-solver-modal-ordinal-row">';
		tmpHTML += '<label class="pict-fe-props-label">Ordinal</label>';
		tmpHTML += `<input class="pict-fe-solver-modal-ordinal-input" id="PictFE-SolverEditor-Ordinal-${tmpEditorHash}" type="text" value="${this._escapeAttr(tmpContext.Ordinal)}" placeholder="1" />`;
		tmpHTML += '</div>';

		// Reference panel
		tmpHTML += '<div class="pict-fe-solver-modal-reference">';
		tmpHTML += '<div class="pict-fe-solver-modal-reference-header">';
		tmpHTML += '<span class="pict-fe-props-label">Reference</span>';
		tmpHTML += `<input class="pict-fe-solver-modal-reference-search" id="PictFE-SolverEditor-RefSearch-${tmpEditorHash}" type="text" placeholder="Filter addresses\u2026" oninput="${tmpPanelViewRef}._onSolverEditorReferenceSearch(this.value)" />`;
		tmpHTML += '</div>';
		tmpHTML += `<div class="pict-fe-solver-modal-reference-list" id="PictFE-SolverEditor-RefList-${tmpEditorHash}">`;
		tmpHTML += this._renderSolverEditorReference('');
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // body

		// ---- Actions ----
		tmpHTML += '<div class="pict-fe-solver-editor-actions">';
		tmpHTML += `<button class="pict-fe-solver-modal-btn" onclick="${tmpPanelViewRef}.closeSolverEditor()">Cancel</button>`;
		tmpHTML += `<button class="pict-fe-solver-modal-btn pict-fe-solver-modal-btn-save" onclick="${tmpPanelViewRef}.saveSolverEditor()">Save</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/* -------------------------------------------------------------------------- */
	/*          Solvers Tab                                                       */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the Solvers tab content into the top-level Solvers tab panel container.
	 * Called by the FormEditor when switching to the Solvers tab.
	 */
	renderSolversTabPanel()
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpContainerEl = `#FormEditor-SolversTab-Container-${tmpHash}`;
		let tmpHTML = this._renderSolversTab();
		this.pict.ContentAssignment.assignContent(tmpContainerEl, tmpHTML);
	}

	/**
	 * Build the full Solvers tab HTML.
	 * Delegates to three sub-renderers: health summary, execution sequence, data flow.
	 *
	 * @returns {string} HTML string
	 */
	_renderSolversTab()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpHealthReport = this._buildSolverHealthReport();
		let tmpHTML = '';

		// Section 1: Health Summary
		tmpHTML += this._renderSolverHealthSummary(tmpPanelViewRef, tmpHealthReport);

		tmpHTML += '<div class="pict-fe-data-section-divider"></div>';

		// Section 2: Execution Sequence
		tmpHTML += this._renderSolverExecutionSequence(tmpPanelViewRef, tmpHealthReport);

		tmpHTML += '<div class="pict-fe-data-section-divider"></div>';

		// Section 3: Data Flow
		tmpHTML += this._renderSolverDataFlow(tmpPanelViewRef, tmpHealthReport);

		// Add Solver helper
		let tmpHash = this._ParentFormEditor.Hash;
		tmpHTML += this._renderAddSolverHelper(`FormEditor-SolversTab-AddSolver-${tmpHash}`);

		return tmpHTML;
	}

	/**
	 * Analyze all solver expressions and return a structured health report.
	 *
	 * @returns {Object} Health report with stats, expressions, solver map, and detected issues
	 */
	_buildSolverHealthReport()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpReport =
		{
			TotalSolvers: 0,
			SectionSolvers: 0,
			GroupSolvers: 0,
			AllExpressions: [],
			SolverMap: {},
			UnresolvedHashes: [],
			DuplicateAssignments: [],
			CircularReferences: [],
			NoHashExpressions: []
		};

		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return tmpReport;
		}

		// ---- Collect all expressions ----
		for (let s = 0; s < tmpManifest.Sections.length; s++)
		{
			let tmpSection = tmpManifest.Sections[s];
			let tmpSectionName = tmpSection.Name || tmpSection.Hash || ('Section ' + (s + 1));

			// Section solvers
			if (Array.isArray(tmpSection.Solvers))
			{
				for (let i = 0; i < tmpSection.Solvers.length; i++)
				{
					let tmpSolver = tmpSection.Solvers[i];
					let tmpExpr = '';
					let tmpOrdinal = 1;
					if (typeof tmpSolver === 'string')
					{
						tmpExpr = tmpSolver;
					}
					else if (tmpSolver && tmpSolver.Expression)
					{
						tmpExpr = tmpSolver.Expression;
						tmpOrdinal = tmpSolver.Ordinal || 1;
					}
					if (tmpExpr)
					{
						tmpReport.AllExpressions.push(
						{
							Expression: tmpExpr,
							Ordinal: tmpOrdinal,
							Type: 'Section',
							SectionIndex: s,
							SolverIndex: i,
							GroupIndex: -1,
							SectionName: tmpSectionName,
							GroupName: ''
						});
						tmpReport.SectionSolvers++;
					}
				}
			}

			// Group RecordSetSolvers
			if (Array.isArray(tmpSection.Groups))
			{
				for (let g = 0; g < tmpSection.Groups.length; g++)
				{
					let tmpGroup = tmpSection.Groups[g];
					let tmpGroupName = tmpGroup.Name || tmpGroup.Hash || ('Group ' + (g + 1));
					if (Array.isArray(tmpGroup.RecordSetSolvers))
					{
						for (let i = 0; i < tmpGroup.RecordSetSolvers.length; i++)
						{
							let tmpSolver = tmpGroup.RecordSetSolvers[i];
							let tmpExpr = '';
							let tmpOrdinal = 1;
							if (typeof tmpSolver === 'string')
							{
								tmpExpr = tmpSolver;
							}
							else if (tmpSolver && tmpSolver.Expression)
							{
								tmpExpr = tmpSolver.Expression;
								tmpOrdinal = tmpSolver.Ordinal || 1;
							}
							if (tmpExpr)
							{
								tmpReport.AllExpressions.push(
								{
									Expression: tmpExpr,
									Ordinal: tmpOrdinal,
									Type: 'Group',
									SectionIndex: s,
									SolverIndex: i,
									GroupIndex: g,
									SectionName: tmpSectionName,
									GroupName: tmpGroupName
								});
								tmpReport.GroupSolvers++;
							}
						}
					}
				}
			}
		}

		tmpReport.TotalSolvers = tmpReport.SectionSolvers + tmpReport.GroupSolvers;

		// Sort expressions by Ordinal ascending
		tmpReport.AllExpressions.sort(function (a, b) { return a.Ordinal - b.Ordinal; });

		// ---- Build known hash set from Descriptors ----
		let tmpKnownHashes = {};
		if (tmpManifest.Descriptors && typeof tmpManifest.Descriptors === 'object')
		{
			let tmpAddresses = Object.keys(tmpManifest.Descriptors);
			for (let a = 0; a < tmpAddresses.length; a++)
			{
				let tmpDescriptor = tmpManifest.Descriptors[tmpAddresses[a]];
				if (tmpDescriptor && tmpDescriptor.Hash)
				{
					tmpKnownHashes[tmpDescriptor.Hash] = true;
				}
			}
		}

		// Known solver function names and keywords to exclude from unresolved detection
		let tmpKnownFunctions =
		{
			'SUM': true, 'MEAN': true, 'MEDIAN': true, 'COUNT': true, 'MIN': true, 'MAX': true,
			'ABS': true, 'ROUND': true, 'CEIL': true, 'FLOOR': true, 'SQRT': true, 'POW': true,
			'CONCAT': true, 'MAP': true, 'VAR': true, 'FROM': true, 'IF': true, 'THEN': true, 'ELSE': true,
			'AND': true, 'OR': true, 'NOT': true, 'TRUE': true, 'FALSE': true,
			'FILTER': true, 'REDUCE': true, 'COALESCE': true, 'LENGTH': true,
			'TOSTRING': true, 'TONUMBER': true, 'TOFLOAT': true, 'TOINT': true,
			'NOW': true, 'TODAY': true, 'DATEFORMAT': true, 'DATEDIFF': true
		};

		// ---- Analyze expressions for issues ----
		// Track assignment left-side hashes for duplicate detection
		let tmpAssignmentMap = {};
		// For solver map (same as _buildSolverHashMapAll but augmented)
		let tmpSolverMap = {};

		for (let e = 0; e < tmpReport.AllExpressions.length; e++)
		{
			let tmpExprObj = tmpReport.AllExpressions[e];
			let tmpExpr = tmpExprObj.Expression;

			// Split on '=' to get left and right sides
			let tmpEqIndex = tmpExpr.indexOf('=');
			let tmpLeftHash = '';
			let tmpRightSide = tmpExpr;

			if (tmpEqIndex >= 0)
			{
				tmpLeftHash = tmpExpr.substring(0, tmpEqIndex).trim();
				tmpRightSide = tmpExpr.substring(tmpEqIndex + 1);

				// Track assignments
				if (tmpLeftHash)
				{
					if (!tmpAssignmentMap[tmpLeftHash])
					{
						tmpAssignmentMap[tmpLeftHash] = [];
					}
					tmpAssignmentMap[tmpLeftHash].push(tmpExprObj);
				}
			}

			// Strip quoted string literals before tokenizing so their contents
			// (e.g. URLs, spaces, punctuation) are not treated as hash tokens.
			let tmpStrippedRight = tmpRightSide.replace(/"[^"]*"|'[^']*'/g, '');

			// Tokenize the stripped right side to find hash references
			let tmpTokens = tmpStrippedRight.split(/[=+\-*\/(),\s]+/).filter(function (t) { return t.length > 0; });
			let tmpFoundHashes = [];
			let tmpUnresolvedTokens = [];

			for (let t = 0; t < tmpTokens.length; t++)
			{
				let tmpToken = tmpTokens[t];

				// Skip numeric literals
				if (/^-?\d+(\.\d+)?$/.test(tmpToken))
				{
					continue;
				}

				// Skip known functions (case-insensitive)
				if (tmpKnownFunctions[tmpToken.toUpperCase()])
				{
					continue;
				}

				// Check if it is a known descriptor hash
				if (tmpKnownHashes[tmpToken])
				{
					tmpFoundHashes.push(tmpToken);
				}
				else
				{
					tmpUnresolvedTokens.push(tmpToken);
				}
			}

			// Check left side for known hash too
			if (tmpLeftHash && tmpKnownHashes[tmpLeftHash])
			{
				// Build solver map entry
				if (!tmpSolverMap[tmpLeftHash])
				{
					tmpSolverMap[tmpLeftHash] = { assignment: null, references: [] };
				}
				if (!tmpSolverMap[tmpLeftHash].assignment)
				{
					tmpSolverMap[tmpLeftHash].assignment = tmpExprObj;
				}
			}
			else if (tmpLeftHash && !tmpKnownFunctions[tmpLeftHash.toUpperCase()])
			{
				// Left-side hash not in Descriptors and not a function — still track as unresolved
				tmpUnresolvedTokens.push(tmpLeftHash);
			}

			// Add references to solver map
			for (let h = 0; h < tmpFoundHashes.length; h++)
			{
				if (!tmpSolverMap[tmpFoundHashes[h]])
				{
					tmpSolverMap[tmpFoundHashes[h]] = { assignment: null, references: [] };
				}
				tmpSolverMap[tmpFoundHashes[h]].references.push(tmpExprObj);
			}

			// Track unresolved hashes
			for (let u = 0; u < tmpUnresolvedTokens.length; u++)
			{
				tmpReport.UnresolvedHashes.push(
				{
					Token: tmpUnresolvedTokens[u],
					Expression: tmpExpr,
					ExpressionEntry: tmpExprObj
				});
			}

			// Flag expressions with no recognized hashes on the right side
			if (tmpFoundHashes.length === 0 && tmpRightSide.trim().length > 0)
			{
				tmpReport.NoHashExpressions.push(tmpExprObj);
			}
		}

		tmpReport.SolverMap = tmpSolverMap;

		// ---- Detect duplicate assignments ----
		let tmpAssignKeys = Object.keys(tmpAssignmentMap);
		for (let k = 0; k < tmpAssignKeys.length; k++)
		{
			if (tmpAssignmentMap[tmpAssignKeys[k]].length > 1)
			{
				tmpReport.DuplicateAssignments.push(
				{
					Hash: tmpAssignKeys[k],
					Expressions: tmpAssignmentMap[tmpAssignKeys[k]]
				});
			}
		}

		// ---- Detect circular references via DFS ----
		// Build directed graph: assigned hash → referenced hashes
		let tmpGraph = {};
		let tmpSolverMapKeys = Object.keys(tmpSolverMap);
		for (let k = 0; k < tmpSolverMapKeys.length; k++)
		{
			let tmpHash = tmpSolverMapKeys[k];
			let tmpEntry = tmpSolverMap[tmpHash];
			if (tmpEntry.assignment)
			{
				// Find which known hashes appear on the right side of this assignment
				let tmpAssignExpr = tmpEntry.assignment.Expression;
				let tmpAssignEq = tmpAssignExpr.indexOf('=');
				let tmpAssignRight = (tmpAssignEq >= 0) ? tmpAssignExpr.substring(tmpAssignEq + 1) : '';
				let tmpDepTokens = tmpAssignRight.split(/[=+\-*\/(),\s]+/).filter(function (t) { return t.length > 0; });
				let tmpDeps = [];
				for (let d = 0; d < tmpDepTokens.length; d++)
				{
					if (tmpKnownHashes[tmpDepTokens[d]] && tmpDepTokens[d] !== tmpHash)
					{
						tmpDeps.push(tmpDepTokens[d]);
					}
				}
				if (tmpDeps.length > 0)
				{
					tmpGraph[tmpHash] = tmpDeps;
				}
			}
		}

		// DFS for cycle detection
		let tmpCyclesFound = {};
		let tmpGraphKeys = Object.keys(tmpGraph);
		for (let k = 0; k < tmpGraphKeys.length; k++)
		{
			let tmpStartHash = tmpGraphKeys[k];
			let tmpVisited = {};
			let tmpPath = [tmpStartHash];
			tmpVisited[tmpStartHash] = true;

			let tmpStack = [{ hash: tmpStartHash, depIndex: 0 }];
			while (tmpStack.length > 0)
			{
				let tmpCurrent = tmpStack[tmpStack.length - 1];
				let tmpDeps = tmpGraph[tmpCurrent.hash];

				if (!tmpDeps || tmpCurrent.depIndex >= tmpDeps.length || tmpStack.length > 10)
				{
					tmpStack.pop();
					tmpPath.pop();
					if (tmpStack.length > 0)
					{
						delete tmpVisited[tmpCurrent.hash];
					}
					continue;
				}

				let tmpNextHash = tmpDeps[tmpCurrent.depIndex];
				tmpCurrent.depIndex++;

				if (tmpVisited[tmpNextHash])
				{
					// Cycle detected
					let tmpCycleKey = [tmpStartHash, tmpNextHash].sort().join('↔');
					if (!tmpCyclesFound[tmpCycleKey])
					{
						tmpCyclesFound[tmpCycleKey] = true;
						tmpReport.CircularReferences.push(
						{
							From: tmpStartHash,
							To: tmpNextHash,
							Path: tmpPath.slice().concat(tmpNextHash)
						});
					}
				}
				else if (tmpGraph[tmpNextHash])
				{
					tmpVisited[tmpNextHash] = true;
					tmpPath.push(tmpNextHash);
					tmpStack.push({ hash: tmpNextHash, depIndex: 0 });
				}
			}
		}

		return tmpReport;
	}

	/**
	 * Render the Solver Health Summary section.
	 * Shows stats cards and detected issue categories.
	 *
	 * @param {string} pPanelViewRef - Browser-accessible view reference
	 * @param {Object} pHealthReport - Health report from _buildSolverHealthReport
	 * @returns {string} HTML string
	 */
	_renderSolverHealthSummary(pPanelViewRef, pHealthReport)
	{
		let tmpHTML = '';

		// ---- Stats Grid ----
		tmpHTML += '<div class="pict-fe-form-dashboard-heading">Solver Overview</div>';
		tmpHTML += '<div class="pict-fe-stats-grid">';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #9E6B47">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#9E6B47">${pHealthReport.TotalSolvers}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Total Solvers</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #D4A373">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#D4A373">${pHealthReport.SectionSolvers}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Section Solvers</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card" style="border-left:3px solid #5A7F9E">';
		tmpHTML += `<div class="pict-fe-stats-value" style="color:#5A7F9E">${pHealthReport.GroupSolvers}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Group Solvers</div>';
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // pict-fe-stats-grid

		// ---- Health Issues ----
		let tmpTotalIssues = pHealthReport.UnresolvedHashes.length
			+ pHealthReport.DuplicateAssignments.length
			+ pHealthReport.CircularReferences.length
			+ pHealthReport.NoHashExpressions.length;

		if (tmpTotalIssues === 0 && pHealthReport.TotalSolvers > 0)
		{
			tmpHTML += '<div class="pict-fe-solvers-health-ok">&#10003; No issues detected — all solver expressions appear healthy.</div>';
			return tmpHTML;
		}
		else if (pHealthReport.TotalSolvers === 0)
		{
			return tmpHTML;
		}

		tmpHTML += '<div class="pict-fe-form-dashboard-heading">Health Issues</div>';

		// Circular References
		if (pHealthReport.CircularReferences.length > 0)
		{
			tmpHTML += '<div class="pict-fe-solvers-health-issue" style="border-left:3px solid #A04040">';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-header">';
			tmpHTML += `<span class="pict-fe-solvers-health-issue-count" style="background:#A04040">${pHealthReport.CircularReferences.length}</span>`;
			tmpHTML += 'Circular References';
			tmpHTML += '</div>';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-items">';
			for (let c = 0; c < pHealthReport.CircularReferences.length; c++)
			{
				let tmpCycle = pHealthReport.CircularReferences[c];
				tmpHTML += `<div class="pict-fe-solvers-health-issue-item">${this._escapeHTML(tmpCycle.Path.join(' \u2192 '))}</div>`;
			}
			tmpHTML += '</div>';
			tmpHTML += '</div>';
		}

		// Duplicate Assignments
		if (pHealthReport.DuplicateAssignments.length > 0)
		{
			tmpHTML += '<div class="pict-fe-solvers-health-issue" style="border-left:3px solid #E76F51">';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-header">';
			tmpHTML += `<span class="pict-fe-solvers-health-issue-count" style="background:#E76F51">${pHealthReport.DuplicateAssignments.length}</span>`;
			tmpHTML += 'Duplicate Assignments';
			tmpHTML += '</div>';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-items">';
			for (let d = 0; d < pHealthReport.DuplicateAssignments.length; d++)
			{
				let tmpDup = pHealthReport.DuplicateAssignments[d];
				tmpHTML += `<div class="pict-fe-solvers-health-issue-detail">${this._escapeHTML(tmpDup.Hash)} is assigned by ${tmpDup.Expressions.length} expressions:</div>`;
				for (let de = 0; de < tmpDup.Expressions.length; de++)
				{
					let tmpDupExpr = tmpDup.Expressions[de];
					let tmpGroupArg = (tmpDupExpr.Type === 'Group') ? (', ' + tmpDupExpr.GroupIndex) : '';
					tmpHTML += `<div class="pict-fe-solvers-health-issue-item" onclick="${pPanelViewRef}.openSolverEditor('${tmpDupExpr.Type}', ${tmpDupExpr.SectionIndex}, ${tmpDupExpr.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpDupExpr.Expression)}</div>`;
				}
			}
			tmpHTML += '</div>';
			tmpHTML += '</div>';
		}

		// No-Hash Expressions
		if (pHealthReport.NoHashExpressions.length > 0)
		{
			tmpHTML += '<div class="pict-fe-solvers-health-issue" style="border-left:3px solid #D4A373">';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-header">';
			tmpHTML += `<span class="pict-fe-solvers-health-issue-count" style="background:#D4A373">${pHealthReport.NoHashExpressions.length}</span>`;
			tmpHTML += 'No Descriptor References';
			tmpHTML += '</div>';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-items">';
			for (let n = 0; n < pHealthReport.NoHashExpressions.length; n++)
			{
				let tmpNoHash = pHealthReport.NoHashExpressions[n];
				let tmpGroupArg = (tmpNoHash.Type === 'Group') ? (', ' + tmpNoHash.GroupIndex) : '';
				tmpHTML += `<div class="pict-fe-solvers-health-issue-item" onclick="${pPanelViewRef}.openSolverEditor('${tmpNoHash.Type}', ${tmpNoHash.SectionIndex}, ${tmpNoHash.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpNoHash.Expression)}</div>`;
			}
			tmpHTML += '</div>';
			tmpHTML += '</div>';
		}

		// Unresolved Hashes
		if (pHealthReport.UnresolvedHashes.length > 0)
		{
			// Deduplicate by token
			let tmpSeenTokens = {};
			let tmpUniqueUnresolved = [];
			for (let u = 0; u < pHealthReport.UnresolvedHashes.length; u++)
			{
				if (!tmpSeenTokens[pHealthReport.UnresolvedHashes[u].Token])
				{
					tmpSeenTokens[pHealthReport.UnresolvedHashes[u].Token] = true;
					tmpUniqueUnresolved.push(pHealthReport.UnresolvedHashes[u]);
				}
			}

			tmpHTML += '<div class="pict-fe-solvers-health-issue" style="border-left:3px solid #8A7F72">';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-header">';
			tmpHTML += `<span class="pict-fe-solvers-health-issue-count" style="background:#8A7F72">${tmpUniqueUnresolved.length}</span>`;
			tmpHTML += 'Unresolved Tokens';
			tmpHTML += '</div>';
			tmpHTML += '<div class="pict-fe-solvers-health-issue-items">';
			for (let u = 0; u < tmpUniqueUnresolved.length; u++)
			{
				let tmpUnresolved = tmpUniqueUnresolved[u];
				let tmpExprEntry = tmpUnresolved.ExpressionEntry;
				let tmpGroupArg = (tmpExprEntry.Type === 'Group') ? (', ' + tmpExprEntry.GroupIndex) : '';
				tmpHTML += `<div class="pict-fe-solvers-health-issue-item" onclick="${pPanelViewRef}.openSolverEditor('${tmpExprEntry.Type}', ${tmpExprEntry.SectionIndex}, ${tmpExprEntry.SolverIndex}${tmpGroupArg})"><strong>${this._escapeHTML(tmpUnresolved.Token)}</strong> in ${this._escapeHTML(tmpUnresolved.Expression)}</div>`;
			}
			tmpHTML += '</div>';
			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/**
	 * Render the Solver Execution Sequence section.
	 * Groups all expressions by ordinal, sorted ascending.
	 *
	 * @param {string} pPanelViewRef - Browser-accessible view reference
	 * @param {Object} pHealthReport - Health report from _buildSolverHealthReport
	 * @returns {string} HTML string
	 */
	_renderSolverExecutionSequence(pPanelViewRef, pHealthReport)
	{
		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-form-dashboard-heading">Execution Sequence</div>';

		if (pHealthReport.AllExpressions.length === 0)
		{
			tmpHTML += '<div style="font-size:12px;color:#8A7F72;padding:8px 0;">No solver expressions defined.</div>';
			return tmpHTML;
		}

		// Group expressions by ordinal
		let tmpOrdinalGroups = {};
		let tmpOrdinalOrder = [];
		for (let e = 0; e < pHealthReport.AllExpressions.length; e++)
		{
			let tmpExprObj = pHealthReport.AllExpressions[e];
			let tmpOrdinal = tmpExprObj.Ordinal;
			if (!tmpOrdinalGroups[tmpOrdinal])
			{
				tmpOrdinalGroups[tmpOrdinal] = [];
				tmpOrdinalOrder.push(tmpOrdinal);
			}
			tmpOrdinalGroups[tmpOrdinal].push(tmpExprObj);
		}

		for (let o = 0; o < tmpOrdinalOrder.length; o++)
		{
			let tmpOrdinal = tmpOrdinalOrder[o];
			let tmpExprs = tmpOrdinalGroups[tmpOrdinal];

			tmpHTML += '<div class="pict-fe-solvers-ordinal-group">';
			tmpHTML += `<div class="pict-fe-solvers-ordinal-header">Ordinal ${tmpOrdinal} (${tmpExprs.length} expression${tmpExprs.length !== 1 ? 's' : ''})</div>`;

			for (let e = 0; e < tmpExprs.length; e++)
			{
				let tmpExprObj = tmpExprs[e];
				let tmpGroupArg = (tmpExprObj.Type === 'Group') ? (', ' + tmpExprObj.GroupIndex) : '';
				let tmpBadgeClass = (tmpExprObj.Type === 'Section') ? 'pict-fe-solvers-badge-section' : 'pict-fe-solvers-badge-group';
				let tmpContextName = tmpExprObj.SectionName;
				if (tmpExprObj.GroupName)
				{
					tmpContextName += ' \u203A ' + tmpExprObj.GroupName;
				}

				tmpHTML += '<div class="pict-fe-solvers-seq-entry">';
				tmpHTML += '<div class="pict-fe-solvers-seq-meta">';
				tmpHTML += `<span class="${tmpBadgeClass}">${tmpExprObj.Type}</span>`;
				tmpHTML += `<span class="pict-fe-solvers-seq-context">${this._escapeHTML(tmpContextName)}</span>`;
				tmpHTML += '</div>';
				tmpHTML += `<div class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-link" onclick="${pPanelViewRef}.openSolverEditor('${tmpExprObj.Type}', ${tmpExprObj.SectionIndex}, ${tmpExprObj.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpExprObj.Expression)}</div>`;
				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/**
	 * Render the Solver Data Flow section.
	 * Shows each descriptor hash that participates in solvers with its assignment
	 * and reference relationships.
	 *
	 * @param {string} pPanelViewRef - Browser-accessible view reference
	 * @param {Object} pHealthReport - Health report from _buildSolverHealthReport
	 * @returns {string} HTML string
	 */
	_renderSolverDataFlow(pPanelViewRef, pHealthReport)
	{
		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-form-dashboard-heading">Data Flow</div>';

		let tmpSolverMapKeys = Object.keys(pHealthReport.SolverMap);
		if (tmpSolverMapKeys.length === 0)
		{
			tmpHTML += '<div style="font-size:12px;color:#8A7F72;padding:8px 0;">No solver data flow to display.</div>';
			return tmpHTML;
		}

		// Sort hashes alphabetically for consistent display
		tmpSolverMapKeys.sort();

		for (let k = 0; k < tmpSolverMapKeys.length; k++)
		{
			let tmpHash = tmpSolverMapKeys[k];
			let tmpEntry = pHealthReport.SolverMap[tmpHash];

			// Only show hashes that actually have an assignment or references
			if (!tmpEntry.assignment && tmpEntry.references.length === 0)
			{
				continue;
			}

			tmpHTML += '<div class="pict-fe-solvers-flow-node">';
			tmpHTML += `<div class="pict-fe-solvers-flow-hash">${this._escapeHTML(tmpHash)}</div>`;

			// Assignment (← assigned by)
			if (tmpEntry.assignment)
			{
				let tmpAssign = tmpEntry.assignment;
				let tmpGroupArg = (tmpAssign.Type === 'Group') ? (', ' + tmpAssign.GroupIndex) : '';
				tmpHTML += '<div class="pict-fe-solvers-flow-relationship">';
				tmpHTML += '<span class="pict-fe-solvers-flow-arrow">\u2190</span>';
				tmpHTML += '<span class="pict-fe-solvers-flow-label">assigned by</span>';
				tmpHTML += `<span class="pict-fe-solvers-flow-expr"><span class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-link" onclick="${pPanelViewRef}.openSolverEditor('${tmpAssign.Type}', ${tmpAssign.SectionIndex}, ${tmpAssign.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpAssign.Expression)}</span></span>`;
				tmpHTML += '</div>';
			}

			// References (→ referenced in)
			for (let r = 0; r < tmpEntry.references.length; r++)
			{
				let tmpRefExpr = tmpEntry.references[r];
				let tmpGroupArg = (tmpRefExpr.Type === 'Group') ? (', ' + tmpRefExpr.GroupIndex) : '';
				tmpHTML += '<div class="pict-fe-solvers-flow-relationship">';
				tmpHTML += '<span class="pict-fe-solvers-flow-arrow">\u2192</span>';
				tmpHTML += '<span class="pict-fe-solvers-flow-label">referenced in</span>';
				tmpHTML += `<span class="pict-fe-solvers-flow-expr"><span class="pict-fe-props-solver-info-expr pict-fe-props-solver-info-link" onclick="${pPanelViewRef}.openSolverEditor('${tmpRefExpr.Type}', ${tmpRefExpr.SectionIndex}, ${tmpRefExpr.SolverIndex}${tmpGroupArg})">${this._escapeHTML(tmpRefExpr.Expression)}</span></span>`;
				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/* -------------------------------------------------------------------------- */
	/*          Data Tab                                                          */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render the Data tab content into the top-level Data tab panel container.
	 * Called by the FormEditor when switching to the Data tab.
	 */
	renderListDataTabPanel()
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpContainerEl = `#FormEditor-ListDataTab-Container-${tmpHash}`;
		let tmpHTML = this._renderListDataTab();
		this.pict.ContentAssignment.assignContent(tmpContainerEl, tmpHTML);

		// Wire up the PickList scope searchable selector
		this._wireSearchableSelector('PickListScope');
	}

	renderEntityDataTabPanel()
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpContainerEl = `#FormEditor-EntityDataTab-Container-${tmpHash}`;
		let tmpHTML = this._renderEntityDataTab();
		this.pict.ContentAssignment.assignContent(tmpContainerEl, tmpHTML);
	}

	/**
	 * Render the List Data tab content.
	 * Sections: PickLists, Static Option Lists, List Filter Rules (per-input).
	 *
	 * @returns {string} HTML string
	 */
	_renderListDataTab()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpHTML = '';

		// Section 1: PickLists
		tmpHTML += this._renderPickListsSection(tmpPanelViewRef);

		tmpHTML += '<div class="pict-fe-data-section-divider"></div>';

		// Section 2: Static Option Lists
		tmpHTML += this._renderNamedOptionListsSection(tmpPanelViewRef);

		// Section 3: List Filter Rules (per-input, conditional)
		let tmpResolved = this._resolveSelectedDescriptor();
		if (tmpResolved && tmpResolved.Descriptor)
		{
			let tmpDescriptor = tmpResolved.Descriptor;
			let tmpInputType = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
			let tmpHasFilterRules = (tmpDescriptor.PictForm && Array.isArray(tmpDescriptor.PictForm.ListFilterRules));
			if (tmpInputType === 'Option' || tmpHasFilterRules)
			{
				tmpHTML += '<div class="pict-fe-data-section-divider"></div>';
				tmpHTML += this._renderListFilterRulesSection(tmpPanelViewRef, tmpDescriptor);
			}
		}

		return tmpHTML;
	}

	/**
	 * Render the Entity Data tab content.
	 * Sections: Providers, Entity Bundle (conditional), Autofill Trigger Group (conditional).
	 *
	 * @returns {string} HTML string
	 */
	_renderEntityDataTab()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpHTML = '';

		// Per-input sections
		let tmpResolved = this._resolveSelectedDescriptor();
		if (tmpResolved && tmpResolved.Descriptor)
		{
			let tmpDescriptor = tmpResolved.Descriptor;
			let tmpProviders = (tmpDescriptor.PictForm && Array.isArray(tmpDescriptor.PictForm.Providers))
				? tmpDescriptor.PictForm.Providers : [];

			// Section 1: Providers
			tmpHTML += this._renderProvidersSection(tmpPanelViewRef);

			// Section 2: Entity Bundle (conditional on provider)
			if (tmpProviders.indexOf('Pict-Input-EntityBundleRequest') >= 0)
			{
				tmpHTML += '<div class="pict-fe-data-section-divider"></div>';
				tmpHTML += this._renderEntityBundleSection(tmpPanelViewRef, tmpDescriptor);
			}

			// Section 3: Autofill Trigger Group (conditional on provider)
			if (tmpProviders.indexOf('Pict-Input-AutofillTriggerGroup') >= 0)
			{
				tmpHTML += '<div class="pict-fe-data-section-divider"></div>';
				tmpHTML += this._renderAutofillTriggerSection(tmpPanelViewRef, tmpDescriptor);
			}
		}
		else
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">Select an input to see Providers, Entity Bundles, and Triggers.</div>';
		}

		return tmpHTML;
	}

	/* ---- PickLists ---- */

	/**
	 * Resolve the PickList array for the current scope.
	 *
	 * @returns {Array|null}
	 */
	_resolvePickListArray()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest)
		{
			return null;
		}

		if (this._PickListScope === 'manifest')
		{
			if (!Array.isArray(tmpManifest.PickLists))
			{
				tmpManifest.PickLists = [];
			}
			return tmpManifest.PickLists;
		}
		else if (this._PickListScope.indexOf('section:') === 0)
		{
			let tmpIndex = parseInt(this._PickListScope.substring(8), 10);
			if (!tmpManifest.Sections || !tmpManifest.Sections[tmpIndex])
			{
				return null;
			}
			let tmpSection = tmpManifest.Sections[tmpIndex];
			if (!Array.isArray(tmpSection.PickLists))
			{
				tmpSection.PickLists = [];
			}
			return tmpSection.PickLists;
		}

		return null;
	}

	/**
	 * Render the PickLists section of the Data tab.
	 *
	 * @param {string} pPanelViewRef
	 * @returns {string} HTML string
	 */
	_renderPickListsSection(pPanelViewRef)
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpHTML = '';

		tmpHTML += '<div class="pict-fe-props-section-header">PICKLISTS</div>';

		// Scope selector — searchable dropdown
		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpScopeLabel = 'Global (Manifest)';
		if (this._PickListScope !== 'manifest' && tmpManifest && Array.isArray(tmpManifest.Sections))
		{
			let tmpParts = this._PickListScope.split(':');
			let tmpIdx = parseInt(tmpParts[1], 10);
			if (tmpManifest.Sections[tmpIdx])
			{
				tmpScopeLabel = tmpManifest.Sections[tmpIdx].Name || ('Section ' + tmpIdx);
			}
		}

		tmpHTML += `<div class="pict-fe-searchable-selector pict-fe-data-scope-selector" id="FormEditor-PickListScopeSelector-Wrap-${tmpEditorHash}">`;
		tmpHTML += `<input class="pict-fe-searchable-selector-input" id="FormEditor-PickListScopeSelector-${tmpEditorHash}" type="text" placeholder="\u2014 Select scope \u2014" value="${this._escapeAttr(tmpScopeLabel)}" autocomplete="off" />`;
		tmpHTML += `<div class="pict-fe-searchable-selector-list" id="FormEditor-PickListScopeSelector-List-${tmpEditorHash}">`;

		// Global (Manifest) always first
		let tmpGlobalActive = (this._PickListScope === 'manifest') ? ' pict-fe-searchable-selector-item-active' : '';
		tmpHTML += `<div class="pict-fe-searchable-selector-item${tmpGlobalActive}" data-value="manifest" data-label="Global Manifest" onclick="${pPanelViewRef}.setPickListScope('manifest')">Global (Manifest)</div>`;

		// Section-level scopes
		if (tmpManifest && Array.isArray(tmpManifest.Sections))
		{
			for (let s = 0; s < tmpManifest.Sections.length; s++)
			{
				let tmpSection = tmpManifest.Sections[s];
				let tmpScopeName = tmpSection.Name || ('Section ' + s);
				let tmpScopeValue = 'section:' + s;
				let tmpActiveClass = (this._PickListScope === tmpScopeValue) ? ' pict-fe-searchable-selector-item-active' : '';
				tmpHTML += `<div class="pict-fe-searchable-selector-item${tmpActiveClass}" data-value="${this._escapeAttr(tmpScopeValue)}" data-label="${this._escapeAttr(tmpScopeName)}" onclick="${pPanelViewRef}.setPickListScope('${this._escapeAttr(tmpScopeValue)}')">${this._escapeHTML(tmpScopeName)}</div>`;
			}
		}

		tmpHTML += '</div>'; // list
		tmpHTML += '</div>'; // wrap

		// PickList cards
		let tmpPickLists = this._resolvePickListArray();
		if (!tmpPickLists || tmpPickLists.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No PickLists in this scope.</div>';
		}
		else
		{
			for (let i = 0; i < tmpPickLists.length; i++)
			{
				let tmpPL = tmpPickLists[i];
				let tmpHash = tmpPL.Hash || '';
				let tmpIsExpanded = (this._ExpandedPickList === tmpHash);
				let tmpEscapedHash = this._escapeAttr(tmpHash).replace(/'/g, "\\'");

				// Build tag list for collapsed view
				let tmpTags = [];
				if (tmpPL.Dynamic) tmpTags.push('Dynamic');
				if (tmpPL.Sorted) tmpTags.push('Sorted');
				if (tmpPL.Unique) tmpTags.push('Unique');

				tmpHTML += '<div class="pict-fe-picklist-card">';

				// Header
				tmpHTML += `<div class="pict-fe-picklist-header${tmpIsExpanded ? ' pict-fe-picklist-header-expanded' : ''}" onclick="${pPanelViewRef}.togglePickListExpand('${tmpEscapedHash}')">`;
				tmpHTML += `<span class="pict-fe-named-list-arrow">${tmpIsExpanded ? '\u25BE' : '\u25B8'}</span>`;
				tmpHTML += `<span class="pict-fe-picklist-name">${this._escapeHTML(tmpHash)}</span>`;
				if (tmpTags.length > 0)
				{
					tmpHTML += `<span class="pict-fe-named-list-count">(${tmpTags.join(', ')})</span>`;
				}
				tmpHTML += '</div>';

				if (tmpIsExpanded)
				{
					tmpHTML += '<div class="pict-fe-picklist-body">';

					// Hash
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpHash)}" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','Hash',this.value)" />`;
					tmpHTML += '</div>';

					// ListAddress
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">List Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpPL.ListAddress || '')}" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','ListAddress',this.value)" />`;
					tmpHTML += '</div>';

					// ListSourceAddress
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">List Source Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpPL.ListSourceAddress || '')}" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','ListSourceAddress',this.value)" />`;
					tmpHTML += '</div>';

					// TextTemplate
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Text Template</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpPL.TextTemplate || '')}" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','TextTemplate',this.value)" />`;
					tmpHTML += '</div>';

					// IDTemplate
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">ID Template</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpPL.IDTemplate || '')}" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','IDTemplate',this.value)" />`;
					tmpHTML += '</div>';

					// Checkboxes row
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPL.Unique ? 'checked' : ''} onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','Unique',this.checked)" /> Unique</label>`;
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPL.Sorted ? 'checked' : ''} onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','Sorted',this.checked)" /> Sorted</label>`;
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPL.Dynamic ? 'checked' : ''} onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','Dynamic',this.checked)" /> Dynamic</label>`;
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPL.ExplicitSourceAddress ? 'checked' : ''} onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','ExplicitSourceAddress',this.checked)" /> Explicit Source</label>`;
					tmpHTML += '</div>';

					// UpdateFrequency
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Update Frequency</div>';
					let tmpFreq = tmpPL.UpdateFrequency || 'Always';
					tmpHTML += `<select class="pict-fe-props-input" onchange="${pPanelViewRef}.updatePickListProperty('${tmpEscapedHash}','UpdateFrequency',this.value)">`;
					tmpHTML += `<option value="Always"${tmpFreq === 'Always' ? ' selected' : ''}>Always</option>`;
					tmpHTML += `<option value="Once"${tmpFreq === 'Once' ? ' selected' : ''}>Once</option>`;
					tmpHTML += '</select>';
					tmpHTML += '</div>';

					// Delete
					tmpHTML += `<button class="pict-fe-named-list-delete-btn" onclick="if(this.dataset.armed){${pPanelViewRef}.removePickList('${tmpEscapedHash}')}else{this.dataset.armed='1';this.textContent='Sure? Delete PickList';this.classList.add('pict-fe-named-list-delete-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='Delete PickList';b.classList.remove('pict-fe-named-list-delete-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='Delete PickList';this.classList.remove('pict-fe-named-list-delete-btn-armed');clearTimeout(this._armTimer)}">Delete PickList</button>`;

					tmpHTML += '</div>';
				}

				tmpHTML += '</div>';
			}
		}

		tmpHTML += `<button class="pict-fe-named-list-add-btn" onclick="${pPanelViewRef}.addPickList()">+ New PickList</button>`;

		return tmpHTML;
	}

	/**
	 * Set the scope for PickList editing.
	 *
	 * @param {string} pScope - 'manifest' or 'section:N'
	 */
	setPickListScope(pScope)
	{
		this._PickListScope = pScope;
		this._ExpandedPickList = null;
		this.renderListDataTabPanel();
	}

	/**
	 * Toggle the expanded/collapsed state of a PickList card.
	 *
	 * @param {string} pHash
	 */
	togglePickListExpand(pHash)
	{
		this._ExpandedPickList = (this._ExpandedPickList === pHash) ? null : pHash;
		this.renderListDataTabPanel();
	}

	/**
	 * Add a new PickList to the current scope.
	 */
	addPickList()
	{
		let tmpPickLists = this._resolvePickListArray();
		if (!tmpPickLists)
		{
			return;
		}

		let tmpIndex = tmpPickLists.length + 1;
		let tmpHash = 'PickList' + tmpIndex;

		let tmpExists = true;
		while (tmpExists)
		{
			tmpExists = false;
			for (let i = 0; i < tmpPickLists.length; i++)
			{
				if (tmpPickLists[i].Hash === tmpHash)
				{
					tmpIndex++;
					tmpHash = 'PickList' + tmpIndex;
					tmpExists = true;
					break;
				}
			}
		}

		tmpPickLists.push({
			Hash: tmpHash,
			ListAddress: '',
			ListSourceAddress: '',
			TextTemplate: '{~Data:text~}',
			IDTemplate: '{~Data:id~}',
			Unique: false,
			Sorted: false,
			Dynamic: false,
			UpdateFrequency: 'Always'
		});

		this._ExpandedPickList = tmpHash;
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Update a property on a PickList.
	 *
	 * @param {string} pHash - Current hash of the PickList
	 * @param {string} pProperty - Property name
	 * @param {*} pValue - New value
	 */
	updatePickListProperty(pHash, pProperty, pValue)
	{
		let tmpPickLists = this._resolvePickListArray();
		if (!tmpPickLists)
		{
			return;
		}

		for (let i = 0; i < tmpPickLists.length; i++)
		{
			if (tmpPickLists[i].Hash === pHash)
			{
				let tmpOldHash = tmpPickLists[i].Hash;

				// Boolean properties
				if (pProperty === 'Unique' || pProperty === 'Sorted' || pProperty === 'Dynamic' || pProperty === 'ExplicitSourceAddress')
				{
					tmpPickLists[i][pProperty] = !!pValue;
				}
				else
				{
					tmpPickLists[i][pProperty] = pValue;
				}

				// If Hash changed, update expanded state and re-render
				if (pProperty === 'Hash' && tmpOldHash !== pValue)
				{
					if (this._ExpandedPickList === tmpOldHash)
					{
						this._ExpandedPickList = pValue;
					}
					this._ParentFormEditor.renderVisualEditor();
				}

				break;
			}
		}

		// Non-Hash property changes don't need re-render — data is mutated in-place
	}

	/**
	 * Remove a PickList from the current scope.
	 *
	 * @param {string} pHash
	 */
	removePickList(pHash)
	{
		let tmpPickLists = this._resolvePickListArray();
		if (!tmpPickLists)
		{
			return;
		}

		for (let i = 0; i < tmpPickLists.length; i++)
		{
			if (tmpPickLists[i].Hash === pHash)
			{
				tmpPickLists.splice(i, 1);
				break;
			}
		}

		if (this._ExpandedPickList === pHash)
		{
			this._ExpandedPickList = null;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/* ---- Providers ---- */

	/**
	 * Return the list of known provider hashes and names.
	 *
	 * @returns {Array} Array of { Hash, Name }
	 */
	_getKnownProviders()
	{
		return [
			{ Hash: 'Pict-Input-Select', Name: 'Select (Dropdown)' },
			{ Hash: 'Pict-Input-AutofillTriggerGroup', Name: 'Autofill Trigger Group' },
			{ Hash: 'Pict-Input-EntityBundleRequest', Name: 'Entity Bundle Request' },
			{ Hash: 'Pict-Input-TemplatedEntityLookup', Name: 'Templated Entity Lookup' },
			{ Hash: 'Pict-Input-DateTime', Name: 'Date/Time' },
			{ Hash: 'Pict-Input-Chart', Name: 'Chart' },
			{ Hash: 'Pict-Input-PreciseNumber', Name: 'Precise Number' },
			{ Hash: 'Pict-Input-HTML', Name: 'HTML' },
			{ Hash: 'Pict-Input-Markdown', Name: 'Markdown' },
			{ Hash: 'Pict-Input-Link', Name: 'Link' }
		];
	}

	/**
	 * Render the Providers section of the Data tab.
	 *
	 * @param {string} pPanelViewRef
	 * @returns {string} HTML string
	 */
	_renderProvidersSection(pPanelViewRef)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return '';
		}

		let tmpDescriptor = tmpResolved.Descriptor;
		let tmpProviders = (tmpDescriptor.PictForm && Array.isArray(tmpDescriptor.PictForm.Providers))
			? tmpDescriptor.PictForm.Providers : [];
		let tmpKnown = this._getKnownProviders();

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-header">PROVIDERS</div>';

		// Current providers list
		if (tmpProviders.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No providers configured.</div>';
		}
		else
		{
			for (let i = 0; i < tmpProviders.length; i++)
			{
				let tmpProvHash = tmpProviders[i];
				let tmpProvName = tmpProvHash;
				for (let k = 0; k < tmpKnown.length; k++)
				{
					if (tmpKnown[k].Hash === tmpProvHash)
					{
						tmpProvName = tmpKnown[k].Name;
						break;
					}
				}

				tmpHTML += `<div class="pict-fe-provider-entry" draggable="true" data-index="${i}" ondragstart="${pPanelViewRef}.onProviderDragStart(${i},event)" ondragover="${pPanelViewRef}.onProviderDragOver(${i},event)" ondrop="${pPanelViewRef}.onProviderDrop(${i},event)" ondragend="${pPanelViewRef}.onProviderDragEnd(event)">`;
				tmpHTML += '<span class="pict-fe-provider-drag-handle">\u2807</span>';
				tmpHTML += `<span class="pict-fe-provider-name">${this._escapeHTML(tmpProvName)}</span>`;
				tmpHTML += `<button class="pict-fe-provider-remove" onclick="if(this.dataset.armed){${pPanelViewRef}.removeProvider(${i})}else{this.dataset.armed='1';this.textContent='Sure?';this.classList.add('pict-fe-provider-remove-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='\\u2715';b.classList.remove('pict-fe-provider-remove-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='\\u2715';this.classList.remove('pict-fe-provider-remove-armed');clearTimeout(this._armTimer)}">\u2715</button>`;
				tmpHTML += '</div>';
			}
		}

		// Add provider dropdown
		let tmpAvailable = [];
		for (let k = 0; k < tmpKnown.length; k++)
		{
			if (tmpProviders.indexOf(tmpKnown[k].Hash) < 0)
			{
				tmpAvailable.push(tmpKnown[k]);
			}
		}

		tmpHTML += `<select class="pict-fe-provider-add-select" onchange="if(this.value){${pPanelViewRef}.addProvider(this.value);this.value=''}">`;
		tmpHTML += '<option value="">+ Add Provider\u2026</option>';
		for (let a = 0; a < tmpAvailable.length; a++)
		{
			tmpHTML += `<option value="${this._escapeAttr(tmpAvailable[a].Hash)}">${this._escapeHTML(tmpAvailable[a].Name)}</option>`;
		}
		tmpHTML += '</select>';

		return tmpHTML;
	}

	/**
	 * Add a provider to the current input's Providers array.
	 *
	 * @param {string} pProviderHash
	 */
	addProvider(pProviderHash)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		if (!Array.isArray(tmpResolved.Descriptor.PictForm.Providers))
		{
			tmpResolved.Descriptor.PictForm.Providers = [];
		}

		if (tmpResolved.Descriptor.PictForm.Providers.indexOf(pProviderHash) >= 0)
		{
			return;
		}

		tmpResolved.Descriptor.PictForm.Providers.push(pProviderHash);

		// Auto-create stub configurations
		if (pProviderHash === 'Pict-Input-EntityBundleRequest')
		{
			if (!Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
			{
				tmpResolved.Descriptor.PictForm.EntitiesBundle = [];
			}
		}
		else if (pProviderHash === 'Pict-Input-AutofillTriggerGroup')
		{
			if (!tmpResolved.Descriptor.PictForm.AutofillTriggerGroup)
			{
				tmpResolved.Descriptor.PictForm.AutofillTriggerGroup = { TriggerGroupHash: '' };
			}
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Remove a provider from the current input's Providers array.
	 *
	 * @param {number} pIndex
	 */
	removeProvider(pIndex)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.Providers))
		{
			return;
		}

		tmpResolved.Descriptor.PictForm.Providers.splice(pIndex, 1);
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Reorder a provider in the current input's Providers array.
	 *
	 * @param {number} pFromIndex
	 * @param {number} pToIndex
	 */
	reorderProvider(pFromIndex, pToIndex)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.Providers))
		{
			return;
		}

		let tmpProviders = tmpResolved.Descriptor.PictForm.Providers;
		if (pFromIndex < 0 || pFromIndex >= tmpProviders.length || pToIndex < 0 || pToIndex >= tmpProviders.length)
		{
			return;
		}

		let tmpItem = tmpProviders.splice(pFromIndex, 1)[0];
		tmpProviders.splice(pToIndex, 0, tmpItem);
		this._ParentFormEditor.renderVisualEditor();
	}

	onProviderDragStart(pIndex, pEvent)
	{
		this._ProvidersDragState = { FromIndex: pIndex };
		if (pEvent && pEvent.dataTransfer)
		{
			pEvent.dataTransfer.effectAllowed = 'move';
			pEvent.dataTransfer.setData('text/plain', String(pIndex));
		}
		if (pEvent && pEvent.target)
		{
			pEvent.target.style.opacity = '0.5';
		}
	}

	onProviderDragOver(pIndex, pEvent)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
		}
	}

	onProviderDrop(pIndex, pEvent)
	{
		if (pEvent)
		{
			pEvent.preventDefault();
		}

		if (!this._ProvidersDragState)
		{
			return;
		}

		let tmpFromIndex = this._ProvidersDragState.FromIndex;
		this._ProvidersDragState = null;

		if (tmpFromIndex !== pIndex)
		{
			this.reorderProvider(tmpFromIndex, pIndex);
		}
	}

	onProviderDragEnd(pEvent)
	{
		this._ProvidersDragState = null;
		if (pEvent && pEvent.target)
		{
			pEvent.target.style.opacity = '';
		}
	}

	/* ---- Entity Bundle ---- */

	/**
	 * Return metadata for all supported Entity Bundle step types.
	 * Each entry has: Type (string), Name (display label), Fields (array of field defs).
	 * Field defs: { Key, Label, InputType ('text'|'number'|'checkbox'|'json') }
	 *
	 * @returns {Array}
	 */
	_getEntityBundleStepTypes()
	{
		return [
			{
				Type: 'MeadowEntity',
				Name: 'Meadow Entity',
				Fields:
				[
					{ Key: 'Entity', Label: 'Entity', InputType: 'text' },
					{ Key: 'Filter', Label: 'Filter', InputType: 'text' },
					{ Key: 'FilterData', Label: 'Filter Data (JSON)', InputType: 'json' },
					{ Key: 'Destination', Label: 'Destination', InputType: 'text' },
					{ Key: 'SingleRecord', Label: 'Single Record', InputType: 'checkbox' },
					{ Key: 'RecordCount', Label: 'Record Count', InputType: 'number' },
					{ Key: 'RecordStartCursor', Label: 'Record Start Cursor', InputType: 'number' }
				]
			},
			{
				Type: 'MeadowEntityCount',
				Name: 'Entity Count',
				Fields:
				[
					{ Key: 'Entity', Label: 'Entity', InputType: 'text' },
					{ Key: 'Filter', Label: 'Filter', InputType: 'text' },
					{ Key: 'Destination', Label: 'Destination', InputType: 'text' }
				]
			},
			{
				Type: 'Custom',
				Name: 'Custom URL',
				Fields:
				[
					{ Key: 'URL', Label: 'URL', InputType: 'text' },
					{ Key: 'Host', Label: 'Host', InputType: 'text' },
					{ Key: 'Protocol', Label: 'Protocol', InputType: 'text' },
					{ Key: 'Port', Label: 'Port', InputType: 'number' },
					{ Key: 'Destination', Label: 'Destination', InputType: 'text' }
				]
			},
			{
				Type: 'MapJoin',
				Name: 'Map Join',
				Fields:
				[
					{ Key: 'Joins', Label: 'Joins', InputType: 'json' },
					{ Key: 'JoinRecordSetAddress', Label: 'Join Record Set Address', InputType: 'text' },
					{ Key: 'DestinationRecordSetAddress', Label: 'Dest Record Set Address', InputType: 'text' },
					{ Key: 'DestinationRecordAddress', Label: 'Dest Record Address', InputType: 'text' },
					{ Key: 'DestinationJoinValue', Label: 'Dest Join Value', InputType: 'text' },
					{ Key: 'JoinValue', Label: 'Join Value', InputType: 'text' },
					{ Key: 'JoinJoinValueLHS', Label: 'Join Value LHS', InputType: 'text' },
					{ Key: 'JoinJoinValueRHS', Label: 'Join Value RHS', InputType: 'text' },
					{ Key: 'RecordDestinationAddress', Label: 'Record Dest Address', InputType: 'text' },
					{ Key: 'BucketBy', Label: 'Bucket By', InputType: 'text' },
					{ Key: 'BucketByTemplate', Label: 'Bucket By Template', InputType: 'text' },
					{ Key: 'SingleRecord', Label: 'Single Record', InputType: 'checkbox' }
				]
			},
			{
				Type: 'ProjectDataset',
				Name: 'Project Dataset',
				Fields:
				[
					{ Key: 'InputRecordsetAddress', Label: 'Input Recordset Address', InputType: 'text' },
					{ Key: 'OutputRecordsetAddress', Label: 'Output Recordset Address', InputType: 'text' },
					{ Key: 'RecordPrototypeAddress', Label: 'Record Prototype Address', InputType: 'text' },
					{ Key: 'RecordFieldMapping', Label: 'Record Field Mapping (JSON)', InputType: 'json' },
					{ Key: 'OutputRecordsetAddressMapping', Label: 'Output Recordset Mapping (JSON)', InputType: 'json' }
				]
			},
			{
				Type: 'SetStateAddress',
				Name: 'Set State Address',
				Fields:
				[
					{ Key: 'StateAddress', Label: 'State Address', InputType: 'text' }
				]
			},
			{
				Type: 'PopState',
				Name: 'Pop State',
				Fields: []
			}
		];
	}

	/**
	 * Render a single field for an Entity Bundle step based on field metadata.
	 *
	 * @param {string} pPanelViewRef
	 * @param {number} pStepIndex
	 * @param {object} pStep - The step data object
	 * @param {object} pFieldDef - { Key, Label, InputType }
	 * @returns {string} HTML string
	 */
	_renderEntityBundleStepField(pPanelViewRef, pStepIndex, pStep, pFieldDef)
	{
		let tmpHTML = '';
		let tmpKey = pFieldDef.Key;
		let tmpLabel = pFieldDef.Label;
		let tmpInputType = pFieldDef.InputType;

		tmpHTML += '<div class="pict-fe-props-field">';

		if (tmpInputType === 'checkbox')
		{
			tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${pStep[tmpKey] ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleStep(${pStepIndex},'${tmpKey}',this.checked)" /> ${this._escapeHTML(tmpLabel)}</label>`;
		}
		else if (tmpInputType === 'json')
		{
			let tmpValue = '';
			if (pStep[tmpKey] !== undefined && pStep[tmpKey] !== null)
			{
				if (typeof pStep[tmpKey] === 'object')
				{
					try { tmpValue = JSON.stringify(pStep[tmpKey], null, 2); }
					catch (e) { tmpValue = ''; }
				}
				else
				{
					tmpValue = String(pStep[tmpKey]);
				}
			}
			tmpHTML += `<div class="pict-fe-props-label">${this._escapeHTML(tmpLabel)}</div>`;
			tmpHTML += `<textarea class="pict-fe-props-input pict-fe-props-textarea" rows="3" onchange="${pPanelViewRef}.updateEntityBundleStepJSON(${pStepIndex},'${tmpKey}',this.value)">${this._escapeHTML(tmpValue)}</textarea>`;
		}
		else if (tmpInputType === 'number')
		{
			tmpHTML += `<div class="pict-fe-props-label">${this._escapeHTML(tmpLabel)}</div>`;
			tmpHTML += `<input class="pict-fe-props-input" type="number" value="${this._escapeAttr(pStep[tmpKey] !== undefined ? String(pStep[tmpKey]) : '')}" onchange="${pPanelViewRef}.updateEntityBundleStep(${pStepIndex},'${tmpKey}',this.value)" />`;
		}
		else
		{
			// text
			tmpHTML += `<div class="pict-fe-props-label">${this._escapeHTML(tmpLabel)}</div>`;
			tmpHTML += `<input class="pict-fe-props-input${tmpKey === 'Filter' || tmpKey === 'Destination' ? ' pict-fe-hash-input' : ''}" type="text" value="${this._escapeAttr(pStep[tmpKey] || '')}" onchange="${pPanelViewRef}.updateEntityBundleStep(${pStepIndex},'${tmpKey}',this.value)" />`;
		}

		tmpHTML += '</div>';
		return tmpHTML;
	}

	/**
	 * Render the Entity Bundle section of the Entity Data tab.
	 *
	 * @param {string} pPanelViewRef
	 * @param {object} pDescriptor
	 * @returns {string} HTML string
	 */
	_renderEntityBundleSection(pPanelViewRef, pDescriptor)
	{
		let tmpPictForm = pDescriptor.PictForm || {};
		let tmpSteps = Array.isArray(tmpPictForm.EntitiesBundle) ? tmpPictForm.EntitiesBundle : [];
		let tmpStepTypes = this._getEntityBundleStepTypes();

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-header">ENTITY BUNDLE</div>';

		if (tmpSteps.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No entity steps defined.</div>';
		}

		for (let i = 0; i < tmpSteps.length; i++)
		{
			let tmpStep = tmpSteps[i];
			let tmpIsExpanded = (this._ExpandedEntityBundleStep === i);
			let tmpStepType = tmpStep.Type || 'MeadowEntity';
			let tmpStepTypeDef = tmpStepTypes.find(function(t) { return t.Type === tmpStepType; });
			let tmpStepTypeName = tmpStepTypeDef ? tmpStepTypeDef.Name : tmpStepType;

			tmpHTML += '<div class="pict-fe-entity-bundle-card">';

			// Header — shows "Step N (Type Name)" and entity/URL summary
			let tmpHeaderLabel = 'Step ' + (i + 1) + ' (' + tmpStepTypeName + ')';
			if (tmpStepType === 'Custom' && tmpStep.URL)
			{
				tmpHeaderLabel += ': ' + tmpStep.URL;
			}
			else if (tmpStep.Entity)
			{
				tmpHeaderLabel += ': ' + tmpStep.Entity;
			}
			if (tmpStep.Destination)
			{
				tmpHeaderLabel += ' \u2192 ' + tmpStep.Destination;
			}

			tmpHTML += `<div class="pict-fe-picklist-header${tmpIsExpanded ? ' pict-fe-picklist-header-expanded' : ''}" onclick="${pPanelViewRef}.toggleEntityBundleStepExpand(${i})">`;
			tmpHTML += `<span class="pict-fe-named-list-arrow">${tmpIsExpanded ? '\u25BE' : '\u25B8'}</span>`;
			tmpHTML += `<span class="pict-fe-picklist-name">${this._escapeHTML(tmpHeaderLabel)}</span>`;
			tmpHTML += '</div>';

			if (tmpIsExpanded)
			{
				tmpHTML += '<div class="pict-fe-picklist-body">';

				// Type selector dropdown
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Step Type</div>';
				tmpHTML += `<select class="pict-fe-props-input" onchange="${pPanelViewRef}.updateEntityBundleStepType(${i},this.value)">`;
				for (let t = 0; t < tmpStepTypes.length; t++)
				{
					let tmpSelected = (tmpStepTypes[t].Type === tmpStepType) ? ' selected' : '';
					tmpHTML += `<option value="${tmpStepTypes[t].Type}"${tmpSelected}>${this._escapeHTML(tmpStepTypes[t].Name)}</option>`;
				}
				tmpHTML += '</select>';
				tmpHTML += '</div>';

				// Dynamic fields from step type metadata
				if (tmpStepTypeDef && tmpStepTypeDef.Fields.length > 0)
				{
					for (let f = 0; f < tmpStepTypeDef.Fields.length; f++)
					{
						tmpHTML += this._renderEntityBundleStepField(pPanelViewRef, i, tmpStep, tmpStepTypeDef.Fields[f]);
					}
				}
				else if (!tmpStepTypeDef)
				{
					tmpHTML += '<div class="pict-fe-props-placeholder">Unknown step type. Select a type above.</div>';
				}

				// Delete step
				tmpHTML += `<button class="pict-fe-named-list-delete-btn" onclick="if(this.dataset.armed){${pPanelViewRef}.removeEntityBundleStep(${i})}else{this.dataset.armed='1';this.textContent='Sure? Delete Step';this.classList.add('pict-fe-named-list-delete-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='Delete Step';b.classList.remove('pict-fe-named-list-delete-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='Delete Step';this.classList.remove('pict-fe-named-list-delete-btn-armed');clearTimeout(this._armTimer)}">Delete Step</button>`;

				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		tmpHTML += `<button class="pict-fe-named-list-add-btn" onclick="${pPanelViewRef}.addEntityBundleStep()">+ Add Step</button>`;

		// Trigger configuration
		tmpHTML += '<div class="pict-fe-entity-bundle-triggers">';
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Trigger Group (fire when done)</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpPictForm.EntityBundleTriggerGroup || '')}" onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerGroup',this.value)" />`;
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPictForm.EntityBundleTriggerOnDataChange ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerOnDataChange',this.checked)" /> On Data Change</label>`;
		tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPictForm.EntityBundleTriggerOnInitialize ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerOnInitialize',this.checked)" /> On Initialize</label>`;
		tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPictForm.EntityBundleTriggerWithoutValue ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerWithoutValue',this.checked)" /> Without Value</label>`;
		tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPictForm.EntityBundleTriggerMetacontrollerSolve ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerMetacontrollerSolve',this.checked)" /> Metacontroller Solve</label>`;
		tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpPictForm.EntityBundleTriggerMetacontrollerRender ? 'checked' : ''} onchange="${pPanelViewRef}.updateEntityBundleTriggerProperty('EntityBundleTriggerMetacontrollerRender',this.checked)" /> Metacontroller Render</label>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		return tmpHTML;
	}

	toggleEntityBundleStepExpand(pIndex)
	{
		this._ExpandedEntityBundleStep = (this._ExpandedEntityBundleStep === pIndex) ? null : pIndex;
		this.renderEntityDataTabPanel();
	}

	addEntityBundleStep()
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		if (!Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
		{
			tmpResolved.Descriptor.PictForm.EntitiesBundle = [];
		}

		let tmpNewIndex = tmpResolved.Descriptor.PictForm.EntitiesBundle.length;
		tmpResolved.Descriptor.PictForm.EntitiesBundle.push({
			Type: 'MeadowEntity',
			Entity: '',
			Filter: '',
			Destination: '',
			SingleRecord: false
		});

		this._ExpandedEntityBundleStep = tmpNewIndex;
		this._ParentFormEditor.renderVisualEditor();
	}

	updateEntityBundleStep(pIndex, pProperty, pValue)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
		{
			return;
		}

		let tmpSteps = tmpResolved.Descriptor.PictForm.EntitiesBundle;
		if (pIndex < 0 || pIndex >= tmpSteps.length)
		{
			return;
		}

		// Determine field type from step type metadata
		let tmpStep = tmpSteps[pIndex];
		let tmpStepType = tmpStep.Type || 'MeadowEntity';
		let tmpStepTypes = this._getEntityBundleStepTypes();
		let tmpTypeDef = tmpStepTypes.find(function(t) { return t.Type === tmpStepType; });
		let tmpFieldDef = tmpTypeDef ? tmpTypeDef.Fields.find(function(f) { return f.Key === pProperty; }) : null;
		let tmpInputType = tmpFieldDef ? tmpFieldDef.InputType : 'text';

		if (tmpInputType === 'checkbox')
		{
			tmpStep[pProperty] = !!pValue;
		}
		else if (tmpInputType === 'number')
		{
			let tmpNum = Number(pValue);
			tmpStep[pProperty] = isNaN(tmpNum) ? 0 : tmpNum;
		}
		else
		{
			tmpStep[pProperty] = pValue;
		}

		// Don't re-render — data is mutated in-place
	}

	/**
	 * Update the Type of an Entity Bundle step. Triggers a re-render to
	 * show/hide the correct fields for the new type.
	 *
	 * @param {number} pIndex
	 * @param {string} pType
	 */
	updateEntityBundleStepType(pIndex, pType)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
		{
			return;
		}

		let tmpSteps = tmpResolved.Descriptor.PictForm.EntitiesBundle;
		if (pIndex < 0 || pIndex >= tmpSteps.length)
		{
			return;
		}

		tmpSteps[pIndex].Type = pType;

		// Re-render to show/hide fields for the new type
		this.renderEntityDataTabPanel();
	}

	/**
	 * Update a JSON-type field on an Entity Bundle step.
	 * Attempts to parse the value as JSON; stores the parsed object on success
	 * or stores the raw string on parse failure.
	 *
	 * @param {number} pIndex
	 * @param {string} pProperty
	 * @param {string} pValue - Raw string from textarea
	 */
	updateEntityBundleStepJSON(pIndex, pProperty, pValue)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
		{
			return;
		}

		let tmpSteps = tmpResolved.Descriptor.PictForm.EntitiesBundle;
		if (pIndex < 0 || pIndex >= tmpSteps.length)
		{
			return;
		}

		let tmpTrimmed = pValue.trim();
		if (tmpTrimmed === '')
		{
			delete tmpSteps[pIndex][pProperty];
			return;
		}

		try
		{
			tmpSteps[pIndex][pProperty] = JSON.parse(tmpTrimmed);
		}
		catch (e)
		{
			// Store as raw string if not valid JSON
			tmpSteps[pIndex][pProperty] = tmpTrimmed;
		}

		// Don't re-render — data is mutated in-place
	}

	removeEntityBundleStep(pIndex)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.EntitiesBundle))
		{
			return;
		}

		tmpResolved.Descriptor.PictForm.EntitiesBundle.splice(pIndex, 1);

		if (this._ExpandedEntityBundleStep === pIndex)
		{
			this._ExpandedEntityBundleStep = null;
		}
		else if (this._ExpandedEntityBundleStep !== null && this._ExpandedEntityBundleStep > pIndex)
		{
			this._ExpandedEntityBundleStep--;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	updateEntityBundleTriggerProperty(pProperty, pValue)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		if (pProperty === 'EntityBundleTriggerOnDataChange' || pProperty === 'EntityBundleTriggerOnInitialize' || pProperty === 'EntityBundleTriggerWithoutValue' || pProperty === 'EntityBundleTriggerMetacontrollerSolve' || pProperty === 'EntityBundleTriggerMetacontrollerRender')
		{
			tmpResolved.Descriptor.PictForm[pProperty] = !!pValue;
		}
		else
		{
			if (pValue === '')
			{
				delete tmpResolved.Descriptor.PictForm[pProperty];
			}
			else
			{
				tmpResolved.Descriptor.PictForm[pProperty] = pValue;
			}
		}

		// Don't re-render — data is mutated in-place
	}

	/* ---- Autofill Trigger Group ---- */

	/**
	 * Normalize AutofillTriggerGroup to an array.
	 *
	 * @param {object} pDescriptor
	 * @returns {Array}
	 */
	_resolveAutofillTriggerArray(pDescriptor)
	{
		if (!pDescriptor || !pDescriptor.PictForm)
		{
			return [];
		}

		let tmpConfig = pDescriptor.PictForm.AutofillTriggerGroup;

		if (Array.isArray(tmpConfig))
		{
			return tmpConfig;
		}
		else if (tmpConfig && typeof tmpConfig === 'object')
		{
			// Wrap single object in array — but keep the reference intact by converting in-place
			pDescriptor.PictForm.AutofillTriggerGroup = [tmpConfig];
			return pDescriptor.PictForm.AutofillTriggerGroup;
		}

		return [];
	}

	/**
	 * Render the Autofill Trigger Group section of the Data tab.
	 *
	 * @param {string} pPanelViewRef
	 * @param {object} pDescriptor
	 * @returns {string} HTML string
	 */
	_renderAutofillTriggerSection(pPanelViewRef, pDescriptor)
	{
		let tmpTriggers = this._resolveAutofillTriggerArray(pDescriptor);

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-header">AUTOFILL TRIGGER GROUP</div>';

		if (tmpTriggers.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No trigger groups configured.</div>';
		}

		for (let i = 0; i < tmpTriggers.length; i++)
		{
			let tmpTrigger = tmpTriggers[i];
			let tmpIsExpanded = (this._ExpandedAutofillTrigger === i);

			let tmpHeaderLabel = 'Trigger ' + (i + 1);
			if (tmpTrigger.TriggerGroupHash)
			{
				tmpHeaderLabel += ': ' + tmpTrigger.TriggerGroupHash;
			}

			tmpHTML += '<div class="pict-fe-picklist-card">';

			tmpHTML += `<div class="pict-fe-picklist-header${tmpIsExpanded ? ' pict-fe-picklist-header-expanded' : ''}" onclick="${pPanelViewRef}.toggleAutofillTriggerExpand(${i})">`;
			tmpHTML += `<span class="pict-fe-named-list-arrow">${tmpIsExpanded ? '\u25BE' : '\u25B8'}</span>`;
			tmpHTML += `<span class="pict-fe-picklist-name">${this._escapeHTML(tmpHeaderLabel)}</span>`;
			tmpHTML += '</div>';

			if (tmpIsExpanded)
			{
				tmpHTML += '<div class="pict-fe-picklist-body">';

				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Trigger Group Hash</div>';
				tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpTrigger.TriggerGroupHash || '')}" onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'TriggerGroupHash',this.value)" />`;
				tmpHTML += '</div>';

				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Trigger Address</div>';
				tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpTrigger.TriggerAddress || '')}" onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'TriggerAddress',this.value)" />`;
				tmpHTML += '</div>';

				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpTrigger.MarshalEmptyValues ? 'checked' : ''} onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'MarshalEmptyValues',this.checked)" /> Marshal Empty Values</label>`;
				tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpTrigger.SelectOptionsRefresh ? 'checked' : ''} onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'SelectOptionsRefresh',this.checked)" /> Select Options Refresh</label>`;
				tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpTrigger.TriggerAllInputs ? 'checked' : ''} onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'TriggerAllInputs',this.checked)" /> Trigger All Inputs</label>`;
				tmpHTML += '</div>';

				// PreSolvers
				let tmpPreSolvers = Array.isArray(tmpTrigger.PreSolvers) ? JSON.stringify(tmpTrigger.PreSolvers) : '[]';
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Pre-Solvers (JSON array)</div>';
				tmpHTML += `<textarea class="pict-fe-props-textarea" rows="2" onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'PreSolvers',this.value)">${this._escapeHTML(tmpPreSolvers)}</textarea>`;
				tmpHTML += '</div>';

				// PostSolvers
				let tmpPostSolvers = Array.isArray(tmpTrigger.PostSolvers) ? JSON.stringify(tmpTrigger.PostSolvers) : '[]';
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Post-Solvers (JSON array)</div>';
				tmpHTML += `<textarea class="pict-fe-props-textarea" rows="2" onchange="${pPanelViewRef}.updateAutofillTriggerProperty(${i},'PostSolvers',this.value)">${this._escapeHTML(tmpPostSolvers)}</textarea>`;
				tmpHTML += '</div>';

				// Delete trigger
				tmpHTML += `<button class="pict-fe-named-list-delete-btn" onclick="if(this.dataset.armed){${pPanelViewRef}.removeAutofillTrigger(${i})}else{this.dataset.armed='1';this.textContent='Sure? Delete Trigger';this.classList.add('pict-fe-named-list-delete-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='Delete Trigger';b.classList.remove('pict-fe-named-list-delete-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='Delete Trigger';this.classList.remove('pict-fe-named-list-delete-btn-armed');clearTimeout(this._armTimer)}">Delete Trigger</button>`;

				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		tmpHTML += `<button class="pict-fe-named-list-add-btn" onclick="${pPanelViewRef}.addAutofillTrigger()">+ Add Trigger</button>`;

		return tmpHTML;
	}

	toggleAutofillTriggerExpand(pIndex)
	{
		this._ExpandedAutofillTrigger = (this._ExpandedAutofillTrigger === pIndex) ? null : pIndex;
		this.renderEntityDataTabPanel();
	}

	addAutofillTrigger()
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		let tmpTriggers = this._resolveAutofillTriggerArray(tmpResolved.Descriptor);
		if (tmpTriggers.length === 0)
		{
			tmpResolved.Descriptor.PictForm.AutofillTriggerGroup = [];
			tmpTriggers = tmpResolved.Descriptor.PictForm.AutofillTriggerGroup;
		}

		let tmpNewIndex = tmpTriggers.length;
		tmpTriggers.push({
			TriggerGroupHash: '',
			TriggerAddress: '',
			MarshalEmptyValues: false,
			SelectOptionsRefresh: false,
			TriggerAllInputs: false
		});

		this._ExpandedAutofillTrigger = tmpNewIndex;
		this._ParentFormEditor.renderVisualEditor();
	}

	updateAutofillTriggerProperty(pIndex, pProperty, pValue)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpTriggers = this._resolveAutofillTriggerArray(tmpResolved.Descriptor);
		if (pIndex < 0 || pIndex >= tmpTriggers.length)
		{
			return;
		}

		if (pProperty === 'MarshalEmptyValues' || pProperty === 'SelectOptionsRefresh' || pProperty === 'TriggerAllInputs')
		{
			tmpTriggers[pIndex][pProperty] = !!pValue;
		}
		else if (pProperty === 'PreSolvers' || pProperty === 'PostSolvers')
		{
			try
			{
				tmpTriggers[pIndex][pProperty] = JSON.parse(pValue);
			}
			catch (e)
			{
				tmpTriggers[pIndex][pProperty] = [];
			}
		}
		else
		{
			tmpTriggers[pIndex][pProperty] = pValue;
		}

		// Don't re-render — data is mutated in-place
	}

	removeAutofillTrigger(pIndex)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpTriggers = this._resolveAutofillTriggerArray(tmpResolved.Descriptor);
		if (pIndex < 0 || pIndex >= tmpTriggers.length)
		{
			return;
		}

		tmpTriggers.splice(pIndex, 1);

		// If only one left, convert back to single object
		if (tmpTriggers.length === 1)
		{
			tmpResolved.Descriptor.PictForm.AutofillTriggerGroup = tmpTriggers[0];
		}
		else if (tmpTriggers.length === 0)
		{
			tmpResolved.Descriptor.PictForm.AutofillTriggerGroup = { TriggerGroupHash: '' };
		}

		if (this._ExpandedAutofillTrigger === pIndex)
		{
			this._ExpandedAutofillTrigger = null;
		}
		else if (this._ExpandedAutofillTrigger !== null && this._ExpandedAutofillTrigger > pIndex)
		{
			this._ExpandedAutofillTrigger--;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/* ---- List Filter Rules ---- */

	/**
	 * Render the List Filter Rules section of the Data tab.
	 *
	 * @param {string} pPanelViewRef
	 * @param {object} pDescriptor
	 * @returns {string} HTML string
	 */
	_renderListFilterRulesSection(pPanelViewRef, pDescriptor)
	{
		let tmpPictForm = pDescriptor.PictForm || {};
		let tmpRules = Array.isArray(tmpPictForm.ListFilterRules) ? tmpPictForm.ListFilterRules : [];

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-section-header">LIST FILTER RULES</div>';

		if (tmpRules.length === 0)
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">No filter rules defined.</div>';
		}

		for (let i = 0; i < tmpRules.length; i++)
		{
			let tmpRule = tmpRules[i];
			let tmpIsExpanded = (this._ExpandedFilterRule === i);
			let tmpFilterType = tmpRule.FilterType || 'Explicit';

			let tmpHeaderLabel = 'Rule ' + (i + 1) + ': ' + tmpFilterType;

			tmpHTML += '<div class="pict-fe-picklist-card">';

			tmpHTML += `<div class="pict-fe-picklist-header${tmpIsExpanded ? ' pict-fe-picklist-header-expanded' : ''}" onclick="${pPanelViewRef}.toggleFilterRuleExpand(${i})">`;
			tmpHTML += `<span class="pict-fe-named-list-arrow">${tmpIsExpanded ? '\u25BE' : '\u25B8'}</span>`;
			tmpHTML += `<span class="pict-fe-picklist-name">${this._escapeHTML(tmpHeaderLabel)}</span>`;
			tmpHTML += '</div>';

			if (tmpIsExpanded)
			{
				tmpHTML += '<div class="pict-fe-picklist-body">';

				// FilterType selector
				tmpHTML += '<div class="pict-fe-props-field">';
				tmpHTML += '<div class="pict-fe-props-label">Filter Type</div>';
				tmpHTML += `<select class="pict-fe-props-input" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'FilterType',this.value)">`;
				tmpHTML += `<option value="Explicit"${tmpFilterType === 'Explicit' ? ' selected' : ''}>Explicit</option>`;
				tmpHTML += `<option value="CrossMap"${tmpFilterType === 'CrossMap' ? ' selected' : ''}>CrossMap</option>`;
				tmpHTML += '</select>';
				tmpHTML += '</div>';

				if (tmpFilterType === 'Explicit')
				{
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Filter Value Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpRule.FilterValueAddress || '')}" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'FilterValueAddress',this.value)" />`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Comparison</div>';
					let tmpComp = tmpRule.FilterValueComparison || '==';
					tmpHTML += `<select class="pict-fe-props-input" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'FilterValueComparison',this.value)">`;
					tmpHTML += `<option value="=="${tmpComp === '==' ? ' selected' : ''}>== (equals)</option>`;
					tmpHTML += `<option value="!="${tmpComp === '!=' ? ' selected' : ''}>!= (not equals)</option>`;
					tmpHTML += `<option value="~="${tmpComp === '~=' ? ' selected' : ''}>~= (contains)</option>`;
					tmpHTML += '</select>';
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpRule.IgnoreEmptyValue ? 'checked' : ''} onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'IgnoreEmptyValue',this.checked)" /> Ignore Empty Value</label>`;
					tmpHTML += '</div>';
				}
				else if (tmpFilterType === 'CrossMap')
				{
					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Join List Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpRule.JoinListAddress || '')}" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'JoinListAddress',this.value)" />`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpRule.JoinListAddressGlobal ? 'checked' : ''} onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'JoinListAddressGlobal',this.checked)" /> Join List Address Global</label>`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Join List Value Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpRule.JoinListValueAddress || '')}" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'JoinListValueAddress',this.value)" />`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">External Value Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpRule.ExternalValueAddress || '')}" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'ExternalValueAddress',this.value)" />`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += '<div class="pict-fe-props-label">Filter To Value Address</div>';
					tmpHTML += `<input class="pict-fe-props-input pict-fe-hash-input" type="text" value="${this._escapeAttr(tmpRule.FilterToValueAddress || '')}" onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'FilterToValueAddress',this.value)" />`;
					tmpHTML += '</div>';

					tmpHTML += '<div class="pict-fe-props-field">';
					tmpHTML += `<label class="pict-fe-props-checkbox-label"><input type="checkbox" class="pict-fe-props-checkbox" ${tmpRule.IgnoreEmpty ? 'checked' : ''} onchange="${pPanelViewRef}.updateListFilterRuleProperty(${i},'IgnoreEmpty',this.checked)" /> Ignore Empty</label>`;
					tmpHTML += '</div>';
				}

				// Delete rule
				tmpHTML += `<button class="pict-fe-named-list-delete-btn" onclick="if(this.dataset.armed){${pPanelViewRef}.removeListFilterRule(${i})}else{this.dataset.armed='1';this.textContent='Sure? Delete Rule';this.classList.add('pict-fe-named-list-delete-btn-armed');var b=this;clearTimeout(b._armTimer);b._armTimer=setTimeout(function(){delete b.dataset.armed;b.textContent='Delete Rule';b.classList.remove('pict-fe-named-list-delete-btn-armed');},2000)}" onmouseleave="if(this.dataset.armed){delete this.dataset.armed;this.textContent='Delete Rule';this.classList.remove('pict-fe-named-list-delete-btn-armed');clearTimeout(this._armTimer)}">Delete Rule</button>`;

				tmpHTML += '</div>';
			}

			tmpHTML += '</div>';
		}

		tmpHTML += `<button class="pict-fe-named-list-add-btn" onclick="${pPanelViewRef}.addListFilterRule()">+ Add Rule</button>`;

		return tmpHTML;
	}

	toggleFilterRuleExpand(pIndex)
	{
		this._ExpandedFilterRule = (this._ExpandedFilterRule === pIndex) ? null : pIndex;
		this.renderListDataTabPanel();
	}

	addListFilterRule()
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		if (!tmpResolved.Descriptor.PictForm)
		{
			tmpResolved.Descriptor.PictForm = {};
		}

		if (!Array.isArray(tmpResolved.Descriptor.PictForm.ListFilterRules))
		{
			tmpResolved.Descriptor.PictForm.ListFilterRules = [];
		}

		let tmpNewIndex = tmpResolved.Descriptor.PictForm.ListFilterRules.length;
		tmpResolved.Descriptor.PictForm.ListFilterRules.push({
			FilterType: 'Explicit',
			FilterValueAddress: '',
			FilterValueComparison: '=='
		});

		this._ExpandedFilterRule = tmpNewIndex;
		this._ParentFormEditor.renderVisualEditor();
	}

	updateListFilterRuleProperty(pIndex, pProperty, pValue)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.ListFilterRules))
		{
			return;
		}

		let tmpRules = tmpResolved.Descriptor.PictForm.ListFilterRules;
		if (pIndex < 0 || pIndex >= tmpRules.length)
		{
			return;
		}

		if (pProperty === 'IgnoreEmptyValue' || pProperty === 'IgnoreEmpty' || pProperty === 'JoinListAddressGlobal')
		{
			tmpRules[pIndex][pProperty] = !!pValue;
		}
		else
		{
			tmpRules[pIndex][pProperty] = pValue;
		}

		// FilterType changes the visible fields, so re-render
		if (pProperty === 'FilterType')
		{
			this._ParentFormEditor.renderVisualEditor();
		}
		// Other property changes don't need re-render — data is mutated in-place
	}

	removeListFilterRule(pIndex)
	{
		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.Descriptor.PictForm || !Array.isArray(tmpResolved.Descriptor.PictForm.ListFilterRules))
		{
			return;
		}

		tmpResolved.Descriptor.PictForm.ListFilterRules.splice(pIndex, 1);

		if (this._ExpandedFilterRule === pIndex)
		{
			this._ExpandedFilterRule = null;
		}
		else if (this._ExpandedFilterRule !== null && this._ExpandedFilterRule > pIndex)
		{
			this._ExpandedFilterRule--;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/* -------------------------------------------------------------------------- */
	/*          Submanifest (Tabular / RecordSet) Column Properties               */
	/* -------------------------------------------------------------------------- */

	/**
	 * Render properties for a selected submanifest column.
	 *
	 * @returns {string} HTML string
	 */
	_renderTabularColumnProperties()
	{
		let tmpResolved = this._resolveSelectedTabularDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return '<div class="pict-fe-props-placeholder">Select a column to view its properties.</div>';
		}

		let tmpDescriptor = tmpResolved.Descriptor;
		let tmpPanelViewRef = this._browserViewRef();
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpIconProvider = this._ParentFormEditor._IconographyProvider;

		let tmpName = tmpDescriptor.Name || '';
		let tmpColumnHash = tmpDescriptor.Hash || tmpResolved.Address;
		let tmpDataType = tmpDescriptor.DataType || 'String';
		let tmpInputType = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
		let tmpWidth = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.Width) ? tmpDescriptor.PictForm.Width : '';
		let tmpRow = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.Row) ? tmpDescriptor.PictForm.Row : 1;

		// Determine if parent group is Tabular or RecordSet
		let tmpGroupLayout = tmpResolved.Group ? (tmpResolved.Group.Layout || 'Tabular') : 'Tabular';

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-props-body">';

		// ReferenceManifest badge
		tmpHTML += `<div class="pict-fe-refmanifest-badge">${this._escapeHTML(tmpResolved.RefManifestName)}</div>`;

		// Name field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Name</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpName)}" onchange="${tmpPanelViewRef}.commitTabularPropertyChange('Name', this.value)" />`;
		tmpHTML += '</div>';

		// Hash field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Hash</div>';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" type="text" value="${this._escapeAttr(tmpColumnHash)}" onchange="${tmpPanelViewRef}.commitTabularPropertyChange('Hash', this.value)" />`;
		tmpHTML += '</div>';

		// Address (editable with confirmation)
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Address</div>';
		tmpHTML += '<div class="pict-fe-props-address-row">';
		tmpHTML += `<input class="pict-fe-props-input pict-fe-props-input-mono" id="FormEditor-PropsAddress-${this._ParentFormEditor.Hash}" type="text" value="${this._escapeAttr(tmpResolved.Address)}" />`;
		tmpHTML += `<button class="pict-fe-props-address-confirm" id="FormEditor-PropsAddressConfirm-${this._ParentFormEditor.Hash}" onclick="${tmpPanelViewRef}.confirmTabularAddressChange()" title="Confirm address change" style="display:none;">\u2713</button>`;
		tmpHTML += `<button class="pict-fe-props-address-cancel" id="FormEditor-PropsAddressCancel-${this._ParentFormEditor.Hash}" onclick="${tmpPanelViewRef}.cancelAddressChange()" title="Cancel" style="display:none;">\u00D7</button>`;
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// DataType dropdown
		let tmpDataTypeIcon = tmpIconProvider.getDataTypeIcon(tmpDataType, 14);
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += `<div class="pict-fe-props-label">${tmpDataTypeIcon ? '<span class="pict-fe-icon" style="margin-right:4px; vertical-align:middle; opacity:0.6;">' + tmpDataTypeIcon + '</span>' : ''}DataType</div>`;
		tmpHTML += `<select class="pict-fe-props-input" onchange="${tmpPanelViewRef}.commitTabularPropertyChange('DataType', this.value)">`;
		let tmpDataTypes = this._ParentFormEditor._ManyfestDataTypes;
		for (let i = 0; i < tmpDataTypes.length; i++)
		{
			let tmpSelected = (tmpDataTypes[i] === tmpDataType) ? ' selected' : '';
			tmpHTML += `<option value="${tmpDataTypes[i]}"${tmpSelected}>${tmpDataTypes[i]}</option>`;
		}
		tmpHTML += '</select>';
		tmpHTML += '</div>';

		// InputType picker button
		let tmpInputTypeIcon = tmpInputType ? tmpIconProvider.getInputTypeIcon(tmpInputType, 14) : '';
		let tmpInputTypeLabel = tmpInputType || 'DataType Default';
		let tmpEscapedColumnAddr = this._escapeAttr(tmpResolved.Address).replace(/'/g, "\\'");
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += `<div class="pict-fe-props-label">${tmpInputTypeIcon ? '<span class="pict-fe-icon" style="margin-right:4px; vertical-align:middle; opacity:0.6;">' + tmpInputTypeIcon + '</span>' : ''}InputType</div>`;
		tmpHTML += `<button class="pict-fe-props-inputtype-btn" id="FormEditor-PropsInputTypeBtn-${this._ParentFormEditor.Hash}" onclick="${tmpViewRef}._InputTypePickerView.beginEditTabularInputType(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedColumnAddr}')">${this._escapeHTML(tmpInputTypeLabel)}</button>`;
		tmpHTML += '</div>';

		// Width field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Width</div>';
		tmpHTML += `<input class="pict-fe-props-input" type="number" min="1" max="12" value="${this._escapeAttr(String(tmpWidth))}" placeholder="auto" onchange="${tmpPanelViewRef}.commitTabularPropertyChange('Width', this.value)" />`;
		tmpHTML += '</div>';

		// PictForm.Row field
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Row</div>';
		if (tmpGroupLayout === 'RecordSet')
		{
			tmpHTML += `<input class="pict-fe-props-input" type="number" min="1" value="${this._escapeAttr(String(tmpRow))}" onchange="${tmpPanelViewRef}.commitTabularPropertyChange('Row', this.value)" />`;
		}
		else
		{
			// Tabular: row is always 1, show read-only
			tmpHTML += `<input class="pict-fe-props-input" type="number" value="1" disabled title="Tabular groups use a single row" />`;
		}
		tmpHTML += '</div>';

		// Position indicator and move buttons
		let tmpKeys = tmpResolved.RefManifest && tmpResolved.RefManifest.Descriptors ? Object.keys(tmpResolved.RefManifest.Descriptors) : [];
		let tmpColumnIndex = tmpKeys.indexOf(tmpResolved.Address);
		let tmpColumnCount = tmpKeys.length;
		let tmpEscapedAddr = this._escapeAttr(tmpResolved.Address).replace(/'/g, "\\'");
		tmpHTML += '<div class="pict-fe-props-field">';
		tmpHTML += '<div class="pict-fe-props-label">Position</div>';
		tmpHTML += '<div class="pict-fe-props-position-row">';
		if (tmpColumnIndex > 0)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveSubmanifestColumnUp(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedAddr}')" title="Move left">\u25C0</button>`;
		}
		tmpHTML += `<span class="pict-fe-props-position-label">${tmpColumnIndex + 1} of ${tmpColumnCount}</span>`;
		if (tmpColumnIndex >= 0 && tmpColumnIndex < tmpColumnCount - 1)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}._ManifestOpsProvider.moveSubmanifestColumnDown(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedAddr}')" title="Move right">\u25B6</button>`;
		}
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// InputType-specific properties section
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += this._renderTabularInputTypeProperties(tmpInputType, tmpDescriptor, tmpPanelViewRef);

		// Solver assignment and references for this column
		tmpHTML += this._renderInputSolverInfo(tmpColumnHash);

		tmpHTML += '</div>'; // pict-fe-props-body

		return tmpHTML;
	}

	/**
	 * Render InputType-specific properties for a tabular column descriptor.
	 * Reuses the same InputType manifest lookup as regular inputs but
	 * commits changes via commitTabularPictFormChange.
	 *
	 * @param {string} pInputType - The InputType hash
	 * @param {object} pDescriptor - The column descriptor
	 * @param {string} pPanelViewRef - Panel view reference string for event handlers
	 * @returns {string} HTML string
	 */
	_renderTabularInputTypeProperties(pInputType, pDescriptor, pPanelViewRef)
	{
		if (!pInputType)
		{
			return '<div class="pict-fe-props-placeholder">Select an InputType to see additional properties.</div>';
		}

		let tmpManifest = this._ParentFormEditor._UtilitiesProvider._getInputTypeManifest(pInputType);
		if (!tmpManifest || !tmpManifest.Descriptors || Object.keys(tmpManifest.Descriptors).length === 0)
		{
			return '<div class="pict-fe-props-placeholder">No additional properties for ' + this._escapeHTML(pInputType) + '.</div>';
		}

		let tmpPictForm = (pDescriptor && pDescriptor.PictForm) ? pDescriptor.PictForm : {};
		let tmpHTML = '';

		tmpHTML += `<div class="pict-fe-props-section-header">${this._escapeHTML(pInputType)} Properties</div>`;

		let tmpDescriptorKeys = Object.keys(tmpManifest.Descriptors);
		for (let i = 0; i < tmpDescriptorKeys.length; i++)
		{
			let tmpPropHash = tmpDescriptorKeys[i];
			let tmpPropDescriptor = tmpManifest.Descriptors[tmpPropHash];
			let tmpPropName = tmpPropDescriptor.Name || tmpPropHash;
			let tmpPropDataType = tmpPropDescriptor.DataType || 'String';
			let tmpPropDescription = tmpPropDescriptor.Description || '';
			let tmpCurrentValue = tmpPictForm.hasOwnProperty(tmpPropHash) ? tmpPictForm[tmpPropHash] : '';

			tmpHTML += '<div class="pict-fe-props-field">';
			tmpHTML += `<div class="pict-fe-props-label" title="${this._escapeAttr(tmpPropDescription)}">${this._escapeHTML(tmpPropName)}</div>`;

			if (tmpPropDataType === 'Boolean')
			{
				let tmpChecked = tmpCurrentValue ? ' checked' : '';
				tmpHTML += `<label class="pict-fe-props-checkbox-label">`;
				tmpHTML += `<input type="checkbox" class="pict-fe-props-checkbox"${tmpChecked} onchange="${pPanelViewRef}.commitTabularPictFormChange('${tmpPropHash}', this.checked, 'Boolean')" />`;
				tmpHTML += ` ${this._escapeHTML(tmpPropDescription)}</label>`;
			}
			else if (tmpPropDataType === 'Number')
			{
				let tmpDisplayValue = (typeof tmpCurrentValue === 'number') ? String(tmpCurrentValue) : '';
				tmpHTML += `<input class="pict-fe-props-input" type="number" value="${this._escapeAttr(tmpDisplayValue)}" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitTabularPictFormChange('${tmpPropHash}', this.value, 'Number')" />`;
			}
			else
			{
				let tmpIsMultiline = (tmpPropDescription.indexOf('JSON') >= 0) || (tmpPropHash === 'Template');
				if (tmpIsMultiline)
				{
					let tmpDisplayValue = '';
					if (typeof tmpCurrentValue === 'string')
					{
						tmpDisplayValue = tmpCurrentValue;
					}
					else if (tmpCurrentValue !== null && tmpCurrentValue !== undefined && typeof tmpCurrentValue !== 'string')
					{
						try { tmpDisplayValue = JSON.stringify(tmpCurrentValue, null, 2); }
						catch (e) { tmpDisplayValue = String(tmpCurrentValue); }
					}
					tmpHTML += `<textarea class="pict-fe-props-textarea" rows="4" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitTabularPictFormChange('${tmpPropHash}', this.value, 'String')">${this._escapeHTML(tmpDisplayValue)}</textarea>`;
				}
				else
				{
					let tmpDisplayValue = (typeof tmpCurrentValue === 'string') ? tmpCurrentValue : '';
					tmpHTML += `<input class="pict-fe-props-input" type="text" value="${this._escapeAttr(tmpDisplayValue)}" placeholder="${this._escapeAttr(tmpPropDescription)}" onchange="${pPanelViewRef}.commitTabularPictFormChange('${tmpPropHash}', this.value, 'String')" />`;
				}
			}

			tmpHTML += '</div>';
		}

		return tmpHTML;
	}

	/**
	 * Commit a PictForm property change for a tabular column descriptor.
	 *
	 * @param {string} pPropertyHash - The PictForm property key
	 * @param {*} pValue - The new value
	 * @param {string} pDataType - 'Boolean', 'Number', or 'String'
	 */
	commitTabularPictFormChange(pPropertyHash, pValue, pDataType)
	{
		if (!this._SelectedTabularColumn || !this._ParentFormEditor)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedTabularDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpDescriptor = tmpResolved.Descriptor;

		if (!tmpDescriptor.PictForm)
		{
			tmpDescriptor.PictForm = {};
		}

		switch (pDataType)
		{
			case 'Boolean':
			{
				tmpDescriptor.PictForm[pPropertyHash] = !!pValue;
				break;
			}

			case 'Number':
			{
				let tmpNumValue = parseFloat(pValue);
				if (isNaN(tmpNumValue) || pValue === '')
				{
					delete tmpDescriptor.PictForm[pPropertyHash];
				}
				else
				{
					tmpDescriptor.PictForm[pPropertyHash] = tmpNumValue;
				}
				break;
			}

			default: // String
			{
				if (typeof pValue === 'string' && pValue.length > 0)
				{
					let tmpTrimmed = pValue.trim();
					if ((tmpTrimmed.charAt(0) === '[' && tmpTrimmed.charAt(tmpTrimmed.length - 1) === ']') ||
						(tmpTrimmed.charAt(0) === '{' && tmpTrimmed.charAt(tmpTrimmed.length - 1) === '}'))
					{
						try
						{
							tmpDescriptor.PictForm[pPropertyHash] = JSON.parse(tmpTrimmed);
						}
						catch (e)
						{
							tmpDescriptor.PictForm[pPropertyHash] = pValue;
						}
					}
					else
					{
						tmpDescriptor.PictForm[pPropertyHash] = pValue;
					}
				}
				else
				{
					delete tmpDescriptor.PictForm[pPropertyHash];
				}
				break;
			}
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Commit a property change for a submanifest column.
	 *
	 * @param {string} pProperty - 'Name', 'Hash', 'DataType', 'Row', 'Width', or 'InputType'
	 * @param {string} pValue
	 */
	commitTabularPropertyChange(pProperty, pValue)
	{
		if (!this._SelectedTabularColumn || !this._ParentFormEditor)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedTabularDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpDescriptor = tmpResolved.Descriptor;

		switch (pProperty)
		{
			case 'Name':
				tmpDescriptor.Name = pValue;
				break;

			case 'Hash':
				tmpDescriptor.Hash = pValue;
				break;

			case 'DataType':
				tmpDescriptor.DataType = pValue;
				break;

			case 'Row':
			{
				if (!tmpDescriptor.PictForm)
				{
					tmpDescriptor.PictForm = {};
				}
				let tmpRowNum = parseInt(pValue, 10);
				if (isNaN(tmpRowNum) || tmpRowNum < 1)
				{
					tmpRowNum = 1;
				}
				tmpDescriptor.PictForm.Row = tmpRowNum;
				break;
			}

			case 'Width':
			{
				if (!tmpDescriptor.PictForm)
				{
					tmpDescriptor.PictForm = {};
				}
				let tmpWidthValue = parseInt(pValue, 10);
				if (isNaN(tmpWidthValue) || pValue === '')
				{
					delete tmpDescriptor.PictForm.Width;
				}
				else
				{
					tmpDescriptor.PictForm.Width = tmpWidthValue;
				}
				break;
			}

			default:
				return;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Confirm the address change for a submanifest column — re-keys in the
	 * ReferenceManifest Descriptors.
	 */
	confirmTabularAddressChange()
	{
		if (!this._SelectedTabularColumn || !this._ParentFormEditor)
		{
			return;
		}
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpEditorHash = this._ParentFormEditor.Hash;
		let tmpInput = document.getElementById(`FormEditor-PropsAddress-${tmpEditorHash}`);
		if (!tmpInput)
		{
			return;
		}

		let tmpNewAddress = tmpInput.value.trim();
		if (!tmpNewAddress)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedTabularDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor || !tmpResolved.RefManifest)
		{
			return;
		}

		let tmpOldAddress = tmpResolved.Address;
		if (tmpNewAddress === tmpOldAddress)
		{
			return;
		}

		let tmpRefManifest = tmpResolved.RefManifest;

		// Re-key in the ReferenceManifest's Descriptors
		tmpRefManifest.Descriptors[tmpNewAddress] = tmpRefManifest.Descriptors[tmpOldAddress];
		delete tmpRefManifest.Descriptors[tmpOldAddress];

		// Update the selection to the new address
		this._SelectedTabularColumn.ColumnAddress = tmpNewAddress;
		this._ParentFormEditor._SelectedTabularColumn.ColumnAddress = tmpNewAddress;

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Commit a property change from the properties panel.
	 *
	 * @param {string} pProperty - The property to update ('Name', 'Hash', 'DataType', 'Width')
	 * @param {string} pValue - The new value
	 */
	commitPropertyChange(pProperty, pValue)
	{
		if (!this._SelectedInput || !this._ParentFormEditor)
		{
			return;
		}

		let tmpResolved = this._resolveSelectedDescriptor();
		if (!tmpResolved || !tmpResolved.Descriptor)
		{
			return;
		}

		let tmpDescriptor = tmpResolved.Descriptor;

		switch (pProperty)
		{
			case 'Name':
			{
				let tmpOldHash = tmpDescriptor.Hash || '';
				tmpDescriptor.Name = pValue;

				// Auto-update Hash if it still matches the auto-generated
				// pattern (ends with _I{n}).  If the user has manually
				// edited the hash, leave it alone.
				if (this._ParentFormEditor._UtilitiesProvider._isAutoGeneratedInputHash(tmpOldHash))
				{
					// Build new hash: keep the prefix (everything up to the last _I segment), replace with sanitized name
					let tmpPrefixMatch = tmpOldHash.match(/^(.+_R\d+_)Input\d+$/);
					if (tmpPrefixMatch)
					{
						let tmpNewHash = tmpPrefixMatch[1] + this._ParentFormEditor._UtilitiesProvider.sanitizeObjectKey(pValue);
						tmpDescriptor.Hash = tmpNewHash;

						// Also re-key the address in the manifest
						this._reKeyAddress(tmpResolved, tmpNewHash);
					}
				}
				break;
			}

			case 'Hash':
				tmpDescriptor.Hash = pValue;
				break;

			case 'DataType':
				tmpDescriptor.DataType = pValue;
				break;

			case 'Width':
			{
				if (!tmpDescriptor.PictForm)
				{
					tmpDescriptor.PictForm = {};
				}
				let tmpNumValue = parseInt(pValue, 10);
				if (isNaN(tmpNumValue) || tmpNumValue < 1)
				{
					delete tmpDescriptor.PictForm.Width;
				}
				else
				{
					tmpDescriptor.PictForm.Width = tmpNumValue;
				}
				break;
			}

			default:
				return;
		}

		// Re-render the parent's visual editor (which also re-renders this panel)
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Escape HTML attribute characters.
	 */
	_escapeAttr(pString)
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

	/**
	 * Escape HTML content characters.
	 */
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

	/**
	 * Get the browser-accessible reference to this view.
	 */
	_browserViewRef()
	{
		return `${this.pict.browserAddress}.views['${this.Hash}']`;
	}
}

module.exports = PictViewFormEditorPropertiesPanel;
