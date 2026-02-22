const libPictView = require('pict-view');

class PictViewFormEditorInlineEditing extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._ParentFormEditor = null;
	}

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
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();

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
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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
			let tmpLayouts = ['Record', 'Tabular', 'RecordSet'];
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
			tmpEditorHTML += `<input class="pict-fe-inline-edit-input${tmpHashClass}" id="${tmpElementId}-Input" type="text" value="${this._ParentFormEditor._UtilitiesProvider._escapeAttr(tmpCurrentValue)}" onclick="event.stopPropagation()" onblur="${tmpViewRef}.commitEditProperty('${pType}', ${pSectionIndex}, ${pGroupIndex}, '${pProperty}')" onkeydown="if(event.key==='Enter'){this.blur();}if(event.key==='Escape'){this.dataset.cancelled='true';this.blur();}" />`;
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
		let tmpHash = this._ParentFormEditor.Hash;

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
			this._ParentFormEditor.renderVisualEditor();
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
				let tmpSection = this._ParentFormEditor._resolveManifestData().Sections[pSectionIndex];
				if (tmpSection)
				{
					tmpOldHash = tmpSection.Hash || '';
				}
			}

			this._ParentFormEditor._ManifestOpsProvider.updateSectionProperty(pSectionIndex, pProperty, tmpNewValue);

			// When the user edits the Name, auto-generate the Hash if the
			// current hash still matches the auto-generated format (S{n}).
			// If the user has manually overridden the hash it will no
			// longer match and we leave it alone.
			if (pProperty === 'Name' && tmpOldHash !== null)
			{
				if (this._ParentFormEditor._UtilitiesProvider._isAutoGeneratedSectionHash(tmpOldHash))
				{
					let tmpAutoHash = this._ParentFormEditor._UtilitiesProvider.sanitizeObjectKey(tmpNewValue);
					this._ParentFormEditor._ManifestOpsProvider.updateSectionProperty(pSectionIndex, 'Hash', tmpAutoHash);
				}
			}
		}
		else
		{
			this._ParentFormEditor._ManifestOpsProvider.updateGroupProperty(pSectionIndex, pGroupIndex, pProperty, tmpNewValue);

			// When the user edits the Name, auto-generate the Hash if it
			// still follows the auto-generated pattern ({SectionHash}_G...).
			if (pProperty === 'Name')
			{
				let tmpManifest = this._ParentFormEditor._resolveManifestData();
				let tmpSection = tmpManifest.Sections[pSectionIndex];
				let tmpGroup = tmpSection && tmpSection.Groups ? tmpSection.Groups[pGroupIndex] : null;
				if (tmpGroup)
				{
					let tmpSectionHash = tmpSection.Hash || '';
					let tmpAutoPrefix = tmpSectionHash + '_G';
					if (tmpGroup.Hash && tmpGroup.Hash.indexOf(tmpAutoPrefix) === 0)
					{
						let tmpAutoHash = tmpAutoPrefix + this._ParentFormEditor._UtilitiesProvider.sanitizeObjectKey(tmpNewValue);
						this._ParentFormEditor._ManifestOpsProvider.updateGroupProperty(pSectionIndex, pGroupIndex, 'Hash', tmpAutoHash);
					}
				}
			}
		}

		this._ParentFormEditor.renderVisualEditor();
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
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpElementId = `FormEditor-InputType-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${pInputIndex}`;

		// Resolve the current DataType from the Descriptor
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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
		for (let i = 0; i < this._ParentFormEditor._ManyfestDataTypes.length; i++)
		{
			let tmpSelected = (this._ParentFormEditor._ManyfestDataTypes[i] === tmpCurrentValue) ? ' selected' : '';
			tmpEditorHTML += `<option value="${this._ParentFormEditor._ManyfestDataTypes[i]}"${tmpSelected}>${this._ParentFormEditor._ManyfestDataTypes[i]}</option>`;
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
		let tmpHash = this._ParentFormEditor.Hash;
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
			this._ParentFormEditor.renderVisualEditor();
			return;
		}

		if (tmpInput.dataset)
		{
			tmpInput.dataset.committed = 'true';
		}

		let tmpNewValue = tmpInput.value;

		// Update the Descriptor's DataType
		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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

		this._ParentFormEditor.renderVisualEditor();
	}
}

module.exports = PictViewFormEditorInlineEditing;
