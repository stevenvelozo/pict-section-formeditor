const libPictProvider = require('pict-provider');

class FormEditorManifestOps extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';

		// Back-reference to the parent FormEditor view (set after construction)
		this._ParentFormEditor = null;
	}

	/**
	 * Ensure every Section has a Groups array and that every Descriptor's
	 * PictForm.Group is represented.  Creates default groups for sections
	 * that have Descriptors but no Groups defined.  Does NOT build Rows.
	 */
	_ensureSectionGroups()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return;
		}

		if (!tmpManifest.Descriptors || typeof tmpManifest.Descriptors !== 'object')
		{
			return;
		}

		// Build a lookup: SectionHash -> section object
		let tmpSectionMap = {};
		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			if (tmpSection.Hash)
			{
				tmpSectionMap[tmpSection.Hash] = tmpSection;
			}
			if (!Array.isArray(tmpSection.Groups))
			{
				tmpSection.Groups = [];
			}
		}

		// Build a set of existing group hashes per section
		let tmpGroupHashSet = {};
		for (let i = 0; i < tmpManifest.Sections.length; i++)
		{
			let tmpSection = tmpManifest.Sections[i];
			let tmpSHash = tmpSection.Hash || '';
			tmpGroupHashSet[tmpSHash] = {};
			for (let j = 0; j < tmpSection.Groups.length; j++)
			{
				if (tmpSection.Groups[j].Hash)
				{
					tmpGroupHashSet[tmpSHash][tmpSection.Groups[j].Hash] = true;
				}
			}
		}

		// Scan Descriptors and create missing groups
		let tmpDescriptorKeys = Object.keys(tmpManifest.Descriptors);
		for (let i = 0; i < tmpDescriptorKeys.length; i++)
		{
			let tmpDescriptor = tmpManifest.Descriptors[tmpDescriptorKeys[i]];
			if (!tmpDescriptor || !tmpDescriptor.PictForm)
			{
				continue;
			}

			let tmpSHash = tmpDescriptor.PictForm.Section;
			if (!tmpSHash || !tmpSectionMap[tmpSHash])
			{
				continue;
			}

			let tmpSection = tmpSectionMap[tmpSHash];
			let tmpGHash = tmpDescriptor.PictForm.Group || '';

			if (!tmpGHash)
			{
				// Descriptor has no group — ensure a default group exists
				if (tmpSection.Groups.length === 0)
				{
					let tmpDefaultHash = tmpSHash + 'Group_Default';
					tmpSection.Groups.push({ Hash: tmpDefaultHash, Name: 'Default', Layout: 'Record' });
					tmpGroupHashSet[tmpSHash][tmpDefaultHash] = true;
				}
			}
			else if (!tmpGroupHashSet[tmpSHash][tmpGHash])
			{
				// Descriptor references a group that doesn't exist — create it
				tmpSection.Groups.push({ Hash: tmpGHash, Name: tmpGHash, Layout: 'Record' });
				tmpGroupHashSet[tmpSHash][tmpGHash] = true;
			}
		}
	}

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

		this._ParentFormEditor.renderVisualEditor();
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
			this._ParentFormEditor.renderVisualEditor();
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
		this._ParentFormEditor.renderVisualEditor();
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
		this._ParentFormEditor.renderVisualEditor();
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

		this._ParentFormEditor.renderVisualEditor();
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
			this._removeDescriptorsForGroup(tmpManifest, tmpGroup, tmpSection);

			tmpSection.Groups.splice(pGroupIndex, 1);
			this._ParentFormEditor.renderVisualEditor();
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
		this._ParentFormEditor.renderVisualEditor();
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
		this._ParentFormEditor.renderVisualEditor();
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

		// Compute current rows to determine the next row number
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		let tmpNextRowNum = tmpRows.length + 1;

		// Auto-create the first input in the new row (rows are derived
		// from Descriptors, so an empty row cannot exist)
		this._addInputAtRow(pSectionIndex, pGroupIndex, tmpNextRowNum);
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
		if (!tmpGroup)
		{
			return;
		}

		// Compute rows from Descriptors
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);

		if (pRowIndex >= 0 && pRowIndex < tmpRows.length)
		{
			// Delete all Descriptors in this row
			let tmpRow = tmpRows[pRowIndex];
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

			// Reindex remaining rows to close the gap
			this._reindexGroupRows(pSectionIndex, pGroupIndex);

			this._ParentFormEditor.renderVisualEditor();
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
		if (!tmpGroup)
		{
			return;
		}

		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		if (pRowIndex <= 0 || pRowIndex >= tmpRows.length)
		{
			return;
		}

		// Swap PictForm.Row values between this row and the one above
		let tmpCurrentRow = tmpRows[pRowIndex];
		let tmpAboveRow = tmpRows[pRowIndex - 1];
		let tmpCurrentRowNum = pRowIndex + 1;
		let tmpAboveRowNum = pRowIndex;

		this._setRowNumberForInputs(tmpManifest, tmpCurrentRow.Inputs, tmpAboveRowNum);
		this._setRowNumberForInputs(tmpManifest, tmpAboveRow.Inputs, tmpCurrentRowNum);

		this._ParentFormEditor.renderVisualEditor();
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
		if (!tmpGroup)
		{
			return;
		}

		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		if (pRowIndex < 0 || pRowIndex >= tmpRows.length - 1)
		{
			return;
		}

		// Swap PictForm.Row values between this row and the one below
		let tmpCurrentRow = tmpRows[pRowIndex];
		let tmpBelowRow = tmpRows[pRowIndex + 1];
		let tmpCurrentRowNum = pRowIndex + 1;
		let tmpBelowRowNum = pRowIndex + 2;

		this._setRowNumberForInputs(tmpManifest, tmpCurrentRow.Inputs, tmpBelowRowNum);
		this._setRowNumberForInputs(tmpManifest, tmpBelowRow.Inputs, tmpCurrentRowNum);

		this._ParentFormEditor.renderVisualEditor();
	}

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
		if (!tmpGroup)
		{
			return;
		}

		let tmpRowNum = pRowIndex + 1;
		this._addInputAtRow(pSectionIndex, pGroupIndex, tmpRowNum);
	}

	/**
	 * Internal helper: create a new Descriptor for the given row number.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} pRowNum - 1-based row number
	 */
	_addInputAtRow(pSectionIndex, pGroupIndex, pRowNum)
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

		if (!tmpManifest.Descriptors || typeof tmpManifest.Descriptors !== 'object')
		{
			tmpManifest.Descriptors = {};
		}

		let tmpSectionHash = tmpSection.Hash || 'S';
		let tmpGroupHash = tmpGroup.Hash || 'G';

		// Count existing inputs in this row to generate a unique number
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		let tmpExistingCount = 0;
		if (pRowNum - 1 >= 0 && pRowNum - 1 < tmpRows.length && tmpRows[pRowNum - 1])
		{
			tmpExistingCount = tmpRows[pRowNum - 1].Inputs.length;
		}
		let tmpInputNum = tmpExistingCount + 1;

		let tmpInputHash = `${tmpGroupHash}_R${pRowNum}_Input${tmpInputNum}`;
		let tmpAddress = tmpInputHash;

		// Ensure the address is unique in the Descriptors
		while (tmpManifest.Descriptors.hasOwnProperty(tmpAddress))
		{
			tmpInputNum++;
			tmpInputHash = `${tmpGroupHash}_R${pRowNum}_Input${tmpInputNum}`;
			tmpAddress = tmpInputHash;
		}

		let tmpInputName = `Input ${tmpInputNum}`;

		// Create the Descriptor entry — no Rows array manipulation needed
		tmpManifest.Descriptors[tmpAddress] =
		{
			Name: tmpInputName,
			Hash: tmpInputHash,
			DataType: 'String',
			PictForm:
			{
				Section: tmpSectionHash,
				Group: tmpGroupHash,
				Row: pRowNum
			}
		};

		this._ParentFormEditor.renderVisualEditor();
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
		if (!tmpGroup)
		{
			return;
		}

		// Compute rows from Descriptors
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);

		if (pRowIndex < 0 || pRowIndex >= tmpRows.length)
		{
			return;
		}

		let tmpRow = tmpRows[pRowIndex];
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

			this._ParentFormEditor.renderVisualEditor();
		}
	}

	/**
	 * Move an input left (earlier) within its row.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} pRowIndex
	 * @param {number} pInputIndex
	 */
	moveInputLeft(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		if (pRowIndex < 0 || pRowIndex >= tmpRows.length)
		{
			return;
		}

		let tmpRow = tmpRows[pRowIndex];
		if (!tmpRow || !Array.isArray(tmpRow.Inputs))
		{
			return;
		}

		if (pInputIndex <= 0 || pInputIndex >= tmpRow.Inputs.length)
		{
			return;
		}

		// Swap Descriptor key order to move input left
		this._swapDescriptorOrder(tmpRow.Inputs[pInputIndex], tmpRow.Inputs[pInputIndex - 1]);

		// Update the selection to follow the moved input
		this._ParentFormEditor._SelectedInputIndices = [pSectionIndex, pGroupIndex, pRowIndex, pInputIndex - 1];
		if (this._ParentFormEditor._PropertiesPanelView && this._ParentFormEditor._PropertiesPanelView._SelectedInput)
		{
			this._ParentFormEditor._PropertiesPanelView._SelectedInput.InputIndex = pInputIndex - 1;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Move an input right (later) within its row.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} pRowIndex
	 * @param {number} pInputIndex
	 */
	moveInputRight(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		if (pRowIndex < 0 || pRowIndex >= tmpRows.length)
		{
			return;
		}

		let tmpRow = tmpRows[pRowIndex];
		if (!tmpRow || !Array.isArray(tmpRow.Inputs))
		{
			return;
		}

		if (pInputIndex < 0 || pInputIndex >= tmpRow.Inputs.length - 1)
		{
			return;
		}

		// Swap Descriptor key order to move input right
		this._swapDescriptorOrder(tmpRow.Inputs[pInputIndex], tmpRow.Inputs[pInputIndex + 1]);

		// Update the selection to follow the moved input
		this._ParentFormEditor._SelectedInputIndices = [pSectionIndex, pGroupIndex, pRowIndex, pInputIndex + 1];
		if (this._ParentFormEditor._PropertiesPanelView && this._ParentFormEditor._PropertiesPanelView._SelectedInput)
		{
			this._ParentFormEditor._PropertiesPanelView._SelectedInput.InputIndex = pInputIndex + 1;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Return the list of ReferenceManifest keys in the manifest.
	 *
	 * @returns {Array<string>}
	 */
	getReferenceManifestNames()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.ReferenceManifests || typeof tmpManifest.ReferenceManifests !== 'object')
		{
			return [];
		}
		return Object.keys(tmpManifest.ReferenceManifests);
	}

	/**
	 * Create a new ReferenceManifest entry.
	 *
	 * @param {string} pName - Desired name/key for the ReferenceManifest
	 * @returns {string} The actual key used (may differ if pName was taken)
	 */
	createReferenceManifest(pName)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return '';
		}

		if (!tmpManifest.ReferenceManifests || typeof tmpManifest.ReferenceManifests !== 'object')
		{
			tmpManifest.ReferenceManifests = {};
		}

		let tmpKey = (typeof pName === 'string' && pName.length > 0) ? pName : 'SubManifest_1';

		// Ensure uniqueness
		let tmpBase = tmpKey;
		let tmpCounter = 1;
		while (tmpManifest.ReferenceManifests.hasOwnProperty(tmpKey))
		{
			tmpCounter++;
			tmpKey = tmpBase + '_' + tmpCounter;
		}

		tmpManifest.ReferenceManifests[tmpKey] =
		{
			Scope: tmpKey,
			Descriptors: {}
		};

		return tmpKey;
	}

	/**
	 * Resolve a ReferenceManifest by name.
	 *
	 * @param {string} pManifestName - Key in ReferenceManifests
	 * @returns {object|null}
	 */
	_resolveReferenceManifest(pManifestName)
	{
		if (!pManifestName || typeof pManifestName !== 'string')
		{
			return null;
		}

		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.ReferenceManifests)
		{
			return null;
		}

		return tmpManifest.ReferenceManifests[pManifestName] || null;
	}

	/**
	 * Bind an existing ReferenceManifest to a group.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pManifestName - Key in ReferenceManifests
	 */
	bindReferenceManifest(pSectionIndex, pGroupIndex, pManifestName)
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

		tmpGroup.RecordManifest = pManifestName;
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Unbind a ReferenceManifest from a group.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	unbindReferenceManifest(pSectionIndex, pGroupIndex)
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

		delete tmpGroup.RecordManifest;
		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Create a new ReferenceManifest and bind it to a group in one step.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	createAndBindReferenceManifest(pSectionIndex, pGroupIndex)
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

		// Generate name based on group hash
		let tmpBaseName = tmpGroup.Hash || ('Manifest_' + pSectionIndex + '_' + pGroupIndex);
		let tmpKey = this.createReferenceManifest(tmpBaseName);

		if (tmpKey)
		{
			tmpGroup.RecordManifest = tmpKey;
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Add a column (Descriptor) to the bound ReferenceManifest.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} [pRow] - PictForm.Row value (defaults to 1)
	 */
	addSubmanifestColumn(pSectionIndex, pGroupIndex, pRow)
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
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return;
		}

		let tmpRefManifest = this._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest)
		{
			return;
		}

		if (!tmpRefManifest.Descriptors || typeof tmpRefManifest.Descriptors !== 'object')
		{
			tmpRefManifest.Descriptors = {};
		}

		let tmpRow = (typeof pRow === 'number' && pRow > 0) ? pRow : 1;

		// Generate a unique column address
		let tmpColumnNum = Object.keys(tmpRefManifest.Descriptors).length + 1;
		let tmpAddress = 'Column_' + tmpColumnNum;
		while (tmpRefManifest.Descriptors.hasOwnProperty(tmpAddress))
		{
			tmpColumnNum++;
			tmpAddress = 'Column_' + tmpColumnNum;
		}

		let tmpColumnName = 'Column ' + tmpColumnNum;

		tmpRefManifest.Descriptors[tmpAddress] =
		{
			Name: tmpColumnName,
			Hash: tmpAddress,
			DataType: 'String',
			PictForm:
			{
				Section: tmpSection.Hash || '',
				Group: tmpGroup.Hash || '',
				Row: tmpRow
			}
		};

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Remove a column (Descriptor) from the bound ReferenceManifest.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pColumnAddress - The Descriptor address key
	 */
	removeSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress)
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
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return;
		}

		let tmpRefManifest = this._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest || !tmpRefManifest.Descriptors)
		{
			return;
		}

		if (tmpRefManifest.Descriptors.hasOwnProperty(pColumnAddress))
		{
			delete tmpRefManifest.Descriptors[pColumnAddress];
		}

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Move a submanifest column up (earlier in key order).
	 */
	moveSubmanifestColumnUp(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		this._reorderSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress, -1);
	}

	/**
	 * Move a submanifest column down (later in key order).
	 */
	moveSubmanifestColumnDown(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		this._reorderSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress, 1);
	}

	/**
	 * Reorder a column within the submanifest Descriptors by rebuilding the object.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pColumnAddress
	 * @param {number} pDirection - -1 for up, +1 for down
	 */
	_reorderSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress, pDirection)
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
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return;
		}

		let tmpRefManifest = this._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest || !tmpRefManifest.Descriptors)
		{
			return;
		}

		let tmpKeys = Object.keys(tmpRefManifest.Descriptors);
		let tmpIndex = tmpKeys.indexOf(pColumnAddress);
		if (tmpIndex < 0)
		{
			return;
		}

		let tmpNewIndex = tmpIndex + pDirection;
		if (tmpNewIndex < 0 || tmpNewIndex >= tmpKeys.length)
		{
			return;
		}

		// Swap keys
		let tmpSwap = tmpKeys[tmpNewIndex];
		tmpKeys[tmpNewIndex] = tmpKeys[tmpIndex];
		tmpKeys[tmpIndex] = tmpSwap;

		// Rebuild the Descriptors object in new order
		let tmpNewDescriptors = {};
		for (let i = 0; i < tmpKeys.length; i++)
		{
			tmpNewDescriptors[tmpKeys[i]] = tmpRefManifest.Descriptors[tmpKeys[i]];
		}
		tmpRefManifest.Descriptors = tmpNewDescriptors;

		this._ParentFormEditor.renderVisualEditor();
	}

	/**
	 * Group submanifest Descriptors by PictForm.Row.
	 *
	 * @param {object} pRefManifest - A ReferenceManifest object
	 * @returns {Array} Array of { Row: number, Columns: [{ Address, Descriptor }, ...] }
	 */
	_getSubmanifestRows(pRefManifest)
	{
		let tmpResult = [];

		if (!pRefManifest || !pRefManifest.Descriptors || typeof pRefManifest.Descriptors !== 'object')
		{
			return tmpResult;
		}

		let tmpRowMap = {};
		let tmpKeys = Object.keys(pRefManifest.Descriptors);

		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpDescriptor = pRefManifest.Descriptors[tmpKeys[i]];
			let tmpRow = 1;
			if (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.Row)
			{
				tmpRow = parseInt(tmpDescriptor.PictForm.Row, 10);
				if (isNaN(tmpRow) || tmpRow < 1)
				{
					tmpRow = 1;
				}
			}

			if (!tmpRowMap[tmpRow])
			{
				tmpRowMap[tmpRow] = [];
			}
			tmpRowMap[tmpRow].push({ Address: tmpKeys[i], Descriptor: tmpDescriptor });
		}

		// Sort by row number
		let tmpRowNumbers = Object.keys(tmpRowMap).map(Number).sort(function(a, b) { return a - b; });
		for (let i = 0; i < tmpRowNumbers.length; i++)
		{
			tmpResult.push({ Row: tmpRowNumbers[i], Columns: tmpRowMap[tmpRowNumbers[i]] });
		}

		return tmpResult;
	}

	/**
	 * Get the highest PictForm.Row value across all Descriptors in a ReferenceManifest.
	 *
	 * @param {object} pRefManifest
	 * @returns {number}
	 */
	_getSubmanifestMaxRow(pRefManifest)
	{
		if (!pRefManifest || !pRefManifest.Descriptors || typeof pRefManifest.Descriptors !== 'object')
		{
			return 0;
		}

		let tmpMaxRow = 0;
		let tmpKeys = Object.keys(pRefManifest.Descriptors);

		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpDescriptor = pRefManifest.Descriptors[tmpKeys[i]];
			if (tmpDescriptor && tmpDescriptor.PictForm && tmpDescriptor.PictForm.Row)
			{
				let tmpRow = parseInt(tmpDescriptor.PictForm.Row, 10);
				if (!isNaN(tmpRow) && tmpRow > tmpMaxRow)
				{
					tmpMaxRow = tmpRow;
				}
			}
		}

		return tmpMaxRow;
	}

	/**
	 * Add a new row to a RecordSet submanifest by creating a column in the next row.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	addSubmanifestRow(pSectionIndex, pGroupIndex)
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
		if (!tmpGroup || !tmpGroup.RecordManifest)
		{
			return;
		}

		let tmpRefManifest = this._resolveReferenceManifest(tmpGroup.RecordManifest);
		if (!tmpRefManifest)
		{
			return;
		}

		let tmpNextRow = this._getSubmanifestMaxRow(tmpRefManifest) + 1;
		this.addSubmanifestColumn(pSectionIndex, pGroupIndex, tmpNextRow);
	}

	/**
	 * Select a submanifest column (Tabular/RecordSet) for the properties panel.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {string} pColumnAddress - The Descriptor address key
	 */
	selectSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		// Clear Record input selection
		this._ParentFormEditor._SelectedInputIndices = null;
		// Also select the containing section and group
		this._ParentFormEditor._SelectedSectionIndex = pSectionIndex;
		this._ParentFormEditor._SelectedGroupIndices = { SectionIndex: pSectionIndex, GroupIndex: pGroupIndex };

		this._ParentFormEditor._SelectedTabularColumn =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			ColumnAddress: pColumnAddress
		};

		if (this._ParentFormEditor._PropertiesPanelView)
		{
			this._ParentFormEditor._PropertiesPanelView.selectTabularColumn(pSectionIndex, pGroupIndex, pColumnAddress);
		}

		// Auto-switch to properties tab and expand panel
		this._ParentFormEditor._PanelActiveTab = 'properties';
		if (this._ParentFormEditor._PanelCollapsed)
		{
			this._ParentFormEditor._PanelCollapsed = false;
		}

		this._ParentFormEditor.renderVisualEditor();

		// Align the properties panel with the selected column after layout settles
		let tmpSelf = this._ParentFormEditor;
		setTimeout(function () { tmpSelf._UtilitiesProvider._alignPanelToSelection(); }, 0);
	}

	/**
	 * Compute the Rows for a group on-the-fly from Descriptors.
	 *
	 * Scans all Descriptors whose PictForm.Section matches pSectionHash
	 * and PictForm.Group matches pGroupHash, groups them by PictForm.Row,
	 * and returns a contiguous array of { Inputs: [address, ...] } objects.
	 *
	 * @param {string} pSectionHash
	 * @param {string} pGroupHash
	 * @param {boolean} [pIsFirstGroup] - When true, also matches Descriptors
	 *        whose PictForm.Group is missing (legacy default-to-first-group).
	 * @returns {Array<{Inputs: Array<string>}>}
	 */
	getRowsForGroup(pSectionHash, pGroupHash, pIsFirstGroup)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Descriptors || typeof tmpManifest.Descriptors !== 'object')
		{
			return [];
		}

		let tmpRowMap = {};
		let tmpDescriptorKeys = Object.keys(tmpManifest.Descriptors);

		for (let i = 0; i < tmpDescriptorKeys.length; i++)
		{
			let tmpAddress = tmpDescriptorKeys[i];
			let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
			if (!tmpDescriptor || !tmpDescriptor.PictForm)
			{
				continue;
			}

			let tmpPictForm = tmpDescriptor.PictForm;

			// Section must match
			if (tmpPictForm.Section !== pSectionHash)
			{
				continue;
			}

			// Group must match, or be missing when this is the first group
			let tmpDescGroup = tmpPictForm.Group;
			if (tmpDescGroup === pGroupHash)
			{
				// Exact match
			}
			else if (pIsFirstGroup && (!tmpDescGroup || tmpDescGroup === ''))
			{
				// Legacy: no group set, default to first group
			}
			else
			{
				continue;
			}

			let tmpRowNumber = parseInt(tmpPictForm.Row, 10);
			if (isNaN(tmpRowNumber) || tmpRowNumber < 1)
			{
				tmpRowNumber = 1;
			}

			if (!tmpRowMap[tmpRowNumber])
			{
				tmpRowMap[tmpRowNumber] = [];
			}
			tmpRowMap[tmpRowNumber].push(tmpAddress);
		}

		// Sort by row number and return as contiguous array
		let tmpRowNumbers = Object.keys(tmpRowMap).map(Number).sort(function(a, b) { return a - b; });
		let tmpResult = [];
		for (let i = 0; i < tmpRowNumbers.length; i++)
		{
			tmpResult.push({ Inputs: tmpRowMap[tmpRowNumbers[i]] });
		}
		return tmpResult;
	}

	/**
	 * Convenience wrapper that resolves section/group indices to hashes
	 * and calls getRowsForGroup().
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @returns {Array<{Inputs: Array<string>}>}
	 */
	getRowsForGroupByIndex(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !Array.isArray(tmpManifest.Sections))
		{
			return [];
		}

		let tmpSection = tmpManifest.Sections[pSectionIndex];
		if (!tmpSection || !Array.isArray(tmpSection.Groups))
		{
			return [];
		}

		let tmpGroup = tmpSection.Groups[pGroupIndex];
		if (!tmpGroup)
		{
			return [];
		}

		return this.getRowsForGroup(tmpSection.Hash || '', tmpGroup.Hash || '', pGroupIndex === 0);
	}

	/**
	 * Strip Rows arrays from all Groups in a manifest object (in-place).
	 * Use this to clean corrupted manifests that have Rows baked in.
	 *
	 * @param {object} pManifest - The manifest to clean
	 */
	stripRowsFromManifest(pManifest)
	{
		if (!pManifest || !Array.isArray(pManifest.Sections))
		{
			return;
		}

		for (let i = 0; i < pManifest.Sections.length; i++)
		{
			let tmpSection = pManifest.Sections[i];
			if (Array.isArray(tmpSection.Groups))
			{
				for (let j = 0; j < tmpSection.Groups.length; j++)
				{
					delete tmpSection.Groups[j].Rows;
				}
			}
		}
	}

	/**
	 * Recompute contiguous 1-based PictForm.Row values for all Descriptors
	 * in a group.  Call after row removal or reorder to close gaps.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 */
	_reindexGroupRows(pSectionIndex, pGroupIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Descriptors)
		{
			return;
		}

		let tmpRows = this.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);

		for (let i = 0; i < tmpRows.length; i++)
		{
			let tmpRow = tmpRows[i];
			if (!tmpRow || !Array.isArray(tmpRow.Inputs))
			{
				continue;
			}

			for (let j = 0; j < tmpRow.Inputs.length; j++)
			{
				let tmpAddress = tmpRow.Inputs[j];
				if (typeof tmpAddress === 'string' && tmpManifest.Descriptors.hasOwnProperty(tmpAddress))
				{
					let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
					if (tmpDescriptor && tmpDescriptor.PictForm)
					{
						tmpDescriptor.PictForm.Row = i + 1;
					}
				}
			}
		}
	}

	/**
	 * Swap two Descriptor keys in the manifest's Descriptors object to
	 * control intra-row input ordering (Object.keys insertion order).
	 *
	 * @param {string} pAddress1
	 * @param {string} pAddress2
	 */
	_swapDescriptorOrder(pAddress1, pAddress2)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Descriptors)
		{
			return;
		}

		let tmpKeys = Object.keys(tmpManifest.Descriptors);
		let tmpIndex1 = tmpKeys.indexOf(pAddress1);
		let tmpIndex2 = tmpKeys.indexOf(pAddress2);

		if (tmpIndex1 < 0 || tmpIndex2 < 0)
		{
			return;
		}

		// Swap the keys
		tmpKeys[tmpIndex1] = pAddress2;
		tmpKeys[tmpIndex2] = pAddress1;

		// Rebuild the Descriptors object in new order
		let tmpNewDescriptors = {};
		for (let i = 0; i < tmpKeys.length; i++)
		{
			tmpNewDescriptors[tmpKeys[i]] = tmpManifest.Descriptors[tmpKeys[i]];
		}
		tmpManifest.Descriptors = tmpNewDescriptors;
	}

	/**
	 * Rebuild the Descriptors object so that pDesiredAddresses appear in the
	 * given order, replacing any previous ordering of those keys.  All other
	 * keys remain in their original order.  The block of reordered keys is
	 * placed at the position of the first occurrence of any key in the set.
	 *
	 * @param {Array<string>} pDesiredAddresses - Addresses in the desired order
	 */
	_reorderDescriptorsForRow(pDesiredAddresses)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Descriptors || !Array.isArray(pDesiredAddresses) || pDesiredAddresses.length === 0)
		{
			return;
		}

		let tmpDesiredSet = {};
		for (let i = 0; i < pDesiredAddresses.length; i++)
		{
			tmpDesiredSet[pDesiredAddresses[i]] = true;
		}

		let tmpOldKeys = Object.keys(tmpManifest.Descriptors);
		let tmpNonRowKeys = [];
		let tmpFirstRowKeyPosition = -1;

		for (let i = 0; i < tmpOldKeys.length; i++)
		{
			if (tmpDesiredSet[tmpOldKeys[i]])
			{
				if (tmpFirstRowKeyPosition < 0)
				{
					tmpFirstRowKeyPosition = tmpNonRowKeys.length;
				}
			}
			else
			{
				tmpNonRowKeys.push(tmpOldKeys[i]);
			}
		}

		if (tmpFirstRowKeyPosition < 0)
		{
			tmpFirstRowKeyPosition = tmpNonRowKeys.length;
		}

		// Insert desired addresses at the position of the first removed key
		let tmpFinalKeys = tmpNonRowKeys.slice(0, tmpFirstRowKeyPosition)
			.concat(pDesiredAddresses)
			.concat(tmpNonRowKeys.slice(tmpFirstRowKeyPosition));

		let tmpNewDescriptors = {};
		for (let i = 0; i < tmpFinalKeys.length; i++)
		{
			if (tmpManifest.Descriptors[tmpFinalKeys[i]])
			{
				tmpNewDescriptors[tmpFinalKeys[i]] = tmpManifest.Descriptors[tmpFinalKeys[i]];
			}
		}

		tmpManifest.Descriptors = tmpNewDescriptors;
	}

	/**
	 * Return a deep clone of the manifest with runtime-only properties
	 * (such as Rows on Groups) stripped out.
	 *
	 * @returns {object|null}
	 */
	getCleanManifestForExport()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return null;
		}

		let tmpClone = JSON.parse(JSON.stringify(tmpManifest));
		this.stripRowsFromManifest(tmpClone);
		return tmpClone;
	}

	_resolveManifestData()
	{
		let tmpAddress = this._ParentFormEditor.options.ManifestDataAddress;
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
		let tmpAddress = this._ParentFormEditor.options.ManifestDataAddress;
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
			Descriptors: {},
			ReferenceManifests: {},
			StaticOptionLists: [],
			PickLists: []
		});
	}

	/**
	 * Set PictForm.Row to the given value for a list of Descriptor addresses.
	 *
	 * @param {object} pManifest - The manifest data object
	 * @param {Array<string>} pAddresses - Descriptor address keys
	 * @param {number} pRowNumber - 1-based row number to assign
	 */
	_setRowNumberForInputs(pManifest, pAddresses, pRowNumber)
	{
		if (!pManifest || !pManifest.Descriptors || !Array.isArray(pAddresses))
		{
			return;
		}

		for (let i = 0; i < pAddresses.length; i++)
		{
			let tmpAddress = pAddresses[i];
			if (typeof tmpAddress === 'string' && pManifest.Descriptors.hasOwnProperty(tmpAddress))
			{
				let tmpDescriptor = pManifest.Descriptors[tmpAddress];
				if (tmpDescriptor && tmpDescriptor.PictForm)
				{
					tmpDescriptor.PictForm.Row = pRowNumber;
				}
			}
		}
	}

	/**
	 * Remove all Descriptor entries for inputs within a group by scanning
	 * Descriptors for matching Section+Group hashes.
	 *
	 * @param {object} pManifest - The manifest data object
	 * @param {object} pGroup - The group being removed
	 * @param {object} [pSection] - The containing section (used to match hashes)
	 */
	_removeDescriptorsForGroup(pManifest, pGroup, pSection)
	{
		if (!pGroup || !pManifest || !pManifest.Descriptors)
		{
			return;
		}

		let tmpGroupHash = pGroup.Hash || '';
		let tmpSectionHash = (pSection && pSection.Hash) ? pSection.Hash : '';

		let tmpKeys = Object.keys(pManifest.Descriptors);
		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpDescriptor = pManifest.Descriptors[tmpKeys[i]];
			if (!tmpDescriptor || !tmpDescriptor.PictForm)
			{
				continue;
			}

			if (tmpDescriptor.PictForm.Section === tmpSectionHash && tmpDescriptor.PictForm.Group === tmpGroupHash)
			{
				delete pManifest.Descriptors[tmpKeys[i]];
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
			this._removeDescriptorsForGroup(pManifest, pSection.Groups[i], pSection);
		}
	}
}

module.exports = FormEditorManifestOps;
