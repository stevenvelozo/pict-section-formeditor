const libPictSectionForm = require('pict-section-form');

class ChildPictApplication extends libPictSectionForm.PictFormApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Trying this pattern -- it seems to make the most sense.
		// MainViewportViewIdentifier: 'Default-View',
		// MainViewportRenderableHash: false,
		// MainViewportDestinationAddress: false,
		// MainViewportDefaultDataAddress: false,

		this.options.AutoSolveAfterInitialize = false;
		this.options.AutoRenderMainViewportViewAfterInitialize = false;
		this.options.AutoRenderViewsAfterInitialize = false;
		this.options.AutoLoginAfterInitialize = false;
		this.options.AutoLoadDataAfterLogin = false;
	}

	onBeforeInitialize()
	{
		this.log.trace(`Initializing embedded application.`);
		return super.onBeforeInitialize();
	}

	onAfterInitialize()
	{
		this.log.trace(`Finished initializing embedded application.`);
		return super.onAfterInitialize();
	}

	onAfterRender()
	{
		return super.onAfterRender();
	}
}

module.exports = ChildPictApplication;
