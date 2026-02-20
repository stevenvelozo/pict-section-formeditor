/**
 * Pict Provider: Form Editor Iconography
 *
 * Provides cohesive SVG icons for the Form Editor UI, organized by category:
 *   - Section  — structural grouping of the form
 *   - Group    — a logical container within a section
 *   - Row      — a horizontal row of inputs
 *   - Input    — a single form input/field
 *   - InputType — icons for specific InputType definitions
 *
 * Each category supports multiple named variants.  Every variant is an SVG
 * string template that can be rendered directly into HTML.
 *
 * Embedders can override or add icons via the constructor options or the
 * setIcon() / setInputTypeIcon() methods.
 *
 * @license MIT
 * @author Steven Velozo <steven@velozo.com>
 */

const _DefaultProviderConfiguration = (
{
	ProviderIdentifier: 'Pict-FormEditor-Iconography',
	AutoInitialize: true,
	AutoInitializeOrdinal: 0,
	AutoSolveWithApp: false,

	// The default size for icons (pixels).
	// Consumers can override per-call via the pSize parameter.
	DefaultIconSize: 24,

	// Stroke width for all line-based icons (relative to a 24x24 viewbox)
	StrokeWidth: 1.5,

	// Color tokens (consumers can override to match their theme)
	Colors:
	{
		// Primary stroke/fill for structural icons
		Primary: '#3D3229',
		// Secondary stroke for accents
		Accent: '#9E6B47',
		// Muted color for subtle elements
		Muted: '#B0A89E',
		// Lighter fill for backgrounds inside icons
		Fill: '#F5F0E8'
	}
});

class PictProviderFormEditorIconography
{
	constructor(pOptions)
	{
		// Merge default config with passed options
		this.options = Object.assign({},
			JSON.parse(JSON.stringify(_DefaultProviderConfiguration)),
			pOptions);

		// Internal icon registries, keyed by category then variant name
		// Each entry is a function(pSize, pColors) that returns an SVG string
		this._Icons =
		{
			Section: {},
			Group: {},
			Row: {},
			Input: {},
			Action: {}
		};

		// InputType icons, keyed by InputType Hash
		this._InputTypeIcons = {};

		// DataType icons, keyed by Manyfest DataType name
		this._DataTypeIcons = {};

		// Populate built-in icons
		this._registerBuiltInIcons();
		this._registerBuiltInInputTypeIcons();
		this._registerBuiltInDataTypeIcons();

		// Apply any icon overrides from options
		if (pOptions && pOptions.IconOverrides && typeof pOptions.IconOverrides === 'object')
		{
			let tmpCategories = Object.keys(pOptions.IconOverrides);
			for (let i = 0; i < tmpCategories.length; i++)
			{
				let tmpCategory = tmpCategories[i];
				let tmpVariants = pOptions.IconOverrides[tmpCategory];
				if (tmpVariants && typeof tmpVariants === 'object')
				{
					let tmpVariantNames = Object.keys(tmpVariants);
					for (let j = 0; j < tmpVariantNames.length; j++)
					{
						this.setIcon(tmpCategory, tmpVariantNames[j], tmpVariants[tmpVariantNames[j]]);
					}
				}
			}
		}

		// Apply InputType icon overrides from options
		if (pOptions && pOptions.InputTypeIconOverrides && typeof pOptions.InputTypeIconOverrides === 'object')
		{
			let tmpHashes = Object.keys(pOptions.InputTypeIconOverrides);
			for (let i = 0; i < tmpHashes.length; i++)
			{
				this.setInputTypeIcon(tmpHashes[i], pOptions.InputTypeIconOverrides[tmpHashes[i]]);
			}
		}

		// Apply DataType icon overrides from options
		if (pOptions && pOptions.DataTypeIconOverrides && typeof pOptions.DataTypeIconOverrides === 'object')
		{
			let tmpHashes = Object.keys(pOptions.DataTypeIconOverrides);
			for (let i = 0; i < tmpHashes.length; i++)
			{
				this.setDataTypeIcon(tmpHashes[i], pOptions.DataTypeIconOverrides[tmpHashes[i]]);
			}
		}
	}

	/* ======================================================================== */
	/*                           Public API                                      */
	/* ======================================================================== */

