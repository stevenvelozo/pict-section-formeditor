const libPictView = require('pict-view');
const libPictSectionObjectEditor = require('pict-section-objecteditor');
const libPictSectionCode = require('pict-section-code');
const libPictSectionContent = require('pict-section-content');
const libPictSectionMarkdownEditor = require('pict-section-markdowneditor');

const _DefaultConfiguration = require('../Pict-Section-FormEditor-DefaultConfiguration.js');
const libFormEditorIconography = require('../providers/Pict-Provider-FormEditorIconography.js');
const libFormEditorUtilities = require('../providers/Pict-Provider-FormEditorUtilities.js');
const libFormEditorDragDrop = require('../providers/Pict-Provider-FormEditorDragDrop.js');
const libFormEditorInlineEditing = require('./PictView-FormEditor-InlineEditing.js');
const libFormEditorInputTypePicker = require('./PictView-FormEditor-InputTypePicker.js');
const libFormEditorRendering = require('../providers/Pict-Provider-FormEditorRendering.js');
const libFormEditorManifestOps = require('../providers/Pict-Provider-FormEditorManifestOps.js');
const libChildPictManager = require('../providers/Pict-Provider-ChildPictManager.js');
const libPreviewCSS = require('../providers/Pict-Provider-PreviewCSS.js');
const libFormEditorDocumentation = require('../providers/Pict-Provider-FormEditorDocumentation.js');
const libManifestFactory = require('pict-section-form').ManifestFactory;
const libManifestConversionToCSV = require('pict-section-form').ManifestConversionToCSV;

