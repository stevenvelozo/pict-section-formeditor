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
			this._removeDescriptorsForGroup(tmpManifest, tmpGroup);

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

		if (!Array.isArray(tmpGroup.Rows))
		{
			tmpGroup.Rows = [];
		}

		tmpGroup.Rows.push({ Inputs: [] });

		this._ParentFormEditor.renderVisualEditor();
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
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows) || pRowIndex <= 0)
		{
			return;
		}

		let tmpRow = tmpGroup.Rows.splice(pRowIndex, 1)[0];
		tmpGroup.Rows.splice(pRowIndex - 1, 0, tmpRow);

		this._syncRowIndices(tmpManifest, tmpGroup);
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
		if (!tmpGroup || !Array.isArray(tmpGroup.Rows) || pRowIndex >= tmpGroup.Rows.length - 1)
		{
			return;
		}

		let tmpRow = tmpGroup.Rows.splice(pRowIndex, 1)[0];
		tmpGroup.Rows.splice(pRowIndex + 1, 0, tmpRow);

		this._syncRowIndices(tmpManifest, tmpGroup);
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

		if (pInputIndex <= 0 || pInputIndex >= tmpRow.Inputs.length)
		{
			return;
		}

		let tmpItem = tmpRow.Inputs.splice(pInputIndex, 1)[0];
		tmpRow.Inputs.splice(pInputIndex - 1, 0, tmpItem);

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

		if (pInputIndex < 0 || pInputIndex >= tmpRow.Inputs.length - 1)
		{
			return;
		}

		let tmpItem = tmpRow.Inputs.splice(pInputIndex, 1)[0];
		tmpRow.Inputs.splice(pInputIndex + 1, 0, tmpItem);

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
}

module.exports = FormEditorManifestOps;
