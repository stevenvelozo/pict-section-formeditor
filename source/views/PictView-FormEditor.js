const libPictView = require('pict-view');
const libPictSectionObjectEditor = require('pict-section-objecteditor');
const libPictSectionCode = require('pict-section-code');
const libPictSectionContent = require('pict-section-content');

const _DefaultConfiguration = require('../Pict-Section-FormEditor-DefaultConfiguration.js');
const libFormEditorIconography = require('../providers/Pict-Provider-FormEditorIconography.js');
const libFormEditorUtilities = require('../providers/Pict-Provider-FormEditorUtilities.js');
const libFormEditorDragDrop = require('../providers/Pict-Provider-FormEditorDragDrop.js');
const libFormEditorInlineEditing = require('./PictView-FormEditor-InlineEditing.js');
const libFormEditorInputTypePicker = require('./PictView-FormEditor-InputTypePicker.js');
const libFormEditorRendering = require('../providers/Pict-Provider-FormEditorRendering.js');
const libFormEditorManifestOps = require('../providers/Pict-Provider-FormEditorManifestOps.js');
const libChildPictManager = require('../providers/Pict-Provider-ChildPictManager.js');
const libFormEditorDocumentation = require('../providers/Pict-Provider-FormEditorDocumentation.js');

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

		this._ActiveTab = tmpOptions.ActiveTab || 'visual';

		// Child view references
		this._ObjectEditorView = null;
		this._CodeEditorView = null;
		this._SolverCodeEditorView = null;
		this._HelpContentView = null;
		this._HelpContentProvider = null;
		this._DocumentationProvider = null;

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

		// Create the documentation provider for the embedded help system
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
				ReadOnly: false,
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

		this.renderVisualEditor();
		this._syncTabState();
	}

	renderVisualEditor()
	{
		return this._RenderingProvider.renderVisualEditor();
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
			this._UtilitiesProvider._updateCodeEditor();
		}
		else if (pTabName === 'visual')
		{
			this.renderVisualEditor();
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
	}

	_syncTabState()
	{
		let tmpHash = this.Hash;
		let tmpTabs = ['visual', 'solvereditor', 'solvers', 'listdata', 'entitydata', 'objecteditor', 'json'];
		let tmpTabNames = ['Visual', 'SolverEditor', 'Solvers', 'ListData', 'EntityData', 'ObjectEditor', 'JSON'];

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
	/*                     Code Section: Utility                                  */
	/* -------------------------------------------------------------------------- */

	_browserViewRef()
	{
		return `${this.pict.browserAddress}.views['${this.Hash}']`;
	}
}

module.exports = PictViewFormEditor;
