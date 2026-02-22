const libPictProvider = require('pict-provider');

/**
 * Documentation Provider for the Form Editor.
 *
 * Manages fetching, caching, and navigation of markdown help articles.
 * Delegates markdown parsing to PictContentProvider and HTML rendering
 * to PictContentView (both from pict-section-content).
 *
 * By default loads articles from relative file paths (e.g. docs/ToC.md).
 * Can be extended to use custom REST endpoints by overriding loadArticle().
 */
class FormEditorDocumentation extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'PictProvider';

		// Back-reference to the parent FormEditor view (set after construction)
		this._ParentFormEditor = null;

		// Navigation state
		this._NavigationStack = [];
		this._CurrentPath = null;
		this._CurrentTitle = 'Help';

		// Base path for documentation files (relative to the served app)
		this._BasePath = 'docs/';

		// Cache of parsed HTML keyed by path
		this._Cache = {};

		// Whether the click handler has been wired on the help body container
		this._ClickHandlerAttached = false;
	}

	/**
	 * Load and display a documentation article.
	 *
	 * Fetches the markdown file, parses it via PictContentProvider, and
	 * renders the HTML via PictContentView.displayContent().
	 *
	 * @param {string} pPath - Path to the markdown file (e.g. 'docs/ToC.md')
	 * @param {boolean} pPushToStack - If true, push the current article onto the navigation stack before navigating
	 */
	loadArticle(pPath, pPushToStack)
	{
		if (!pPath)
		{
			pPath = this._BasePath + 'ToC.md';
		}

		if (!this._ParentFormEditor)
		{
			return;
		}

		// Push current location onto the stack before navigating
		if (pPushToStack && this._CurrentPath)
		{
			this._NavigationStack.push(
			{
				path: this._CurrentPath,
				title: this._CurrentTitle
			});
		}

		this._CurrentPath = pPath;

		// If cached, render immediately
		if (this._Cache[pPath])
		{
			this._renderArticle(this._Cache[pPath].html, this._Cache[pPath].title);
			return;
		}

		// Show loading state
		let tmpContentView = this._ParentFormEditor._HelpContentView;
		if (tmpContentView && typeof tmpContentView.showLoading === 'function')
		{
			let tmpBodyId = 'Pict-Content-Body';
			tmpContentView.showLoading('Loading article...', tmpBodyId);
		}

		// Fetch the markdown file
		let tmpXHR = new XMLHttpRequest();
		tmpXHR.open('GET', pPath, true);
		tmpXHR.onreadystatechange = () =>
		{
			if (tmpXHR.readyState === 4)
			{
				if (tmpXHR.status === 200)
				{
					let tmpMarkdown = tmpXHR.responseText;
					let tmpTitle = this._extractTitle(tmpMarkdown);
					let tmpContentProvider = this._ParentFormEditor._HelpContentProvider;

					if (tmpContentProvider)
					{
						let tmpLinkResolver = (pHref, pLinkText) =>
						{
							return this._linkResolver(pHref, pLinkText);
						};
						let tmpHTML = tmpContentProvider.parseMarkdown(tmpMarkdown, tmpLinkResolver);

						// Cache the result
						this._Cache[pPath] = { html: tmpHTML, title: tmpTitle };

						this._renderArticle(tmpHTML, tmpTitle);
					}
				}
				else
				{
					this._renderError(pPath, tmpXHR.status);
				}
			}
		};
		tmpXHR.send();
	}

	/**
	 * Navigate back to the previous article.
	 */
	navigateBack()
	{
		if (this._NavigationStack.length < 1)
		{
			return;
		}

		let tmpPrevious = this._NavigationStack.pop();
		this.loadArticle(tmpPrevious.path, false);
	}

	/**
	 * Navigate to the table of contents.
	 */
	navigateHome()
	{
		// Clear the stack and go home
		this._NavigationStack = [];
		this.loadArticle(this._BasePath + 'ToC.md', false);
	}

	/**
	 * Custom link resolver for parseMarkdown().
	 *
	 * Intercepts links to .md files and converts them to in-panel navigation.
	 * External links open in a new tab.
	 *
	 * @param {string} pHref - The href from the markdown link
	 * @param {string} pLinkText - The display text of the link
	 * @returns {object|null} Link attributes object or null for default behavior
	 */
	_linkResolver(pHref, pLinkText)
	{
		if (!pHref)
		{
			return null;
		}

		// If it's a .md file, intercept for in-panel navigation.
		// Use a #help: scheme rather than javascript: to avoid the href being
		// corrupted by the markdown parser's italic regex (underscores in
		// variable names like _DocumentationProvider get wrapped in <em> tags).
		// A click handler on the help body container intercepts these links.
		if (pHref.endsWith('.md'))
		{
			let tmpFullPath = this._BasePath + pHref;

			return {
				href: '#help:' + tmpFullPath
			};
		}

		// External links open in new tab
		if (pHref.startsWith('http://') || pHref.startsWith('https://'))
		{
			return {
				href: pHref,
				target: '_blank',
				rel: 'noopener noreferrer'
			};
		}

		return null;
	}

	/**
	 * Render the parsed HTML article into the help content area.
	 *
	 * @param {string} pHTML - The parsed HTML content
	 * @param {string} pTitle - The article title (from first heading)
	 */
	_renderArticle(pHTML, pTitle)
	{
		this._CurrentTitle = pTitle || 'Help';

		let tmpContentView = this._ParentFormEditor._HelpContentView;
		if (tmpContentView)
		{
			let tmpBodyId = 'Pict-Content-Body';
			tmpContentView.displayContent(pHTML, tmpBodyId);
		}

		this._attachClickHandler();
		this._renderBreadcrumbs();
	}

	/**
	 * Attach a delegated click handler on the help body container to
	 * intercept clicks on #help: links. This avoids putting JavaScript
	 * in href attributes (which gets corrupted by the markdown parser's
	 * italic regex treating underscores in variable names as emphasis).
	 */
	_attachClickHandler()
	{
		if (this._ClickHandlerAttached)
		{
			return;
		}

		if (typeof document === 'undefined')
		{
			return;
		}

		let tmpHash = this._ParentFormEditor.Hash;
		let tmpBody = document.getElementById(`FormEditor-Help-Body-${tmpHash}`);

		if (!tmpBody)
		{
			return;
		}

		let tmpSelf = this;
		tmpBody.addEventListener('click', (pEvent) =>
		{
			// Walk up from the click target to find an anchor with #help: href
			let tmpEl = pEvent.target;
			while (tmpEl && tmpEl !== tmpBody)
			{
				if (tmpEl.tagName === 'A' && tmpEl.getAttribute('href') && tmpEl.getAttribute('href').indexOf('#help:') === 0)
				{
					pEvent.preventDefault();
					let tmpPath = tmpEl.getAttribute('href').substring(6); // strip '#help:'
					tmpSelf.loadArticle(tmpPath, true);
					return;
				}
				tmpEl = tmpEl.parentElement;
			}
		});

		this._ClickHandlerAttached = true;
	}

	/**
	 * Render an error message when an article fails to load.
	 *
	 * @param {string} pPath - The path that failed to load
	 * @param {number} pStatus - The HTTP status code
	 */
	_renderError(pPath, pStatus)
	{
		let tmpHTML = '<div style="padding: 20px; color: #8A7F72; text-align: center;">';
		tmpHTML += '<p>Could not load article.</p>';
		tmpHTML += `<p style="font-size: 12px; color: #B0A89E;">${pPath} (HTTP ${pStatus})</p>`;
		tmpHTML += '</div>';

		let tmpContentView = this._ParentFormEditor._HelpContentView;
		if (tmpContentView)
		{
			let tmpBodyId = 'Pict-Content-Body';
			tmpContentView.displayContent(tmpHTML, tmpBodyId);
		}

		this._renderBreadcrumbs();
	}

	/**
	 * Render the breadcrumb navigation bar.
	 */
	_renderBreadcrumbs()
	{
		let tmpHash = this._ParentFormEditor.Hash;
		let tmpNavEl = `#FormEditor-Help-Nav-${tmpHash}`;
		let tmpViewRef = this._ParentFormEditor._browserViewRef();

		let tmpHTML = '';

		// Home link
		tmpHTML += `<a href="javascript:void(0)" onclick="${tmpViewRef}._DocumentationProvider.navigateHome()">Help</a>`;

		// Stack entries
		for (let i = 0; i < this._NavigationStack.length; i++)
		{
			let tmpEntry = this._NavigationStack[i];
			tmpHTML += '<span class="pict-fe-help-nav-sep">\u203A</span>';
			tmpHTML += `<a href="javascript:void(0)" onclick="${tmpViewRef}._DocumentationProvider.loadArticle('${tmpEntry.path}', false); ${tmpViewRef}._DocumentationProvider._NavigationStack.splice(${i});">${this._escapeHTML(tmpEntry.title)}</a>`;
		}

		// Current article
		if (this._CurrentTitle && this._CurrentTitle !== 'Help')
		{
			tmpHTML += '<span class="pict-fe-help-nav-sep">\u203A</span>';
			tmpHTML += `<span>${this._escapeHTML(this._CurrentTitle)}</span>`;
		}

		this.pict.ContentAssignment.assignContent(tmpNavEl, tmpHTML);
	}

	/**
	 * Extract the title from the first heading in a markdown string.
	 *
	 * @param {string} pMarkdown - The raw markdown text
	 * @returns {string} The title text, or 'Help' if no heading found
	 */
	_extractTitle(pMarkdown)
	{
		if (!pMarkdown)
		{
			return 'Help';
		}

		let tmpMatch = pMarkdown.match(/^#\s+(.+)$/m);
		if (tmpMatch)
		{
			return tmpMatch[1].trim();
		}

		return 'Help';
	}

	/**
	 * Escape HTML special characters in a string.
	 *
	 * @param {string} pString - The string to escape
	 * @returns {string} The escaped string
	 */
	_escapeHTML(pString)
	{
		if (typeof pString !== 'string')
		{
			return '';
		}
		return pString
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

module.exports = FormEditorDocumentation;
