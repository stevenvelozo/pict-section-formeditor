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
			// Detect whether the cursor is in the top or bottom half of the target
			let tmpRect = pEvent.currentTarget.getBoundingClientRect();
			let tmpMidpoint = tmpRect.top + (tmpRect.height / 2);
			let tmpIsTopHalf = pEvent.clientY < tmpMidpoint;

			pEvent.currentTarget.classList.remove('pict-fe-drag-insert-before');
			pEvent.currentTarget.classList.remove('pict-fe-drag-insert-after');

			if (tmpIsTopHalf)
			{
				pEvent.currentTarget.classList.add('pict-fe-drag-insert-before');
			}
			else
			{
				pEvent.currentTarget.classList.add('pict-fe-drag-insert-after');
			}

			this._ParentFormEditor._DragState.InsertPosition = tmpIsTopHalf ? 'before' : 'after';
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
			pEvent.currentTarget.classList.remove('pict-fe-drag-insert-before');
			pEvent.currentTarget.classList.remove('pict-fe-drag-insert-after');
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
		let tmpInsertPosition = this._ParentFormEditor._DragState.InsertPosition || 'before';
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
				let tmpInsertIdx = this._computeInsertIndex(tmpFromIdx, tmpToIdx, true, tmpInsertPosition);
				tmpManifest.Sections.splice(tmpInsertIdx, 0, tmpItem);
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

				let tmpSameContainer = (tmpSourceIndices[0] === tmpTargetIndices[0]);
				let tmpItem = tmpSourceSection.Groups.splice(tmpSourceIndices[1], 1)[0];
				let tmpInsertIdx = this._computeInsertIndex(tmpSourceIndices[1], tmpTargetIndices[1], tmpSameContainer, tmpInsertPosition);
				tmpTargetSection.Groups.splice(tmpInsertIdx, 0, tmpItem);
				break;
			}
			case 'row':
			{
				let tmpMOps = this._ParentFormEditor._ManifestOpsProvider;
				let tmpTargetSection = tmpManifest.Sections[tmpTargetIndices[0]];
				let tmpTargetGroup = tmpTargetSection && tmpTargetSection.Groups ? tmpTargetSection.Groups[tmpTargetIndices[1]] : null;
				if (!tmpTargetSection || !tmpTargetGroup)
				{
					return;
				}

				// Get source row's addresses before any changes
				let tmpSourceRows = tmpMOps.getRowsForGroupByIndex(tmpSourceIndices[0], tmpSourceIndices[1]);
				let tmpSourceRow = tmpSourceRows[tmpSourceIndices[2]];
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs))
				{
					return;
				}
				let tmpMovedAddresses = tmpSourceRow.Inputs.slice();

				let tmpSameContainer = (tmpSourceIndices[0] === tmpTargetIndices[0]) && (tmpSourceIndices[1] === tmpTargetIndices[1]);
				let tmpInsertIdx = this._computeInsertIndex(tmpSourceIndices[2], tmpTargetIndices[2], tmpSameContainer, tmpInsertPosition);

				// Update PictForm.Section/Group on moved descriptors
				for (let i = 0; i < tmpMovedAddresses.length; i++)
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpMovedAddresses[i]];
					if (tmpDescriptor && tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm.Section = tmpTargetSection.Hash || '';
						tmpDescriptor.PictForm.Group = tmpTargetGroup.Hash || '';
					}
				}

				// Build desired row order for the target group
				let tmpTargetRows = tmpMOps.getRowsForGroupByIndex(tmpTargetIndices[0], tmpTargetIndices[1]);

				// Find and remove the moved row from the list
				for (let i = tmpTargetRows.length - 1; i >= 0; i--)
				{
					if (tmpTargetRows[i].Inputs.length > 0 && tmpMovedAddresses.indexOf(tmpTargetRows[i].Inputs[0]) >= 0)
					{
						tmpTargetRows.splice(i, 1);
						break;
					}
				}

				// Insert at the computed position
				tmpTargetRows.splice(tmpInsertIdx, 0, { Inputs: tmpMovedAddresses });

				// Reassign Row numbers based on desired order
				for (let i = 0; i < tmpTargetRows.length; i++)
				{
					tmpMOps._setRowNumberForInputs(tmpManifest, tmpTargetRows[i].Inputs, i + 1);
				}

				// Reindex source group for cross-container moves
				if (!tmpSameContainer)
				{
					tmpMOps._reindexGroupRows(tmpSourceIndices[0], tmpSourceIndices[1]);
				}
				break;
			}
			case 'input':
			{
				let tmpMOps = this._ParentFormEditor._ManifestOpsProvider;
				let tmpTargetSection = tmpManifest.Sections[tmpTargetIndices[0]];
				let tmpTargetGroup = tmpTargetSection && tmpTargetSection.Groups ? tmpTargetSection.Groups[tmpTargetIndices[1]] : null;
				if (!tmpTargetSection || !tmpTargetGroup)
				{
					return;
				}

				// Get source address before any changes
				let tmpSourceRows = tmpMOps.getRowsForGroupByIndex(tmpSourceIndices[0], tmpSourceIndices[1]);
				let tmpSourceRow = (tmpSourceIndices[2] >= 0 && tmpSourceIndices[2] < tmpSourceRows.length) ? tmpSourceRows[tmpSourceIndices[2]] : null;
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs) || tmpSourceIndices[3] < 0 || tmpSourceIndices[3] >= tmpSourceRow.Inputs.length)
				{
					return;
				}
				let tmpAddress = tmpSourceRow.Inputs[tmpSourceIndices[3]];

				// Get target row's current inputs before any changes
				let tmpTargetRows = tmpMOps.getRowsForGroupByIndex(tmpTargetIndices[0], tmpTargetIndices[1]);
				let tmpTargetRow = (tmpTargetIndices[2] >= 0 && tmpTargetIndices[2] < tmpTargetRows.length) ? tmpTargetRows[tmpTargetIndices[2]] : null;
				let tmpTargetInputs = (tmpTargetRow && Array.isArray(tmpTargetRow.Inputs)) ? tmpTargetRow.Inputs.slice() : [];

				// Compute insert position
				let tmpSameRow = (tmpSourceIndices[0] === tmpTargetIndices[0]) && (tmpSourceIndices[1] === tmpTargetIndices[1]) && (tmpSourceIndices[2] === tmpTargetIndices[2]);
				let tmpInsertIdx = this._computeInsertIndex(tmpSameRow ? tmpSourceIndices[3] : -1, tmpTargetIndices[3], tmpSameRow, tmpInsertPosition);

				// Build desired input order for the target row
				// Remove moved address if it's already in the target list (same-row case)
				let tmpAddrIdx = tmpTargetInputs.indexOf(tmpAddress);
				if (tmpAddrIdx >= 0)
				{
					tmpTargetInputs.splice(tmpAddrIdx, 1);
				}
				tmpTargetInputs.splice(tmpInsertIdx, 0, tmpAddress);

				// Update Descriptor's PictForm metadata
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

				// Reorder Descriptor keys to achieve desired input order
				tmpMOps._reorderDescriptorsForRow(tmpTargetInputs);

				// Reindex source group if cross-group move
				let tmpSameGroup = (tmpSourceIndices[0] === tmpTargetIndices[0]) && (tmpSourceIndices[1] === tmpTargetIndices[1]);
				if (!tmpSameGroup)
				{
					tmpMOps._reindexGroupRows(tmpSourceIndices[0], tmpSourceIndices[1]);
				}
				break;
			}
			case 'subcolumn':
			{
				// Reorder a column within a Tabular/RecordSet group's ReferenceManifest Descriptors.
				// Indices: [sectionIndex, groupIndex, columnKeyIndex]
				let tmpRefManifest = this._resolveSubcolumnRefManifest(tmpManifest, tmpSourceIndices);
				if (!tmpRefManifest)
				{
					return;
				}

				let tmpKeys = Object.keys(tmpRefManifest.Descriptors);
				let tmpFromIdx = tmpSourceIndices[2];
				let tmpToIdx = tmpTargetIndices[2];

				if (tmpFromIdx === tmpToIdx || tmpFromIdx < 0 || tmpFromIdx >= tmpKeys.length || tmpToIdx < 0 || tmpToIdx >= tmpKeys.length)
				{
					return;
				}

				let tmpInsertIdx = this._computeInsertIndex(tmpFromIdx, tmpToIdx, true, tmpInsertPosition);
				let tmpMovedKey = tmpKeys.splice(tmpFromIdx, 1)[0];
				tmpKeys.splice(tmpInsertIdx, 0, tmpMovedKey);

				// Rebuild the Descriptors object in the new key order
				let tmpNewDescriptors = {};
				for (let k = 0; k < tmpKeys.length; k++)
				{
					tmpNewDescriptors[tmpKeys[k]] = tmpRefManifest.Descriptors[tmpKeys[k]];
				}
				tmpRefManifest.Descriptors = tmpNewDescriptors;
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
			let tmpHighlighted = tmpContainer[0].querySelectorAll('.pict-fe-drag-over, .pict-fe-drag-insert-before, .pict-fe-drag-insert-after');
			for (let i = 0; i < tmpHighlighted.length; i++)
			{
				tmpHighlighted[i].classList.remove('pict-fe-drag-over');
				tmpHighlighted[i].classList.remove('pict-fe-drag-insert-before');
				tmpHighlighted[i].classList.remove('pict-fe-drag-insert-after');
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
	 * Compute the final insert index for a position-aware drag-and-drop.
	 *
	 * After removing the source item from its array, this method determines the
	 * correct splice index based on the user's cursor position (insert before or
	 * after the target).
	 *
	 * @param {number} pSourceIdx - The source item's index within its container
	 * @param {number} pTargetIdx - The target item's index within its container
	 * @param {boolean} pSameContainer - Whether source and target share the same parent
	 * @param {string} pInsertPosition - 'before' or 'after'
	 * @returns {number} The index to use with Array.splice after removing the source
	 */
	_computeInsertIndex(pSourceIdx, pTargetIdx, pSameContainer, pInsertPosition)
	{
		let tmpLogicalTarget = (pInsertPosition === 'before') ? pTargetIdx : pTargetIdx + 1;

		if (pSameContainer && pSourceIdx < tmpLogicalTarget)
		{
			tmpLogicalTarget--;
		}

		return tmpLogicalTarget;
	}

	/**
	 * Resolve the ReferenceManifest for a subcolumn drag operation.
	 *
	 * @param {object} pManifest - The root manifest
	 * @param {Array} pIndices - [sectionIndex, groupIndex, columnKeyIndex]
	 * @returns {object|null} The ReferenceManifest, or null if not found
	 */
	_resolveSubcolumnRefManifest(pManifest, pIndices)
	{
		if (!pManifest || !Array.isArray(pManifest.Sections))
		{
			return null;
		}

		let tmpSection = pManifest.Sections[pIndices[0]];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return null;
		}

		let tmpGroup = tmpSection.Groups[pIndices[1]];
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return null;
		}

		let tmpRefManifest = this._ParentFormEditor._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest || !tmpRefManifest.Descriptors || typeof tmpRefManifest.Descriptors !== 'object')
		{
			return null;
		}

		return tmpRefManifest;
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
				let tmpMOps = this._ParentFormEditor._ManifestOpsProvider;
				let tmpTargetSection = tmpManifest.Sections[tmpContainerIndices[0]];
				let tmpTargetGroup = tmpTargetSection && tmpTargetSection.Groups ? tmpTargetSection.Groups[tmpContainerIndices[1]] : null;
				if (!tmpTargetSection || !tmpTargetGroup)
				{
					return;
				}

				// Get source row's addresses
				let tmpSourceRows = tmpMOps.getRowsForGroupByIndex(tmpSourceIndices[0], tmpSourceIndices[1]);
				let tmpSourceRow = tmpSourceRows[tmpSourceIndices[2]];
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs))
				{
					return;
				}
				let tmpMovedAddresses = tmpSourceRow.Inputs.slice();

				// Update PictForm.Section/Group on moved descriptors
				for (let i = 0; i < tmpMovedAddresses.length; i++)
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpMovedAddresses[i]];
					if (tmpDescriptor && tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm.Section = tmpTargetSection.Hash || '';
						tmpDescriptor.PictForm.Group = tmpTargetGroup.Hash || '';
					}
				}

				// Assign row number to place at end of target group
				let tmpTargetRows = tmpMOps.getRowsForGroupByIndex(tmpContainerIndices[0], tmpContainerIndices[1]);
				let tmpNextRowNum = tmpTargetRows.length + 1;
				tmpMOps._setRowNumberForInputs(tmpManifest, tmpMovedAddresses, tmpNextRowNum);

				// Reindex source group to close the gap
				let tmpSameGroup = (tmpSourceIndices[0] === tmpContainerIndices[0]) && (tmpSourceIndices[1] === tmpContainerIndices[1]);
				if (!tmpSameGroup)
				{
					tmpMOps._reindexGroupRows(tmpSourceIndices[0], tmpSourceIndices[1]);
				}
				break;
			}
			case 'input':
			{
				// Container is a row; indices = [sectionIndex, groupIndex, rowIndex]
				let tmpMOps = this._ParentFormEditor._ManifestOpsProvider;
				let tmpTargetSection = tmpManifest.Sections[tmpContainerIndices[0]];
				let tmpTargetGroup = tmpTargetSection && tmpTargetSection.Groups ? tmpTargetSection.Groups[tmpContainerIndices[1]] : null;
				if (!tmpTargetSection || !tmpTargetGroup)
				{
					return;
				}

				// Get source address
				let tmpSourceRows = tmpMOps.getRowsForGroupByIndex(tmpSourceIndices[0], tmpSourceIndices[1]);
				let tmpSourceRow = (tmpSourceIndices[2] >= 0 && tmpSourceIndices[2] < tmpSourceRows.length) ? tmpSourceRows[tmpSourceIndices[2]] : null;
				if (!tmpSourceRow || !Array.isArray(tmpSourceRow.Inputs) || tmpSourceIndices[3] < 0 || tmpSourceIndices[3] >= tmpSourceRow.Inputs.length)
				{
					return;
				}
				let tmpAddress = tmpSourceRow.Inputs[tmpSourceIndices[3]];

				// Update Descriptor PictForm metadata
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

				// Place at end of target row's input order
				let tmpTargetRows = tmpMOps.getRowsForGroupByIndex(tmpContainerIndices[0], tmpContainerIndices[1]);
				let tmpTargetRow = (tmpContainerIndices[2] >= 0 && tmpContainerIndices[2] < tmpTargetRows.length) ? tmpTargetRows[tmpContainerIndices[2]] : null;
				let tmpTargetInputs = (tmpTargetRow && Array.isArray(tmpTargetRow.Inputs)) ? tmpTargetRow.Inputs.slice() : [];

				// Remove from current position if it's there (same-row case)
				let tmpAddrIdx = tmpTargetInputs.indexOf(tmpAddress);
				if (tmpAddrIdx >= 0)
				{
					tmpTargetInputs.splice(tmpAddrIdx, 1);
				}
				tmpTargetInputs.push(tmpAddress);

				// Reorder Descriptor keys
				tmpMOps._reorderDescriptorsForRow(tmpTargetInputs);

				// Reindex source group if cross-group
				let tmpSameGroup = (tmpSourceIndices[0] === tmpContainerIndices[0]) && (tmpSourceIndices[1] === tmpContainerIndices[1]);
				if (!tmpSameGroup)
				{
					tmpMOps._reindexGroupRows(tmpSourceIndices[0], tmpSourceIndices[1]);
				}
				break;
			}
			case 'subcolumn':
			{
				// Container is a Tabular/RecordSet group; indices = [sectionIndex, groupIndex]
				// Move the subcolumn to the end of the Descriptors object
				let tmpRefManifest = this._resolveSubcolumnRefManifest(tmpManifest, tmpSourceIndices);
				if (!tmpRefManifest)
				{
					return;
				}

				let tmpKeys = Object.keys(tmpRefManifest.Descriptors);
				let tmpFromIdx = tmpSourceIndices[2];

				if (tmpFromIdx < 0 || tmpFromIdx >= tmpKeys.length)
				{
					return;
				}

				// Move the key to the end
				let tmpMovedKey = tmpKeys.splice(tmpFromIdx, 1)[0];
				tmpKeys.push(tmpMovedKey);

				// Rebuild the Descriptors object in the new key order
				let tmpNewDescriptors = {};
				for (let k = 0; k < tmpKeys.length; k++)
				{
					tmpNewDescriptors[tmpKeys[k]] = tmpRefManifest.Descriptors[tmpKeys[k]];
				}
				tmpRefManifest.Descriptors = tmpNewDescriptors;
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
