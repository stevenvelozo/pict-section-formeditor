/**
 * Unit tests for Pict Section FormEditor
 *
 * @license     MIT
 *
 * @author      Steven Velozo <steven@velozo.com>
 */

var libPict = require('pict');

var Chai = require("chai");
var Expect = Chai.expect;

var libPictSectionFormEditor = require('../source/Pict-Section-FormEditor.js');

suite
(
	'Pict Section FormEditor',
	function ()
	{
		suite
		(
			'Module Exports',
			function ()
			{
				test
				(
					'Module should export the main view class',
					function ()
					{
						Expect(libPictSectionFormEditor).to.be.a('function');
					}
				);
				test
				(
					'Module should export default configuration',
					function ()
					{
						Expect(libPictSectionFormEditor.default_configuration).to.be.an('object');
						Expect(libPictSectionFormEditor.default_configuration.ViewIdentifier).to.equal('Pict-FormEditor');
						Expect(libPictSectionFormEditor.default_configuration.CSS).to.be.a('string');
						Expect(libPictSectionFormEditor.default_configuration.Templates).to.be.an('array');
						Expect(libPictSectionFormEditor.default_configuration.Renderables).to.be.an('array');
					}
				);
			}
		);
		suite
		(
			'View Instantiation',
			function ()
			{
				test
				(
					'Should instantiate a FormEditor view',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestFormEditor',
						{
							ViewIdentifier: 'TestFormEditor',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView).to.be.an('object');
						Expect(tmpView.options.ViewIdentifier).to.equal('TestFormEditor');
						Expect(tmpView.options.ManifestDataAddress).to.equal('AppData.FormConfig');
					}
				);
				test
				(
					'Should use default ManifestDataAddress when none provided',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestFormEditorDefault',
						{
							ViewIdentifier: 'TestFormEditorDefault'
						}, libPictSectionFormEditor);

						Expect(tmpView.options.ManifestDataAddress).to.equal('FormEditor.Manifest');
					}
				);
				test
				(
					'Should initialize with an empty manifest when no data exists',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestFormEditorInit',
						{
							ViewIdentifier: 'TestFormEditorInit',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						Expect(tmpPict.AppData.FormConfig).to.be.an('object');
						Expect(tmpPict.AppData.FormConfig.Scope).to.equal('NewForm');
						Expect(tmpPict.AppData.FormConfig.Sections).to.be.an('array');
						Expect(tmpPict.AppData.FormConfig.Descriptors).to.be.an('object');
					}
				);
				test
				(
					'Should preserve existing manifest data on initialize',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'ExistingForm',
							Sections:
							[
								{
									Hash: 'Section1',
									Name: 'My Section',
									Groups: []
								}
							],
							Descriptors: {}
						};

						let tmpView = tmpPict.addView('TestFormEditorPreserve',
						{
							ViewIdentifier: 'TestFormEditorPreserve',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						Expect(tmpPict.AppData.FormConfig.Scope).to.equal('ExistingForm');
						Expect(tmpPict.AppData.FormConfig.Sections.length).to.equal(1);
						Expect(tmpPict.AppData.FormConfig.Sections[0].Name).to.equal('My Section');
					}
				);
				test
				(
					'Should create a code editor child view on initialize',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestCodeEditorView',
						{
							ViewIdentifier: 'TestCodeEditorView',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						Expect(tmpView._CodeEditorView).to.be.an('object');
						Expect(tmpView._CodeEditorView.options.Language).to.equal('json');
						Expect(tmpView._CodeEditorView.options.LineNumbers).to.equal(true);
						Expect(tmpView._CodeEditorView.options.ReadOnly).to.equal(false);
					}
				);
				test
				(
					'Should update code editor content via _updateCodeEditor',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestUpdateCodeEditor',
						{
							ViewIdentifier: 'TestUpdateCodeEditor',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						// Without a DOM, codeJar won't be initialized,
						// so _updateCodeEditor should not throw
						tmpView._updateCodeEditor();
					}
				);
			}
		);
		suite
		(
			'Section Operations',
			function ()
			{
				test
				(
					'Should add a section',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestAddSection',
						{
							ViewIdentifier: 'TestAddSection',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						tmpView.addSection();
						let tmpManifest = tmpPict.AppData.FormConfig;
						Expect(tmpManifest.Sections.length).to.equal(1);
						Expect(tmpManifest.Sections[0].Hash).to.equal('S1');
						Expect(tmpManifest.Sections[0].Name).to.equal('Section 1');
						Expect(tmpManifest.Sections[0].Groups).to.be.an('array');

						tmpView.addSection();
						Expect(tmpManifest.Sections.length).to.equal(2);
						Expect(tmpManifest.Sections[1].Hash).to.equal('S2');
					}
				);
				test
				(
					'Should remove a section',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveSection',
						{
							ViewIdentifier: 'TestRemoveSection',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addSection();
						tmpView.addSection();

						Expect(tmpPict.AppData.FormConfig.Sections.length).to.equal(3);

						tmpView.removeSection(1);
						Expect(tmpPict.AppData.FormConfig.Sections.length).to.equal(2);
						Expect(tmpPict.AppData.FormConfig.Sections[0].Hash).to.equal('S1');
						Expect(tmpPict.AppData.FormConfig.Sections[1].Hash).to.equal('S3');
					}
				);
				test
				(
					'Should move sections up and down',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestMoveSection',
						{
							ViewIdentifier: 'TestMoveSection',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addSection();
						tmpView.addSection();

						// Move section at index 2 up
						tmpView.moveSectionUp(2);
						Expect(tmpPict.AppData.FormConfig.Sections[1].Hash).to.equal('S3');
						Expect(tmpPict.AppData.FormConfig.Sections[2].Hash).to.equal('S2');

						// Move section at index 0 down
						tmpView.moveSectionDown(0);
						Expect(tmpPict.AppData.FormConfig.Sections[0].Hash).to.equal('S3');
						Expect(tmpPict.AppData.FormConfig.Sections[1].Hash).to.equal('S1');
					}
				);
				test
				(
					'Should update section properties',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestUpdateSection',
						{
							ViewIdentifier: 'TestUpdateSection',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();

						tmpView.updateSectionProperty(0, 'Name', 'Customer Info');
						tmpView.updateSectionProperty(0, 'Hash', 'CustomerInfo');

						Expect(tmpPict.AppData.FormConfig.Sections[0].Name).to.equal('Customer Info');
						Expect(tmpPict.AppData.FormConfig.Sections[0].Hash).to.equal('CustomerInfo');
					}
				);
				test
				(
					'Should handle boundary conditions for section operations',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestSectionBounds',
						{
							ViewIdentifier: 'TestSectionBounds',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();

						// Moving up at index 0 should be a no-op
						tmpView.moveSectionUp(0);
						Expect(tmpPict.AppData.FormConfig.Sections[0].Hash).to.equal('S1');

						// Moving down at last index should be a no-op
						tmpView.moveSectionDown(0);
						Expect(tmpPict.AppData.FormConfig.Sections[0].Hash).to.equal('S1');

						// Removing at invalid index should be a no-op
						tmpView.removeSection(5);
						Expect(tmpPict.AppData.FormConfig.Sections.length).to.equal(1);

						tmpView.removeSection(-1);
						Expect(tmpPict.AppData.FormConfig.Sections.length).to.equal(1);
					}
				);
			}
		);
		suite
		(
			'Group Operations',
			function ()
			{
				test
				(
					'Should add a group to a section',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestAddGroup',
						{
							ViewIdentifier: 'TestAddGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();

						// addSection creates a default group, so we already have one
						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];
						Expect(tmpSection.Groups.length).to.equal(1);
						Expect(tmpSection.Groups[0].Hash).to.equal('S1_G1');
						Expect(tmpSection.Groups[0].Layout).to.equal('Record');

						tmpView.addGroup(0);
						Expect(tmpSection.Groups.length).to.equal(2);
						Expect(tmpSection.Groups[1].Hash).to.equal('S1_G2');
					}
				);
				test
				(
					'Should remove a group from a section',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveGroup',
						{
							ViewIdentifier: 'TestRemoveGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						// addSection creates a default group; add two more
						tmpView.addGroup(0);
						tmpView.addGroup(0);

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];
						Expect(tmpSection.Groups.length).to.equal(3);

						tmpView.removeGroup(0, 1);
						Expect(tmpSection.Groups.length).to.equal(2);
						Expect(tmpSection.Groups[0].Hash).to.equal('S1_G1');
						Expect(tmpSection.Groups[1].Hash).to.equal('S1_G3');
					}
				);
				test
				(
					'Should move groups up and down',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestMoveGroup',
						{
							ViewIdentifier: 'TestMoveGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						// addSection creates a default group; add two more
						tmpView.addGroup(0);
						tmpView.addGroup(0);

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];

						tmpView.moveGroupUp(0, 2);
						Expect(tmpSection.Groups[1].Hash).to.equal('S1_G3');
						Expect(tmpSection.Groups[2].Hash).to.equal('S1_G2');

						tmpView.moveGroupDown(0, 0);
						Expect(tmpSection.Groups[0].Hash).to.equal('S1_G3');
						Expect(tmpSection.Groups[1].Hash).to.equal('S1_G1');
					}
				);
				test
				(
					'Should update group properties',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestUpdateGroup',
						{
							ViewIdentifier: 'TestUpdateGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addGroup(0);

						tmpView.updateGroupProperty(0, 0, 'Name', 'Address Fields');
						tmpView.updateGroupProperty(0, 0, 'Hash', 'AddressFields');
						tmpView.updateGroupProperty(0, 0, 'Layout', 'Tabular');

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpGroup.Name).to.equal('Address Fields');
						Expect(tmpGroup.Hash).to.equal('AddressFields');
						Expect(tmpGroup.Layout).to.equal('Tabular');
					}
				);
			}
		);
		suite
		(
			'Sanitize Object Key',
			function ()
			{
				test
				(
					'Should sanitize strings into valid object keys',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestSanitize',
						{
							ViewIdentifier: 'TestSanitize',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView.sanitizeObjectKey('Section 1')).to.equal('Section_1');
						Expect(tmpView.sanitizeObjectKey('Hello World')).to.equal('Hello_World');
						Expect(tmpView.sanitizeObjectKey('foo--bar  baz')).to.equal('foo_bar_baz');
						Expect(tmpView.sanitizeObjectKey('  leading spaces  ')).to.equal('leading_spaces');
						Expect(tmpView.sanitizeObjectKey('AlreadyClean')).to.equal('AlreadyClean');
						Expect(tmpView.sanitizeObjectKey('with_underscores')).to.equal('with_underscores');
						Expect(tmpView.sanitizeObjectKey('')).to.equal('INVALID');
						Expect(tmpView.sanitizeObjectKey(null)).to.equal('INVALID');
						Expect(tmpView.sanitizeObjectKey(undefined)).to.equal('INVALID');
						Expect(tmpView.sanitizeObjectKey(42)).to.equal('INVALID');
					}
				);
				test
				(
					'Should cascade section hash changes to auto-generated group hashes',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestCascade',
						{
							ViewIdentifier: 'TestCascade',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addGroup(0);

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];
						Expect(tmpSection.Groups[0].Hash).to.equal('S1_G1');
						Expect(tmpSection.Groups[1].Hash).to.equal('S1_G2');

						// Rename the section hash; groups should cascade
						tmpView.updateSectionProperty(0, 'Hash', 'CustomerInfo');
						Expect(tmpSection.Groups[0].Hash).to.equal('CustomerInfo_G1');
						Expect(tmpSection.Groups[1].Hash).to.equal('CustomerInfo_G2');
					}
				);
				test
				(
					'Should not cascade to manually customized group hashes',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestNoCascade',
						{
							ViewIdentifier: 'TestNoCascade',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addGroup(0);

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];

						// Manually customize the second group's hash (no _G prefix)
						tmpSection.Groups[1].Hash = 'MyCustomHash';

						// Rename the section hash; only auto-generated groups
						// (those with the _G prefix) should cascade
						tmpView.updateSectionProperty(0, 'Hash', 'CustomerInfo');
						Expect(tmpSection.Groups[0].Hash).to.equal('CustomerInfo_G1');
						Expect(tmpSection.Groups[1].Hash).to.equal('MyCustomHash');
					}
				);
				test
				(
					'Should cascade past a customized middle group',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestCascadePast',
						{
							ViewIdentifier: 'TestCascadePast',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addGroup(0);
						tmpView.addGroup(0);

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];
						Expect(tmpSection.Groups.length).to.equal(3);

						// Customize the middle group's hash
						tmpSection.Groups[1].Hash = 'CustomMiddle';

						// Change section hash; groups 0 and 2 should update, group 1 stays
						tmpView.updateSectionProperty(0, 'Hash', 'NewSection');
						Expect(tmpSection.Groups[0].Hash).to.equal('NewSection_G1');
						Expect(tmpSection.Groups[1].Hash).to.equal('CustomMiddle');
						Expect(tmpSection.Groups[2].Hash).to.equal('NewSection_G3');
					}
				);
			}
		);
		suite
		(
			'Row Operations',
			function ()
			{
				test
				(
					'Should add a row to a group',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestAddRow',
						{
							ViewIdentifier: 'TestAddRow',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpGroup.Rows).to.be.undefined;

						tmpView.addRow(0, 0);
						Expect(tmpGroup.Rows).to.be.an('array');
						Expect(tmpGroup.Rows.length).to.equal(1);
						Expect(tmpGroup.Rows[0].Inputs).to.be.an('array');
						Expect(tmpGroup.Rows[0].Inputs.length).to.equal(0);

						tmpView.addRow(0, 0);
						Expect(tmpGroup.Rows.length).to.equal(2);
					}
				);
				test
				(
					'Should remove a row from a group',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveRow',
						{
							ViewIdentifier: 'TestRemoveRow',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpGroup.Rows.length).to.equal(3);

						tmpView.removeRow(0, 0, 1);
						Expect(tmpGroup.Rows.length).to.equal(2);
					}
				);
				test
				(
					'Should move rows up and down',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestMoveRow',
						{
							ViewIdentifier: 'TestMoveRow',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];

						// Tag each row so we can track reordering
						tmpGroup.Rows[0]._tag = 'A';
						tmpGroup.Rows[1]._tag = 'B';
						tmpGroup.Rows[2]._tag = 'C';

						tmpView.moveRowUp(0, 0, 2);
						Expect(tmpGroup.Rows[1]._tag).to.equal('C');
						Expect(tmpGroup.Rows[2]._tag).to.equal('B');

						tmpView.moveRowDown(0, 0, 0);
						Expect(tmpGroup.Rows[0]._tag).to.equal('C');
						Expect(tmpGroup.Rows[1]._tag).to.equal('A');
					}
				);
			}
		);
		suite
		(
			'Input Operations',
			function ()
			{
				test
				(
					'Should add an input to a row and create a Descriptor',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestAddInput',
						{
							ViewIdentifier: 'TestAddInput',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpRow = tmpManifest.Sections[0].Groups[0].Rows[0];
						Expect(tmpRow.Inputs.length).to.equal(0);

						tmpView.addInput(0, 0, 0);
						Expect(tmpRow.Inputs.length).to.equal(1);

						// Inputs are now address strings referencing Descriptors
						let tmpAddress1 = tmpRow.Inputs[0];
						Expect(typeof tmpAddress1).to.equal('string');
						Expect(tmpManifest.Descriptors).to.have.property(tmpAddress1);

						let tmpDescriptor1 = tmpManifest.Descriptors[tmpAddress1];
						Expect(tmpDescriptor1.DataType).to.equal('String');
						Expect(tmpDescriptor1.Name).to.be.a('string');
						Expect(tmpDescriptor1.Hash).to.be.a('string');
						Expect(tmpDescriptor1.PictForm).to.be.an('object');
						Expect(tmpDescriptor1.PictForm.Section).to.equal('S1');
						Expect(tmpDescriptor1.PictForm.Group).to.equal('S1_G1');
						Expect(tmpDescriptor1.PictForm.Row).to.equal(1);

						tmpView.addInput(0, 0, 0);
						Expect(tmpRow.Inputs.length).to.equal(2);
						let tmpAddress2 = tmpRow.Inputs[1];
						Expect(tmpManifest.Descriptors).to.have.property(tmpAddress2);
						Expect(tmpAddress1).to.not.equal(tmpAddress2);
					}
				);
				test
				(
					'Should remove an input and its Descriptor',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveInput',
						{
							ViewIdentifier: 'TestRemoveInput',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addInput(0, 0, 0);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpRow = tmpManifest.Sections[0].Groups[0].Rows[0];
						Expect(tmpRow.Inputs.length).to.equal(3);

						let tmpAddress1 = tmpRow.Inputs[0];
						let tmpAddress2 = tmpRow.Inputs[1];
						let tmpAddress3 = tmpRow.Inputs[2];

						// Remove the middle input
						tmpView.removeInput(0, 0, 0, 1);
						Expect(tmpRow.Inputs.length).to.equal(2);
						Expect(tmpRow.Inputs[0]).to.equal(tmpAddress1);
						Expect(tmpRow.Inputs[1]).to.equal(tmpAddress3);

						// The removed Descriptor should be gone
						Expect(tmpManifest.Descriptors).to.not.have.property(tmpAddress2);
						// The remaining Descriptors should still exist
						Expect(tmpManifest.Descriptors).to.have.property(tmpAddress1);
						Expect(tmpManifest.Descriptors).to.have.property(tmpAddress3);
					}
				);
				test
				(
					'Should remove Descriptors when removing a row',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveRowDescriptors',
						{
							ViewIdentifier: 'TestRemoveRowDescriptors',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addInput(0, 0, 1);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpGroup = tmpManifest.Sections[0].Groups[0];
						let tmpRow1Address1 = tmpGroup.Rows[0].Inputs[0];
						let tmpRow1Address2 = tmpGroup.Rows[0].Inputs[1];
						let tmpRow2Address1 = tmpGroup.Rows[1].Inputs[0];

						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(3);

						// Remove row 0 — its two descriptors should be deleted
						tmpView.removeRow(0, 0, 0);
						Expect(tmpManifest.Descriptors).to.not.have.property(tmpRow1Address1);
						Expect(tmpManifest.Descriptors).to.not.have.property(tmpRow1Address2);
						Expect(tmpManifest.Descriptors).to.have.property(tmpRow2Address1);
						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(1);

						// Row 2 is now Row 1; its Descriptor PictForm.Row should be updated
						Expect(tmpManifest.Descriptors[tmpRow2Address1].PictForm.Row).to.equal(1);
					}
				);
				test
				(
					'Should remove Descriptors when removing a group',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveGroupDescriptors',
						{
							ViewIdentifier: 'TestRemoveGroupDescriptors',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addGroup(0);
						tmpView.addRow(0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addRow(0, 1);
						tmpView.addInput(0, 1, 0);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpGroup0Address = tmpManifest.Sections[0].Groups[0].Rows[0].Inputs[0];
						let tmpGroup1Address = tmpManifest.Sections[0].Groups[1].Rows[0].Inputs[0];

						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(2);

						// Remove group 0
						tmpView.removeGroup(0, 0);
						Expect(tmpManifest.Descriptors).to.not.have.property(tmpGroup0Address);
						Expect(tmpManifest.Descriptors).to.have.property(tmpGroup1Address);
						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(1);
					}
				);
				test
				(
					'Should remove Descriptors when removing a section',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRemoveSectionDescriptors',
						{
							ViewIdentifier: 'TestRemoveSectionDescriptors',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addRow(1, 0);
						tmpView.addInput(1, 0, 0);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpSection0Address = tmpManifest.Sections[0].Groups[0].Rows[0].Inputs[0];
						let tmpSection1Address = tmpManifest.Sections[1].Groups[0].Rows[0].Inputs[0];

						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(2);

						// Remove section 0
						tmpView.removeSection(0);
						Expect(tmpManifest.Descriptors).to.not.have.property(tmpSection0Address);
						Expect(tmpManifest.Descriptors).to.have.property(tmpSection1Address);
						Expect(Object.keys(tmpManifest.Descriptors).length).to.equal(1);
					}
				);
				test
				(
					'Should sync PictForm.Row when rows are reordered',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestRowSync',
						{
							ViewIdentifier: 'TestRowSync',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.addSection();
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);
						tmpView.addRow(0, 0);
						tmpView.addInput(0, 0, 0);
						tmpView.addInput(0, 0, 1);
						tmpView.addInput(0, 0, 2);

						let tmpManifest = tmpPict.AppData.FormConfig;
						let tmpGroup = tmpManifest.Sections[0].Groups[0];
						let tmpAddr0 = tmpGroup.Rows[0].Inputs[0];
						let tmpAddr1 = tmpGroup.Rows[1].Inputs[0];
						let tmpAddr2 = tmpGroup.Rows[2].Inputs[0];

						// Verify initial row assignments
						Expect(tmpManifest.Descriptors[tmpAddr0].PictForm.Row).to.equal(1);
						Expect(tmpManifest.Descriptors[tmpAddr1].PictForm.Row).to.equal(2);
						Expect(tmpManifest.Descriptors[tmpAddr2].PictForm.Row).to.equal(3);

						// Move row 2 up — swaps row 1 and row 2
						tmpView.moveRowUp(0, 0, 2);
						Expect(tmpManifest.Descriptors[tmpAddr0].PictForm.Row).to.equal(1);
						Expect(tmpManifest.Descriptors[tmpAddr2].PictForm.Row).to.equal(2);
						Expect(tmpManifest.Descriptors[tmpAddr1].PictForm.Row).to.equal(3);

						// Move row 0 down — swaps row 0 and row 1 (which is now addr2)
						tmpView.moveRowDown(0, 0, 0);
						Expect(tmpManifest.Descriptors[tmpAddr2].PictForm.Row).to.equal(1);
						Expect(tmpManifest.Descriptors[tmpAddr0].PictForm.Row).to.equal(2);
						Expect(tmpManifest.Descriptors[tmpAddr1].PictForm.Row).to.equal(3);
					}
				);
				test
				(
					'Should expose the full list of Manyfest DataTypes',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDataTypes',
						{
							ViewIdentifier: 'TestDataTypes',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._ManyfestDataTypes).to.be.an('array');
						Expect(tmpView._ManyfestDataTypes).to.include('String');
						Expect(tmpView._ManyfestDataTypes).to.include('Number');
						Expect(tmpView._ManyfestDataTypes).to.include('Float');
						Expect(tmpView._ManyfestDataTypes).to.include('Integer');
						Expect(tmpView._ManyfestDataTypes).to.include('PreciseNumber');
						Expect(tmpView._ManyfestDataTypes).to.include('Boolean');
						Expect(tmpView._ManyfestDataTypes).to.include('Binary');
						Expect(tmpView._ManyfestDataTypes).to.include('DateTime');
						Expect(tmpView._ManyfestDataTypes).to.include('Array');
						Expect(tmpView._ManyfestDataTypes).to.include('Object');
						Expect(tmpView._ManyfestDataTypes).to.include('Null');
						Expect(tmpView._ManyfestDataTypes.length).to.equal(11);
					}
				);
				test
				(
					'Should expose InputType definitions as rich objects with Hash, Name, Description, Category',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestInputTypes',
						{
							ViewIdentifier: 'TestInputTypes',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._InputTypeDefinitions).to.be.an('array');
						Expect(tmpView._InputTypeDefinitions.length).to.equal(16);

						// Check that each entry is a rich object
						for (let i = 0; i < tmpView._InputTypeDefinitions.length; i++)
						{
							let tmpDef = tmpView._InputTypeDefinitions[i];
							Expect(tmpDef).to.be.an('object');
							Expect(tmpDef.Hash).to.be.a('string');
							Expect(tmpDef.Name).to.be.a('string');
							Expect(tmpDef.Description).to.be.a('string');
							Expect(tmpDef.Category).to.be.a('string');
						}

						// Verify all 16 built-in InputTypes are present by Hash
						let tmpHashes = tmpView._InputTypeDefinitions.map(function(d) { return d.Hash; });
						Expect(tmpHashes).to.include('TextArea');
						Expect(tmpHashes).to.include('Option');
						Expect(tmpHashes).to.include('Boolean');
						Expect(tmpHashes).to.include('Hidden');
						Expect(tmpHashes).to.include('Color');
						Expect(tmpHashes).to.include('DisplayOnly');
						Expect(tmpHashes).to.include('ReadOnly');
						Expect(tmpHashes).to.include('Link');
						Expect(tmpHashes).to.include('Chart');
						Expect(tmpHashes).to.include('Markdown');
						Expect(tmpHashes).to.include('HTML');
						Expect(tmpHashes).to.include('PreciseNumberReadOnly');
						Expect(tmpHashes).to.include('Templated');
						Expect(tmpHashes).to.include('TemplatedEntityLookup');
						Expect(tmpHashes).to.include('TabGroupSelector');
						Expect(tmpHashes).to.include('TabSectionSelector');
					}
				);
				test
				(
					'Should allow embedders to add custom InputType definitions via options',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestCustomInputTypes',
						{
							ViewIdentifier: 'TestCustomInputTypes',
							ManifestDataAddress: 'AppData.FormConfig',
							InputTypeDefinitions:
							[
								{ Hash: 'CustomWidget', Name: 'Custom Widget', Description: 'A custom widget type', Category: 'Custom' },
								{ Hash: 'CustomChart', Name: 'Custom Chart', Description: 'An extended chart type', Category: 'Custom' }
							]
						}, libPictSectionFormEditor);

						Expect(tmpView._InputTypeDefinitions).to.be.an('array');
						// 16 defaults + 2 custom = 18
						Expect(tmpView._InputTypeDefinitions.length).to.equal(18);

						let tmpHashes = tmpView._InputTypeDefinitions.map(function(d) { return d.Hash; });
						Expect(tmpHashes).to.include('CustomWidget');
						Expect(tmpHashes).to.include('CustomChart');
						// Built-in types should still be there
						Expect(tmpHashes).to.include('TextArea');
						Expect(tmpHashes).to.include('Boolean');
					}
				);
				test
				(
					'Should allow embedders to override built-in InputType definitions',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestOverrideInputTypes',
						{
							ViewIdentifier: 'TestOverrideInputTypes',
							ManifestDataAddress: 'AppData.FormConfig',
							InputTypeDefinitions:
							[
								{ Hash: 'Boolean', Name: 'Yes/No Toggle', Description: 'Overridden boolean' }
							]
						}, libPictSectionFormEditor);

						// Count should stay at 16 since we overrode, not appended
						Expect(tmpView._InputTypeDefinitions.length).to.equal(16);

						// Find the Boolean entry and verify it was overridden
						let tmpBoolDef = null;
						for (let i = 0; i < tmpView._InputTypeDefinitions.length; i++)
						{
							if (tmpView._InputTypeDefinitions[i].Hash === 'Boolean')
							{
								tmpBoolDef = tmpView._InputTypeDefinitions[i];
								break;
							}
						}
						Expect(tmpBoolDef).to.not.be.null;
						Expect(tmpBoolDef.Name).to.equal('Yes/No Toggle');
						Expect(tmpBoolDef.Description).to.equal('Overridden boolean');
						// Category should be preserved from the default
						Expect(tmpBoolDef.Category).to.equal('Selection');
					}
				);
				test
				(
					'Should group InputType definitions by category',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestCategories',
						{
							ViewIdentifier: 'TestCategories',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						let tmpCategories = tmpView._getInputTypeCategories();
						Expect(tmpCategories).to.be.an('array');
						Expect(tmpCategories).to.include('Text & Content');
						Expect(tmpCategories).to.include('Selection');
						Expect(tmpCategories).to.include('Display');
						Expect(tmpCategories).to.include('Navigation');
						Expect(tmpCategories).to.include('Advanced');
					}
				);
				test
				(
					'Should filter InputType definitions by search query',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestFilter',
						{
							ViewIdentifier: 'TestFilter',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						// Search for "read" should find ReadOnly and PreciseNumberReadOnly
						let tmpFiltered = tmpView._filterInputTypeDefinitions('read');
						Expect(tmpFiltered).to.be.an('array');
						Expect(tmpFiltered.length).to.be.at.least(2);
						let tmpFilteredHashes = tmpFiltered.map(function(d) { return d.Hash; });
						Expect(tmpFilteredHashes).to.include('ReadOnly');
						Expect(tmpFilteredHashes).to.include('PreciseNumberReadOnly');

						// Empty query should return all definitions
						let tmpAll = tmpView._filterInputTypeDefinitions('');
						Expect(tmpAll.length).to.equal(16);

						// Non-matching query should return empty
						let tmpNone = tmpView._filterInputTypeDefinitions('zzzznonexistent');
						Expect(tmpNone.length).to.equal(0);
					}
				);
			}
		);
		suite
		(
			'Manifest Reconciliation',
			function ()
			{
				test
				(
					'Should build Rows and Inputs from Descriptors on an existing manifest',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestReconcile',
							Sections:
							[
								{
									Hash: 'Area',
									Name: 'Area Calculator',
									Groups:
									[
										{
											Hash: 'AreaDefault',
											Name: 'Default',
											Layout: 'Record'
										}
									]
								}
							],
							Descriptors:
							{
								'Name':
								{
									Name: 'Object Name',
									Hash: 'Name',
									DataType: 'String',
									PictForm: { Section: 'Area', Row: 1 }
								},
								'Width':
								{
									Name: 'Width',
									Hash: 'Width',
									DataType: 'Number',
									PictForm: { Section: 'Area', Row: 2 }
								},
								'Height':
								{
									Name: 'Height',
									Hash: 'Height',
									DataType: 'Number',
									PictForm: { Section: 'Area', Row: 2 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestReconcile',
						{
							ViewIdentifier: 'TestReconcile',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView._reconcileManifestStructure();

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpGroup.Rows).to.be.an('array');
						Expect(tmpGroup.Rows.length).to.equal(2);

						// Row 1 should have one input: 'Name'
						Expect(tmpGroup.Rows[0].Inputs).to.be.an('array');
						Expect(tmpGroup.Rows[0].Inputs.length).to.equal(1);
						Expect(tmpGroup.Rows[0].Inputs[0]).to.equal('Name');

						// Row 2 should have two inputs: 'Width' and 'Height'
						Expect(tmpGroup.Rows[1].Inputs).to.be.an('array');
						Expect(tmpGroup.Rows[1].Inputs.length).to.equal(2);
						Expect(tmpGroup.Rows[1].Inputs).to.include('Width');
						Expect(tmpGroup.Rows[1].Inputs).to.include('Height');
					}
				);
				test
				(
					'Should default to first group when PictForm.Group is omitted',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestDefaultGroup',
							Sections:
							[
								{
									Hash: 'Info',
									Name: 'Info Section',
									Groups:
									[
										{ Hash: 'Main', Name: 'Main', Layout: 'Record' },
										{ Hash: 'Extra', Name: 'Extra', Layout: 'Record' }
									]
								}
							],
							Descriptors:
							{
								'FirstName':
								{
									Name: 'First Name',
									Hash: 'FirstName',
									DataType: 'String',
									PictForm: { Section: 'Info', Row: 1 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestDefaultGroup',
						{
							ViewIdentifier: 'TestDefaultGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView._reconcileManifestStructure();

						// Should land in the first group (Main)
						let tmpMainGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpMainGroup.Rows).to.be.an('array');
						Expect(tmpMainGroup.Rows[0].Inputs).to.include('FirstName');
					}
				);
				test
				(
					'Should place inputs in the correct named group',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestNamedGroup',
							Sections:
							[
								{
									Hash: 'Area',
									Name: 'Area',
									Groups:
									[
										{ Hash: 'Default', Name: 'Default', Layout: 'Record' },
										{ Hash: 'Help', Name: 'Help', Layout: 'Record' }
									]
								}
							],
							Descriptors:
							{
								'Help.Content':
								{
									Name: 'Help Content',
									Hash: 'HelpContent',
									DataType: 'String',
									PictForm: { Section: 'Area', Group: 'Help', Row: 1 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestNamedGroup',
						{
							ViewIdentifier: 'TestNamedGroup',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView._reconcileManifestStructure();

						// Should be in the Help group, not Default
						let tmpDefaultGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						let tmpHelpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[1];
						Expect(tmpDefaultGroup.Rows).to.be.undefined;
						Expect(tmpHelpGroup.Rows).to.be.an('array');
						Expect(tmpHelpGroup.Rows[0].Inputs).to.include('Help.Content');
					}
				);
				test
				(
					'Should create a default group when section has no groups',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestNoGroups',
							Sections:
							[
								{
									Hash: 'SectionA',
									Name: 'Section A'
								}
							],
							Descriptors:
							{
								'SectionA.Amount':
								{
									Name: 'Amount in A',
									Hash: 'SectionAAmount',
									DataType: 'Number',
									PictForm: { Section: 'SectionA', Row: 1 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestNoGroups',
						{
							ViewIdentifier: 'TestNoGroups',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView._reconcileManifestStructure();

						let tmpSection = tmpPict.AppData.FormConfig.Sections[0];
						Expect(tmpSection.Groups).to.be.an('array');
						Expect(tmpSection.Groups.length).to.equal(1);
						Expect(tmpSection.Groups[0].Rows[0].Inputs).to.include('SectionA.Amount');
					}
				);
				test
				(
					'Should not duplicate inputs on repeated reconciliation calls',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestIdempotent',
							Sections:
							[
								{
									Hash: 'Sec',
									Name: 'Section',
									Groups:
									[
										{ Hash: 'Grp', Name: 'Group', Layout: 'Record' }
									]
								}
							],
							Descriptors:
							{
								'Field1':
								{
									Name: 'Field One',
									Hash: 'Field1',
									DataType: 'String',
									PictForm: { Section: 'Sec', Row: 1 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestIdempotent',
						{
							ViewIdentifier: 'TestIdempotent',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						// Call reconcile multiple times
						tmpView._reconcileManifestStructure();
						tmpView._reconcileManifestStructure();
						tmpView._reconcileManifestStructure();

						let tmpGroup = tmpPict.AppData.FormConfig.Sections[0].Groups[0];
						Expect(tmpGroup.Rows[0].Inputs.length).to.equal(1);
						Expect(tmpGroup.Rows[0].Inputs[0]).to.equal('Field1');
					}
				);
			}
		);
		suite
		(
			'Tab Management',
			function ()
			{
				test
				(
					'Should default to visual tab',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestTabDefault',
						{
							ViewIdentifier: 'TestTabDefault',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._ActiveTab).to.equal('visual');
					}
				);
				test
				(
					'Should switch tabs',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData = {};

						let tmpView = tmpPict.addView('TestTabSwitch',
						{
							ViewIdentifier: 'TestTabSwitch',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.initialize();

						tmpView.switchTab('objecteditor');
						Expect(tmpView._ActiveTab).to.equal('objecteditor');

						tmpView.switchTab('json');
						Expect(tmpView._ActiveTab).to.equal('json');

						tmpView.switchTab('visual');
						Expect(tmpView._ActiveTab).to.equal('visual');
					}
				);
			}
		);
		suite
		(
			'Utility Methods',
			function ()
			{
				test
				(
					'Should escape HTML correctly',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestEscape',
						{
							ViewIdentifier: 'TestEscape',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._escapeHTML('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
						Expect(tmpView._escapeHTML('')).to.equal('');
						Expect(tmpView._escapeHTML(null)).to.equal('');
						Expect(tmpView._escapeHTML(undefined)).to.equal('');
					}
				);
				test
				(
					'Should escape attributes correctly',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestEscapeAttr',
						{
							ViewIdentifier: 'TestEscapeAttr',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._escapeAttr('value with "quotes" and \'apostrophes\'')).to.equal('value with &quot;quotes&quot; and &#39;apostrophes&#39;');
					}
				);
			}
		);
		suite
		(
			'Iconography Provider',
			function ()
			{
				test
				(
					'Should expose the iconography provider on the view',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestIconProvider',
						{
							ViewIdentifier: 'TestIconProvider',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._IconographyProvider).to.be.an('object');
					}
				);
				test
				(
					'Should export the IconographyProvider class from the module',
					function ()
					{
						Expect(libPictSectionFormEditor.IconographyProvider).to.be.a('function');
					}
				);
				test
				(
					'Should register expected variants for each structural category',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSectionVariants = tmpProvider.getVariants('Section');
						var tmpGroupVariants = tmpProvider.getVariants('Group');
						var tmpRowVariants = tmpProvider.getVariants('Row');
						var tmpInputVariants = tmpProvider.getVariants('Input');

						Expect(tmpSectionVariants.length).to.equal(11);
						Expect(tmpGroupVariants.length).to.equal(11);
						Expect(tmpRowVariants.length).to.equal(11);
						Expect(tmpInputVariants.length).to.equal(10);
					}
				);
				test
				(
					'Should return SVG strings for all structural icon variants',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCategories = ['Section', 'Group', 'Row', 'Input'];
						for (var c = 0; c < tmpCategories.length; c++)
						{
							var tmpVariants = tmpProvider.getVariants(tmpCategories[c]);
							for (var v = 0; v < tmpVariants.length; v++)
							{
								var tmpSVG = tmpProvider.getIcon(tmpCategories[c], tmpVariants[v]);
								Expect(tmpSVG).to.be.a('string');
								Expect(tmpSVG.indexOf('<svg')).to.equal(0);
								Expect(tmpSVG.indexOf('</svg>')).to.be.above(0);
							}
						}
					}
				);
				test
				(
					'Should return SVG strings at custom sizes',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG16 = tmpProvider.getIcon('Section', 'Default', 16);
						var tmpSVG32 = tmpProvider.getIcon('Section', 'Default', 32);

						Expect(tmpSVG16).to.contain('width="16"');
						Expect(tmpSVG16).to.contain('height="16"');
						Expect(tmpSVG32).to.contain('width="32"');
						Expect(tmpSVG32).to.contain('height="32"');
					}
				);
				test
				(
					'Should fall back to Default variant for unknown variant names',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG = tmpProvider.getIcon('Section', 'NonExistentVariant');
						var tmpDefault = tmpProvider.getIcon('Section', 'Default');
						Expect(tmpSVG).to.equal(tmpDefault);
					}
				);
				test
				(
					'Should return empty string for unknown category',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG = tmpProvider.getIcon('NonExistent', 'Default');
						Expect(tmpSVG).to.equal('');
					}
				);
				test
				(
					'Should register InputType icons for all built-in types',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpHashes = tmpProvider.getInputTypeIconHashes();
						Expect(tmpHashes).to.be.an('array');
						Expect(tmpHashes.length).to.be.at.least(16);

						// Check a sampling of known InputType icons
						Expect(tmpProvider.hasInputTypeIcon('TextArea')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('Boolean')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('DisplayOnly')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('Hidden')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('Chart')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('Link')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('Templated')).to.be.true;
					}
				);
				test
				(
					'Should return SVG strings for InputType icons',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG = tmpProvider.getInputTypeIcon('TextArea');
						Expect(tmpSVG).to.be.a('string');
						Expect(tmpSVG.indexOf('<svg')).to.equal(0);

						var tmpSVG2 = tmpProvider.getInputTypeIcon('Boolean', 24);
						Expect(tmpSVG2).to.contain('width="24"');
					}
				);
				test
				(
					'Should return empty string for unknown InputType icon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG = tmpProvider.getInputTypeIcon('CompletelyFakeType');
						Expect(tmpSVG).to.equal('');
					}
				);
				test
				(
					'Should allow overriding structural icons via setIcon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCustomFactory = function(pSize, pColors, pSW)
						{
							return '<svg class="custom" width="' + pSize + '"></svg>';
						};

						tmpProvider.setIcon('Section', 'Default', tmpCustomFactory);
						var tmpSVG = tmpProvider.getIcon('Section', 'Default');
						Expect(tmpSVG).to.contain('class="custom"');
					}
				);
				test
				(
					'Should allow adding new structural icon variants via setIcon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCustomFactory = function(pSize, pColors, pSW)
						{
							return '<svg class="brand-new" width="' + pSize + '"></svg>';
						};

						tmpProvider.setIcon('Section', 'MyBrandNew', tmpCustomFactory);
						Expect(tmpProvider.hasIcon('Section', 'MyBrandNew')).to.be.true;
						var tmpSVG = tmpProvider.getIcon('Section', 'MyBrandNew');
						Expect(tmpSVG).to.contain('class="brand-new"');
					}
				);
				test
				(
					'Should allow overriding InputType icons via setInputTypeIcon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCustomFactory = function(pSize, pColors, pSW)
						{
							return '<svg class="custom-boolean" width="' + pSize + '"></svg>';
						};

						tmpProvider.setInputTypeIcon('Boolean', tmpCustomFactory);
						var tmpSVG = tmpProvider.getInputTypeIcon('Boolean');
						Expect(tmpSVG).to.contain('class="custom-boolean"');
					}
				);
				test
				(
					'Should allow adding new InputType icons via setInputTypeIcon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCustomFactory = function(pSize, pColors, pSW)
						{
							return '<svg class="custom-widget" width="' + pSize + '"></svg>';
						};

						tmpProvider.setInputTypeIcon('CustomWidget', tmpCustomFactory);
						Expect(tmpProvider.hasInputTypeIcon('CustomWidget')).to.be.true;
						var tmpSVG = tmpProvider.getInputTypeIcon('CustomWidget');
						Expect(tmpSVG).to.contain('class="custom-widget"');
					}
				);
				test
				(
					'Should accept icon overrides via constructor options',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography(
						{
							IconOverrides:
							{
								Section:
								{
									Default: function(pSize, pColors, pSW) { return '<svg class="opts-override" width="' + pSize + '"></svg>'; }
								}
							},
							InputTypeIconOverrides:
							{
								TextArea: function(pSize, pColors, pSW) { return '<svg class="opts-textarea" width="' + pSize + '"></svg>'; }
							}
						});

						var tmpSVG = tmpProvider.getIcon('Section', 'Default');
						Expect(tmpSVG).to.contain('class="opts-override"');

						var tmpSVG2 = tmpProvider.getInputTypeIcon('TextArea');
						Expect(tmpSVG2).to.contain('class="opts-textarea"');
					}
				);
				test
				(
					'Should support custom color tokens',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography(
						{
							Colors:
							{
								Primary: '#FF0000',
								Accent: '#00FF00',
								Muted: '#0000FF',
								Fill: '#FFFFFF'
							}
						});

						var tmpSVG = tmpProvider.getIcon('Section', 'Default');
						Expect(tmpSVG).to.contain('#FF0000');
						Expect(tmpSVG).to.contain('#FFFFFF');
					}
				);
				test
				(
					'Should have hasIcon and hasInputTypeIcon return correct booleans',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						Expect(tmpProvider.hasIcon('Section', 'Default')).to.be.true;
						Expect(tmpProvider.hasIcon('Section', 'Layers')).to.be.true;
						Expect(tmpProvider.hasIcon('Section', 'NonExistent')).to.be.false;
						Expect(tmpProvider.hasIcon('FakeCategory', 'Default')).to.be.false;

						Expect(tmpProvider.hasInputTypeIcon('TextArea')).to.be.true;
						Expect(tmpProvider.hasInputTypeIcon('FakeHash')).to.be.false;
					}
				);
				test
				(
					'Should make the iconography provider accessible on the FormEditor view with custom options',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestIconProviderOpts',
						{
							ViewIdentifier: 'TestIconProviderOpts',
							ManifestDataAddress: 'AppData.FormConfig',
							Iconography:
							{
								Colors:
								{
									Primary: '#112233',
									Accent: '#445566',
									Muted: '#778899',
									Fill: '#AABBCC'
								}
							}
						}, libPictSectionFormEditor);

						var tmpSVG = tmpView._IconographyProvider.getIcon('Section', 'Default');
						Expect(tmpSVG).to.contain('#112233');
						Expect(tmpSVG).to.contain('#AABBCC');
					}
				);
				test
				(
					'Should have a DragHandle icon in the Action category',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpActionVariants = tmpProvider.getVariants('Action');
						Expect(tmpActionVariants).to.be.an('array');
						Expect(tmpActionVariants.length).to.equal(2);
						Expect(tmpActionVariants).to.include('Add');
						Expect(tmpActionVariants).to.include('DragHandle');

						var tmpSVG = tmpProvider.getIcon('Action', 'DragHandle');
						Expect(tmpSVG).to.be.a('string');
						Expect(tmpSVG.indexOf('<svg')).to.equal(0);
						Expect(tmpSVG).to.contain('currentColor');
					}
				);
				test
				(
					'Should have drag-and-drop disabled by default',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDragDropDefault',
						{
							ViewIdentifier: 'TestDragDropDefault',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._DragAndDropEnabled).to.equal(false);
						Expect(tmpView._DragState).to.equal(null);
					}
				);
				test
				(
					'Should enable and disable drag-and-drop via setDragAndDropEnabled',
					function (fDone)
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestDragDrop',
							Sections: [],
							Descriptors: {}
						};

						let tmpView = tmpPict.addView('TestDragDropToggle',
						{
							ViewIdentifier: 'TestDragDropToggle',
							ManifestDataAddress: 'AppData.FormConfig',
							DefaultDestinationAddress: '#FormEditor-Container',
							Renderables:
							[
								{
									RenderableHash: 'FormEditor-Container',
									TemplateHash: 'FormEditor-Container-Template',
									DestinationAddress: '#FormEditor-Container',
									RenderMethod: 'replace'
								}
							]
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.render();

						Expect(tmpView._DragAndDropEnabled).to.equal(false);

						tmpView.setDragAndDropEnabled(true);
						Expect(tmpView._DragAndDropEnabled).to.equal(true);

						tmpView.setDragAndDropEnabled(false);
						Expect(tmpView._DragAndDropEnabled).to.equal(false);

						fDone();
					}
				);
				test
				(
					'Should build drag attributes only when enabled',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDragAttrs',
						{
							ViewIdentifier: 'TestDragAttrs',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						// Disabled — should return empty string
						var tmpAttrs = tmpView._buildDragAttributes('section', [0]);
						Expect(tmpAttrs).to.equal('');

						var tmpHandle = tmpView._buildDragHandleHTML(12);
						Expect(tmpHandle).to.equal('');

						// Enabled — should return drag attribute string
						tmpView._DragAndDropEnabled = true;
						tmpAttrs = tmpView._buildDragAttributes('section', [0]);
						Expect(tmpAttrs).to.contain('draggable="true"');
						Expect(tmpAttrs).to.contain('ondragstart');
						Expect(tmpAttrs).to.contain('ondrop');

						tmpHandle = tmpView._buildDragHandleHTML(12);
						Expect(tmpHandle).to.contain('pict-fe-drag-handle');
						Expect(tmpHandle).to.contain('<svg');
					}
				);
				test
				(
					'Should correctly determine if drag indices share a parent',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDragParent',
						{
							ViewIdentifier: 'TestDragParent',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						// Sections (1 index) — always share root
						Expect(tmpView._dragIndicesShareParent([0], [1])).to.equal(true);
						Expect(tmpView._dragIndicesShareParent([0], [2])).to.equal(true);

						// Groups (2 indices) — must share section
						Expect(tmpView._dragIndicesShareParent([0, 1], [0, 2])).to.equal(true);
						Expect(tmpView._dragIndicesShareParent([0, 1], [1, 2])).to.equal(false);

						// Rows (3 indices) — must share section + group
						Expect(tmpView._dragIndicesShareParent([0, 0, 1], [0, 0, 3])).to.equal(true);
						Expect(tmpView._dragIndicesShareParent([0, 0, 1], [0, 1, 3])).to.equal(false);

						// Inputs (4 indices) — must share section + group + row
						Expect(tmpView._dragIndicesShareParent([0, 0, 0, 1], [0, 0, 0, 3])).to.equal(true);
						Expect(tmpView._dragIndicesShareParent([0, 0, 0, 1], [0, 0, 1, 3])).to.equal(false);

						// Mismatched lengths
						Expect(tmpView._dragIndicesShareParent([0], [0, 1])).to.equal(false);
					}
				);
				test
				(
					'Should support cross-container drag and drop for groups',
					function (fDone)
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'CrossDragGroup',
							Sections:
							[
								{
									Name: 'Section A', Hash: 'SectionA',
									Groups:
									[
										{ Name: 'Group A1', Hash: 'GroupA1', Rows: [] },
										{ Name: 'Group A2', Hash: 'GroupA2', Rows: [] }
									]
								},
								{
									Name: 'Section B', Hash: 'SectionB',
									Groups:
									[
										{ Name: 'Group B1', Hash: 'GroupB1', Rows: [] }
									]
								}
							],
							Descriptors: {}
						};

						let tmpView = tmpPict.addView('TestCrossDragGroup',
						{
							ViewIdentifier: 'TestCrossDragGroup',
							ManifestDataAddress: 'AppData.FormConfig',
							DefaultDestinationAddress: '#FormEditor-Container',
							Renderables:
							[
								{
									RenderableHash: 'FormEditor-Container',
									TemplateHash: 'FormEditor-Container-Template',
									DestinationAddress: '#FormEditor-Container',
									RenderMethod: 'replace'
								}
							]
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.render();
						tmpView._DragAndDropEnabled = true;

						// Move Group A2 from Section A to Section B (drop on Group B1)
						tmpView._DragState = { Type: 'group', Indices: [0, 1] };
						tmpView.onDrop(
							{ preventDefault: function() {} },
							'group', 1, 0
						);

						var tmpManifest = tmpPict.AppData.FormConfig;
						// Section A should now have 1 group
						Expect(tmpManifest.Sections[0].Groups.length).to.equal(1);
						Expect(tmpManifest.Sections[0].Groups[0].Hash).to.equal('GroupA1');
						// Section B should now have 2 groups (GroupA2 inserted before GroupB1)
						Expect(tmpManifest.Sections[1].Groups.length).to.equal(2);
						Expect(tmpManifest.Sections[1].Groups[0].Hash).to.equal('GroupA2');
						Expect(tmpManifest.Sections[1].Groups[1].Hash).to.equal('GroupB1');

						fDone();
					}
				);
				test
				(
					'Should support cross-container drag and drop for rows',
					function (fDone)
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'CrossDragRow',
							Sections:
							[
								{
									Name: 'Section A', Hash: 'SectionA',
									Groups:
									[
										{
											Name: 'Group A1', Hash: 'GroupA1',
											Rows:
											[
												{ Inputs: ['addrA'] },
												{ Inputs: ['addrB'] }
											]
										},
										{
											Name: 'Group A2', Hash: 'GroupA2',
											Rows:
											[
												{ Inputs: ['addrC'] }
											]
										}
									]
								}
							],
							Descriptors:
							{
								addrA: { Name: 'InputA', Hash: 'InputA', DataType: 'String', PictForm: { Section: 'SectionA', Group: 'GroupA1', Row: 1 } },
								addrB: { Name: 'InputB', Hash: 'InputB', DataType: 'String', PictForm: { Section: 'SectionA', Group: 'GroupA1', Row: 2 } },
								addrC: { Name: 'InputC', Hash: 'InputC', DataType: 'String', PictForm: { Section: 'SectionA', Group: 'GroupA2', Row: 1 } }
							}
						};

						let tmpView = tmpPict.addView('TestCrossDragRow',
						{
							ViewIdentifier: 'TestCrossDragRow',
							ManifestDataAddress: 'AppData.FormConfig',
							DefaultDestinationAddress: '#FormEditor-Container',
							Renderables:
							[
								{
									RenderableHash: 'FormEditor-Container',
									TemplateHash: 'FormEditor-Container-Template',
									DestinationAddress: '#FormEditor-Container',
									RenderMethod: 'replace'
								}
							]
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.render();
						tmpView._DragAndDropEnabled = true;

						// Move Row 2 from Group A1 to Group A2 (drop on Row 1 of Group A2)
						tmpView._DragState = { Type: 'row', Indices: [0, 0, 1] };
						tmpView.onDrop(
							{ preventDefault: function() {} },
							'row', 0, 1, 0
						);

						var tmpManifest = tmpPict.AppData.FormConfig;
						// Group A1 should have 1 row
						Expect(tmpManifest.Sections[0].Groups[0].Rows.length).to.equal(1);
						Expect(tmpManifest.Sections[0].Groups[0].Rows[0].Inputs[0]).to.equal('addrA');
						// Group A2 should have 2 rows (addrB row inserted before addrC row)
						Expect(tmpManifest.Sections[0].Groups[1].Rows.length).to.equal(2);
						Expect(tmpManifest.Sections[0].Groups[1].Rows[0].Inputs[0]).to.equal('addrB');
						Expect(tmpManifest.Sections[0].Groups[1].Rows[1].Inputs[0]).to.equal('addrC');

						fDone();
					}
				);
				test
				(
					'Should support cross-container drag and drop for inputs and update PictForm metadata',
					function (fDone)
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'CrossDragInput',
							Sections:
							[
								{
									Name: 'Section A', Hash: 'SectionA',
									Groups:
									[
										{
											Name: 'Group A1', Hash: 'GroupA1',
											Rows:
											[
												{ Inputs: ['addrX', 'addrY'] }
											]
										}
									]
								},
								{
									Name: 'Section B', Hash: 'SectionB',
									Groups:
									[
										{
											Name: 'Group B1', Hash: 'GroupB1',
											Rows:
											[
												{ Inputs: ['addrZ'] }
											]
										}
									]
								}
							],
							Descriptors:
							{
								addrX: { Name: 'InputX', Hash: 'InputX', DataType: 'String', PictForm: { Section: 'SectionA', Group: 'GroupA1', Row: 1 } },
								addrY: { Name: 'InputY', Hash: 'InputY', DataType: 'String', PictForm: { Section: 'SectionA', Group: 'GroupA1', Row: 1 } },
								addrZ: { Name: 'InputZ', Hash: 'InputZ', DataType: 'String', PictForm: { Section: 'SectionB', Group: 'GroupB1', Row: 1 } }
							}
						};

						let tmpView = tmpPict.addView('TestCrossDragInput',
						{
							ViewIdentifier: 'TestCrossDragInput',
							ManifestDataAddress: 'AppData.FormConfig',
							DefaultDestinationAddress: '#FormEditor-Container',
							Renderables:
							[
								{
									RenderableHash: 'FormEditor-Container',
									TemplateHash: 'FormEditor-Container-Template',
									DestinationAddress: '#FormEditor-Container',
									RenderMethod: 'replace'
								}
							]
						}, libPictSectionFormEditor);

						tmpView.initialize();
						tmpView.render();
						tmpView._DragAndDropEnabled = true;

						// Move addrY from Section A / Group A1 / Row 0 to Section B / Group B1 / Row 0 (drop on addrZ position)
						tmpView._DragState = { Type: 'input', Indices: [0, 0, 0, 1] };
						tmpView.onDrop(
							{ preventDefault: function() {} },
							'input', 1, 0, 0, 0
						);

						var tmpManifest = tmpPict.AppData.FormConfig;
						// Source row should have 1 input
						Expect(tmpManifest.Sections[0].Groups[0].Rows[0].Inputs.length).to.equal(1);
						Expect(tmpManifest.Sections[0].Groups[0].Rows[0].Inputs[0]).to.equal('addrX');
						// Target row should have 2 inputs (addrY inserted before addrZ)
						Expect(tmpManifest.Sections[1].Groups[0].Rows[0].Inputs.length).to.equal(2);
						Expect(tmpManifest.Sections[1].Groups[0].Rows[0].Inputs[0]).to.equal('addrY');
						Expect(tmpManifest.Sections[1].Groups[0].Rows[0].Inputs[1]).to.equal('addrZ');

						// Verify PictForm metadata was updated
						Expect(tmpManifest.Descriptors.addrY.PictForm.Section).to.equal('SectionB');
						Expect(tmpManifest.Descriptors.addrY.PictForm.Group).to.equal('GroupB1');
						Expect(tmpManifest.Descriptors.addrY.PictForm.Row).to.equal(1);

						fDone();
					}
				);
			}
		);
		suite
		(
			'DataType Icons',
			function ()
			{
				test
				(
					'Should register DataType icons for all 11 Manyfest DataTypes',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpExpectedTypes = ['String', 'Number', 'Float', 'Integer', 'PreciseNumber', 'Boolean', 'Binary', 'DateTime', 'Array', 'Object', 'Null'];
						var tmpHashes = tmpProvider.getDataTypeIconHashes();

						Expect(tmpHashes).to.be.an('array');
						Expect(tmpHashes.length).to.equal(11);

						for (var i = 0; i < tmpExpectedTypes.length; i++)
						{
							Expect(tmpProvider.hasDataTypeIcon(tmpExpectedTypes[i])).to.be.true;
						}
					}
				);
				test
				(
					'Should return SVG strings for all DataType icons',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpHashes = tmpProvider.getDataTypeIconHashes();
						for (var i = 0; i < tmpHashes.length; i++)
						{
							var tmpSVG = tmpProvider.getDataTypeIcon(tmpHashes[i]);
							Expect(tmpSVG).to.be.a('string');
							Expect(tmpSVG.indexOf('<svg')).to.equal(0);
							Expect(tmpSVG.indexOf('</svg>')).to.be.above(0);
						}
					}
				);
				test
				(
					'Should return SVG strings at custom sizes',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG12 = tmpProvider.getDataTypeIcon('String', 12);
						var tmpSVG32 = tmpProvider.getDataTypeIcon('String', 32);

						Expect(tmpSVG12).to.contain('width="12"');
						Expect(tmpSVG32).to.contain('width="32"');
					}
				);
				test
				(
					'Should return empty string for unknown DataType',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpSVG = tmpProvider.getDataTypeIcon('CompletelyFakeType');
						Expect(tmpSVG).to.equal('');
					}
				);
				test
				(
					'Should allow overriding DataType icons via setDataTypeIcon',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						var tmpCustomFactory = function(pSize, pColors, pSW)
						{
							return '<svg class="custom-datatype" width="' + pSize + '"></svg>';
						};

						tmpProvider.setDataTypeIcon('String', tmpCustomFactory);
						var tmpSVG = tmpProvider.getDataTypeIcon('String');
						Expect(tmpSVG).to.contain('class="custom-datatype"');
					}
				);
				test
				(
					'hasDataTypeIcon should return correct booleans',
					function ()
					{
						var libIconography = libPictSectionFormEditor.IconographyProvider;
						var tmpProvider = new libIconography();

						Expect(tmpProvider.hasDataTypeIcon('String')).to.be.true;
						Expect(tmpProvider.hasDataTypeIcon('Boolean')).to.be.true;
						Expect(tmpProvider.hasDataTypeIcon('FakeType')).to.be.false;
					}
				);
			}
		);
		suite
		(
			'Input Selection and Display Mode',
			function ()
			{
				test
				(
					'Should have default input display mode of name',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDisplayMode',
						{
							ViewIdentifier: 'TestDisplayMode',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._InputDisplayMode).to.equal('name');
					}
				);
				test
				(
					'Should toggle input display mode via setInputDisplayMode',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestDisplayToggle',
							Sections: [],
							Descriptors: {}
						};

						let tmpView = tmpPict.addView('TestDisplayToggle',
						{
							ViewIdentifier: 'TestDisplayToggle',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._InputDisplayMode).to.equal('name');

						tmpView.setInputDisplayMode('hash');
						Expect(tmpView._InputDisplayMode).to.equal('hash');

						tmpView.setInputDisplayMode('name');
						Expect(tmpView._InputDisplayMode).to.equal('name');
					}
				);
				test
				(
					'Should ignore invalid display mode values',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestDisplayModeInvalid',
						{
							ViewIdentifier: 'TestDisplayModeInvalid',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.setInputDisplayMode('invalid');
						Expect(tmpView._InputDisplayMode).to.equal('name');
					}
				);
				test
				(
					'Should have null selected input by default',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestSelection',
						{
							ViewIdentifier: 'TestSelection',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._SelectedInputIndices).to.equal(null);
					}
				);
				test
				(
					'Should track selected input indices via selectInput',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestSelect',
							Sections:
							[
								{
									Hash: 'S1',
									Name: 'Section 1',
									Groups:
									[
										{
											Hash: 'G1',
											Name: 'Group 1',
											Layout: 'Record',
											Rows:
											[
												{ Inputs: ['addr1'] }
											]
										}
									]
								}
							],
							Descriptors:
							{
								addr1:
								{
									Name: 'Input 1',
									Hash: 'Input1',
									DataType: 'String',
									PictForm: { Section: 'S1', Group: 'G1', Row: 1 }
								}
							}
						};

						let tmpView = tmpPict.addView('TestSelectInput',
						{
							ViewIdentifier: 'TestSelectInput',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView.selectInput(0, 0, 0, 0);
						Expect(tmpView._SelectedInputIndices).to.be.an('array');
						Expect(tmpView._SelectedInputIndices).to.deep.equal([0, 0, 0, 0]);
					}
				);
				test
				(
					'Should clear selection via deselectInput',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						tmpPict.AppData.FormConfig =
						{
							Scope: 'TestDeselect',
							Sections: [],
							Descriptors: {}
						};

						let tmpView = tmpPict.addView('TestDeselectInput',
						{
							ViewIdentifier: 'TestDeselectInput',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						tmpView._SelectedInputIndices = [0, 0, 0, 0];
						tmpView.deselectInput();
						Expect(tmpView._SelectedInputIndices).to.equal(null);
					}
				);
			}
		);
		suite
		(
			'Properties Panel',
			function ()
			{
				test
				(
					'Should export the PropertiesPanel class from the module',
					function ()
					{
						Expect(libPictSectionFormEditor.PropertiesPanel).to.be.a('function');
					}
				);
				test
				(
					'Properties panel should instantiate without errors',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpPropertiesPanel = require('../source/views/PictView-FormEditor-PropertiesPanel.js');

						let tmpView = tmpPict.addView('TestPropsPanel',
						{
							ViewIdentifier: 'TestPropsPanel'
						}, tmpPropertiesPanel);

						Expect(tmpView).to.be.an('object');
						Expect(tmpView._SelectedInput).to.equal(null);
						Expect(tmpView._ParentFormEditor).to.equal(null);
					}
				);
				test
				(
					'Properties panel selectInput should set state',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpPropertiesPanel = require('../source/views/PictView-FormEditor-PropertiesPanel.js');

						let tmpView = tmpPict.addView('TestPropsPanelSelect',
						{
							ViewIdentifier: 'TestPropsPanelSelect'
						}, tmpPropertiesPanel);

						tmpView.selectInput(1, 2, 3, 4);
						Expect(tmpView._SelectedInput).to.be.an('object');
						Expect(tmpView._SelectedInput.SectionIndex).to.equal(1);
						Expect(tmpView._SelectedInput.GroupIndex).to.equal(2);
						Expect(tmpView._SelectedInput.RowIndex).to.equal(3);
						Expect(tmpView._SelectedInput.InputIndex).to.equal(4);
					}
				);
				test
				(
					'Properties panel deselectInput should clear state',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpPropertiesPanel = require('../source/views/PictView-FormEditor-PropertiesPanel.js');

						let tmpView = tmpPict.addView('TestPropsPanelDeselect',
						{
							ViewIdentifier: 'TestPropsPanelDeselect'
						}, tmpPropertiesPanel);

						tmpView.selectInput(0, 0, 0, 0);
						Expect(tmpView._SelectedInput).to.not.equal(null);

						tmpView.deselectInput();
						Expect(tmpView._SelectedInput).to.equal(null);
					}
				);
			}
		);
		suite
		(
			'InputType Manifests',
			function ()
			{
				test
				(
					'InputType definitions with manifests should have valid Descriptor structures',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestManifestStructure',
						{
							ViewIdentifier: 'TestManifestStructure',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						let tmpTypesWithManifests = ['Option', 'PreciseNumberReadOnly', 'Chart', 'TabSectionSelector', 'TabGroupSelector', 'Templated', 'TemplatedEntityLookup'];

						for (let i = 0; i < tmpView._InputTypeDefinitions.length; i++)
						{
							let tmpDef = tmpView._InputTypeDefinitions[i];
							if (tmpDef.Manifest)
							{
								Expect(tmpDef.Manifest).to.be.an('object');
								Expect(tmpDef.Manifest.Descriptors).to.be.an('object');

								let tmpKeys = Object.keys(tmpDef.Manifest.Descriptors);
								Expect(tmpKeys.length).to.be.greaterThan(0);

								for (let j = 0; j < tmpKeys.length; j++)
								{
									let tmpDesc = tmpDef.Manifest.Descriptors[tmpKeys[j]];
									Expect(tmpDesc).to.be.an('object');
									Expect(tmpDesc.Name).to.be.a('string');
									Expect(tmpDesc.Hash).to.be.a('string');
									Expect(tmpDesc.DataType).to.be.a('string');
									Expect(tmpDesc.Description).to.be.a('string');
								}
							}
						}
					}
				);
				test
				(
					'_getInputTypeManifest should return manifest for types that have one',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestGetManifest',
						{
							ViewIdentifier: 'TestGetManifest',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						let tmpOptionManifest = tmpView._getInputTypeManifest('Option');
						Expect(tmpOptionManifest).to.be.an('object');
						Expect(tmpOptionManifest.Descriptors).to.be.an('object');
						Expect(tmpOptionManifest.Descriptors['SelectOptions']).to.be.an('object');
						Expect(tmpOptionManifest.Descriptors['SelectOptionsPickList']).to.be.an('object');

						let tmpChartManifest = tmpView._getInputTypeManifest('Chart');
						Expect(tmpChartManifest).to.be.an('object');
						Expect(tmpChartManifest.Descriptors['ChartType']).to.be.an('object');

						let tmpPNROManifest = tmpView._getInputTypeManifest('PreciseNumberReadOnly');
						Expect(tmpPNROManifest).to.be.an('object');
						Expect(tmpPNROManifest.Descriptors['DecimalPrecision']).to.be.an('object');
						Expect(tmpPNROManifest.Descriptors['AddCommas']).to.be.an('object');
						Expect(tmpPNROManifest.Descriptors['DigitsPrefix']).to.be.an('object');
						Expect(tmpPNROManifest.Descriptors['DigitsPostfix']).to.be.an('object');
					}
				);
				test
				(
					'_getInputTypeManifest should return null for types without a manifest',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestGetManifestNull',
						{
							ViewIdentifier: 'TestGetManifestNull',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						Expect(tmpView._getInputTypeManifest('TextArea')).to.equal(null);
						Expect(tmpView._getInputTypeManifest('Boolean')).to.equal(null);
						Expect(tmpView._getInputTypeManifest('Hidden')).to.equal(null);
						Expect(tmpView._getInputTypeManifest('Link')).to.equal(null);
						Expect(tmpView._getInputTypeManifest('')).to.equal(null);
						Expect(tmpView._getInputTypeManifest(null)).to.equal(null);
						Expect(tmpView._getInputTypeManifest('NonExistent')).to.equal(null);
					}
				);
				test
				(
					'commitPictFormChange should update PictForm properties on the Descriptor',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpPropertiesPanel = require('../source/views/PictView-FormEditor-PropertiesPanel.js');

						let tmpView = tmpPict.addView('TestCommitPictForm',
						{
							ViewIdentifier: 'TestCommitPictForm'
						}, tmpPropertiesPanel);

						// Create a mock parent form editor
						let tmpFormEditor = tmpPict.addView('TestCommitPictFormParent',
						{
							ViewIdentifier: 'TestCommitPictFormParent',
							ManifestDataAddress: 'AppData.TestCommitManifest'
						}, libPictSectionFormEditor);
						tmpFormEditor.initialize();

						// Set up manifest data with a section/group/row/input
						tmpFormEditor.addSection();
						tmpFormEditor.addGroup(0);
						tmpFormEditor.addRow(0, 0);
						tmpFormEditor.addInput(0, 0, 0);

						// Wire the properties panel to the form editor
						tmpView._ParentFormEditor = tmpFormEditor;
						tmpView.selectInput(0, 0, 0, 0);

						// Test String property
						tmpView.commitPictFormChange('Template', 'Hello {~D:Name~}', 'String');
						let tmpManifest = tmpFormEditor._resolveManifestData();
						let tmpAddress = tmpManifest.Sections[0].Groups[0].Rows[0].Inputs[0];
						let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
						Expect(tmpDescriptor.PictForm.Template).to.equal('Hello {~D:Name~}');

						// Test Number property
						tmpView.commitPictFormChange('DecimalPrecision', '2', 'Number');
						Expect(tmpDescriptor.PictForm.DecimalPrecision).to.equal(2);

						// Test Boolean property
						tmpView.commitPictFormChange('AddCommas', true, 'Boolean');
						Expect(tmpDescriptor.PictForm.AddCommas).to.equal(true);

						// Test empty Number removes property
						tmpView.commitPictFormChange('DecimalPrecision', '', 'Number');
						Expect(tmpDescriptor.PictForm.hasOwnProperty('DecimalPrecision')).to.equal(false);

						// Test empty String removes property
						tmpView.commitPictFormChange('Template', '', 'String');
						Expect(tmpDescriptor.PictForm.hasOwnProperty('Template')).to.equal(false);

						// Test JSON string auto-parsing
						tmpView.commitPictFormChange('SelectOptions', '[{"id":"1","text":"One"}]', 'String');
						Expect(Array.isArray(tmpDescriptor.PictForm.SelectOptions)).to.equal(true);
						Expect(tmpDescriptor.PictForm.SelectOptions[0].id).to.equal('1');
					}
				);
				test
				(
					'TabGroupSelector and TabSectionSelector should have correct manifest properties',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestTabManifests',
						{
							ViewIdentifier: 'TestTabManifests',
							ManifestDataAddress: 'AppData.FormConfig'
						}, libPictSectionFormEditor);

						let tmpTabGroupManifest = tmpView._getInputTypeManifest('TabGroupSelector');
						Expect(tmpTabGroupManifest.Descriptors['TabGroupSet']).to.be.an('object');
						Expect(tmpTabGroupManifest.Descriptors['DefaultTabGroupHash']).to.be.an('object');
						Expect(tmpTabGroupManifest.Descriptors['DefaultFromData']).to.be.an('object');
						Expect(tmpTabGroupManifest.Descriptors['DefaultFromData'].DataType).to.equal('Boolean');

						let tmpTabSectionManifest = tmpView._getInputTypeManifest('TabSectionSelector');
						Expect(tmpTabSectionManifest.Descriptors['TabSectionSet']).to.be.an('object');
						Expect(tmpTabSectionManifest.Descriptors['DefaultTabSectionHash']).to.be.an('object');
						Expect(tmpTabSectionManifest.Descriptors['DefaultFromData']).to.be.an('object');
					}
				);
				test
				(
					'Custom InputType definitions with manifests should merge correctly',
					function ()
					{
						let tmpPict = new libPict({ Product: 'TestFormEditor' });
						let tmpView = tmpPict.addView('TestCustomManifests',
						{
							ViewIdentifier: 'TestCustomManifests',
							ManifestDataAddress: 'AppData.FormConfig',
							InputTypeDefinitions:
							[
								{
									Hash: 'CustomWidget',
									Name: 'Custom Widget',
									Description: 'A custom widget',
									Category: 'Custom',
									Manifest:
									{
										Descriptors:
										{
											'WidgetColor': { Name: 'Widget Color', Hash: 'WidgetColor', DataType: 'String', Description: 'The color of the widget' }
										}
									}
								}
							]
						}, libPictSectionFormEditor);

						let tmpCustomManifest = tmpView._getInputTypeManifest('CustomWidget');
						Expect(tmpCustomManifest).to.be.an('object');
						Expect(tmpCustomManifest.Descriptors['WidgetColor']).to.be.an('object');
						Expect(tmpCustomManifest.Descriptors['WidgetColor'].DataType).to.equal('String');
					}
				);
			}
		);
	}
);
