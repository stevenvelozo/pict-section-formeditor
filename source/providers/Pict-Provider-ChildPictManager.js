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
			
			this._PictCache[tmpFormHash] = new Pict(tmpChildPictSettings);

			_Pict.addApplication(tmpFormHash, {}, libPictCustomApplication);

			_Pict.PictApplication.initializeAsync(
				function (pError)
				{
					if (pError)
					{
						console.log('Error initializing the pict application: '+pError)
					}
					_Pict.log.info('Loading the Application and associated views.');
				});

			// NOTICE: This application is initializing async
			return this._PictCache[tmpFormHash];
		}
		catch (pError)
		{
			this.log.error(`Error initializing child pict application for form ${pFormHash}: ${pError}`);
			return null;
		}
	}

}

module.exports = ChildPictManager;
module.exports.default_configuration = {};
