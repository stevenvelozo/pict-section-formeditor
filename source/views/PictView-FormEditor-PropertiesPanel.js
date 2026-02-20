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
	}

	/**
	 * Deselect the current input and hide the panel.
	 */
	deselectInput()
	{
		this._SelectedInput = null;
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
	 * Render the properties panel content into the DOM.
	 * Called directly by the parent FormEditor after the panel container is in the DOM.
	 */
	renderPanel()
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
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpPanelViewRef = this._browserViewRef();
		let tmpIconProvider = this._ParentFormEditor._IconographyProvider;

		let tmpName = tmpDescriptor.Name || '';
		let tmpInputHash = tmpDescriptor.Hash || tmpResolved.Address;
		let tmpDataType = tmpDescriptor.DataType || 'String';
		let tmpInputType = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
		let tmpWidth = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.Width) ? tmpDescriptor.PictForm.Width : '';

		let tmpHTML = '';

		// Header with close button
		tmpHTML += '<div class="pict-fe-props-header">';
		tmpHTML += '<div class="pict-fe-props-header-title">Input Properties</div>';
		tmpHTML += `<button class="pict-fe-props-close" onclick="${tmpViewRef}.deselectInput()" title="Close">\u00D7</button>`;
		tmpHTML += '</div>';

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

		// InputType-specific properties placeholder
		tmpHTML += '<div class="pict-fe-props-section-divider"></div>';
		if (tmpInputType)
		{
			tmpHTML += `<div class="pict-fe-props-placeholder">Additional properties for <strong>${this._escapeHTML(tmpInputType)}</strong> will appear here.</div>`;
		}
		else
		{
			tmpHTML += '<div class="pict-fe-props-placeholder">Select an InputType to see additional properties.</div>';
		}

		tmpHTML += '</div>'; // pict-fe-props-body

		let tmpPanelEl = `#FormEditor-PropertiesPanel-${this._ParentFormEditor.Hash}`;
		this.pict.ContentAssignment.assignContent(tmpPanelEl, tmpHTML);

		// Wire up the address input to show confirm/cancel buttons on change
		this._wireAddressConfirmation(tmpResolved.Address);
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
				tmpDescriptor.Name = pValue;
				break;

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