	/**
	 * Get an SVG icon string for a structural element.
	 *
	 * @param {string} pCategory  - 'Section', 'Group', 'Row', or 'Input'
	 * @param {string} pVariant   - The named variant (e.g. 'Default', 'Folder', 'Stack')
	 * @param {number} [pSize]    - Icon width/height in pixels (default: options.DefaultIconSize)
	 * @return {string} An SVG string, or an empty string if not found
	 */
	getIcon(pCategory, pVariant, pSize)
	{
		let tmpSize = (typeof pSize === 'number' && pSize > 0) ? pSize : this.options.DefaultIconSize;

		if (!this._Icons[pCategory])
		{
			return '';
		}

		let tmpFactory = this._Icons[pCategory][pVariant];
		if (typeof tmpFactory !== 'function')
		{
			// Fall back to 'Default' variant
			tmpFactory = this._Icons[pCategory]['Default'];
		}

		if (typeof tmpFactory !== 'function')
		{
			return '';
		}

		return tmpFactory(tmpSize, this.options.Colors, this.options.StrokeWidth);
	}

	/**
	 * Get an SVG icon string for a specific InputType.
	 *
	 * @param {string} pInputTypeHash - The InputType Hash (e.g. 'TextArea', 'Boolean')
	 * @param {number} [pSize]        - Icon width/height in pixels
	 * @return {string} An SVG string, or an empty string if not found
	 */
	getInputTypeIcon(pInputTypeHash, pSize)
	{
		let tmpSize = (typeof pSize === 'number' && pSize > 0) ? pSize : this.options.DefaultIconSize;

		let tmpFactory = this._InputTypeIcons[pInputTypeHash];
		if (typeof tmpFactory !== 'function')
		{
			return '';
		}

		return tmpFactory(tmpSize, this.options.Colors, this.options.StrokeWidth);
	}

	/**
	 * Register or override a structural icon variant.
	 *
	 * @param {string}   pCategory - 'Section', 'Group', 'Row', or 'Input'
	 * @param {string}   pVariant  - The variant name
	 * @param {function} pFactory  - A function(pSize, pColors, pStrokeWidth) returning an SVG string
	 */
	setIcon(pCategory, pVariant, pFactory)
	{
		if (!this._Icons[pCategory])
		{
			this._Icons[pCategory] = {};
		}
		this._Icons[pCategory][pVariant] = pFactory;
	}

	/**
	 * Register or override an InputType icon.
	 *
	 * @param {string}   pInputTypeHash - The InputType Hash
	 * @param {function} pFactory       - A function(pSize, pColors, pStrokeWidth) returning an SVG string
	 */
	setInputTypeIcon(pInputTypeHash, pFactory)
	{
		this._InputTypeIcons[pInputTypeHash] = pFactory;
	}

	/**
	 * Get an array of all registered variant names for a category.
	 *
	 * @param {string} pCategory - 'Section', 'Group', 'Row', or 'Input'
	 * @return {Array} Variant name strings
	 */
	getVariants(pCategory)
	{
		if (!this._Icons[pCategory])
		{
			return [];
		}
		return Object.keys(this._Icons[pCategory]);
	}

	/**
	 * Get an array of all registered InputType icon hashes.
	 *
	 * @return {Array} InputType Hash strings
	 */
	getInputTypeIconHashes()
	{
		return Object.keys(this._InputTypeIcons);
	}

	/**
	 * Check whether a given category + variant is registered.
	 *
	 * @param {string} pCategory - 'Section', 'Group', 'Row', or 'Input'
	 * @param {string} pVariant  - The variant name
	 * @return {boolean}
	 */
	hasIcon(pCategory, pVariant)
	{
		return !!(this._Icons[pCategory] && typeof this._Icons[pCategory][pVariant] === 'function');
	}

	/**
	 * Check whether a given InputType has a registered icon.
	 *
	 * @param {string} pInputTypeHash - The InputType Hash
	 * @return {boolean}
	 */
	hasInputTypeIcon(pInputTypeHash)
	{
		return typeof this._InputTypeIcons[pInputTypeHash] === 'function';
	}

