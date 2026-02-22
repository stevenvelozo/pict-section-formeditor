const libPictView = require('pict-view');

class PictViewFormEditorInputTypePicker extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._ParentFormEditor = null;
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
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		// Close any existing picker first
		this.closeInputTypePicker();

		// Resolve the current InputType from the Descriptor's PictForm
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		let tmpHTML = '';

		// Search bar
		tmpHTML += '<div class="pict-fe-inputtype-picker-search">';
		tmpHTML += `<input type="text" class="pict-fe-inputtype-picker-search-input" id="${tmpPickerId}-Search" placeholder="Search input types\u2026" value="${this._ParentFormEditor._UtilitiesProvider._escapeAttr(pSearchQuery)}" oninput="${tmpViewRef}._onInputTypePickerSearch(this.value)" onkeydown="if(event.key==='Escape'){${tmpViewRef}.closeInputTypePicker();}" />`;
		tmpHTML += '</div>';

		// Filter definitions by search query
		let tmpDefinitions = this._ParentFormEditor._UtilitiesProvider._filterInputTypeDefinitions(pSearchQuery);

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
			let tmpPickerIcon = this._ParentFormEditor._IconographyProvider.getInputTypeIcon(tmpDef.Hash, 16);

			tmpHTML += `<div class="pict-fe-inputtype-picker-item${tmpActive}" onclick="${tmpViewRef}.commitEditInputType('${this._ParentFormEditor._UtilitiesProvider._escapeAttr(tmpDef.Hash)}')">`;
			tmpHTML += `<div class="pict-fe-inputtype-picker-item-name">${tmpPickerIcon ? '<span class="pict-fe-icon pict-fe-icon-picker">' + tmpPickerIcon + '</span>' : ''}${this._ParentFormEditor._UtilitiesProvider._escapeHTML(tmpDef.Name || tmpDef.Hash)}</div>`;
			if (tmpDef.Description)
			{
				tmpHTML += `<div class="pict-fe-inputtype-picker-item-desc">${this._ParentFormEditor._UtilitiesProvider._escapeHTML(tmpDef.Description)}</div>`;
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
				tmpHTML += `<div class="pict-fe-inputtype-picker-category-label">${this._ParentFormEditor._UtilitiesProvider._escapeHTML(tmpCategory)}</div>`;

				for (let j = 0; j < tmpItems.length; j++)
				{
					let tmpDef = tmpItems[j];
					let tmpActive = (tmpDef.Hash === pCurrentValue) ? ' pict-fe-inputtype-picker-item-active' : '';
					let tmpCatIcon = this._ParentFormEditor._IconographyProvider.getInputTypeIcon(tmpDef.Hash, 16);

					tmpHTML += `<div class="pict-fe-inputtype-picker-item${tmpActive}" onclick="${tmpViewRef}.commitEditInputType('${this._ParentFormEditor._UtilitiesProvider._escapeAttr(tmpDef.Hash)}')">`;
					tmpHTML += `<div class="pict-fe-inputtype-picker-item-name">${tmpCatIcon ? '<span class="pict-fe-icon pict-fe-icon-picker">' + tmpCatIcon + '</span>' : ''}${this._ParentFormEditor._UtilitiesProvider._escapeHTML(tmpDef.Name || tmpDef.Hash)}</div>`;
					if (tmpDef.Description)
					{
						tmpHTML += `<div class="pict-fe-inputtype-picker-item-desc">${this._ParentFormEditor._UtilitiesProvider._escapeHTML(tmpDef.Description)}</div>`;
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
		let tmpHash = this._ParentFormEditor.Hash;
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
		let tmpHash = this._ParentFormEditor.Hash;
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

		// Close the picker
		this.closeInputTypePicker();

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Sections)
		{
			return;
		}

		let tmpDescriptor = null;

		if (tmpContext.IsTabular)
		{
			// Tabular column — resolve descriptor from ReferenceManifest
			let tmpSection = tmpManifest.Sections[tmpContext.SectionIndex];
			let tmpGroup = (tmpSection && Array.isArray(tmpSection.Groups)) ? tmpSection.Groups[tmpContext.GroupIndex] : null;
			if (tmpGroup && tmpGroup.RecordManifest)
			{
				let tmpRefManifest = this._ParentFormEditor._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
				if (tmpRefManifest && tmpRefManifest.Descriptors && tmpRefManifest.Descriptors[tmpContext.ColumnAddress])
				{
					tmpDescriptor = tmpRefManifest.Descriptors[tmpContext.ColumnAddress];
				}
			}
		}
		else
		{
			// Regular input — resolve descriptor from main Descriptors
			let tmpSection = tmpManifest.Sections[tmpContext.SectionIndex];
			let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[tmpContext.GroupIndex] : null;
			let tmpRow = tmpGroup && tmpGroup.Rows ? tmpGroup.Rows[tmpContext.RowIndex] : null;
			if (tmpRow && Array.isArray(tmpRow.Inputs))
			{
				let tmpAddress = tmpRow.Inputs[tmpContext.InputIndex];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
				{
					tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
				}
			}
		}

		if (tmpDescriptor)
		{
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

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Open the InputType picker for a tabular/RecordSet column descriptor.
	 * Reuses the same picker UI as regular inputs but resolves the descriptor
	 * from the ReferenceManifest instead of the main Descriptors.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pColumnAddress - The column address in the ReferenceManifest
	 */
	beginEditTabularInputType(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpPickerId = `FormEditor-InputTypePicker-${tmpHash}`;

		// Close any existing picker first
		this.closeInputTypePicker();

		// Resolve the current InputType from the ReferenceManifest descriptor
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
		let tmpCurrentValue = '';
		if (tmpManifest && tmpManifest.Sections)
		{
			let tmpSection = tmpManifest.Sections[pSectionIndex];
			let tmpGroup = (tmpSection && Array.isArray(tmpSection.Groups)) ? tmpSection.Groups[pGroupIndex] : null;
			if (tmpGroup && tmpGroup.RecordManifest)
			{
				let tmpRefManifest = this._ParentFormEditor._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
				if (tmpRefManifest && tmpRefManifest.Descriptors && tmpRefManifest.Descriptors[pColumnAddress])
				{
					let tmpDescriptor = tmpRefManifest.Descriptors[pColumnAddress];
					if (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType)
					{
						tmpCurrentValue = tmpDescriptor.PictForm.InputType;
					}
				}
			}
		}

		// Store context — mark as tabular so commitEditInputType knows to handle it
		this._InputTypePickerContext =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			ColumnAddress: pColumnAddress,
			IsTabular: true,
			CurrentValue: tmpCurrentValue
		};

		// Build the picker HTML
		let tmpPickerHTML = this._renderInputTypePicker(tmpCurrentValue, '');

		// Anchor near the properties panel InputType button
		if (typeof document !== 'undefined')
		{
			let tmpOverlay = document.createElement('div');
			tmpOverlay.id = tmpPickerId + '-Overlay';
			tmpOverlay.className = 'pict-fe-inputtype-overlay';
			tmpOverlay.onclick = function() { eval(tmpViewRef + '.closeInputTypePicker()'); };
			tmpOverlay.addEventListener('wheel', function(pEvent) { pEvent.preventDefault(); }, { passive: false });

			let tmpPickerContainer = document.createElement('div');
			tmpPickerContainer.id = tmpPickerId;
			tmpPickerContainer.className = 'pict-fe-inputtype-picker';
			tmpPickerContainer.innerHTML = tmpPickerHTML;
			tmpPickerContainer.onclick = function(e) { e.stopPropagation(); };
			tmpPickerContainer.addEventListener('wheel', function(pEvent)
			{
				pEvent.stopPropagation();
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

			// Position anchored to the InputType button in the properties panel
			let tmpAnchorEl = document.getElementById(`FormEditor-PropsInputTypeBtn-${tmpHash}`);
			if (tmpAnchorEl && tmpAnchorEl.getBoundingClientRect)
			{
				let tmpAnchorRect = tmpAnchorEl.getBoundingClientRect();

				tmpPickerContainer.style.position = 'fixed';
				tmpPickerContainer.style.top = (tmpAnchorRect.bottom + 4) + 'px';
				tmpPickerContainer.style.left = tmpAnchorRect.left + 'px';

				let tmpPickerWidth = 340;
				if (tmpAnchorRect.left + tmpPickerWidth > window.innerWidth)
				{
					tmpPickerContainer.style.left = Math.max(8, window.innerWidth - tmpPickerWidth - 8) + 'px';
				}

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
}

module.exports = PictViewFormEditorInputTypePicker;
