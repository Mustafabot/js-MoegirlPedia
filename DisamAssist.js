//<syntaxhighlight lang="javascript">
//DisamAssist，萌百修改版
//DisamAssist的使用方法等请见[[User:没有羽翼的格雷塔/js]]。

window.DisamAssist = jQuery.extend( true, {
	cfg: {
		/*
		 * 消歧义页的分类（通常通过{{Disambiguation}} ( {{消歧义页}} ) 添加）
		 */
		disamCategories: ['消歧义页'],
		
		/*
		 * 需要消歧义的链接后可能出现的模板的名称（萌百暂无）
		 * 清理消歧义后它们会被移除
		 */
		disamLinkTemplates: [
		],
		
		/*
		 * 表示链接是有意指向消歧义页的模板的名称（萌百暂无）
		 */
		disamLinkIgnoreTemplates: [
		],
		
		/*
		 * 消歧义页面的名称格式（如[[Example (消歧义)]]）
		 */
		 disamFormat:
			'$1(消歧义页)', 
		
		/*
		 * 用于匹配消歧义页面标题的正则表达式（当与页面主题不同时）
		 */
		disamRegExp:
			'^(.*)\\(消歧义页\\)$', 
		
		/*
		 * 当用户需要帮助时，在链接后插入的文本（萌百暂无）
		 * 如果值为null，则需要帮助的选项不会出现。
		 */
		disamNeededText: 'null',
		
		/*
		 * 在[[Example]]使用DisamAssist时自动创建的[[Example (消歧义)]]的内容
		 */
		redirectToDisam: '#REDIRECT [[$1]]',
		
		/*
		 * 是否可以通过添加“(消歧义)”有意地将页面链接到消歧义页
		 */
		intentionalLinkOption: false,
		
		/*
		 *寻找以下命名空间中的页面的消歧义链接（其它命名空间的页面会被忽略）。
		 */
		targetNamespaces: [0, 6, 10, 14, 100, 102, 118, 126],
		
		/*
		 * 一次性下载的反向链接的数量
		 *使用blredirect时，上限可能会减半。
		 * (请见https://www.mediawiki.org/wiki/API:Backlinks)
		 */
		backlinkLimit: 50,
		
		/*
		 * 一次性查询的标题数量
		 */
		queryTitleLimit: 20,
	
		/*
		 * 链接前后的字符数
		 */
		radius: 600,
	
		/*
		 *文本框的高度，以行为单位
		 */
		numContextLines: 6,
	
		/*
		 *提交前临时储存的编辑数量。有必要时可取消这些编辑，使之不会被提交。
		 */
		historySize: 2,
		
		/*
		 *提交编辑的最短时间间隔，以秒为单位。使用负值或0则不会进行冷却。拥有“bot”权限的用户不会受到冷却时间的影响。
		 */
		editCooldown: 20,
		
		/*
		 * 指定通过DisamAssist作出的编辑如何影响监视列表。可能的值："watch"（添加至监视列表）, "unwatch"（从监视列表中移除）,"preferences"（与参数设置中的设定一致）, "nochange"（保持原来的监视状态）
		 */
		watch: 'nochange'
	},

	txt: {
		start: '消歧义',
		startMain: '清理链接至主题的链接',
		startSame: '清理链接至消歧义页的链接',
		close: '关闭',
		undo: '复原',
		omit: '跳过',
		refresh: '重新整理',
		titleAsText: '链接到其它页面',
		disamNeeded: '标示{{需要消歧义}}',
		intentionalLink: '有意链接到消歧义页',
		titleAsTextPrompt: '请输入新的链接目标：',
		removeLink: '移除内链',
		optionMarker: ' [链接至此处]',
		targetOptionMarker: ' [当前目标]',
		redirectOptionMarker: ' [当前目标的重定向]',
		pageTitleLine: '<a href="$1">$2</a>:',
		noMoreLinks: '没有需要消歧义的链接了。',
		pendingEditCounter: '提交中：$1；临时储存：$2',
		pendingEditBox: '编辑提交中（$1）',
		pendingEditBoxTimeEstimation: '$1; 剩余时间: $2',
		pendingEditBoxLimited: '在所有编辑均被提交前，请勿关闭此页面。'
			+ '您可在其它页面继续编辑，不过不建议同时在多个页面使用DisamAssist。这可能导致大量编辑出现在最近更改中，干扰到其他人。',
		error: 'Error: $1',
		fetchRedirectsError: '无法获取重定向："$1".',
		getBacklinksError: '无法下载反向链接: "$1".',
		fetchRightsError: '无法获取用户权限："$1",',
		loadPageError: '无法加载 $1: "$2".',
		savePageError: '无法提交编辑到 $1: "$2".',
		dismissError: '跳过',
		pending: '存在尚未储存的编辑。如欲储存之，请按「关闭」。',
		editInProgress: 'DisamAssist正在提交编辑。如果您将该页面关闭，可能会丢失您的编辑。',
		ellipsis: '…',
		notifyCharacter: '✔',
		summary: '使用[[User:没有羽翼的格雷塔/js#DisamAssist|DisamAssist]]清理[[MGP:消歧义方针|消歧义]]链接：[[$1]]（$2）。',
		summaryChanged: '链接至[[$1]]',
		summaryOmitted: '链接已跳过',
		summaryRemoved: '链接已移除',
		summaryIntentional: '有意链接到消歧义页',
		summaryHelpNeeded: '需要帮助',
		summarySeparator: '; ',
		redirectSummary: '使用[[User:没有羽翼的格雷塔/js#DisamAssist|DisamAssist]]创建目标为[[$1]]的重定向。'
	}
}, window.DisamAssist || {} );

mw.loader.load( '//testingcf.jsdelivr.net/gh/Mustafabot/js-MoegiriPedia/DisamAssist-core.js' );

//</source>