	/**
	 * Get an SVG icon string for a specific Manyfest DataType.
	 *
	 * @param {string} pDataTypeHash - The DataType name (e.g. 'String', 'Number', 'Boolean')
	 * @param {number} [pSize]       - Icon width/height in pixels
	 * @return {string} An SVG string, or an empty string if not found
	 */
	getDataTypeIcon(pDataTypeHash, pSize)
	{
		let tmpSize = (typeof pSize === 'number' && pSize > 0) ? pSize : this.options.DefaultIconSize;

		let tmpFactory = this._DataTypeIcons[pDataTypeHash];
		if (typeof tmpFactory !== 'function')
		{
			return '';
		}

		return tmpFactory(tmpSize, this.options.Colors, this.options.StrokeWidth);
	}

	/**
	 * Register or override a DataType icon.
	 *
	 * @param {string}   pDataTypeHash - The DataType name
	 * @param {function} pFactory      - A function(pSize, pColors, pStrokeWidth) returning an SVG string
	 */
	setDataTypeIcon(pDataTypeHash, pFactory)
	{
		this._DataTypeIcons[pDataTypeHash] = pFactory;
	}

	/**
	 * Get an array of all registered DataType icon names.
	 *
	 * @return {Array} DataType name strings
	 */
	getDataTypeIconHashes()
	{
		return Object.keys(this._DataTypeIcons);
	}

	/**
	 * Check whether a given DataType has a registered icon.
	 *
	 * @param {string} pDataTypeHash - The DataType name
	 * @return {boolean}
	 */
	hasDataTypeIcon(pDataTypeHash)
	{
		return typeof this._DataTypeIcons[pDataTypeHash] === 'function';
	}

	/* ======================================================================== */
	/*                    Built-in Structural Icons                              */
	/* ======================================================================== */

