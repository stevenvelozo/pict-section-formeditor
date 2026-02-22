const libPictSectionForm = require('pict-section-form');

class ChildPictApplication extends libPictSectionForm.PictFormApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Trying this pattern -- it seems to make the most sense.
		this.options.AutoRenderMainViewportViewAfterInitialize = false;
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