class PictViewFormEditor extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultConfiguration)), pOptions);

		if (!tmpOptions.ManifestDataAddress)
		{
			tmpOptions.ManifestDataAddress = 'FormEditor.Manifest';
		}

		super(pFable, tmpOptions, pServiceHash);

		this._ActiveTab = tmpOptions.ActiveTab || 'formoverview';

		// Child view references
		this._ObjectEditorView = null;
		this._CodeEditorView = null;
		this._SolverCodeEditorView = null;
		this._HelpContentView = null;
		this._HelpContentProvider = null;
		this._DocumentationProvider = null;

		// Content editor (markdown editor overlay for Markdown/HTML inputs)
		this._ContentEditorView = null;
		this._ContentEditorContext = null;

		// Extended descriptor properties for the Input properties panel.
		// Populated from options.ExtendedDescriptorProperties and can be
		// modified at runtime via addExtendedDescriptorProperty().
		this._ExtendedDescriptorProperties = [];
		if (Array.isArray(tmpOptions.ExtendedDescriptorProperties))
		{
			for (let i = 0; i < tmpOptions.ExtendedDescriptorProperties.length; i++)
			{
				let tmpProp = tmpOptions.ExtendedDescriptorProperties[i];
				if (tmpProp && typeof tmpProp.Address === 'string' && tmpProp.Address.length > 0)
				{
					this._ExtendedDescriptorProperties.push(
					{
						Name: tmpProp.Name || tmpProp.Address,
						Address: tmpProp.Address,
						DataType: tmpProp.DataType || 'String',
						Description: tmpProp.Description || ''
					});
				}
			}
		}

		// Supported Manyfest DataTypes
		this._ManyfestDataTypes =
		[
			'String',
			'Number',
			'Float',
			'Integer',
			'PreciseNumber',
			'Boolean',
			'Binary',
			'DateTime',
			'Array',
			'Object',
			'Null'
		];


		// Create the iconography provider
		this._IconographyProvider = new libFormEditorIconography(tmpOptions.Iconography || {});

		// Create the child pict manager provider for managing any embedded pict instances (e.g. the solver editor)
		let tmpChildPictManagerHash = `${pServiceHash || 'FormEditor'}-ChildPictManager`;
		this._ChildPictManager = this.pict.addProvider(tmpChildPictManagerHash, {}, libChildPictManager );

		// Create the preview CSS provider so the child pict form preview
		// injects its CSS into a dedicated <style> element rather than #PICT-CSS
		let tmpPreviewCSSHash = `${pServiceHash || 'FormEditor'}-PreviewCSS`;
		this._PreviewCSSProvider = this.pict.addProvider(tmpPreviewCSSHash, {}, libPreviewCSS);

		// Create the drag-and-drop provider
		let tmpDragDropHash = `${pServiceHash || 'FormEditor'}-DragDrop`;
		this._DragDropProvider = this.pict.addProvider(
			tmpDragDropHash,
			{},
			libFormEditorDragDrop
		);
		this._DragDropProvider._ParentFormEditor = this;
		// Create the utilities provider
		let tmpUtilitiesHash = `${pServiceHash || 'FormEditor'}-Utilities`;
		this._UtilitiesProvider = this.pict.addProvider(
			tmpUtilitiesHash,
			{},
			libFormEditorUtilities
		);
		this._UtilitiesProvider._ParentFormEditor = this;

		// Create the manifest operations provider
		let tmpManifestOpsHash = `${pServiceHash || 'FormEditor'}-ManifestOps`;
		this._ManifestOpsProvider = this.pict.addProvider(
			tmpManifestOpsHash,
			{},
			libFormEditorManifestOps
		);
		this._ManifestOpsProvider._ParentFormEditor = this;

		// Create the rendering provider
		let tmpRenderingHash = `${pServiceHash || 'FormEditor'}-Rendering`;
		this._RenderingProvider = this.pict.addProvider(
			tmpRenderingHash,
			{},
			libFormEditorRendering
		);
		this._RenderingProvider._ParentFormEditor = this;

		// Create the documentation provider for the embedded help system.
		let tmpDocumentationHash = `${pServiceHash || 'FormEditor'}-Documentation`;
		this._DocumentationProvider = this.pict.addProvider(
			tmpDocumentationHash,
			{},
			libFormEditorDocumentation
		);
		this._DocumentationProvider._ParentFormEditor = this;

		// Create the help content provider (PictContentProvider for markdown parsing)
		let tmpHelpContentProviderHash = `${pServiceHash || 'FormEditor'}-HelpContentProvider`;
		this._HelpContentProvider = this.pict.addProvider(
			tmpHelpContentProviderHash,
			{},
			libPictSectionContent.PictContentProvider
		);

		// Create the inline editing child view
		let tmpInlineEditHash = `${pServiceHash || 'FormEditor'}-InlineEditing`;
		this._InlineEditingView = this.pict.addView(
			tmpInlineEditHash,
			{ ViewIdentifier: tmpInlineEditHash, AutoRender: false },
			libFormEditorInlineEditing
		);
		this._InlineEditingView._ParentFormEditor = this;

		// Create the input type picker child view
		let tmpInputTypePickerHash = `${pServiceHash || 'FormEditor'}-InputTypePicker`;
		this._InputTypePickerView = this.pict.addView(
			tmpInputTypePickerHash,
			{ ViewIdentifier: tmpInputTypePickerHash, AutoRender: false },
			libFormEditorInputTypePicker
		);
		this._InputTypePickerView._ParentFormEditor = this;

		// Build the InputType definitions from defaults + any embedder overrides
		this._InputTypeDefinitions = this._UtilitiesProvider._buildInputTypeDefinitions(tmpOptions);

		// Drag-and-drop state (opt-in, disabled by default)
		this._DragAndDropEnabled = false;
		this._DragState = null;

		// Input display mode: 'name' shows Name, 'hash' shows Hash
		this._InputDisplayMode = 'name';

		// Selected input for the properties panel
		this._SelectedInputIndices = null;

		// Selected submanifest column for Tabular/RecordSet groups
		this._SelectedTabularColumn = null;

		// Selected section/group for the properties panel
		this._SelectedSectionIndex = null;
		this._SelectedGroupIndices = null;

		// Properties panel state
		this._PanelCollapsed = false;
		this._PanelActiveTab = 'form';
		this._PanelWidth = 300;
		this._PanelResizing = false;

		// Restore panel width from localStorage
		if (typeof localStorage !== 'undefined')
		{
			try
			{
				let tmpStoredWidth = localStorage.getItem('pict-fe-panel-width');
				if (tmpStoredWidth)
				{
					let tmpParsed = parseInt(tmpStoredWidth, 10);
					if (!isNaN(tmpParsed) && tmpParsed >= 240)
					{
						this._PanelWidth = tmpParsed;
					}
				}
			}
			catch (pError)
			{
				// localStorage may throw in restrictive environments
			}
		}

		// Properties panel child view reference
		this._PropertiesPanelView = null;
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Initialization                           */
	/* -------------------------------------------------------------------------- */

	onBeforeInitialize()
	{
		super.onBeforeInitialize();

		// Register ManifestFactory service type if not already present (needed for CSV import)
		if (!this.fable.servicesMap.hasOwnProperty('ManifestFactory'))
		{
			this.fable.addServiceType('ManifestFactory', libManifestFactory);
		}

		// Register ManifestConversionToCSV service type if not already present (needed for CSV export)
		if (!this.fable.servicesMap.hasOwnProperty('ManifestConversionToCSV'))
		{
			this.fable.addServiceType('ManifestConversionToCSV', libManifestConversionToCSV);
		}

		// Ensure the manifest data address exists in AppData
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			this._setManifestData(this._createEmptyManifest());
		}
	}

	onAfterInitialize()
	{
		super.onAfterInitialize();

		// Register the object editor service type if not already registered
		if (!this.fable.servicesMap.hasOwnProperty('PictSectionObjectEditor'))
		{
			this.fable.addServiceType('PictSectionObjectEditor', libPictSectionObjectEditor);
		}

		// Create the object editor child view
		let tmpViewHash = `${this.Hash}-ObjectEditor`;
		this._ObjectEditorView = this.pict.addView(
			tmpViewHash,
			{
				ViewIdentifier: tmpViewHash,
				ObjectDataAddress: this.options.ManifestDataAddress,
				DefaultDestinationAddress: `#FormEditor-ObjectEditor-Container-${this.Hash}`,
				InitialExpandDepth: 2,
				Editable: true,
				ShowTypeIndicators: true,
				AutoRender: false,
				Renderables:
				[
					{
						RenderableHash: 'ObjectEditor-Container',
						TemplateHash: 'ObjectEditor-Container-Template',
						DestinationAddress: `#FormEditor-ObjectEditor-Container-${this.Hash}`,
						RenderMethod: 'replace'
					}
				]
			},
			libPictSectionObjectEditor
		);
		this._ObjectEditorView.initialize();

		// Create the properties panel child view
		let tmpPropertiesPanelView = require('./PictView-FormEditor-PropertiesPanel.js');
		let tmpPropsPanelHash = `${this.Hash}-PropertiesPanel`;
		this._PropertiesPanelView = this.pict.addView(
			tmpPropsPanelHash,
			{
				ViewIdentifier: tmpPropsPanelHash,
				DefaultDestinationAddress: `#FormEditor-PropertiesPanel-${this.Hash}`,
				AutoRender: false
			},
			tmpPropertiesPanelView
		);
		this._PropertiesPanelView._ParentFormEditor = this;
		this._PropertiesPanelView.initialize();

		// Create the code editor child view (pict-section-code for JSON tab)
		let tmpCodeEditorHash = `${this.Hash}-CodeEditor`;
		this._CodeEditorView = this.pict.addView(
			tmpCodeEditorHash,
			{
				ViewIdentifier: tmpCodeEditorHash,
				TargetElementAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`,
				Language: 'json',
				ReadOnly: true,
				LineNumbers: true,
				DefaultCode: '{}',
				AutoRender: false,
				RenderOnLoad: false,
				DefaultRenderable: 'CodeEditor-Wrap',
				DefaultDestinationAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`,
				Renderables:
				[
					{
						RenderableHash: 'CodeEditor-Wrap',
						TemplateHash: 'CodeEditor-Container',
						DestinationAddress: `#FormEditor-CodeEditor-Container-${this.Hash}`
					}
				]
			},
			libPictSectionCode
		);
		this._CodeEditorView.initialize();

		// Override onCodeChange to sync edits back to manifest
		let tmpSelf = this;
		this._CodeEditorView.onCodeChange = function(pCode)
		{
			// Try to parse; silently ignore invalid JSON while user is typing
			try
			{
				let tmpParsed = JSON.parse(pCode);
				tmpSelf._ManifestOpsProvider.stripRowsFromManifest(tmpParsed);
				tmpSelf._setManifestData(tmpParsed);
			}
			catch (e)
			{
				// JSON not yet valid — no-op until user finishes editing
			}
		};

		// Create the solver code editor child view (pict-section-code for Solver Editor tab)
		let tmpSolverCodeEditorHash = `${this.Hash}-SolverCodeEditor`;
		this._SolverCodeEditorView = this.pict.addView(
			tmpSolverCodeEditorHash,
			{
				ViewIdentifier: tmpSolverCodeEditorHash,
				TargetElementAddress: `#FormEditor-SolverCodeEditor-Container-${this.Hash}`,
				Language: 'javascript',
				ReadOnly: false,
				LineNumbers: true,
				DefaultCode: '',
				AddClosing: false,
				IndentOn: false,
				MoveToNewLine: false,
				AutoRender: false,
				RenderOnLoad: false,
				DefaultRenderable: 'SolverCodeEditor-Wrap',
				DefaultDestinationAddress: `#FormEditor-SolverCodeEditor-Container-${this.Hash}`,
				Renderables:
				[
					{
						RenderableHash: 'SolverCodeEditor-Wrap',
						TemplateHash: 'CodeEditor-Container',
						DestinationAddress: `#FormEditor-SolverCodeEditor-Container-${this.Hash}`
					}
				]
			},
			libPictSectionCode
		);
		this._SolverCodeEditorView.initialize();

		// Set a custom solver DSL highlight function
		this._SolverCodeEditorView.setHighlightFunction(this._buildSolverHighlightFunction());

		// Create the help content view (PictContentView for rendering parsed markdown)
		let tmpHelpContentViewHash = `${this.Hash}-HelpContentView`;
		this._HelpContentView = this.pict.addView(
			tmpHelpContentViewHash,
			{
				ViewIdentifier: tmpHelpContentViewHash,
				DefaultRenderable: 'HelpContent-Wrap',
				DefaultDestinationAddress: `#FormEditor-Help-Body-${this.Hash}`,
				AutoRender: false,
				Renderables:
				[
					{
						RenderableHash: 'HelpContent-Wrap',
						TemplateHash: 'Pict-Content-Template',
						DestinationAddress: `#FormEditor-Help-Body-${this.Hash}`
					}
				]
			},
			libPictSectionContent
		);
		this._HelpContentView.initialize();

		// Create the content editor child view (pict-section-markdowneditor for Markdown/HTML input content)
		let tmpContentEditorHash = `${this.Hash}-ContentEditor`;
		this.pict.AppData.FormEditor = this.pict.AppData.FormEditor || {};
		this.pict.AppData.FormEditor.ContentEditorSegments = [{ Content: '' }];

		this._ContentEditorView = this.pict.addView(
			tmpContentEditorHash,
			{
				ViewIdentifier: tmpContentEditorHash,
				ContentDataAddress: 'FormEditor.ContentEditorSegments',
				AutoRender: false,
				RenderOnLoad: false,
				EnableRichPreview: true,
				ReadOnly: false,
				DefaultRenderable: 'MarkdownEditor-Wrap',
				DefaultDestinationAddress: `#FormEditor-ContentEditor-Body-${this.Hash}`,
				TargetElementAddress: `#FormEditor-ContentEditor-Body-${this.Hash}`,
				Renderables:
				[
					{
						RenderableHash: 'MarkdownEditor-Wrap',
						TemplateHash: 'MarkdownEditor-Container',
						DestinationAddress: `#FormEditor-ContentEditor-Body-${this.Hash}`
					}
				]
			},
			libPictSectionMarkdownEditor
		);
		this._ContentEditorView.initialize();

		// Sync content changes back to the descriptor (tmpSelf already defined above for code editor)
		this._ContentEditorView.onContentChange = function(pSegmentIndex, pContent)
		{
			if (tmpSelf._ContentEditorContext)
			{
				let tmpContent = tmpSelf._ContentEditorView.getAllContent();
				tmpSelf._setContentEditorValue(tmpContent);
			}
		};
	}

	/**
	 * Build the custom syntax highlight function for the solver DSL.
	 *
	 * The function tokenizes the raw code to extract string literals first,
	 * then applies keyword/reference/number/operator highlighting to code segments.
	 *
	 * @returns {function} A highlight function compatible with pict-section-code / CodeJar
	 */
	_buildSolverHighlightFunction()
	{
		// Single combined tokenizer that matches all token types in one pass on the raw text.
		// Order matters: strings first, then keywords, then dot-path references, then numbers, then operators.
		// Group 1: string literals
		// Group 2: keyword
		// Group 3: dot-path reference (e.g. Section.Group.Field)
		// Group 4: number
		// Group 5: operator
		let tmpTokenizer = new RegExp(
			'("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')' +               // Group 1: strings
			'|\\b(' +
			// Math
			'abs|sqrt|round|tofixed|floor|ceil|exp|log|sin|cos|tan|rad|pi|euler|compare|percent' +
			// Stats
			'|sum|avg|mean|median|mode|min|max|var|vara|varp|stdev|stdeva|stdevp|count|countset|countsetelements' +
			// Array/Set
			'|sortset|sortarray|bucketset|uniquearray|unionarrays|differencearrays|arrayconcat|flatten|slice|setconcatenate|entryinset|smallestinset|largestinset' +
			// String
			'|concat|concatraw|join|joinraw|stringcountsegments|stringgetsegments|resolvehtmlentities' +
			// Object/Value
			'|getvalue|setvalue|getvaluearray|getvalueobject|createvalueobjectbyhashes|cleanvaluearray|cleanvalueobject' +
			// Date
			'|datemilliseconddifference|dateseconddifference|dateminutedifference|datehourdifference|datedaydifference|dateweekdifference|datemonthdifference|dateyeardifference|datemathadd|dateaddmilliseconds|dateaddseconds|dateaddminutes|dateaddhours|dateadddays|dateaddweeks|dateaddmonths|dateaddyears|datefromparts' +
			// Conditional
			'|if|when' +
			// Form control
			'|showsections|hidesections|setsectionvisibility|setgroupvisibility|generatehtmlhexcolor|colorsectionbackground|colorgroupbackground|colorinputbackground|colorinputbackgroundtabular|setsolverordinalenabled|enablesolverordinal|disablesolverordinal|settabularrowlength|refreshtabularsection|runsolvers|logvalues' +
			// Regression/Advanced
			'|polynomialregression|leastsquares|linest|matrixtranspose|matrixmultiply|matrixvectormultiply|matrixinverse|gaussianelimination|predict|iterativeseries|cumulativesummation|subtractingsummation' +
			// Random
			'|randominteger|randomintegerbetween|randomintegerupto|randomfloat|randomfloatbetween|randomfloatupto' +
			// Search
			'|findfirstvaluebyexactmatch|findfirstvaluebystringincludes|match' +
			// Histogram
			'|aggregationhistogram|aggregationhistogrambyobject|distributionhistogram|distributionhistogrambyobject|sorthistogram|sorthistogrambykeys|objectkeystoarray|setkeystoarray|histogramkeystoarray|objectvaluestoarray|setvaluestoarray|histogramvaluestoarray|generatearrayofobjectsfromsets|objectvaluessortbyexternalobjectarray' +
			// Curve
			'|bezierpoint|beziercurvefit' +
			')\\b' +                                                             // Group 2: keywords
			'|([a-zA-Z_]\\w*(?:\\.\\w+)+)' +                                    // Group 3: dot-path references
			'|(\\b\\d+\\.?\\d*(?:e[+-]?\\d+)?\\b)' +                            // Group 4: numbers
			'|([=+\\-*/%^<>!?&|]+)',                                             // Group 5: operators
			'gi');

		function escapeHTML(pString)
		{
			return pString
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}

		return function highlightSolverExpression(pElement)
		{
			let tmpCode = pElement.textContent;

			// Single-pass tokenization on raw text — no cascading regex on HTML
			let tmpResult = '';
			let tmpLastIndex = 0;
			let tmpMatch;

			tmpTokenizer.lastIndex = 0;

			while ((tmpMatch = tmpTokenizer.exec(tmpCode)) !== null)
			{
				// Emit any plain text before this token
				if (tmpMatch.index > tmpLastIndex)
				{
					tmpResult += escapeHTML(tmpCode.substring(tmpLastIndex, tmpMatch.index));
				}

				let tmpFullMatch = tmpMatch[0];

				if (tmpMatch[1])
				{
					// String literal
					tmpResult += '<span class="string">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[2])
				{
					// Keyword
					tmpResult += '<span class="keyword">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[3])
				{
					// Dot-path reference
					tmpResult += '<span class="property">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[4])
				{
					// Number
					tmpResult += '<span class="number">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[5])
				{
					// Operator
					tmpResult += '<span class="operator">' + escapeHTML(tmpFullMatch) + '</span>';
				}

				tmpLastIndex = tmpTokenizer.lastIndex;
			}

			// Emit any remaining plain text
			if (tmpLastIndex < tmpCode.length)
			{
				tmpResult += escapeHTML(tmpCode.substring(tmpLastIndex));
			}

			pElement.innerHTML = tmpResult;
		};
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Rendering                                */
	/* -------------------------------------------------------------------------- */

	onAfterRender()
	{
		super.onAfterRender();

		// Inject CSS
		if (this.options.CSS)
		{
			this.pict.CSSMap.injectCSS(this.options.ViewIdentifier, this.options.CSS);
		}

		// Build the full tab bar and content panels programmatically
		this._RenderingProvider._renderTabShell();

		// Re-render the content for the currently active tab (not just visual)
		this._renderActiveTabContent();
		this._syncTabState();
	}

	renderVisualEditor()
	{
		return this._RenderingProvider.renderVisualEditor();
	}

	/**
	 * Re-render the content for the currently active tab.
	 * Called from onAfterRender to restore whichever tab the user was on.
	 */
	_renderActiveTabContent()
	{
		// Default to formoverview when no active tab is set (initial render)
		let tmpActiveTab = this._ActiveTab || 'formoverview';

		if (tmpActiveTab === 'solvereditor')
		{
			// Render the visual editor content in the background (hidden),
			// then restore the solver editor panel so the user is not disrupted.
			this.renderVisualEditor();
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderSolverEditorTabPanel();
			}
		}
		else if (tmpActiveTab === 'solvers')
		{
			this.renderVisualEditor();
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderSolversTabPanel();
			}
		}
		else
		{
			// For all other tabs, re-run switchTab which handles each tab's rendering
			this.switchTab(tmpActiveTab);
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Tab Management                           */
	/* -------------------------------------------------------------------------- */

	switchTab(pTabName)
	{
		this._ActiveTab = pTabName;
		this._syncTabState();

		if (pTabName === 'objecteditor')
		{
			// Render the object editor container first, then expand to 2 levels
			this._ObjectEditorView.render();
			this._ObjectEditorView.expandToDepth(2);
		}
		else if (pTabName === 'json')
		{
			// Reset to read-only each time the tab is opened
			if (this._CodeEditorView)
			{
				this._CodeEditorView.setReadOnly(true);
			}
			// Sync the checkbox
			if (typeof document !== 'undefined')
			{
				let tmpCheckbox = document.getElementById(`FormEditor-JSON-ReadOnly-${this.Hash}`);
				if (tmpCheckbox)
				{
					tmpCheckbox.checked = true;
				}
			}
			this._UtilitiesProvider._updateCodeEditor();
		}
		else if (pTabName === 'visual')
		{
			this.renderVisualEditor();
		}
		else if (pTabName === 'formoverview')
		{
			this._RenderingProvider.renderFormOverviewTabPanel();
		}
		else if (pTabName === 'solvereditor')
		{
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderSolverEditorTabPanel();
			}
		}
		else if (pTabName === 'solvers')
		{
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderSolversTabPanel();
			}
		}
		else if (pTabName === 'listdata')
		{
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderListDataTabPanel();
			}
		}
		else if (pTabName === 'entitydata')
		{
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderEntityDataTabPanel();
			}
		}
		else if (pTabName === 'import')
		{
			this._RenderingProvider.renderImportTabPanel();
		}
		else if (pTabName === 'preview')
		{
			if (this._PropertiesPanelView)
			{
				this._PropertiesPanelView.renderPreviewTabPanel();
			}
		}
	}

	_toggleJSONReadOnly(pIsReadOnly)
	{
		if (this._CodeEditorView)
		{
			this._CodeEditorView.setReadOnly(pIsReadOnly);
			if (pIsReadOnly)
			{
				// Normalize row numbers after manual JSON edits
				this._ManifestOpsProvider.normalizeAllRowNumbers();
				// Refresh the editor content from the manifest when locking
				this._UtilitiesProvider._updateCodeEditor();
			}
		}
	}

	_syncTabState()
	{
		let tmpHash = this.Hash;
		let tmpTabs = ['formoverview', 'visual', 'solvereditor', 'solvers', 'listdata', 'entitydata', 'json', 'import', 'objecteditor', 'preview'];
		let tmpTabNames = ['FormOverview', 'Visual', 'SolverEditor', 'Solvers', 'ListData', 'EntityData', 'JSON', 'Import', 'ObjectEditor', 'Preview'];

		for (let i = 0; i < tmpTabs.length; i++)
		{
			// getElement returns an array; grab the first match
			let tmpTabButtonSet = this.pict.ContentAssignment.getElement(`#FormEditor-Tab-${tmpTabNames[i]}-${tmpHash}`);
			let tmpTabPanelSet = this.pict.ContentAssignment.getElement(`#FormEditor-Panel-${tmpTabNames[i]}-${tmpHash}`);

			let tmpTabButton = (Array.isArray(tmpTabButtonSet) && tmpTabButtonSet.length > 0) ? tmpTabButtonSet[0] : tmpTabButtonSet;
			let tmpTabPanel = (Array.isArray(tmpTabPanelSet) && tmpTabPanelSet.length > 0) ? tmpTabPanelSet[0] : tmpTabPanelSet;

			if (tmpTabButton && tmpTabButton.className !== undefined)
			{
				if (tmpTabs[i] === this._ActiveTab)
				{
					tmpTabButton.className = 'pict-fe-tab pict-fe-tab-active';
				}
				else
				{
					tmpTabButton.className = 'pict-fe-tab';
				}
			}
			if (tmpTabPanel && tmpTabPanel.className !== undefined)
			{
				if (tmpTabs[i] === this._ActiveTab)
				{
					tmpTabPanel.className = 'pict-fe-tabcontent pict-fe-tabcontent-active';
				}
				else
				{
					tmpTabPanel.className = 'pict-fe-tabcontent';
				}
			}
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                  Code Section: Form Overview Tab Handlers                  */
	/* -------------------------------------------------------------------------- */

	/**
	 * Commit an edited field value from the Form Overview tree.
	 * Called on blur of every input field in the overview.
	 * Does NOT re-render the tree (to preserve Tab navigation focus).
	 */
	_formOverviewCommitField(pTier, pSectionIndex, pGroupIndex, pRowIndex, pField, pValue, pInputIndex)
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		if (pTier === 'section')
		{
			let tmpSection = tmpManifest.Sections ? tmpManifest.Sections[pSectionIndex] : null;
			if (!tmpSection)
			{
				return;
			}
			if (tmpSection[pField] === pValue)
			{
				return;
			}
			this._ManifestOpsProvider.updateSectionProperty(pSectionIndex, pField, pValue);

			// Auto-generate Hash from Name when hash is still auto-generated
			if (pField === 'Name' && this._UtilitiesProvider._isAutoGeneratedSectionHash(tmpSection.Hash))
			{
				let tmpAutoHash = this._UtilitiesProvider.sanitizeObjectKey(pValue);
				this._ManifestOpsProvider.updateSectionProperty(pSectionIndex, 'Hash', tmpAutoHash);
			}
		}
		else if (pTier === 'group')
		{
			let tmpSection = tmpManifest.Sections ? tmpManifest.Sections[pSectionIndex] : null;
			let tmpGroup = (tmpSection && Array.isArray(tmpSection.Groups)) ? tmpSection.Groups[pGroupIndex] : null;
			if (!tmpGroup)
			{
				return;
			}
			if (tmpGroup[pField] === pValue)
			{
				return;
			}
			this._ManifestOpsProvider.updateGroupProperty(pSectionIndex, pGroupIndex, pField, pValue);

			// Auto-generate Hash from Name when hash follows auto-generated pattern
			if (pField === 'Name')
			{
				let tmpSectionHash = tmpSection.Hash || '';
				let tmpAutoPrefix = tmpSectionHash + '_G';
				if (tmpGroup.Hash && tmpGroup.Hash.indexOf(tmpAutoPrefix) === 0)
				{
					let tmpAutoHash = tmpAutoPrefix + this._UtilitiesProvider.sanitizeObjectKey(pValue);
					this._ManifestOpsProvider.updateGroupProperty(pSectionIndex, pGroupIndex, 'Hash', tmpAutoHash);
				}
			}
		}
		else if (pTier === 'input')
		{
			let tmpRows = this._ManifestOpsProvider.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
			if (pRowIndex < 0 || pRowIndex >= tmpRows.length)
			{
				return;
			}
			let tmpRow = tmpRows[pRowIndex];
			let tmpIdx = (typeof pInputIndex === 'number') ? pInputIndex : 0;
			if (!tmpRow || !Array.isArray(tmpRow.Inputs) || tmpIdx >= tmpRow.Inputs.length)
			{
				return;
			}
			let tmpAddress = tmpRow.Inputs[tmpIdx];
			let tmpDescriptor = tmpManifest.Descriptors ? tmpManifest.Descriptors[tmpAddress] : null;
			if (!tmpDescriptor)
			{
				return;
			}

			if (pField === 'Name')
			{
				if (tmpDescriptor.Name === pValue)
				{
					return;
				}
				tmpDescriptor.Name = pValue;
				// Auto-generate Hash from Name if hash is still auto-generated
				if (this._UtilitiesProvider._isAutoGeneratedInputHash(tmpDescriptor.Hash))
				{
					let tmpGroupHash = '';
					let tmpSection = tmpManifest.Sections[pSectionIndex];
					if (tmpSection && tmpSection.Groups && tmpSection.Groups[pGroupIndex])
					{
						tmpGroupHash = tmpSection.Groups[pGroupIndex].Hash || '';
					}
					tmpDescriptor.Hash = tmpGroupHash + '_' + this._UtilitiesProvider.sanitizeObjectKey(pValue);
				}
			}
			else if (pField === 'Hash')
			{
				tmpDescriptor.Hash = pValue;
			}
			else if (pField === 'Address')
			{
				// Move the Descriptor to the new key in the Descriptors map
				if (pValue !== tmpAddress && pValue.length > 0)
				{
					tmpManifest.Descriptors[pValue] = tmpDescriptor;
					delete tmpManifest.Descriptors[tmpAddress];
					// Update the DataAddress property on the descriptor itself
					tmpDescriptor.DataAddress = pValue;
				}
			}
		}
		else if (pTier === 'column')
		{
			let tmpSection = tmpManifest.Sections ? tmpManifest.Sections[pSectionIndex] : null;
			let tmpGroup = (tmpSection && Array.isArray(tmpSection.Groups)) ? tmpSection.Groups[pGroupIndex] : null;
			if (!tmpGroup || !tmpGroup.RecordManifest)
			{
				return;
			}

			let tmpRefManifest = this._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
			if (!tmpRefManifest || !tmpRefManifest.Descriptors)
			{
				return;
			}

			let tmpColIdx = (typeof pInputIndex === 'number') ? pInputIndex : 0;
			let tmpColAddresses = Object.keys(tmpRefManifest.Descriptors);
			if (tmpColIdx >= tmpColAddresses.length)
			{
				return;
			}

			let tmpColAddr = tmpColAddresses[tmpColIdx];
			let tmpColDesc = tmpRefManifest.Descriptors[tmpColAddr];
			if (!tmpColDesc)
			{
				return;
			}

			if (pField === 'Name')
			{
				if (tmpColDesc.Name === pValue)
				{
					return;
				}
				tmpColDesc.Name = pValue;
			}
			else if (pField === 'Hash')
			{
				if (pValue !== tmpColAddr && pValue.length > 0)
				{
					// Rename the Descriptor key in the ReferenceManifest
					tmpRefManifest.Descriptors[pValue] = tmpColDesc;
					delete tmpRefManifest.Descriptors[tmpColAddr];
					tmpColDesc.Hash = pValue;
				}
				else
				{
					tmpColDesc.Hash = pValue;
				}
			}
		}
	}

	/**
	 * Handle keydown events for the Form Overview tree fields.
	 * Enter on last field of row → add sibling.
	 * Enter on non-last field → move to next field in row.
	 * Escape → revert and re-render.
	 */
	_formOverviewHandleKeydown(pEvent, pTier, pSectionIndex, pGroupIndex, pRowIndex, pField, pInputIndex)
	{
		if (pEvent.key === 'Enter')
		{
			// Commit current field
			this._formOverviewCommitField(pTier, pSectionIndex, pGroupIndex, pRowIndex, pField, pEvent.target.value, pInputIndex);

			// Determine if this is the last field on the row
			let tmpIsLastField = false;
			if (pTier === 'section' && pField === 'Hash')
			{
				tmpIsLastField = true;
			}
			else if (pTier === 'group' && pField === 'Hash')
			{
				tmpIsLastField = true;
			}
			else if (pTier === 'input' && pField === 'Address')
			{
				tmpIsLastField = true;
			}
			else if (pTier === 'column' && pField === 'Hash')
			{
				tmpIsLastField = true;
			}

			if (tmpIsLastField)
			{
				// Add a sibling and focus its first field
				pEvent.preventDefault();
				if (pTier === 'section')
				{
					this._formOverviewAddSection();
				}
				else if (pTier === 'group')
				{
					this._formOverviewAddGroup(pSectionIndex);
				}
				else if (pTier === 'input')
				{
					this._formOverviewAddInput(pSectionIndex, pGroupIndex);
				}
				else if (pTier === 'column')
				{
					this._formOverviewAddColumn(pSectionIndex, pGroupIndex);
				}
			}
			else
			{
				// Move focus to the next field in this row
				pEvent.preventDefault();

				let tmpHash = this.Hash;
				let tmpNextField = '';
				if (pField === 'Name')
				{
					tmpNextField = 'Hash';
				}
				else if (pField === 'Hash' && pTier === 'input')
				{
					tmpNextField = 'Address';
				}

				let tmpTierCap = pTier.charAt(0).toUpperCase() + pTier.slice(1);
				let tmpNextId = `FormEditor-Overview-${tmpTierCap}-${tmpNextField}-${tmpHash}-${pSectionIndex}`;
				if (pTier === 'group' || pTier === 'input' || pTier === 'column')
				{
					tmpNextId += `-${pGroupIndex}`;
				}
				if (pTier === 'input')
				{
					tmpNextId += `-${pRowIndex}-${(typeof pInputIndex === 'number') ? pInputIndex : 0}`;
				}
				if (pTier === 'column')
				{
					tmpNextId += `-${(typeof pInputIndex === 'number') ? pInputIndex : 0}`;
				}

				let tmpNextEl = (typeof document !== 'undefined') ? document.getElementById(tmpNextId) : null;
				if (tmpNextEl)
				{
					tmpNextEl.focus();
					tmpNextEl.select();
				}
			}
		}
		else if (pEvent.key === 'Escape')
		{
			pEvent.target.blur();
			// Re-render to restore original values from manifest
			this._RenderingProvider.renderFormOverviewTabPanel();
		}
	}

	_formOverviewAddSection()
	{
		this._ManifestOpsProvider.addSection();
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpHash = this.Hash;
		let tmpManifest = this._resolveManifestData();
		let tmpNewIndex = tmpManifest.Sections.length - 1;
		setTimeout(function()
		{
			let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Section-Name-${tmpHash}-${tmpNewIndex}`) : null;
			if (tmpEl)
			{
				tmpEl.focus();
				tmpEl.select();
			}
		}, 20);
	}

	_formOverviewAddGroup(pSectionIndex)
	{
		this._ManifestOpsProvider.addGroup(pSectionIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpHash = this.Hash;
		let tmpManifest = this._resolveManifestData();
		let tmpSection = tmpManifest.Sections[pSectionIndex];
		let tmpNewIndex = tmpSection.Groups.length - 1;
		setTimeout(function()
		{
			let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Group-Name-${tmpHash}-${pSectionIndex}-${tmpNewIndex}`) : null;
			if (tmpEl)
			{
				tmpEl.focus();
				tmpEl.select();
			}
		}, 20);
	}

	_formOverviewAddInput(pSectionIndex, pGroupIndex)
	{
		this._ManifestOpsProvider.addRow(pSectionIndex, pGroupIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpSelf = this;
		let tmpHash = this.Hash;
		setTimeout(function()
		{
			let tmpRows = tmpSelf._ManifestOpsProvider.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
			let tmpLastRow = tmpRows.length - 1;
			let tmpLastInput = tmpRows[tmpLastRow].Inputs.length - 1;
			let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Input-Name-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${tmpLastRow}-${tmpLastInput}`) : null;
			if (tmpEl)
			{
				tmpEl.focus();
				tmpEl.select();
			}
		}, 20);
	}

	_formOverviewRemoveSection(pSectionIndex)
	{
		this._ManifestOpsProvider.removeSection(pSectionIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();
	}

	_formOverviewRemoveGroup(pSectionIndex, pGroupIndex)
	{
		this._ManifestOpsProvider.removeGroup(pSectionIndex, pGroupIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();
	}

	_formOverviewRemoveInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		this._ManifestOpsProvider.removeInput(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();
	}

	_formOverviewAddRow(pSectionIndex, pGroupIndex)
	{
		this._ManifestOpsProvider.addRow(pSectionIndex, pGroupIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpSelf = this;
		let tmpHash = this.Hash;
		setTimeout(function()
		{
			let tmpRows = tmpSelf._ManifestOpsProvider.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
			let tmpLastRow = tmpRows.length - 1;
			let tmpLastInput = tmpRows[tmpLastRow].Inputs.length - 1;
			let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Input-Name-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${tmpLastRow}-${tmpLastInput}`) : null;
			if (tmpEl)
			{
				tmpEl.focus();
				tmpEl.select();
			}
		}, 20);
	}

	_formOverviewAddInputToRow(pSectionIndex, pGroupIndex, pRowIndex)
	{
		// Row numbers are 1-based in the manifest
		let tmpRowNum = pRowIndex + 1;
		this._ManifestOpsProvider._addInputAtRow(pSectionIndex, pGroupIndex, tmpRowNum);
		this._ManifestOpsProvider._ParentFormEditor.renderVisualEditor();
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpSelf = this;
		let tmpHash = this.Hash;
		setTimeout(function()
		{
			let tmpRows = tmpSelf._ManifestOpsProvider.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
			if (pRowIndex < tmpRows.length)
			{
				let tmpLastInput = tmpRows[pRowIndex].Inputs.length - 1;
				let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Input-Name-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${pRowIndex}-${tmpLastInput}`) : null;
				if (tmpEl)
				{
					tmpEl.focus();
					tmpEl.select();
				}
			}
		}, 20);
	}

	_formOverviewAddColumn(pSectionIndex, pGroupIndex)
	{
		this._ManifestOpsProvider.addSubmanifestColumn(pSectionIndex, pGroupIndex);
		this._RenderingProvider.renderFormOverviewTabPanel();

		let tmpSelf = this;
		let tmpHash = this.Hash;
		setTimeout(function()
		{
			let tmpManifest = tmpSelf._resolveManifestData();
			let tmpSection = tmpManifest.Sections[pSectionIndex];
			let tmpGroup = tmpSection.Groups[pGroupIndex];
			let tmpRefManifest = tmpSelf._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
			if (tmpRefManifest && tmpRefManifest.Descriptors)
			{
				let tmpColCount = Object.keys(tmpRefManifest.Descriptors).length;
				let tmpEl = (typeof document !== 'undefined') ? document.getElementById(`FormEditor-Overview-Column-Name-${tmpHash}-${pSectionIndex}-${pGroupIndex}-${tmpColCount - 1}`) : null;
				if (tmpEl)
				{
					tmpEl.focus();
					tmpEl.select();
				}
			}
		}, 20);
	}

	_formOverviewRemoveColumn(pSectionIndex, pGroupIndex, pColumnAddress)
	{
		this._ManifestOpsProvider.removeSubmanifestColumn(pSectionIndex, pGroupIndex, pColumnAddress);
		this._RenderingProvider.renderFormOverviewTabPanel();
	}

	/* -------------------------------------------------------------------------- */
	/*                  Code Section: Form Overview Drag and Drop                 */
	/* -------------------------------------------------------------------------- */

	_formOverviewDragStart(pEvent, pTier, pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		this._overviewDragState = { tier: pTier, sectionIndex: pSectionIndex, groupIndex: pGroupIndex, rowIndex: pRowIndex, inputIndex: pInputIndex };
		pEvent.dataTransfer.effectAllowed = 'move';
		pEvent.dataTransfer.setData('text/plain', ''); // Required for Firefox
		pEvent.currentTarget.classList.add('pict-fe-overview-dragging');
		// Prevent child drag events from bubbling (e.g., dragging an input shouldn't start a section drag)
		pEvent.stopPropagation();
	}

	_formOverviewDragOver(pEvent, pTier, pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		if (!this._overviewDragState || this._overviewDragState.tier !== pTier)
		{
			return; // Only allow same-tier drops
		}

		pEvent.preventDefault();
		pEvent.stopPropagation();
		pEvent.dataTransfer.dropEffect = 'move';

		// Determine drop position based on mouse Y relative to element midpoint
		let tmpRect = pEvent.currentTarget.getBoundingClientRect();
		let tmpMidY = tmpRect.top + tmpRect.height / 2;

		// Clear previous indicators from all elements
		this._formOverviewClearDropIndicators();

		if (pEvent.clientY < tmpMidY)
		{
			pEvent.currentTarget.classList.add('pict-fe-overview-drop-above');
		}
		else
		{
			pEvent.currentTarget.classList.add('pict-fe-overview-drop-below');
		}
	}

	_formOverviewDrop(pEvent, pTier, pTargetSectionIndex, pTargetGroupIndex, pTargetRowIndex, pTargetInputIndex)
	{
		pEvent.preventDefault();
		pEvent.stopPropagation();

		let tmpDrag = this._overviewDragState;
		if (!tmpDrag || tmpDrag.tier !== pTier)
		{
			return;
		}

		// Clear all drag visual indicators
		this._formOverviewClearDragClasses();

		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			return;
		}

		// Determine insert position: above or below
		let tmpRect = pEvent.currentTarget.getBoundingClientRect();
		let tmpMidY = tmpRect.top + tmpRect.height / 2;
		let tmpInsertAfter = (pEvent.clientY >= tmpMidY);

		if (pTier === 'section')
		{
			let tmpSourceIdx = tmpDrag.sectionIndex;
			let tmpTargetIdx = pTargetSectionIndex;
			if (tmpSourceIdx === tmpTargetIdx)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSections = tmpManifest.Sections;
			let tmpSection = tmpSections.splice(tmpSourceIdx, 1)[0];
			// Recalculate target index after removal
			let tmpFinalIdx = tmpTargetIdx;
			if (tmpSourceIdx < tmpTargetIdx)
			{
				tmpFinalIdx--;
			}
			if (tmpInsertAfter)
			{
				tmpFinalIdx++;
			}
			tmpSections.splice(tmpFinalIdx, 0, tmpSection);
		}
		else if (pTier === 'group')
		{
			// Only allow reorder within the same section
			if (tmpDrag.sectionIndex !== pTargetSectionIndex)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSourceIdx = tmpDrag.groupIndex;
			let tmpTargetIdx = pTargetGroupIndex;
			if (tmpSourceIdx === tmpTargetIdx)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSection = tmpManifest.Sections[pTargetSectionIndex];
			let tmpGroups = tmpSection.Groups;
			let tmpGroup = tmpGroups.splice(tmpSourceIdx, 1)[0];
			let tmpFinalIdx = tmpTargetIdx;
			if (tmpSourceIdx < tmpTargetIdx)
			{
				tmpFinalIdx--;
			}
			if (tmpInsertAfter)
			{
				tmpFinalIdx++;
			}
			tmpGroups.splice(tmpFinalIdx, 0, tmpGroup);
		}
		else if (pTier === 'input')
		{
			// Allow reorder within the same group (possibly across rows)
			if (tmpDrag.sectionIndex !== pTargetSectionIndex || tmpDrag.groupIndex !== pTargetGroupIndex)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpRows = this._ManifestOpsProvider.getRowsForGroupByIndex(pTargetSectionIndex, pTargetGroupIndex);
			let tmpSourceRow = tmpRows[tmpDrag.rowIndex];
			let tmpTargetRow = tmpRows[pTargetRowIndex];
			if (!tmpSourceRow || !tmpTargetRow)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSourceAddress = tmpSourceRow.Inputs[tmpDrag.inputIndex];
			let tmpDescriptor = tmpManifest.Descriptors[tmpSourceAddress];
			if (!tmpDescriptor)
			{
				this._overviewDragState = null;
				return;
			}

			// If moving to a different row, update PictForm.Row
			if (tmpDrag.rowIndex !== pTargetRowIndex)
			{
				tmpDescriptor.PictForm.Row = pTargetRowIndex + 1;
			}

			// Reorder within the target row using Descriptor key reordering
			// Build the desired order by removing source and inserting at target position
			let tmpTargetInputIdx = (typeof pTargetInputIndex === 'number') ? pTargetInputIndex : 0;
			if (tmpDrag.rowIndex === pTargetRowIndex && tmpDrag.inputIndex === tmpTargetInputIdx)
			{
				this._overviewDragState = null;
				return; // No move needed
			}

			// Use _reorderDescriptorsForRow pattern: rebuild Descriptor key order
			let tmpAllKeys = Object.keys(tmpManifest.Descriptors);
			let tmpSourceKeyIdx = tmpAllKeys.indexOf(tmpSourceAddress);
			if (tmpSourceKeyIdx >= 0)
			{
				tmpAllKeys.splice(tmpSourceKeyIdx, 1);
			}

			// Find the target position in the global keys array
			if (pTargetRowIndex < tmpRows.length && tmpTargetRow.Inputs.length > 0)
			{
				let tmpRefAddress = tmpTargetRow.Inputs[Math.min(tmpTargetInputIdx, tmpTargetRow.Inputs.length - 1)];
				let tmpRefIdx = tmpAllKeys.indexOf(tmpRefAddress);
				if (tmpRefIdx >= 0)
				{
					if (tmpInsertAfter)
					{
						tmpRefIdx++;
					}
					tmpAllKeys.splice(tmpRefIdx, 0, tmpSourceAddress);
				}
				else
				{
					tmpAllKeys.push(tmpSourceAddress);
				}
			}
			else
			{
				tmpAllKeys.push(tmpSourceAddress);
			}

			// Rebuild the Descriptors object in the new key order
			let tmpNewDescriptors = {};
			for (let i = 0; i < tmpAllKeys.length; i++)
			{
				tmpNewDescriptors[tmpAllKeys[i]] = tmpManifest.Descriptors[tmpAllKeys[i]];
			}
			tmpManifest.Descriptors = tmpNewDescriptors;
		}
		else if (pTier === 'column')
		{
			// Reorder columns within the same tabular group
			if (tmpDrag.sectionIndex !== pTargetSectionIndex || tmpDrag.groupIndex !== pTargetGroupIndex)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSection = tmpManifest.Sections[pTargetSectionIndex];
			let tmpGroup = tmpSection.Groups[pTargetGroupIndex];
			let tmpRefManifest = this._ManifestOpsProvider._resolveReferenceManifest(tmpGroup.RecordManifest);
			if (!tmpRefManifest || !tmpRefManifest.Descriptors)
			{
				this._overviewDragState = null;
				return;
			}

			let tmpSourceIdx = tmpDrag.inputIndex;
			let tmpTargetIdx = (typeof pTargetInputIndex === 'number') ? pTargetInputIndex : 0;
			if (tmpSourceIdx === tmpTargetIdx)
			{
				this._overviewDragState = null;
				return;
			}

			// Rebuild Descriptors in new order
			let tmpKeys = Object.keys(tmpRefManifest.Descriptors);
			let tmpSourceKey = tmpKeys.splice(tmpSourceIdx, 1)[0];
			let tmpFinalIdx = tmpTargetIdx;
			if (tmpSourceIdx < tmpTargetIdx)
			{
				tmpFinalIdx--;
			}
			if (tmpInsertAfter)
			{
				tmpFinalIdx++;
			}
			tmpKeys.splice(tmpFinalIdx, 0, tmpSourceKey);

			let tmpNewDescriptors = {};
			for (let i = 0; i < tmpKeys.length; i++)
			{
				tmpNewDescriptors[tmpKeys[i]] = tmpRefManifest.Descriptors[tmpKeys[i]];
			}
			tmpRefManifest.Descriptors = tmpNewDescriptors;
		}

		this._overviewDragState = null;
		this._RenderingProvider.renderFormOverviewTabPanel();
		this.renderVisualEditor();
	}

	_formOverviewDragEnd(pEvent)
	{
		this._overviewDragState = null;
		this._formOverviewClearDragClasses();
	}

	_formOverviewClearDropIndicators()
	{
		if (typeof document === 'undefined')
		{
			return;
		}
		let tmpElements = document.querySelectorAll('.pict-fe-overview-drop-above, .pict-fe-overview-drop-below');
		for (let i = 0; i < tmpElements.length; i++)
		{
			tmpElements[i].classList.remove('pict-fe-overview-drop-above', 'pict-fe-overview-drop-below');
		}
	}

	_formOverviewClearDragClasses()
	{
		if (typeof document === 'undefined')
		{
			return;
		}
		this._formOverviewClearDropIndicators();
		let tmpElements = document.querySelectorAll('.pict-fe-overview-dragging');
		for (let i = 0; i < tmpElements.length; i++)
		{
			tmpElements[i].classList.remove('pict-fe-overview-dragging');
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Data Helpers                             */
	/* -------------------------------------------------------------------------- */

	_resolveManifestData()
	{
		let tmpAddress = this.options.ManifestDataAddress;
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
		let tmpAddress = this.options.ManifestDataAddress;
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

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Import (CSV / JSON)                      */
	/* -------------------------------------------------------------------------- */

	handleImportDrop(pEvent)
	{
		let tmpFiles = pEvent.dataTransfer ? pEvent.dataTransfer.files : [];
		if (tmpFiles.length < 1)
		{
			return;
		}
		let tmpFile = tmpFiles[0];
		let tmpName = tmpFile.name.toLowerCase();
		if (!tmpName.endsWith('.csv') && !tmpName.endsWith('.json'))
		{
			this._setImportStatus('error', 'Please drop a CSV or JSON file.');
			return;
		}
		this._readImportFile(tmpFile);
	}

	handleImportFileSelect(pEvent)
	{
		let tmpFiles = pEvent.target ? pEvent.target.files : [];
		if (tmpFiles.length < 1)
		{
			return;
		}
		this._readImportFile(tmpFiles[0]);
	}

	_readImportFile(pFile)
	{
		let tmpReader = new FileReader();
		tmpReader.onload = (pEvent) =>
		{
			let tmpContent = pEvent.target.result;
			let tmpName = pFile.name.toLowerCase();
			if (tmpName.endsWith('.json'))
			{
				this._processJSONContent(tmpContent, pFile.name);
			}
			else
			{
				this._processCSVContent(tmpContent, pFile.name);
			}
		};
		tmpReader.onerror = () =>
		{
			this._setImportStatus('error', `Error reading file: ${pFile.name}`);
		};
		tmpReader.readAsText(pFile);
	}

	_processCSVContent(pCSVContent, pFileName)
	{
		// Use Fable's CSVParser to parse the CSV line-by-line
		let tmpCSVParser = this.fable.instantiateServiceProviderWithoutRegistration('CSVParser');
		tmpCSVParser.EscapedQuoteString = '"';

		let tmpLines = pCSVContent.split('\n');
		let tmpRecords = [];

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i];
			if (tmpLine.trim().length === 0)
			{
				continue;
			}
			let tmpRecord = tmpCSVParser.parseCSVLine(tmpLine);
			if (tmpRecord)
			{
				tmpRecords.push(tmpRecord);
			}
		}

		if (tmpRecords.length === 0)
		{
			this._setImportStatus('error', 'No valid records found in CSV file.');
			this._showToast('error', 'No valid records found in CSV file.');
			return;
		}

		// Use ManifestFactory to generate form configurations
		let tmpManifestFactory = this.fable.instantiateServiceProviderWithoutRegistration('ManifestFactory');
		let tmpManifests = tmpManifestFactory.createManifestsFromTabularArray(tmpRecords);

		let tmpManifestKeys = Object.keys(tmpManifests);
		if (tmpManifestKeys.length === 0)
		{
			this._setImportStatus('error', 'CSV parsed but no valid form configurations were generated. Ensure the CSV has a "Form" column.');
			this._showToast('error', 'No form configurations generated. Ensure the CSV has a "Form" column.');
			return;
		}

		this._loadImportedManifests(tmpManifests, pFileName, 'CSV');
	}

	_processJSONContent(pJSONContent, pFileName)
	{
		let tmpParsed;
		try
		{
			tmpParsed = JSON.parse(pJSONContent);
		}
		catch (pError)
		{
			this._setImportStatus('error', `Invalid JSON: ${pError.message}`);
			this._showToast('error', 'Failed to parse JSON file.');
			return;
		}

		if (!tmpParsed || typeof tmpParsed !== 'object')
		{
			this._setImportStatus('error', 'JSON file did not contain a valid object.');
			this._showToast('error', 'JSON file did not contain a valid object.');
			return;
		}

		// Detect whether this is a single manifest or a multi-form bundle.
		// A single manifest has Descriptors and/or Sections at the top level.
		// A multi-form bundle is an object whose values are each manifests
		// (like the output of ManifestFactory).
		let tmpIsSingleManifest = (tmpParsed.Descriptors || tmpParsed.Sections);

		if (tmpIsSingleManifest)
		{
			// Wrap in a keyed object so _loadImportedManifests can handle it uniformly
			let tmpFormName = tmpParsed.Scope || tmpParsed.FormName || pFileName.replace(/\.json$/i, '');
			let tmpManifests = {};
			tmpManifests[tmpFormName] = tmpParsed;
			this._loadImportedManifests(tmpManifests, pFileName, 'JSON');
		}
		else
		{
			// Check if the values look like manifests (at least one has Descriptors or Sections)
			let tmpKeys = Object.keys(tmpParsed);
			let tmpHasManifestValues = false;
			for (let i = 0; i < tmpKeys.length; i++)
			{
				let tmpValue = tmpParsed[tmpKeys[i]];
				if (tmpValue && typeof tmpValue === 'object' && (tmpValue.Descriptors || tmpValue.Sections))
				{
					tmpHasManifestValues = true;
					break;
				}
			}

			if (tmpHasManifestValues)
			{
				this._loadImportedManifests(tmpParsed, pFileName, 'JSON');
			}
			else
			{
				this._setImportStatus('error', 'JSON file does not appear to contain a valid form manifest. Expected an object with Descriptors and/or Sections.');
				this._showToast('error', 'JSON does not contain a valid form manifest.');
			}
		}
	}

	/**
	 * Common handler for loading imported manifests (from CSV or JSON).
	 *
	 * @param {object} pManifests - Keyed object of form manifests
	 * @param {string} pFileName - Original file name
	 * @param {string} pSourceType - 'CSV' or 'JSON' for display purposes
	 */
	_loadImportedManifests(pManifests, pFileName, pSourceType)
	{
		let tmpManifestKeys = Object.keys(pManifests);
		if (tmpManifestKeys.length === 0)
		{
			this._setImportStatus('error', `${pSourceType} parsed but no valid form configurations were found.`);
			this._showToast('error', `No form configurations found in ${pSourceType} file.`);
			return;
		}

		// Load the first manifest into the editor data address.
		// Do NOT call this.render() here — that rebuilds the entire tab shell
		// and destroys the import panel the user is looking at.  Each tab lazily
		// renders its own content when switched to, so the data will be picked
		// up automatically.
		let tmpFirstKey = tmpManifestKeys[0];
		let tmpFirstManifest = pManifests[tmpFirstKey];
		this._ManifestOpsProvider.stripRowsFromManifest(tmpFirstManifest);
		this._setManifestData(tmpFirstManifest);
		this._ManifestOpsProvider.normalizeAllRowNumbers();

		// Emit event with all manifests for the host application to handle
		// (fire before toast so the selector is updated first)
		if (typeof this.onImport === 'function')
		{
			this.onImport(pManifests, pFileName);
		}

		// Build a toast notification
		let tmpDescriptorCount = Object.keys(tmpFirstManifest.Descriptors || {}).length;
		let tmpSectionCount = (tmpFirstManifest.Sections || []).length;
		let tmpToastMessage = `Loaded \u201C${tmpFirstKey}\u201D \u2014 ${tmpDescriptorCount} descriptors, ${tmpSectionCount} section${tmpSectionCount !== 1 ? 's' : ''}`;

		if (tmpManifestKeys.length > 1)
		{
			tmpToastMessage += ` \u00B7 ${tmpManifestKeys.length - 1} additional form${tmpManifestKeys.length > 2 ? 's' : ''} added to selector`;
		}

		this._showToast('success', tmpToastMessage);

		// Also update the in-tab status area (persists when user returns to import tab)
		let tmpStatusParts = [];
		tmpStatusParts.push(`Loaded <strong>${this._UtilitiesProvider._escapeHTML(tmpFirstKey)}</strong> from ${pSourceType} (${tmpDescriptorCount} descriptors, ${tmpSectionCount} sections)`);

		if (tmpManifestKeys.length > 1)
		{
			tmpStatusParts.push(`<br/>${tmpManifestKeys.length - 1} additional form(s) found: ${tmpManifestKeys.slice(1).map((pKey) => '<strong>' + this._UtilitiesProvider._escapeHTML(pKey) + '</strong>').join(', ')}`);
			tmpStatusParts.push('<br/>These have been added to the Load Configuration selector.');
		}

		this._setImportStatus('success', tmpStatusParts.join(''));
	}

	_setImportStatus(pType, pMessage)
	{
		let tmpHash = this.Hash;
		let tmpStatusClass = (pType === 'error') ? 'pict-fe-import-status-error' : 'pict-fe-import-status-success';
		let tmpHTML = `<div class="${tmpStatusClass}">${pMessage}</div>`;
		this.pict.ContentAssignment.assignContent(`#FormEditor-ImportStatus-${tmpHash}`, tmpHTML);
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Export (CSV / JSON)                       */
	/* -------------------------------------------------------------------------- */

	/**
	 * Export the current manifest as a JSON file download.
	 */
	exportJSON()
	{
		let tmpManifest = this._ManifestOpsProvider.getCleanManifestForExport();
		if (!tmpManifest)
		{
			this._showToast('error', 'No manifest data to export.');
			return;
		}

		let tmpJSON = JSON.stringify(tmpManifest, null, '\t');
		let tmpFileName = tmpManifest.Scope || tmpManifest.Form || 'manifest';
		this._triggerFileDownload(tmpFileName + '.json', tmpJSON, 'application/json');
		this._showToast('success', `Exported JSON: ${tmpFileName}.json`);
	}

	/**
	 * Export the current manifest as a CSV file download.
	 *
	 * Uses ManifestConversionToCSV from pict-section-form to convert the
	 * manifest to a tabular array, then formats as a CSV string.
	 */
	exportCSV()
	{
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest)
		{
			this._showToast('error', 'No manifest data to export.');
			return;
		}

		// Instantiate the conversion service without registering it globally
		let tmpConverter = this.fable.instantiateServiceProviderWithoutRegistration('ManifestConversionToCSV', {}, `${this.UUID}-CSVExport`);

		let tmpCSVDataArray = tmpConverter.createTabularArrayFromManifests(tmpManifest);

		if (!tmpCSVDataArray || tmpCSVDataArray.length === 0)
		{
			this._showToast('error', 'Could not convert manifest to CSV.');
			return;
		}

		// Convert the 2D array to a CSV string with proper escaping
		let tmpCSVLines = [];
		for (let i = 0; i < tmpCSVDataArray.length; i++)
		{
			let tmpRow = tmpCSVDataArray[i];
			let tmpEscapedRow = [];
			for (let j = 0; j < tmpRow.length; j++)
			{
				let tmpCell = tmpRow[j];
				if ((typeof tmpCell === 'string') && ((tmpCell.indexOf(',') >= 0) || (tmpCell.indexOf('"') >= 0) || (tmpCell.indexOf('\n') >= 0)))
				{
					tmpEscapedRow.push('"' + tmpCell.replace(/"/g, '""') + '"');
				}
				else
				{
					tmpEscapedRow.push(tmpCell);
				}
			}
			tmpCSVLines.push(tmpEscapedRow.join(','));
		}
		let tmpCSVString = tmpCSVLines.join('\n');

		let tmpFileName = tmpManifest.Scope || tmpManifest.Form || 'manifest';
		this._triggerFileDownload(tmpFileName + '.csv', tmpCSVString, 'text/csv');
		this._showToast('success', `Exported CSV: ${tmpFileName}.csv`);
	}

	/**
	 * Trigger a browser file download from an in-memory string.
	 *
	 * @param {string} pFileName - The suggested file name
	 * @param {string} pContent - The file content
	 * @param {string} pMimeType - MIME type for the blob
	 */
	_triggerFileDownload(pFileName, pContent, pMimeType)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpBlob = new Blob([pContent], { type: pMimeType });
		let tmpURL = URL.createObjectURL(tmpBlob);

		let tmpLink = document.createElement('a');
		tmpLink.href = tmpURL;
		tmpLink.download = pFileName;
		tmpLink.style.display = 'none';
		document.body.appendChild(tmpLink);
		tmpLink.click();

		// Clean up
		document.body.removeChild(tmpLink);
		URL.revokeObjectURL(tmpURL);
	}

	/* -------------------------------------------------------------------------- */
	/*               Code Section: Extended Descriptor Properties                 */
	/* -------------------------------------------------------------------------- */

	/**
	 * Add an extended descriptor property to the Input properties panel.
	 *
	 * @param {string} pAddress - Dot-notation path relative to the Descriptor (e.g. 'PictForm.Units')
	 * @param {string} [pName] - Display label (defaults to the last segment of the address)
	 * @param {string} [pDataType] - 'String' (default), 'Number', or 'Boolean'
	 * @param {string} [pDescription] - Tooltip / placeholder text
	 */
	addExtendedDescriptorProperty(pAddress, pName, pDataType, pDescription)
	{
		if (typeof pAddress !== 'string' || pAddress.length === 0)
		{
			return;
		}

		// Avoid duplicates
		for (let i = 0; i < this._ExtendedDescriptorProperties.length; i++)
		{
			if (this._ExtendedDescriptorProperties[i].Address === pAddress)
			{
				return;
			}
		}

		let tmpSegments = pAddress.split('.');
		let tmpDefaultName = tmpSegments[tmpSegments.length - 1];

		this._ExtendedDescriptorProperties.push(
		{
			Name: pName || tmpDefaultName,
			Address: pAddress,
			DataType: pDataType || 'String',
			Description: pDescription || ''
		});
	}

	/**
	 * Remove an extended descriptor property by address.
	 *
	 * @param {string} pAddress - Dot-notation path to remove
	 */
	removeExtendedDescriptorProperty(pAddress)
	{
		for (let i = 0; i < this._ExtendedDescriptorProperties.length; i++)
		{
			if (this._ExtendedDescriptorProperties[i].Address === pAddress)
			{
				this._ExtendedDescriptorProperties.splice(i, 1);
				return;
			}
		}
	}

	/**
	 * Show a floating toast notification inside the form editor.
	 *
	 * @param {string} pType - 'success' or 'error'
	 * @param {string} pMessage - Plain text message to display
	 * @param {number} [pDuration] - Auto-dismiss in ms (default 4000)
	 */
	_showToast(pType, pMessage, pDuration)
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpDuration = (typeof pDuration === 'number') ? pDuration : 4000;

		// Find or create the toast container anchored inside the editor wrapper
		let tmpContainerId = `FormEditor-ToastContainer-${this.Hash}`;
		let tmpContainer = document.getElementById(tmpContainerId);
		if (!tmpContainer)
		{
			tmpContainer = document.createElement('div');
			tmpContainer.id = tmpContainerId;
			tmpContainer.className = 'pict-fe-toast-container';
			// Attach inside the editor wrapper so it stays positioned within the editor
			let tmpWrap = document.getElementById(`FormEditor-Wrap-${this.Hash}`);
			if (tmpWrap)
			{
				tmpWrap.appendChild(tmpContainer);
			}
			else
			{
				document.body.appendChild(tmpContainer);
			}
		}

		// Create the toast element
		let tmpToast = document.createElement('div');
		tmpToast.className = 'pict-fe-toast pict-fe-toast-' + pType;
		tmpToast.textContent = pMessage;

		tmpContainer.appendChild(tmpToast);

		// Trigger the enter animation on next frame
		requestAnimationFrame(() =>
		{
			tmpToast.classList.add('pict-fe-toast-visible');
		});

		// Auto-dismiss
		let tmpDismiss = () =>
		{
			tmpToast.classList.remove('pict-fe-toast-visible');
			tmpToast.classList.add('pict-fe-toast-exit');
			tmpToast.addEventListener('transitionend', () =>
			{
				if (tmpToast.parentNode)
				{
					tmpToast.parentNode.removeChild(tmpToast);
				}
			});
			// Fallback removal if transitionend doesn't fire
			setTimeout(() =>
			{
				if (tmpToast.parentNode)
				{
					tmpToast.parentNode.removeChild(tmpToast);
				}
			}, 400);
		};

		setTimeout(tmpDismiss, tmpDuration);

		// Also allow click to dismiss
		tmpToast.addEventListener('click', tmpDismiss);
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Content Editor                           */
	/* -------------------------------------------------------------------------- */

	/**
	 * Open the content editor overlay for a Markdown or HTML input.
	 *
	 * Creates a modal overlay with the pict-section-markdowneditor embedded,
	 * pre-loaded with the descriptor's Content property. Falls back to a plain
	 * textarea if CodeMirror modules are not available.
	 *
	 * @param {number} pSectionIndex
	 * @param {number} pGroupIndex
	 * @param {number} pRowIndex
	 * @param {number} pInputIndex
	 */
	openContentEditor(pSectionIndex, pGroupIndex, pRowIndex, pInputIndex)
	{
		// Resolve the descriptor
		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Sections)
		{
			return;
		}

		let tmpRows = this._ManifestOpsProvider.getRowsForGroupByIndex(pSectionIndex, pGroupIndex);
		let tmpRow = (pRowIndex >= 0 && pRowIndex < tmpRows.length) ? tmpRows[pRowIndex] : null;
		let tmpDescriptor = null;
		let tmpInputType = '';

		if (tmpRow && Array.isArray(tmpRow.Inputs))
		{
			let tmpAddress = tmpRow.Inputs[pInputIndex];
			if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
			{
				tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
				tmpInputType = (tmpDescriptor.PictForm && tmpDescriptor.PictForm.InputType) ? tmpDescriptor.PictForm.InputType : '';
			}
		}

		if (!tmpDescriptor)
		{
			return;
		}

		// Close any existing content editor first (before setting new context)
		this.closeContentEditor();

		// Read existing content
		let tmpContent = tmpDescriptor.Content || tmpDescriptor.Default || '';

		// Store context
		this._ContentEditorContext =
		{
			SectionIndex: pSectionIndex,
			GroupIndex: pGroupIndex,
			RowIndex: pRowIndex,
			InputIndex: pInputIndex
		};

		// Load content into the segments data address
		this.pict.AppData.FormEditor = this.pict.AppData.FormEditor || {};
		this.pict.AppData.FormEditor.ContentEditorSegments = [{ Content: tmpContent }];

		let tmpViewRef = this._browserViewRef();
		let tmpEditorId = `FormEditor-ContentEditor-${this.Hash}`;
		let tmpInputName = tmpDescriptor.Name || tmpDescriptor.Hash || 'Input';

		if (typeof document !== 'undefined')
		{
			// Create the backdrop overlay
			let tmpOverlay = document.createElement('div');
			tmpOverlay.id = `${tmpEditorId}-Overlay`;
			tmpOverlay.className = 'pict-fe-content-editor-overlay';
			tmpOverlay.onclick = function() { eval(tmpViewRef + '.closeContentEditor()'); };

			// Create the editor container
			let tmpEditorContainer = document.createElement('div');
			tmpEditorContainer.id = tmpEditorId;
			tmpEditorContainer.className = 'pict-fe-content-editor';
			tmpEditorContainer.onclick = function(e) { e.stopPropagation(); };

			// Header
			let tmpHeaderHTML = '';
			tmpHeaderHTML += '<div class="pict-fe-content-editor-header">';
			tmpHeaderHTML += `<div class="pict-fe-content-editor-title">${tmpInputType} Content: ${this._UtilitiesProvider._escapeHTML(tmpInputName)}</div>`;
			tmpHeaderHTML += `<button class="pict-fe-content-editor-close" onclick="${tmpViewRef}.closeContentEditor()">Save &amp; Close</button>`;
			tmpHeaderHTML += '</div>';

			// Body (target for the markdown editor)
			tmpHeaderHTML += `<div class="pict-fe-content-editor-body" id="FormEditor-ContentEditor-Body-${this.Hash}"></div>`;

			tmpEditorContainer.innerHTML = tmpHeaderHTML;

			// Append as siblings on document.body (same pattern as InputType picker)
			document.body.appendChild(tmpOverlay);
			document.body.appendChild(tmpEditorContainer);

			// Try to render the markdown editor into the body container
			let tmpUseFallback = false;

			try
			{
				// Destroy any existing CodeMirror editors from a previous open
				this._ContentEditorView.destroy();

				// Reset the initial render flag so the markdown editor fully
				// re-initializes its UI (the DOM target is re-created each time
				// the modal opens, so onAfterInitialRender must run again).
				this._ContentEditorView.initialRenderComplete = false;

				this._ContentEditorView.render();

				// Check if CodeMirror modules are available
				if (!this._ContentEditorView._codeMirrorModules)
				{
					tmpUseFallback = true;
				}
			}
			catch (pError)
			{
				this.log.warn(`Content editor markdown view failed to render: ${pError.message}`);
				tmpUseFallback = true;
			}

			if (tmpUseFallback)
			{
				// Fallback to a plain textarea
				let tmpBodyEl = document.getElementById(`FormEditor-ContentEditor-Body-${this.Hash}`);
				if (tmpBodyEl)
				{
					let tmpEscapedContent = this._UtilitiesProvider._escapeHTML(tmpContent);
					tmpBodyEl.innerHTML = `<textarea class="pict-fe-content-editor-fallback" id="FormEditor-ContentEditor-Fallback-${this.Hash}">${tmpEscapedContent}</textarea>`;
				}
			}
		}
	}

	/**
	 * Close the content editor overlay, saving the content back to the descriptor.
	 */
	closeContentEditor()
	{
		let tmpEditorId = `FormEditor-ContentEditor-${this.Hash}`;

		// Read content from the fallback textarea if it exists, otherwise from the markdown editor
		if (this._ContentEditorContext && typeof document !== 'undefined')
		{
			let tmpFallbackEl = document.getElementById(`FormEditor-ContentEditor-Fallback-${this.Hash}`);
			if (tmpFallbackEl)
			{
				this._setContentEditorValue(tmpFallbackEl.value);
			}
			else
			{
				// Marshal from the markdown editor
				let tmpContent = this._ContentEditorView.getAllContent();
				this._setContentEditorValue(tmpContent);
			}
		}

		// Destroy CodeMirror editors to prevent memory leaks
		if (this._ContentEditorView)
		{
			this._ContentEditorView.destroy();
		}

		// Remove overlay
		if (typeof document !== 'undefined')
		{
			let tmpOverlayId = `${tmpEditorId}-Overlay`;
			let tmpOverlay = document.getElementById(tmpOverlayId);
			if (tmpOverlay && tmpOverlay.parentNode)
			{
				tmpOverlay.parentNode.removeChild(tmpOverlay);
			}

			// Remove editor container
			let tmpEditor = document.getElementById(tmpEditorId);
			if (tmpEditor && tmpEditor.parentNode)
			{
				tmpEditor.parentNode.removeChild(tmpEditor);
			}
		}

		this._ContentEditorContext = null;

		// Refresh the visual editor and properties panel
		this.renderVisualEditor();
	}

	/**
	 * Write content back to the descriptor's Content property.
	 *
	 * @param {string} pContent - The content string to store
	 */
	_setContentEditorValue(pContent)
	{
		if (!this._ContentEditorContext)
		{
			return;
		}

		let tmpManifest = this._resolveManifestData();
		if (!tmpManifest || !tmpManifest.Sections)
		{
			return;
		}

		let tmpCtx = this._ContentEditorContext;
		let tmpRows = this._ManifestOpsProvider.getRowsForGroupByIndex(tmpCtx.SectionIndex, tmpCtx.GroupIndex);
		let tmpRow = (tmpCtx.RowIndex >= 0 && tmpCtx.RowIndex < tmpRows.length) ? tmpRows[tmpCtx.RowIndex] : null;

		if (tmpRow && Array.isArray(tmpRow.Inputs))
		{
			let tmpAddress = tmpRow.Inputs[tmpCtx.InputIndex];
			if (typeof tmpAddress === 'string' && tmpManifest.Descriptors && tmpManifest.Descriptors[tmpAddress])
			{
				let tmpDescriptor = tmpManifest.Descriptors[tmpAddress];
				if (pContent && pContent.length > 0)
				{
					tmpDescriptor.Content = pContent;
				}
				else
				{
					delete tmpDescriptor.Content;
				}
			}
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                     Code Section: Utility                                  */
	/* -------------------------------------------------------------------------- */

	_browserViewRef()
	{
		return `${this.pict.browserAddress}.views['${this.Hash}']`;
	}

	// Proxy methods for the InputType picker child view.
	// The picker's inline onclick handlers reference the parent form editor's
	// browser view ref, so these must exist on the parent to route calls through.
	commitEditInputType(pInputTypeHash)
	{
		this._InputTypePickerView.commitEditInputType(pInputTypeHash);
	}

	closeInputTypePicker()
	{
		this._InputTypePickerView.closeInputTypePicker();
	}

	_onInputTypePickerSearch(pQuery)
	{
		this._InputTypePickerView._onInputTypePickerSearch(pQuery);
	}
}

module.exports = PictViewFormEditor;
