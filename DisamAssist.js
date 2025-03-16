//<source lang="javascript">

window.DisamAssist = jQuery.extend( true, {
	cfg: {
		/*
		 * Categories where disambiguation pages are added (usually by a template like {{Disambiguation}}
		 */
		disamCategories: ['全部消歧義頁面'],
		
		/*
		 * "Canonical names" of the templates that may appear after ambiguous links
		 * and which should be removed when fixing those links
		 */
		disamLinkTemplates: [
			'Disambiguation needed',
			'Ambiguous link',
			'Amblink',
			'Dab needed',
			'Disamb-link',
			'Disambig needed',
			'Disambiguate',
			'Dn',
			'Needdab'
		],
		
		/*
		 * "Canonical names" of the templates that designate intentional links to
		 * disambiguation pages
		 */
		disamLinkIgnoreTemplates: [
			'R from ambiguous page',
			'R to disambiguation page',
			'R from incomplete disambiguation'
		],
		
		/*
		 * Format string for "Foo (disambiguation)"-style pages
		 */
		 disamFormat: '$1(消歧义)',
		
		/*
		 * Regular expression matching the titles of disambiguation pages (when they are different from
		 * the titles of the primary topics)
		 */
		disamRegExp: '^(.*) \\(disambiguation\\)$',
		
		/*
		 * Text that will be inserted after the link if the user requests help. If the value is null,
		 * the option to request help won't be offered
		 */
		disamNeededText: '{{dn|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}',
		
		/*
		 * Content of the "Foo (disambiguation)" pages that will be created automatically when using
		 * DisamAssist from a "Foo" page
		 */
		redirectToDisam: '#REDIRECT [[$1]] {{R to disambiguation page}}',
		
		/*
		 * Whether intentional links to disambiguation pages can be explicitly marked by adding " (disambiguation)"
		 */
		intentionalLinkOption: true,
		
		/*
		 * Namespaces that will be searched for incoming links to the disambiguation page (pages in other
		 * namespaces will be ignored)
		 */
		targetNamespaces: [0, 6, 10, 14, 100, 108],
		
		/*
		 * Number of backlinks that will be downloaded at once
		 * When using blredirect, the maximum limit is supposedly halved
		 * (see http://www.mediawiki.org/wiki/API:Backlinks)
		 */
		backlinkLimit: 250,
		
		/*
		 * Number of titles we can query for at once
		 */
		queryTitleLimit: 50,
	
		/*
		 * Number of characters before and after the incoming link that will be displayed
		 */
		radius: 300,
	
		/*
		 * Height of the context box, in lines
		 */
		numContextLines: 4,
	
		/*
		 * Number of pages that will be stored before saving, so that changes to them can be
		 * undone if need be
		 */
		historySize: 2,
		
		/*
		 * Minimum time in seconds since the last change was saved before a new edit can be made. A
		 * negative value or 0 disables the cooldown. Users with the "bot" right won't be affected by
		 * the cooldown
		 */
		editCooldown: 12,
		
		/*
		 * Specify how the watchlist is affected by DisamAssist edits. Possible values: "watch", "unwatch",
		 * "preferences", "nochange"
		 */
		watch: 'nochange'
	},

	txt: {
		start: '内部链接消歧义',
		startMain: 'Disambiguate links to primary topic',
		startSame: 'Disambiguate links to DAB',
		close: 'Close',
		undo: 'Undo',
		omit: 'Skip',
		refresh: 'Refresh',
		titleAsText: 'Different target',
		disamNeeded: '标记{{dn}}',
		intentionalLink: 'Intentional link to DAB',
		titleAsTextPrompt: 'Specify the new target:',
		removeLink: 'Unlink',
		optionMarker: ' [Link here]',
		targetOptionMarker: ' [Current target]',
		redirectOptionMarker: ' [Current target (redirected)]',
		pageTitleLine: 'In <a href="$1">$2</a>:',
		noMoreLinks: 'No more links to disambiguate.',
		pendingEditCounter: '保存：$1；历史中：$2',
		pendingEditBox: 'DisamAssist is currently saving changes ($1).',
		pendingEditBoxTimeEstimation: '$1; approximate time remaining: $2',
		pendingEditBoxLimited: 'Please don\'t close this tab until all pending changes have been saved. You may keep '
			+ 'editing Wikipedia in a different tab, but be advised that using multiple instances of DisamAssist at '
			+ 'the same time is discouraged, as a high number of edits over a short time period may be disruptive.',
		error: 'Error: $1',
		fetchRedirectsError: 'Unable to fetch redirects: "$1".',
		getBacklinksError: 'Unable to download backlinks: "$1".',
		fetchRightsError: 'Unable to fetch user rights: "$1",',
		loadPageError: 'Unable to load $1: "$2".',
		savePageError: 'Unable to save changes to $1: "$2".',
		dismissError: 'Dismiss',
		pending: 'There are unsaved changes in DisamAssist. To save them, please press Close',
		editInProgress: 'DisamAssist is currently performing changes. If you close the tab now, they may be lost.',
		ellipsis: '...',
		notifyCharacter: '✔',
		summary: '消歧义：[[$1]] $2',
		summaryChanged: '→[[$1]]',
		summaryOmitted: '跳过链接',
		summaryRemoved: '移除链接',
		summaryIntentional: '刻意指向消歧义页',
		summaryHelpNeeded: '需要协助',
		summarySeparator: '; ',
		redirectSummary: '创建重定向至[[$1]] ([[User:94rain/DisamAssist|DisamAssist]])'
	}
}, window.DisamAssist || {} );

mw.loader.load( '//testingcf.jsdelivr.net/gh/Mustafabot/js-MoegiriPedia/DisamAssist-core.js' );
mw.loader.load( '/index.php?title=User:穆斯塔法凯末尔/DisamAssist.css&action=raw&ctype=text/css', 'text/css' );

//</source>