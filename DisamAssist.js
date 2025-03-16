// 消歧義輔助工具
// 取自 https://zh.wikipedia.org/w/index.php?title=User:和平奮鬥救地球/DisamAssist.js&oldid=66432221
// 由於原始碼位於西班牙文維基百科，使用此工具時需位在能正常存取該站之環境
// 在萌娘這邊使用這個工具，有一個缺點就是儲存很慢（甚至好像根本不會自動儲存？），所以建議多往前消歧義幾個頁面，或是按下右下角的重新整理按鈕確定真的有儲存變更
 
window.DisamAssist = jQuery.extend( true, {
	cfg: {
		/*
		 * Categories where disambiguation pages are added (usually by a template like {{Disambiguation}}
		 */
		disamCategories: ['消歧义页'],
		
		/*
		 * "Canonical names" of the templates that may appear after ambiguous links
		 * and which should be removed when fixing those links
		 */
		disamLinkTemplates: [], // 萌娘暫無相關模板
		
		/*
		 * "Canonical names" of the templates that designate intentional links to
		 * disambiguation pages
		 */
		disamLinkIgnoreTemplates: [], // 萌娘暫無相關模板
		
		/*
		 * Format string for "Foo (disambiguation)"-style pages
		 */
		 disamFormat: '$1(消歧义页)',
		
		/*
		 * Regular expression matching the titles of disambiguation pages (when they are different from
		 * the titles of the primary topics)
		 */
		disamRegExp: '^(.*)\\(消歧义页\\)$',
		
		/*
		 * Text that will be inserted after the link if the user requests help. If the value is null,
		 * the option to request help won't be offered
		 */
		disamNeededText: '', // 萌娘暫不需相關配置
		
		/*
		 * Content of the "Foo (disambiguation)" pages that will be created automatically when using
		 * DisamAssist from a "Foo" page
		 */
		redirectToDisam: '#REDIRECT [[$1]]', // 萌娘暫不需相關配置
		
		/*
		 * Whether intentional links to disambiguation pages can be explicitly marked by adding " (disambiguation)"
		 */
		intentionalLinkOption: false, // 萌娘暫不需相關配置
		
		/*
		 * Namespaces that will be searched for incoming links to the disambiguation page (pages in other
		 * namespaces will be ignored)
		 */
		targetNamespaces: [0, 6, 10, 14],
		
		/*
		 * Number of backlinks that will be downloaded at once
		 * When using blredirect, the maximum limit is supposedly halved
		 * (see https://www.mediawiki.org/wiki/API:Backlinks)
		 */
		 backlinkLimit: 100, // backlinkLimit: 250, 考慮 WAF 問題降低配置
		
		/*
		 * Number of titles we can query for at once
		 */
		queryTitleLimit: 30, // queryTitleLimit: 50, 考慮 WAF 問題降低配置
	
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
		editCooldown: 3, // editCooldown: 0, 考慮 WAF 問題提高配置
		
		/*
		 * Specify how the watchlist is affected by DisamAssist edits. Possible values: "watch", "unwatch",
		 * "preferences", "nochange"
		 */
		watch: 'nochange'
	},
 
	txt: {
		start: '消歧義連結',
		startMain: '消歧義連結至主題目頁面之連結',
		startSame: '消歧義連結至消歧義頁面之連結',
		close: '關閉',
		undo: '復原',
		omit: '跳過',
		refresh: '重新整理',
		titleAsText: '其他目標',
		disamNeeded: '標示需要消歧義',
		intentionalLink: '有意連到消歧義頁面之連結',
		titleAsTextPrompt: '請輸入新的連結目標：',
		removeLink: '去除連結',
		optionMarker: ' [連結到這裡]',
		targetOptionMarker: ' [目前連結目標頁面]',
		redirectOptionMarker: ' [目前連結目標頁面（已重新導向）]',
		pageTitleLine: '頁面「<a href="$1">$2</a>」：',
		noMoreLinks: '沒有需要消歧義的連結了。',
		pendingEditCounter: '儲存中：$1；最近儲存：$2',
		pendingEditBox: '消歧義輔助工具正在儲存您的編輯（$1）。',
		pendingEditBoxTimeEstimation: '$1；剩餘時間：$2',
		pendingEditBoxLimited: '請不要關閉此分頁，直到所有變更儲存完畢。'
			+ '您可打開其他分頁繼續編輯萌娘百科，不過並不建議同時在多個頁面使用此工具，以避免短時間大量編輯沖刷最近變更。',
		error: '錯誤：$1',
		fetchRedirectsError: '無法擷取重新導向：$1。',
		getBacklinksError: '無法下載反向連結：$1。',
		fetchRightsError: '無法擷取使用者權限：$1。',
		loadPageError: '無法載入頁面「$1」：$2。',
		savePageError: '無法儲存對頁面「$1」之變更：$2。',
		dismissError: '好',
		pending: '消歧義輔助工具尚有未儲存的編輯。如欲儲存之，請按「關閉」。',
		editInProgress: '消歧義輔助工具正在進行編輯。如果您將本分頁關閉，可能會喪失編輯進度。',
		ellipsis: '……',
		notifyCharacter: '✓',
		summary: '使用[[使用者:Ericliu1912/disamassist.js|消歧義輔助工具]]清理[[萌娘百科:消歧义|消歧義]]連結：[[$1]]［$2］。',
		summaryChanged: '變更連結至「[[$1]]」',
		summaryOmitted: '連結已跳過',
		summaryRemoved: '連結已移除',
		summaryIntentional: '刻意連結至消歧義頁面',
		summaryHelpNeeded: '需要幫助',
		summarySeparator: '；',
		redirectSummary: '使用[[使用者:Ericliu1912/disamassist.js|消歧義輔助工具]]創建連結目標為「[[$1]]」之重新導向頁面。'
	}
}, window.DisamAssist || {} );

mw.loader.load( '//testingcf.jsdelivr.net/gh/Mustafabot/js-MoegiriPedia/DisamAssist-core.js' );
mw.loader.load( '/index.php?title=User:穆斯塔法凯末尔/DisamAssist.css&action=raw&ctype=text/css', 'text/css' );

//</source>