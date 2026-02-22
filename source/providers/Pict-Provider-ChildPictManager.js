const libPictProvider = require('pict-provider');

const libPict = require('pict');
const libPictCustomApplication = require('./Pict-Provider-ChildPictManager-Application.js');

class ChildPictManager extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';

		// The cache location for other instances of pict
		this._PictCache = {};
	}

	// Check if a pict instance exists for this cache
	childApplicationExists(pFormHash)
	{
		const tmpFormHash = this.fable.DataFormat.sanitizeObjectKey(pFormHash);

		if (this._PictCache[tmpFormHash])
		{
			return true;
		}

		return false;
	}

	childApplication(pFormHash)
	{
		const tmpFormHash = this.fable.DataFormat.sanitizeObjectKey(pFormHash);

		if (this.childApplicationExists(tmpFormHash))
		{
			return this._PictCache[tmpFormHash];
		}

		return null;
	}

	/**
	 * Destroy and remove a cached child application.
	 *
	 * @param {string} pFormHash - The form hash key for the cached application
	 */
	destroyChildApplication(pFormHash)
	{
		const tmpFormHash = this.fable.DataFormat.sanitizeObjectKey(pFormHash);

		if (this._PictCache[tmpFormHash])
		{
			delete this._PictCache[tmpFormHash];
		}
	}

	// Initialize a new child application
	initializeChildApplication(pFormHash, pPictSectionFormManifest)
	{
		const tmpFormHash = this.fable.DataFormat.sanitizeObjectKey(pFormHash);

		try
		{
			// Construct a new pict instance
			const tmpChildPictSettings =
				{
					Product: `Form-${tmpFormHash}`,
					ProductVersion: '1.0.0',
					DefaultFormManifest: pPictSectionFormManifest
				};

			let tmpChildPict = new libPict(tmpChildPictSettings);

			this._PictCache[tmpFormHash] = tmpChildPict;

			tmpChildPict.addApplication(tmpFormHash, {}, libPictCustomApplication);

			tmpChildPict.PictApplication.initializeAsync(
				function (pError)
				{
					if (pError)
					{
						console.log('Error initializing the pict application: ' + pError);
					}
					tmpChildPict.log.info('Loading the Application and associated views.');
				});

			// NOTICE: This application is initializing async
			return tmpChildPict;
		}
		catch (pError)
		{
			this.log.error(`Error initializing child pict application for form ${pFormHash}: ${pError}`);
			return null;
		}
	}

	/**
	 * Initialize a child application configured for browser rendering.
	 * Sets BrowserAddress so the child pict is available on the window
	 * and {~P~} template expressions resolve correctly.
	 *
	 * @param {string} pFormHash - Cache key for the child application
	 * @param {Object} pPictSectionFormManifest - The form manifest (DefaultFormManifest)
	 * @param {string} pBrowserAddress - The global window address (e.g. 'window._ChildPict')
	 * @param {string} pDestinationSelector - CSS selector for the render target (e.g. '#Preview-Container')
	 * @param {Function} fCallback - Called with (pError, pChildPict) when initialization completes
	 */
	initializeRenderableChildApplication(pFormHash, pPictSectionFormManifest, pBrowserAddress, pDestinationSelector, fCallback)
	{
		const tmpFormHash = this.fable.DataFormat.sanitizeObjectKey(pFormHash);

		try
		{
			// Destroy any previous instance with this hash
			this.destroyChildApplication(tmpFormHash);

			// Clean up previous global reference if it exists
			if (typeof window !== 'undefined' && pBrowserAddress)
			{
				let tmpAddressParts = pBrowserAddress.split('.');
				if (tmpAddressParts.length === 2 && tmpAddressParts[0] === 'window')
				{
					delete window[tmpAddressParts[1]];
				}
			}

			// Construct a new pict instance with BrowserAddress
			const tmpChildPictSettings =
				{
					Product: `FormPreview-${tmpFormHash}`,
					ProductVersion: '1.0.0',
					BrowserAddress: pBrowserAddress || 'window._ChildPict',
					DefaultFormManifest: pPictSectionFormManifest
				};

			let tmpChildPict = new libPict(tmpChildPictSettings);

			// Disable CSS injection on the child pict so it does not
			// overwrite the parent's #PICT-CSS style element.
			// The parent already has all pict-section-form CSS loaded.
			if (tmpChildPict.CSSMap)
			{
				tmpChildPict.CSSMap.injectCSS = function() {};
			}

			this._PictCache[tmpFormHash] = tmpChildPict;

			// Set the global reference so {~P~} expressions resolve
			if (typeof window !== 'undefined' && pBrowserAddress)
			{
				let tmpAddressParts = pBrowserAddress.split('.');
				if (tmpAddressParts.length === 2 && tmpAddressParts[0] === 'window')
				{
					window[tmpAddressParts[1]] = tmpChildPict;
				}
			}

			// Configure the application to render into the target container
			let tmpAppOptions =
				{
					MainViewportDestinationAddress: pDestinationSelector,
					AutoPopulateAfterRender: true
				};

			tmpChildPict.addApplication(tmpFormHash, tmpAppOptions, libPictCustomApplication);

			let tmpSelf = this;
			tmpChildPict.PictApplication.initializeAsync(
				function (pError)
				{
					if (pError)
					{
						tmpSelf.log.error('Error initializing renderable child pict application: ' + pError);
					}
					if (typeof fCallback === 'function')
					{
						fCallback(pError, tmpChildPict);
					}
				});

			return tmpChildPict;
		}
		catch (pError)
		{
			this.log.error(`Error initializing renderable child pict application for form ${pFormHash}: ${pError}`);
			if (typeof fCallback === 'function')
			{
				fCallback(pError, null);
			}
			return null;
		}
	}

}

module.exports = ChildPictManager;
module.exports.default_configuration = {};
