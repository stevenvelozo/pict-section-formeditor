const libPictProvider = require('pict-provider');

/**
 * Provider that prevents the child pict form preview from injecting CSS
 * into the parent form editor's #PICT-CSS style element.
 *
 * The parent pict already loads all necessary pict-section-form styles.
 * The child pict does not need its own CSS injection — it just needs to
 * be told not to touch #PICT-CSS.
 *
 * Usage:
 *   After creating the child pict instance, call:
 *     previewCSSProvider.disableChildCSSInjection(childPict);
 */
class PreviewCSSProvider extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';
	}

	/**
	 * Disable CSS injection on a child pict instance so its CSSMap
	 * does not overwrite the parent's #PICT-CSS element.
	 *
	 * Replaces the child's injectCSS method with a no-op.
	 *
	 * @param {Object} pChildPict - The child pict instance
	 */
	disableChildCSSInjection(pChildPict)
	{
		if (pChildPict && pChildPict.CSSMap)
		{
			pChildPict.CSSMap.injectCSS = function() {};
		}
	}
}

module.exports = PreviewCSSProvider;
module.exports.default_configuration = {};
