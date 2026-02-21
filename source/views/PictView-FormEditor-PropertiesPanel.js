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

		// Solver modal context: { Type, SectionIndex, SolverIndex, GroupIndex, Expression, Ordinal }
		this._SolverModalContext = null;

		// Currently expanded reference item hash in the solver modal
		this._SolverModalExpandedHash = null;

		// Drag state for option entry reordering
		this._OptionsDragState = null;

		// Currently expanded named option list (by Hash)
		this._ExpandedNamedList = null;
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

		let tmpRefManifest = this._ParentFormEditor._resolveReferenceManifest(tmpGroup.RecordManifest);
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
		let tmpActiveTab = this._ParentFormEditor._PanelActiveTab || 'stats';

		let tmpHTML = '';

		// Panel header
		tmpHTML += '<div class="pict-fe-props-header">';
		tmpHTML += '<div class="pict-fe-props-header-title">Properties</div>';
		tmpHTML += `<button class="pict-fe-props-close" onclick="${tmpViewRef}.togglePropertiesPanel()" title="Collapse panel">\u00D7</button>`;
		tmpHTML += '</div>';

		// Panel tab bar
		let tmpStatsActive = (tmpActiveTab === 'stats') ? ' pict-fe-panel-tab-active' : '';
		let tmpPropsActive = (tmpActiveTab === 'properties') ? ' pict-fe-panel-tab-active' : '';
		let tmpSectionActive = (tmpActiveTab === 'section') ? ' pict-fe-panel-tab-active' : '';
		let tmpGroupActive = (tmpActiveTab === 'group') ? ' pict-fe-panel-tab-active' : '';
		let tmpOptionsActive = (tmpActiveTab === 'options') ? ' pict-fe-panel-tab-active' : '';
		tmpHTML += '<div class="pict-fe-panel-tabbar">';
		tmpHTML += `<button class="pict-fe-panel-tab${tmpStatsActive}" onclick="${tmpViewRef}.setPanelTab('stats')">Stats</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpSectionActive}" onclick="${tmpViewRef}.setPanelTab('section')">Section</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpGroupActive}" onclick="${tmpViewRef}.setPanelTab('group')">Group</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpPropsActive}" onclick="${tmpViewRef}.setPanelTab('properties')">Input</button>`;
		tmpHTML += `<button class="pict-fe-panel-tab${tmpOptionsActive}" onclick="${tmpViewRef}.setPanelTab('options')">Options</button>`;
		tmpHTML += '</div>';

		// Tab content: Form Stats
		let tmpStatsDisplay = (tmpActiveTab === 'stats') ? ' pict-fe-panel-tab-content-active' : '';
		tmpHTML += `<div class="pict-fe-panel-tab-content${tmpStatsDisplay}">`;
		tmpHTML += this._renderFormStats();
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
	 * Render the Form Stats tab content.
	 *
	 * @returns {string} HTML string
	 */
	_renderFormStats()
	{
		let tmpStats = this._ParentFormEditor.getFormStats();

		let tmpHTML = '';
		tmpHTML += '<div class="pict-fe-stats-grid">';

		tmpHTML += '<div class="pict-fe-stats-card">';
		tmpHTML += `<div class="pict-fe-stats-value">${tmpStats.Sections}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Sections</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card">';
		tmpHTML += `<div class="pict-fe-stats-value">${tmpStats.Groups}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Groups</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card">';
		tmpHTML += `<div class="pict-fe-stats-value">${tmpStats.Inputs}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Inputs</div>';
		tmpHTML += '</div>';

		tmpHTML += '<div class="pict-fe-stats-card">';
		tmpHTML += `<div class="pict-fe-stats-value">${tmpStats.Descriptors}</div>`;
		tmpHTML += '<div class="pict-fe-stats-label">Descriptors</div>';
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // pict-fe-stats-grid

		return tmpHTML;
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

		this._ParentFormEditor.selectSection(pSectionIndex);
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

		this._ParentFormEditor.updateSectionProperty(this._SelectedSection.SectionIndex, pProperty, pValue);
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
				tmpHTML += `<button class="pict-fe-solver-btn pict-fe-solver-btn-expand" title="Edit in modal" onclick="${tmpPanelViewRef}.openSolverModal('${pType}', ${pSectionIndex}, ${i}${tmpGroupArg})">Edit</button>`;
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
	/*                     Solver Editor Modal                                    */
	/* -------------------------------------------------------------------------- */

	/**
	 * Open the solver editor modal for a given solver entry.
	 *
	 * @param {string} pType - 'Section' or 'Group'
	 * @param {number} pSectionIndex
	 * @param {number} pSolverIndex
	 * @param {number} [pGroupIndex]
	 */
	openSolverModal(pType, pSectionIndex, pSolverIndex, pGroupIndex)
	{
		let tmpPanelViewRef = this._browserViewRef();

		// Close any existing modal first
		this.closeSolverModal();

		// Reset expanded reference state
		this._SolverModalExpandedHash = null;

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
		this._SolverModalContext =
		{
			Type: pType,
			SectionIndex: pSectionIndex,
			SolverIndex: pSolverIndex,
			GroupIndex: pGroupIndex,
			Expression: tmpExpression,
			Ordinal: tmpDisplayOrdinal
		};

		if (typeof document === 'undefined')
		{
			return;
		}

		// Build modal HTML
		let tmpModalHTML = this._renderSolverModal();

		// Create overlay
		let tmpOverlay = document.createElement('div');
		tmpOverlay.id = 'PictFE-SolverModal-Overlay';
		tmpOverlay.className = 'pict-fe-solver-modal-overlay';
		tmpOverlay.onclick = function() { eval(tmpPanelViewRef + '.closeSolverModal()'); };
		tmpOverlay.addEventListener('wheel', function(pEvent) { pEvent.preventDefault(); }, { passive: false });

		// Create modal container
		let tmpModalContainer = document.createElement('div');
		tmpModalContainer.id = 'PictFE-SolverModal';
		tmpModalContainer.className = 'pict-fe-solver-modal';
		tmpModalContainer.innerHTML = tmpModalHTML;
		tmpModalContainer.onclick = function(e) { e.stopPropagation(); };
		// Contain scroll within the modal
		tmpModalContainer.addEventListener('wheel', function(pEvent)
		{
			pEvent.stopPropagation();
			let tmpScrollable = tmpModalContainer.querySelector('.pict-fe-solver-modal-reference-list');
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

		tmpOverlay.appendChild(tmpModalContainer);
		document.body.appendChild(tmpOverlay);

		// Center the modal
		tmpModalContainer.style.position = 'fixed';
		tmpModalContainer.style.top = '50%';
		tmpModalContainer.style.left = '50%';
		tmpModalContainer.style.transform = 'translate(-50%, -50%)';

		// Focus the expression textarea
		let tmpTextarea = document.getElementById('PictFE-SolverModal-Expression');
		if (tmpTextarea && tmpTextarea.focus)
		{
			tmpTextarea.focus();
		}
	}

	/**
	 * Render the inner HTML of the solver editor modal.
	 *
	 * @returns {string} Modal innerHTML
	 */
	_renderSolverModal()
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpContext = this._SolverModalContext;
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

		// Header
		tmpHTML += '<div class="pict-fe-solver-modal-header">';
		tmpHTML += `<button class="pict-fe-solver-modal-close" onclick="${tmpPanelViewRef}.closeSolverModal()" title="Close">&times;</button>`;
		tmpHTML += '<span class="pict-fe-solver-modal-title">Solver Editor</span>';
		tmpHTML += `<span class="pict-fe-solver-modal-badge">${this._escapeHTML(tmpBadgeLabel)}</span>`;
		tmpHTML += `<span class="pict-fe-solver-modal-context">${this._escapeHTML(tmpContextLabel)}</span>`;
		tmpHTML += '</div>';

		// Body
		tmpHTML += '<div class="pict-fe-solver-modal-body">';

		// Expression textarea
		tmpHTML += '<label class="pict-fe-props-label">Expression</label>';
		tmpHTML += `<textarea class="pict-fe-solver-modal-expression" id="PictFE-SolverModal-Expression" rows="5" placeholder="Enter solver expression\u2026" onkeydown="if(event.key==='Escape'){${tmpPanelViewRef}.closeSolverModal();}">${this._escapeHTML(tmpContext.Expression)}</textarea>`;

		// Ordinal row
		tmpHTML += '<div class="pict-fe-solver-modal-ordinal-row">';
		tmpHTML += '<label class="pict-fe-props-label">Ordinal</label>';
		tmpHTML += `<input class="pict-fe-solver-modal-ordinal-input" id="PictFE-SolverModal-Ordinal" type="text" value="${this._escapeAttr(tmpContext.Ordinal)}" placeholder="1" />`;
		tmpHTML += '</div>';

		// Reference panel
		tmpHTML += '<div class="pict-fe-solver-modal-reference">';
		tmpHTML += '<div class="pict-fe-solver-modal-reference-header">';
		tmpHTML += '<span class="pict-fe-props-label">Reference</span>';
		tmpHTML += `<input class="pict-fe-solver-modal-reference-search" id="PictFE-SolverModal-RefSearch" type="text" placeholder="Filter addresses\u2026" oninput="${tmpPanelViewRef}._onSolverModalReferenceSearch(this.value)" />`;
		tmpHTML += '</div>';
		tmpHTML += '<div class="pict-fe-solver-modal-reference-list" id="PictFE-SolverModal-RefList">';
		tmpHTML += this._renderSolverModalReference('');
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		tmpHTML += '</div>'; // body

		// Footer
		tmpHTML += '<div class="pict-fe-solver-modal-footer">';
		tmpHTML += `<button class="pict-fe-solver-modal-btn" onclick="${tmpPanelViewRef}.closeSolverModal()">Cancel</button>`;
		tmpHTML += `<button class="pict-fe-solver-modal-btn pict-fe-solver-modal-btn-save" onclick="${tmpPanelViewRef}.saveSolverModal()">Save</button>`;
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/**
	 * Render the reference list content for the solver modal.
	 * Each entry shows two rows:
	 *   Row 1: Name (left) + Hash: XYZ (right)
	 *   Row 2: First solver equation snippet (left) + Address: A.B.C (right)
	 *
	 * @param {string} pFilterText - Search filter text
	 * @returns {string} HTML for the reference list items
	 */
	_renderSolverModalReference(pFilterText)
	{
		let tmpPanelViewRef = this._browserViewRef();
		let tmpEntries = this._ParentFormEditor.getAllInputEntries();
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
				let tmpFirstSolver = (tmpSolverData && tmpSolverData.assignment) ? tmpSolverData.assignment.Expression : '';
				let tmpIsExpanded = (this._SolverModalExpandedHash === tmpHash && tmpHash);

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
						tmpHTML += '<div class="pict-fe-solver-modal-reference-detail-label">ASSIGNED BY</div>';
						tmpHTML += `<div class="pict-fe-solver-modal-reference-detail-equation pict-fe-solver-modal-reference-detail-assignment">${this._escapeHTML(tmpSolverData.assignment.Expression)}</div>`;
					}

					if (tmpSolverData.references.length > 0)
					{
						tmpHTML += '<div class="pict-fe-solver-modal-reference-detail-label">REFERENCED IN</div>';
						for (let r = 0; r < tmpSolverData.references.length; r++)
						{
							tmpHTML += `<div class="pict-fe-solver-modal-reference-detail-equation">${this._escapeHTML(tmpSolverData.references[r].Expression)}</div>`;
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
	 * @returns {Object} Map of hash string → { assignment: { Expression, Ordinal } | null, references: [{ Expression, Ordinal }] }
	 */
	_buildSolverHashMapAll()
	{
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpMap = {};

		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return tmpMap;
		}

		// Collect all solver expressions as { Expression, Ordinal }
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
							tmpAllExpressions.push({ Expression: tmpSolver, Ordinal: 1 });
						}
					}
					else if (tmpSolver && tmpSolver.Expression)
					{
						tmpAllExpressions.push({ Expression: tmpSolver.Expression, Ordinal: tmpSolver.Ordinal || 1 });
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
									tmpAllExpressions.push({ Expression: tmpSolver, Ordinal: 1 });
								}
							}
							else if (tmpSolver && tmpSolver.Expression)
							{
								tmpAllExpressions.push({ Expression: tmpSolver.Expression, Ordinal: tmpSolver.Ordinal || 1 });
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
							tmpEntry.assignment = { Expression: tmpExprObj.Expression, Ordinal: tmpExprObj.Ordinal };
							continue;
						}
					}

					tmpEntry.references.push({ Expression: tmpExprObj.Expression, Ordinal: tmpExprObj.Ordinal });
				}

				tmpMap[tmpHash] = tmpEntry;
			}
		}

		return tmpMap;
	}

	/**
	 * Handle search input in the solver modal reference panel.
	 * Re-renders only the reference list, preserving the rest of the modal.
	 *
	 * @param {string} pSearchText
	 */
	_onSolverModalReferenceSearch(pSearchText)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpRefList = document.getElementById('PictFE-SolverModal-RefList');
		if (!tmpRefList)
		{
			return;
		}

		tmpRefList.innerHTML = this._renderSolverModalReference(pSearchText);
	}

	/**
	 * Toggle the expanded detail view for a reference item in the solver modal.
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
		if (this._SolverModalExpandedHash === pHash)
		{
			this._SolverModalExpandedHash = null;
		}
		else
		{
			this._SolverModalExpandedHash = pHash;
		}

		// Read the current search filter and re-render the reference list
		let tmpSearchInput = document.getElementById('PictFE-SolverModal-RefSearch');
		let tmpFilterText = tmpSearchInput ? tmpSearchInput.value : '';

		let tmpRefList = document.getElementById('PictFE-SolverModal-RefList');
		if (tmpRefList)
		{
			tmpRefList.innerHTML = this._renderSolverModalReference(tmpFilterText);
		}
	}

	/**
	 * Insert a reference address at the cursor position in the solver modal expression textarea.
	 *
	 * @param {string} pAddress - The address string to insert
	 */
	insertSolverReference(pAddress)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpTextarea = document.getElementById('PictFE-SolverModal-Expression');
		if (!tmpTextarea)
		{
			return;
		}

		let tmpStart = tmpTextarea.selectionStart || 0;
		let tmpEnd = tmpTextarea.selectionEnd || 0;
		let tmpValue = tmpTextarea.value || '';

		// Insert the address at the cursor position, replacing any selection
		tmpTextarea.value = tmpValue.substring(0, tmpStart) + pAddress + tmpValue.substring(tmpEnd);

		// Move cursor to after the inserted text
		let tmpNewPos = tmpStart + pAddress.length;
		tmpTextarea.selectionStart = tmpNewPos;
		tmpTextarea.selectionEnd = tmpNewPos;

		tmpTextarea.focus();
	}

	/**
	 * Close the solver editor modal and clean up.
	 */
	closeSolverModal()
	{
		this._SolverModalContext = null;
		this._SolverModalExpandedHash = null;

		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpOverlay = document.getElementById('PictFE-SolverModal-Overlay');
		if (tmpOverlay && tmpOverlay.parentNode)
		{
			tmpOverlay.parentNode.removeChild(tmpOverlay);
		}
	}

	/**
	 * Save the solver modal values and close.
	 * Reads expression and ordinal from the modal, updates the solver,
	 * closes the modal, and re-renders.
	 */
	saveSolverModal()
	{
		if (!this._SolverModalContext)
		{
			return;
		}

		let tmpContext = this._SolverModalContext;

		if (typeof document !== 'undefined')
		{
			let tmpExpressionEl = document.getElementById('PictFE-SolverModal-Expression');
			let tmpOrdinalEl = document.getElementById('PictFE-SolverModal-Ordinal');

			let tmpExpression = tmpExpressionEl ? tmpExpressionEl.value : tmpContext.Expression;
			let tmpOrdinal = tmpOrdinalEl ? tmpOrdinalEl.value : tmpContext.Ordinal;

			// Update the solver expression first, then ordinal
			// (ordinal may promote/demote the solver format)
			this.updateSolverExpression(tmpContext.Type, tmpContext.SectionIndex, tmpContext.SolverIndex, tmpExpression, tmpContext.GroupIndex);
			this.updateSolverOrdinal(tmpContext.Type, tmpContext.SectionIndex, tmpContext.SolverIndex, tmpOrdinal, tmpContext.GroupIndex);
		}

		this.closeSolverModal();
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

		this._ParentFormEditor.selectGroup(pSectionIndex, pGroupIndex);
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
			let tmpManifestNames = this._ParentFormEditor.getReferenceManifestNames();
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

		let tmpRefManifest = this._ParentFormEditor._resolveReferenceManifest(pManifestName);

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

		this._ParentFormEditor.updateGroupProperty(this._SelectedGroup.SectionIndex, this._SelectedGroup.GroupIndex, pProperty, pValue);
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
		let tmpEntries = this._ParentFormEditor.getAllInputEntries();
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
		tmpHTML += `<button class="pict-fe-props-inputtype-btn" id="FormEditor-PropsInputTypeBtn-${this._ParentFormEditor.Hash}" onclick="${tmpViewRef}.beginEditInputType(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${this._SelectedInput.InputIndex})">${this._escapeHTML(tmpInputTypeLabel)}</button>`;
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
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveInputLeft(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${tmpInputIndex})" title="Move left">\u25C0</button>`;
		}
		tmpHTML += `<span class="pict-fe-props-position-label">${tmpInputIndex + 1} of ${tmpInputCount}</span>`;
		if (tmpInputIndex < tmpInputCount - 1)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveInputRight(${this._SelectedInput.SectionIndex}, ${this._SelectedInput.GroupIndex}, ${this._SelectedInput.RowIndex}, ${tmpInputIndex})" title="Move right">\u25B6</button>`;
		}
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// InputType-specific properties section
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += this._renderInputTypeProperties(tmpInputType, tmpDescriptor, tmpPanelViewRef);

		tmpHTML += '</div>'; // pict-fe-props-body

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
			this._ParentFormEditor.deselectInput();
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
			this._ParentFormEditor.selectSubmanifestColumn(tmpS, tmpG, tmpAddress);
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

		this._ParentFormEditor.selectInput(tmpS, tmpG, tmpR, tmpI);
		this._ParentFormEditor.scrollToInput(tmpS, tmpG, tmpR, tmpI);
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

		let tmpManifest = this._ParentFormEditor._getInputTypeManifest(pInputType);
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

		// Section B: Named Option Lists
		tmpHTML += this._renderNamedOptionListsSection(tmpPanelViewRef);

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

		this._ParentFormEditor.renderVisualEditor();
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
				}

				break;
			}
		}

		this._ParentFormEditor.renderVisualEditor();
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

		if (this._ParentFormEditor._PropertiesPanelView)
		{
			this._ParentFormEditor._PropertiesPanelView.renderPanel();
		}
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
		tmpHTML += `<button class="pict-fe-props-inputtype-btn" id="FormEditor-PropsInputTypeBtn-${this._ParentFormEditor.Hash}" onclick="${tmpViewRef}.beginEditTabularInputType(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedColumnAddr}')">${this._escapeHTML(tmpInputTypeLabel)}</button>`;
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
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveSubmanifestColumnUp(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedAddr}')" title="Move left">\u25C0</button>`;
		}
		tmpHTML += `<span class="pict-fe-props-position-label">${tmpColumnIndex + 1} of ${tmpColumnCount}</span>`;
		if (tmpColumnIndex >= 0 && tmpColumnIndex < tmpColumnCount - 1)
		{
			tmpHTML += `<button class="pict-fe-btn pict-fe-btn-sm" onclick="${tmpViewRef}.moveSubmanifestColumnDown(${this._SelectedTabularColumn.SectionIndex}, ${this._SelectedTabularColumn.GroupIndex}, '${tmpEscapedAddr}')" title="Move right">\u25B6</button>`;
		}
		tmpHTML += '</div>';
		tmpHTML += '</div>';

		// InputType-specific properties section
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		tmpHTML += this._renderTabularInputTypeProperties(tmpInputType, tmpDescriptor, tmpPanelViewRef);

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

		let tmpManifest = this._ParentFormEditor._getInputTypeManifest(pInputType);
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
				if (this._ParentFormEditor._isAutoGeneratedInputHash(tmpOldHash))
				{
					// Build new hash: keep the prefix (everything up to the last _I segment), replace with sanitized name
					let tmpPrefixMatch = tmpOldHash.match(/^(.+_R\d+_)Input\d+$/);
					if (tmpPrefixMatch)
					{
						let tmpNewHash = tmpPrefixMatch[1] + this._ParentFormEditor.sanitizeObjectKey(pValue);
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
