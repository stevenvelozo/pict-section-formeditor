const libPictProvider = require('pict-provider');

class FormEditorDragDrop extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';

		// Back-reference to the parent FormEditor view (set after construction)
		this._ParentFormEditor = null;
	}

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
		this._ParentFormEditor._DragAndDropEnabled = !!pEnabled;
		this._ParentFormEditor._DragState = null;
		this._ParentFormEditor.renderVisualEditor();
	}

	onDragStart(pEvent, pType, pIndex0, pIndex1, pIndex2, pIndex3)
	{
		if (!this._ParentFormEditor._DragAndDropEnabled)
		{
			return;
		}

		// Stop propagation so nested draggable parents don't overwrite _DragState
		if (pEvent && pEvent.stopPropagation)
		{
			pEvent.stopPropagation();
		}

		this._ParentFormEditor._DragState =
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
		if (!this._ParentFormEditor._DragAndDropEnabled || !this._ParentFormEditor._DragState)
		{
			return;
		}

		// Only allow drops of the same type
		if (this._ParentFormEditor._DragState.Type !== pType)
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

		if (!this._ParentFormEditor._DragAndDropEnabled || !this._ParentFormEditor._DragState || this._ParentFormEditor._DragState.Type !== pType)
		{
			this._ParentFormEditor._DragState = null;
			return;
		}

		let tmpTargetIndices = [pIndex0, pIndex1, pIndex2, pIndex3].filter((pVal) => { return typeof pVal === 'number'; });
		let tmpSourceIndices = this._ParentFormEditor._DragState.Indices;
		this._ParentFormEditor._DragState = null;

		// Check if source and target are identical
		if (tmpSourceIndices.length === tmpTargetIndices.length && tmpSourceIndices.every((pVal, pIdx) => { return pVal === tmpTargetIndices[pIdx]; }))
		{
			return;
		}

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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
				this._ParentFormEditor._ManifestOpsProvider._syncRowIndices(tmpManifest, tmpSourceGroup);
				if (!tmpSameContainer)
				{
					this._ParentFormEditor._ManifestOpsProvider._syncRowIndices(tmpManifest, tmpTargetGroup);
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

		this._ParentFormEditor.renderVisualEditor();
	}

	onDragEnd(pEvent)
	{
		if (pEvent && pEvent.currentTarget)
		{
			pEvent.currentTarget.classList.remove('pict-fe-dragging');
		}

		this._ParentFormEditor._DragState = null;

		// Clean up any leftover drag-over highlights
		let tmpContainer = this.pict.ContentAssignment.getElement(`#FormEditor-Panel-Visual-${this._ParentFormEditor.Hash}`);
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
		if (!this._ParentFormEditor._DragAndDropEnabled)
		{
			return '';
		}

		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpArgs = pIndices.join(', ');

		return ` draggable="true"` +
			` ondragstart="${tmpViewRef}._DragDropProvider.onDragStart(event, '${pType}', ${tmpArgs})"` +
			` ondragover="${tmpViewRef}._DragDropProvider.onDragOver(event, '${pType}', ${tmpArgs})"` +
			` ondragleave="${tmpViewRef}._DragDropProvider.onDragLeave(event)"` +
			` ondrop="${tmpViewRef}._DragDropProvider.onDrop(event, '${pType}', ${tmpArgs})"` +
			` ondragend="${tmpViewRef}._DragDropProvider.onDragEnd(event)"`;
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
		if (!this._ParentFormEditor._DragAndDropEnabled)
		{
			return '';
		}

		let tmpViewRef = this._ParentFormEditor._browserViewRef();
		let tmpArgs = pContainerIndices.join(', ');

		return ` ondragover="${tmpViewRef}._DragDropProvider.onContainerDragOver(event, '${pChildType}')"` +
			` ondragleave="${tmpViewRef}._DragDropProvider.onDragLeave(event)"` +
			` ondrop="${tmpViewRef}._DragDropProvider.onContainerDrop(event, '${pChildType}', ${tmpArgs})"`;
	}

	onContainerDragOver(pEvent, pChildType)
	{
		if (!this._ParentFormEditor._DragAndDropEnabled || !this._ParentFormEditor._DragState)
		{
			return;
		}

		if (this._ParentFormEditor._DragState.Type !== pChildType)
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

		if (!this._ParentFormEditor._DragAndDropEnabled || !this._ParentFormEditor._DragState || this._ParentFormEditor._DragState.Type !== pChildType)
		{
			this._ParentFormEditor._DragState = null;
			return;
		}

		let tmpContainerIndices = [pIndex0, pIndex1, pIndex2].filter((pVal) => { return typeof pVal === 'number'; });
		let tmpSourceIndices = this._ParentFormEditor._DragState.Indices;
		this._ParentFormEditor._DragState = null;

		let tmpManifest = this._ParentFormEditor._resolveManifestData();
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

				this._ParentFormEditor._ManifestOpsProvider._syncRowIndices(tmpManifest, tmpSourceGroup);
				if (tmpSourceGroup !== tmpTargetGroup)
				{
					this._ParentFormEditor._ManifestOpsProvider._syncRowIndices(tmpManifest, tmpTargetGroup);
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

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Build the drag handle HTML for a container element.
	 * Returns an empty string when drag-and-drop is disabled.
	 */
	_buildDragHandleHTML(pSize)
	{
		if (!this._ParentFormEditor._DragAndDropEnabled)
		{
			return '';
		}

		return `<span class="pict-fe-drag-handle">${this._ParentFormEditor._IconographyProvider.getIcon('Action', 'DragHandle', pSize || 12)}</span>`;
	}
}

module.exports = FormEditorDragDrop;
module.exports.default_configuration = {};