	/**
	 * All built-in icons use a 24x24 viewBox, rendered as line-art SVGs with
	 * configurable size, colors, and stroke width.  The design language is
	 * cohesive: rounded strokes, consistent weight, geometric shapes with
	 * subtle fills to distinguish hierarchy levels.
	 *
	 *   Section = page/document metaphor (largest container)
	 *   Group   = folder/panel metaphor (container within section)
	 *   Row     = horizontal bar/layer metaphor
	 *   Input   = field/data entry metaphor (smallest unit)
	 */
	_registerBuiltInIcons()
	{
		let tmpSelf = this;

		// Helper to create an SVG wrapper
		function _svg(pSize, pInner)
		{
			return '<svg xmlns="http://www.w3.org/2000/svg" width="' + pSize + '" height="' + pSize + '" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' + pInner + '</svg>';
		}

		// ===== SECTION ICONS (11 variants) =====

		// 1. Default — stacked cards (visual metaphor: sections stack vertically)
		this._Icons.Section['Default'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="4" y="2" width="16" height="6" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="4" y="10" width="16" height="6" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="4" y="18" width="16" height="4" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 2. Document — page with corner fold
		this._Icons.Section['Document'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="14 2 14 8 20 8" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 3. Layers — stacked pages
		this._Icons.Section['Layers'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="6" y="6" width="14" height="14" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M4 16V6a2 2 0 012-2h10" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 4. Clipboard — form on a clipboard
		this._Icons.Section['Clipboard'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="5" y="4" width="14" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="9" y="2" width="6" height="4" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="11" x2="15" y2="11" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="15" x2="13" y2="15" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 5. Layout — page with section divisions
		this._Icons.Section['Layout'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="9" x2="21" y2="9" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="15" x2="21" y2="15" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 6. Book — open book pages
		this._Icons.Section['Book'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 7. Window — application window frame
		this._Icons.Section['Window'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="3" width="20" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="2" y1="8" x2="22" y2="8" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="5.5" cy="5.5" r="0.8" fill="' + pColors.Accent + '"/>' +
				'<circle cx="8.5" cy="5.5" r="0.8" fill="' + pColors.Accent + '"/>');
		};

		// 8. FileText — page with text lines
		this._Icons.Section['FileText'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="14 2 14 8 20 8" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="8" y1="13" x2="16" y2="13" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="8" y1="17" x2="14" y2="17" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 9. Columns — vertical column layout
		this._Icons.Section['Columns'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="12" y1="3" x2="12" y2="21" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 10. Bookmark — bookmark/flag marker
		this._Icons.Section['Bookmark'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M5 3a2 2 0 012-2h10a2 2 0 012 2v18l-7-4-7 4V3z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="7" x2="15" y2="7" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// 11. Shield — protected section
		this._Icons.Section['Shield'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M12 2l8 4v6c0 5.25-3.5 8.25-8 10-4.5-1.75-8-4.75-8-10V6l8-4z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="11" x2="15" y2="11" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// ===== GROUP ICONS (11 variants) =====

		// 1. Default — page with section divisions (visual metaphor: groups divide a section)
		this._Icons.Group['Default'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="9" x2="21" y2="9" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="15" x2="21" y2="15" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 2. Folder — folder shape
		this._Icons.Group['Folder'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 3. Panel — rounded panel container
		this._Icons.Group['Panel'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="4" width="20" height="16" rx="3" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="2" y1="9" x2="22" y2="9" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// 4. Stack — vertically stacked cards
		this._Icons.Group['Stack'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="4" y="2" width="16" height="6" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="4" y="10" width="16" height="6" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="4" y="18" width="16" height="4" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 5. Grid — 2x2 grid boxes
		this._Icons.Group['Grid'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="8" height="8" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="13" y="3" width="8" height="8" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="3" y="13" width="8" height="8" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="13" y="13" width="8" height="8" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 6. Box — simple box container
		this._Icons.Group['Box'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="12" cy="12" r="1.5" fill="' + pColors.Accent + '"/>');
		};

		// 7. Package — wrapped package
		this._Icons.Group['Package'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="12" y1="12" x2="12" y2="22" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="2 7 12 12 22 7" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 8. Bracket — code bracket grouping
		this._Icons.Group['Bracket'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M8 3H6a2 2 0 00-2 2v4.5a1.5 1.5 0 01-1.5 1.5 1.5 1.5 0 011.5 1.5V17a2 2 0 002 2h2" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<path d="M16 3h2a2 2 0 012 2v4.5a1.5 1.5 0 001.5 1.5 1.5 1.5 0 00-1.5 1.5V17a2 2 0 01-2 2h-2" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// 9. Tab — tabbed panel
		this._Icons.Group['Tab'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="7" width="20" height="14" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="3" y="3" width="8" height="5" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="13" y1="5" x2="17" y2="5" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 10. Sidebar — panel with sidebar
		this._Icons.Group['Sidebar'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="3" x2="9" y2="21" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="13" y1="8" x2="17" y2="8" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="13" y1="12" x2="17" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 11. Puzzle — interlocking piece
		this._Icons.Group['Puzzle'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M4 7h3a2 2 0 100-4h0a2 2 0 100 4h3v3a2 2 0 104 0V7h3a2 2 0 012 2v3a2 2 0 10 0 4v3a2 2 0 01-2 2h-3a2 2 0 100-4H10a2 2 0 100 4H7a2 2 0 01-2-2v-3a2 2 0 100-4V9a2 2 0 01-1-2z" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// ===== ROW ICONS (11 variants) =====

		// 1. Default — side-by-side columns (visual metaphor: row of columns)
		this._Icons.Row['Default'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="9.25" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="16.5" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 2. Bars — horizontal bars/lines
		this._Icons.Row['Bars'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="3" y1="8" x2="21" y2="8" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="12" x2="21" y2="12" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="16" x2="21" y2="16" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 3. Stripe — single horizontal stripe band
		this._Icons.Row['Stripe'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="8" width="20" height="8" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 4. Columns — row of columns side-by-side
		this._Icons.Row['Columns'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="9.25" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="16.5" y="6" width="5.5" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 5. ArrowRight — horizontal flow direction
		this._Icons.Row['ArrowRight'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="3" y1="12" x2="21" y2="12" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="17 8 21 12 17 16" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// 6. Divider — horizontal rule with dots
		this._Icons.Row['Divider'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="2" y1="12" x2="8" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="12" cy="12" r="1.2" fill="' + pColors.Primary + '"/>' +
				'<line x1="16" y1="12" x2="22" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 7. Layer — flat layer with depth
		this._Icons.Row['Layer'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<polygon points="12 2 22 8.5 12 15 2 8.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="2 15.5 12 22 22 15.5" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// 8. Grip — draggable grip handle (6 dots)
		this._Icons.Row['Grip'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="8" cy="6" r="1.3" fill="' + pColors.Primary + '"/>' +
				'<circle cx="16" cy="6" r="1.3" fill="' + pColors.Primary + '"/>' +
				'<circle cx="8" cy="12" r="1.3" fill="' + pColors.Primary + '"/>' +
				'<circle cx="16" cy="12" r="1.3" fill="' + pColors.Primary + '"/>' +
				'<circle cx="8" cy="18" r="1.3" fill="' + pColors.Primary + '"/>' +
				'<circle cx="16" cy="18" r="1.3" fill="' + pColors.Primary + '"/>');
		};

		// 9. Table — table row representation
		this._Icons.Row['Table'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="4" width="20" height="16" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="2" y1="10" x2="22" y2="10" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="2" y1="16" x2="22" y2="16" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="9" y1="4" x2="9" y2="20" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 10. Split — two-column split row
		this._Icons.Row['Split'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="6" width="9" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="13" y="6" width="9" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// 11. Slider — horizontal slider track
		this._Icons.Row['Slider'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="3" y1="12" x2="21" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="9" cy="12" r="3" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// ===== INPUT ICONS (10 variants) =====

		// 1. Default — text field with cursor
		this._Icons.Input['Default'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="6" width="18" height="12" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="10" x2="7" y2="14" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// 2. Checkbox — checked checkbox
		this._Icons.Input['Checkbox'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="4" y="4" width="16" height="16" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="8 12 11 15 16 9" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// 3. Toggle — on/off switch
		this._Icons.Input['Toggle'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="7" width="20" height="10" rx="5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="16" cy="12" r="3.5" fill="' + pColors.Accent + '"/>');
		};

		// 4. Dropdown — select dropdown
		this._Icons.Input['Dropdown'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="6" width="18" height="12" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="15 10 18 13 15 16" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// 5. TextArea — multi-line text input
		this._Icons.Input['TextArea'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="8" x2="17" y2="8" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="12" x2="17" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="16" x2="13" y2="16" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// 6. Number — numeric input with arrows
		this._Icons.Input['Number'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="6" width="18" height="12" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<text x="8" y="15.5" font-size="9" font-family="sans-serif" fill="' + pColors.Primary + '">#</text>' +
				'<polyline points="16 10 18 8 20 10" stroke="' + pColors.Muted + '" stroke-width="1.2" fill="none"/>' +
				'<polyline points="16 14 18 16 20 14" stroke="' + pColors.Muted + '" stroke-width="1.2" fill="none"/>');
		};

		// 7. Radio — radio button
		this._Icons.Input['Radio'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="12" cy="12" r="8" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="12" cy="12" r="3.5" fill="' + pColors.Accent + '"/>');
		};

		// 8. Calendar — date picker
		this._Icons.Input['Calendar'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="4" width="18" height="17" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="3" y1="10" x2="21" y2="10" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="8" y1="2" x2="8" y2="6" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="16" y1="2" x2="16" y2="6" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// 9. Lock — password/secure input
		this._Icons.Input['Lock'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="5" y="11" width="14" height="10" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M8 11V7a4 4 0 018 0v4" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<circle cx="12" cy="16" r="1.2" fill="' + pColors.Primary + '"/>');
		};

		// 10. Search — search field with magnifying glass
		this._Icons.Input['Search'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="10.5" cy="10.5" r="6.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="15.5" y1="15.5" x2="21" y2="21" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// ===== ACTION ICONS =====

		// Add — centered plus sign (uses currentColor to inherit button text color)
		this._Icons.Action['Add'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="' + (pSW + 0.5) + '"/>' +
				'<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="' + (pSW + 0.5) + '"/>');
		};

		// DragHandle — six-dot grip pattern (two columns of three dots, uses currentColor)
		this._Icons.Action['DragHandle'] = function(pSize, pColors, pSW)
		{
			let tmpR = Math.max(1.2, pSW * 0.6);
			return _svg(pSize,
				'<circle cx="9" cy="6" r="' + tmpR + '" fill="currentColor"/>' +
				'<circle cx="15" cy="6" r="' + tmpR + '" fill="currentColor"/>' +
				'<circle cx="9" cy="12" r="' + tmpR + '" fill="currentColor"/>' +
				'<circle cx="15" cy="12" r="' + tmpR + '" fill="currentColor"/>' +
				'<circle cx="9" cy="18" r="' + tmpR + '" fill="currentColor"/>' +
				'<circle cx="15" cy="18" r="' + tmpR + '" fill="currentColor"/>');
		};
	}

	/* ======================================================================== */
	/*                    Built-in InputType Icons                               */
	/* ======================================================================== */

	_registerBuiltInInputTypeIcons()
	{
		// Helper to create an SVG wrapper
		function _svg(pSize, pInner)
		{
			return '<svg xmlns="http://www.w3.org/2000/svg" width="' + pSize + '" height="' + pSize + '" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' + pInner + '</svg>';
		}

		// TextArea — multi-line text
		this._InputTypeIcons['TextArea'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="8" x2="17" y2="8" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="12" x2="17" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="7" y1="16" x2="13" y2="16" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// Markdown — text with formatting marks
		this._InputTypeIcons['Markdown'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="4" width="20" height="16" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M6 15V9l3 3.5L12 9v6" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<polyline points="16 12 18 15 20 12" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// HTML — code angle brackets
		this._InputTypeIcons['HTML'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<polyline points="8 7 3 12 8 17" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<polyline points="16 7 21 12 16 17" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<line x1="14" y1="4" x2="10" y2="20" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// Option — dropdown chevron
		this._InputTypeIcons['Option'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="6" width="18" height="12" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="9 10 12 14 15 10" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// Boolean — toggle switch
		this._InputTypeIcons['Boolean'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="7" width="20" height="10" rx="5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="16" cy="12" r="3.5" fill="' + pColors.Accent + '"/>');
		};

		// Color — color swatch circle
		this._InputTypeIcons['Color'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="12" cy="12" r="9" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="12" cy="8" r="2.5" fill="' + pColors.Accent + '"/>' +
				'<circle cx="8.5" cy="14" r="2.5" fill="#6B7F5A"/>' +
				'<circle cx="15.5" cy="14" r="2.5" fill="#5A6B7F"/>');
		};

		// DisplayOnly — eye icon
		this._InputTypeIcons['DisplayOnly'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<circle cx="12" cy="12" r="3" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// ReadOnly — lock icon
		this._InputTypeIcons['ReadOnly'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="5" y="11" width="14" height="10" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M8 11V7a4 4 0 018 0v4" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// PreciseNumberReadOnly — number with decimal point
		this._InputTypeIcons['PreciseNumberReadOnly'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="5" width="18" height="14" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<text x="7" y="16" font-size="10" font-family="sans-serif" fill="' + pColors.Accent + '">.00</text>');
		};

		// Hidden — eye-off icon
		this._InputTypeIcons['Hidden'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<line x1="1" y1="1" x2="23" y2="23" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// Chart — bar chart
		this._InputTypeIcons['Chart'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="12" width="4" height="9" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="10" y="6" width="4" height="15" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<rect x="17" y="3" width="4" height="18" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>');
		};

		// Link — chain link
		this._InputTypeIcons['Link'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// TabSectionSelector — horizontal tabs
		this._InputTypeIcons['TabSectionSelector'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="8" width="20" height="13" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="3" y="3" width="6" height="6" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<rect x="10" y="3" width="6" height="6" rx="1" fill="none" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// TabGroupSelector — group tab switcher
		this._InputTypeIcons['TabGroupSelector'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="8" width="20" height="13" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<rect x="3" y="3" width="5" height="6" rx="1" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<rect x="9" y="3" width="5" height="6" rx="1" fill="none" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<rect x="15" y="3" width="5" height="6" rx="1" fill="none" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// Templated — puzzle piece
		this._InputTypeIcons['Templated'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="3" width="18" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<path d="M8 12h3a1.5 1.5 0 100-3 1.5 1.5 0 100 3h3" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<line x1="8" y1="16" x2="16" y2="16" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// TemplatedEntityLookup — magnifying glass on template
		this._InputTypeIcons['TemplatedEntityLookup'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="3" width="14" height="18" rx="2" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="17" cy="15" r="4" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="20" y1="18" x2="22" y2="20" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};
	}

	/* ======================================================================== */
	/*                    Built-in DataType Icons                                */
	/* ======================================================================== */

	_registerBuiltInDataTypeIcons()
	{
		// Helper to create an SVG wrapper
		function _svg(pSize, pInner)
		{
			return '<svg xmlns="http://www.w3.org/2000/svg" width="' + pSize + '" height="' + pSize + '" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' + pInner + '</svg>';
		}

		// String — horizontal text lines
		this._DataTypeIcons['String'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="4" y1="7" x2="20" y2="7" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="4" y1="12" x2="17" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>' +
				'<line x1="4" y1="17" x2="13" y2="17" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};

		// Number — hash/pound sign
		this._DataTypeIcons['Number'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<line x1="10" y1="3" x2="8" y2="21" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="16" y1="3" x2="14" y2="21" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<line x1="4" y1="9" x2="20" y2="9" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<line x1="4" y1="15" x2="20" y2="15" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>');
		};

		// Float — decimal point with digits
		this._DataTypeIcons['Float'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<text x="3" y="17" font-size="14" font-family="sans-serif" font-weight="600" fill="' + pColors.Primary + '">1</text>' +
				'<circle cx="13" cy="16" r="1.5" fill="' + pColors.Accent + '"/>' +
				'<text x="15" y="17" font-size="14" font-family="sans-serif" font-weight="600" fill="' + pColors.Primary + '">5</text>');
		};

		// Integer — whole number block
		this._DataTypeIcons['Integer'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="4" y="4" width="16" height="16" rx="3" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<text x="8" y="16.5" font-size="11" font-family="sans-serif" font-weight="700" fill="' + pColors.Accent + '">42</text>');
		};

		// PreciseNumber — decimal with precision dots
		this._DataTypeIcons['PreciseNumber'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<text x="2" y="16" font-size="13" font-family="sans-serif" font-weight="600" fill="' + pColors.Primary + '">.00</text>' +
				'<circle cx="19" cy="6" r="1.2" fill="' + pColors.Accent + '"/>' +
				'<circle cx="19" cy="10" r="1.2" fill="' + pColors.Accent + '"/>' +
				'<circle cx="19" cy="14" r="1.2" fill="' + pColors.Accent + '"/>');
		};

		// Boolean — toggle switch
		this._DataTypeIcons['Boolean'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="2" y="7" width="20" height="10" rx="5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<circle cx="16" cy="12" r="3.5" fill="' + pColors.Accent + '"/>');
		};

		// Binary — two squares (0/1)
		this._DataTypeIcons['Binary'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<rect x="3" y="6" width="8" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<text x="5.5" y="15.5" font-size="9" font-family="monospace" fill="' + pColors.Primary + '">0</text>' +
				'<rect x="13" y="6" width="8" height="12" rx="1.5" fill="' + pColors.Fill + '" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '"/>' +
				'<text x="15.5" y="15.5" font-size="9" font-family="monospace" fill="' + pColors.Accent + '">1</text>');
		};

		// DateTime — clock
		this._DataTypeIcons['DateTime'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="12" cy="12" r="9" fill="' + pColors.Fill + '" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '"/>' +
				'<polyline points="12 7 12 12 16 14" stroke="' + pColors.Accent + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// Array — stacked brackets
		this._DataTypeIcons['Array'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M8 4H5v16h3" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<path d="M16 4h3v16h-3" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<circle cx="9" cy="12" r="1.2" fill="' + pColors.Accent + '"/>' +
				'<circle cx="12" cy="12" r="1.2" fill="' + pColors.Accent + '"/>' +
				'<circle cx="15" cy="12" r="1.2" fill="' + pColors.Accent + '"/>');
		};

		// Object — curly braces
		this._DataTypeIcons['Object'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<path d="M8 3H6a2 2 0 00-2 2v4.5a1.5 1.5 0 01-1.5 1.5 1.5 1.5 0 011.5 1.5V17a2 2 0 002 2h2" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>' +
				'<path d="M16 3h2a2 2 0 012 2v4.5a1.5 1.5 0 001.5 1.5 1.5 1.5 0 00-1.5 1.5V17a2 2 0 01-2 2h-2" stroke="' + pColors.Primary + '" stroke-width="' + pSW + '" fill="none"/>');
		};

		// Null — empty circle with dash
		this._DataTypeIcons['Null'] = function(pSize, pColors, pSW)
		{
			return _svg(pSize,
				'<circle cx="12" cy="12" r="8" fill="none" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '" stroke-dasharray="3 2"/>' +
				'<line x1="8" y1="12" x2="16" y2="12" stroke="' + pColors.Muted + '" stroke-width="' + pSW + '"/>');
		};
	}
}

module.exports = PictProviderFormEditorIconography;
module.exports.default_configuration = _DefaultProviderConfiguration;
