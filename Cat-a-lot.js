/**
* Cat-a-lot
* Changes category of multiple files
*
* @rev 00:13, 10 February 2018 (UTC)
* @author Originally by Magnus Manske (2007)
* @author RegExes by Ilmari Karonen (2010)
* @author Completely rewritten by DieBuche (2010-2012)
* @author Rillke (2012-2014)
* @author Perhelion (2017)

* Requires [[MediaWiki:Gadget-SettingsManager.js]] and [[MediaWiki:Gadget-SettingsUI.js]] (properly registered) for per-user-settings
*
* READ THIS PAGE IF YOU WANT TO TRANSLATE OR USE THIS ON ANOTHER SITE:
* http://commons.wikimedia.org/wiki/MediaWiki:Gadget-Cat-a-lot.js/translating
* <nowiki>
*/

/* global jQuery, mediaWiki */
/* eslint one-var:0, vars-on-top:0, no-underscore-dangle:0, valid-jsdoc:0,
curly:0, camelcase:0, no-useless-escape:0, no-alert:0 */ // extends: wikimedia
/* jshint unused:true, forin:false, smarttabs:true, loopfunc:true, browser:true */
	'use strict';
	(function ($, mw) {
		/**
		 * 注入内联CSS样式到页面头部
		 * 为Cat-a-lot工具创建专用样式，包括：
		 * - 主容器样式（固定在页面底部右侧）
		 * - 选择状态样式（高亮显示已选择的文件）
		 * - 反馈样式（操作完成后的视觉反馈）
		 * - 分类列表样式（表格和悬停效果）
		 */
		function injectStyles() {
			var style = document.createElement('style');
			style.type = 'text/css';
			style.textContent = '#cat_a_lot {\n' +
				'bottom: 0;\n' +
				'display: block;\n' +
				'position: fixed;\n' +
				'right: 0;\n' +
				'z-index: 100;\n' +
				'padding: 5px;\n' +
				'box-shadow: 0 2px 4px rgba(0,0,0,0.5); \n' +
				'background-color: #FEF6E7;\n' +
			'}';
			style.textContent += '#cat_a_lot_data, #cat_a_lot_mark_counter {\n' +
				'display: none;\n' +
			'}';
			style.textContent += '#cat_a_lot_data ul {\n' +
				'list-style-image: none;\n' +
				'list-style-type: none;\n' +
				'margin: 0 0 0 5px;\n' +
			'}';
			style.textContent += '#cat_a_lot_selections, #cat_a_lot_mark_counter, #cat_a_lot_settings {\n' +
				'background: url(/w/skins/Vector/images/portal-break.png) no-repeat;\n' +
				'padding: 5px;\n' +
			'}';
			style.textContent += '#cat_a_lot_remove {\n' +
				'font-weight: bold;\n' +
				'display: block;\n' +
			'}';
			style.textContent += 'a {\n' +
				'cursor:pointer;\n' +
			'}';
			style.textContent += '.cat_a_lot_move, .cat_a_lot_action {\n' +
				'font-weight: bold;\n' +
			'}';
			style.textContent += '.cat_a_lot_feedback {\n' +
				'border: 1px #A9DE16 solid !important;\n' +
				'background: #EAF2CB /*url(//upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif)*/ no-repeat 8px 14px !important;\n' +
				'padding-left: 2.85em !important;\n' +
				'padding-top: 10px !important;\n' +
				'font-size: 1.1em !important;\n' +
			'}';
			style.textContent += '.cat_a_lot_done {\n' +
				'background-image: url(//testingcf.jsdelivr.net/gh/Mustafabot/js-MoegirlPedia/Dialog-apply.svg.png) !important;\n' +
				'background-position: 8px 50% !important;\n' +
				'padding-top: 0 !important;\n' +
			'}';
			style.textContent += '#cat_a_lot_searchcatname {\n' +
				'font-size: 112%;\n' +
				'margin: -5px 0 5px -5px;\n' +
				'width: 100%;\n' +
			'}';
			style.textContent += '.skin-vector #cat_a_lot {\n' +
				'font-size: .75em;\n' +
			'}';
			style.textContent += '.cat_a_lot_markAsDone {\n' +
				'background-color: #BBB !important;\n' +
			'}';
			style.textContent += '.cat_a_lot_selected {\n' +
				'background-color: #DF6 !important;\n' +
			'}';
			style.textContent += '#cat_a_lot_no_found, #cat_a_lot_last_selected, #cat_a_lot_settings {\n' +
				'font-weight:bold;\n' +
			'}';
			style.textContent += '#cat_a_lot_last_selected {\n' +
				'outline:1px dotted #999;\n' +
			'}';
			style.textContent += '#cat_a_lot_category_list table {\n' +
				'border-collapse: collapse;\n' +
			'}';
			style.textContent += '#cat_a_lot_category_list tr:hover {\n' +
				'background-color: #fc3;\n' +
			'}';
			style.textContent += '#cat_a_lot_category_list {\n' +
				'overflow: auto;\n' +
			'}';
			(document.head || document.getElementsByTagName('head')[0]).appendChild(style);
		}


	var formattedNS = mw.config.get('wgFormattedNamespaces'),
		ns = mw.config.get('wgNamespaceNumber'),
		nsIDs = mw.config.get('wgNamespaceIds'),
		userGrp = mw.config.get('wgUserGroups'),
		project = mw.config.get('wgDBname');

	/**
	 * 国际化消息定义对象
	 * 包含Cat-a-lot工具的所有用户界面文本和提示信息
	 * 按照功能分类组织：
	 * - Preferences: 用户偏好设置相关文本
	 * - Progress: 操作进度和结果反馈文本
	 * - Actions: 操作按钮和动作文本
	 * - Summaries: 编辑摘要模板
	 */
	var msgs = {
		// Preferences
		// new: added 2012-09-19. Please translate.
		// Use user language for i18n
		'cat-a-lot-watchlistpref': '监视列表偏好设置',
		'cat-a-lot-watch_pref': '跟随参数设置',
		'cat-a-lot-watch_nochange': '不改变监视状态',
		'cat-a-lot-watch_watch': '监视Cat-a-lot编辑后的页面',
		'cat-a-lot-watch_unwatch': '取消监视Cat-a-lot编辑后的页面',
		'cat-a-lot-minorpref': '标记为小编辑（如果您默认将编辑标记为小编辑，将不会有变化）',
		'cat-a-lot-editpagespref': '允许对页面（包括分类）进行分类',
		'cat-a-lot-docleanuppref': '移除{{Check categories}}和其他次要清理',
		'cat-a-lot-uncatpref': '移除{{Uncategorized}}',
		'cat-a-lot-subcatcountpref': '最多显示的子分类',
		'cat-a-lot-config-settings': '偏好设置',
		'cat-a-lot-buttonpref': '使用按钮而不是文本链接',
		'cat-a-lot-comment-label': '自定义编辑注释',

		// Progress
		'cat-a-lot-loading': '加载中...',
		'cat-a-lot-editing': '正在编辑页面',
		'cat-a-lot-of': 'of ',
		'cat-a-lot-skipped-already': '以下 {{PLURAL:$1|1=页面已|$1 页面已}} 被跳过，因为页面已在分类中：',
		'cat-a-lot-skipped-not-found': '以下 {{PLURAL:$1|1=页面已|$1 页面已}} 被跳过，因为旧分类无法找到：',
		'cat-a-lot-skipped-server': '以下 {{PLURAL:$1|1=页面|$1 页面}} 无法更改，因为连接服务器时出现问题：',
		'cat-a-lot-all-done': '所有页面已处理。',
		'cat-a-lot-done': '完成！', // mw.msg("Feedback-close")
		'cat-a-lot-added-cat': '添加分类 $1',
		'cat-a-lot-copied-cat': '复制到分类 $1',
		'cat-a-lot-moved-cat': '移动到分类 $1',
		'cat-a-lot-removed-cat': '从分类 $1 移除',
		// 'cat-a-lot-return-to-page': 'Return to page',
		// 'cat-a-lot-cat-not-found': 'Category not found.',

		// as in 17 files selected
		'cat-a-lot-files-selected': '{{PLURAL:$1|1=1 页面|$1 页面}} 已选择。',
		'cat-a-lot-pe_file': '$1 {{PLURAL:$1|页面|页面}} 受影响，共 $2 页面',
		'cat-a-lot-parent-cat': '父分类：',
		'cat-a-lot-sub-cat': '子分类：',

		// Actions
		'cat-a-lot-copy': '复制',
		'cat-a-lot-move': '移动',
		'cat-a-lot-add': '添加',
		// 'cat-a-lot-remove-from-cat': 'Remove from this category',
		'cat-a-lot-overcat': '遍历分类',
		'cat-a-lot-enter-name': '输入分类名称',
		// 界面选择器配置
		'cat-a-lot-select': '选择', // 界面选择器按钮文本
		'cat-a-lot-all': '全部', // 全选按钮文本
		'cat-a-lot-none': '无', // 取消选择按钮文本
		// 'cat-a-lot-none-selected': 'No files selected!', 'Ooui-selectfile-placeholder'

		// Summaries (project language):
		'cat-a-lot-pref-save-summary': '更新用户偏好设置',
		'cat-a-lot-summary-add': '+[[Category:$1]]',
		'cat-a-lot-summary-copy': '[[Category:$1]]+[[Category:$2]]',
		'cat-a-lot-summary-move': '[[Category:$1]]→[[Category:$2]]',
		'cat-a-lot-summary-remove': '-[[Category:$1]]',
		'cat-a-lot-prefix-summary': '[[zhmoe:User:没有羽翼的格雷塔/js#Cat-a-lot|Cat-a-lot]]：',
		'cat-a-lot-using-summary': ''
	};

	/**
	 * 消息处理函数
	 * 将MediaWiki消息系统与Cat-a-lot的消息对象结合
	 * @param {...*} params - 消息键名和参数
	 * @returns {string} 本地化的消息文本
	 */
	function msg( /* params */) {
		var args = Array.prototype.slice.call(arguments, 0);
		args[0] = 'cat-a-lot-' + args[0];
		return (args.length === 1) ?
			mw.message(args[0]).plain() :
			mw.message.apply(mw.message, args).parse();
	}

	// There is only one Cat-a-lot on one page
	var $body, $container, $dataContainer, $searchInputContainer, $searchInput, $resultList, $markCounter, $selections,
		$selectFiles, $selectPages, $selectNone, $selectInvert, $settingsWrapper, $settingsLink, $head, $link, $overcat,
		commonsURL = 'https://commons.wikimedia.org/w/index.php',
		is_rtl = $('body').hasClass('rtl'),
		reCat, // localized category search regexp
		non,
		r; // result file count for overcat

	/**
	 * Cat-a-lot 核心对象
	 * 包含所有主要功能和配置
	 * 主要功能：
	 * - 分类管理：显示父分类、子分类
	 * - 批量操作：添加、复制、移动、移除分类
	 * - 用户界面：搜索、选择、进度显示
	 * - 设置管理：用户偏好配置
	 * - API集成：与MediaWiki API通信
	 */
	var CAL = mw.libs.catALot = {
		apiUrl: mw.util.wikiScript('api'),
		origin: '',
		searchmode: false,
		version: '4.77',
		setHeight: 450,
		changeTag: 'Bot',

		settings: {
			/* Any category in this category is deemed a disambiguation category; i.e., a category that should not contain
		any items, but that contains links to other categories where stuff should be categorized. If you don't have
		that concept on your wiki, set it to null. Use blanks, not underscores. */
			disambig_category: '消歧义分类', // Commons
			/* Any category in this category is deemed a (soft) redirect to some other category defined by a link
	* to another non-blacklisted category. If your wiki doesn't have soft category redirects, set this to null.
	* If a soft-redirected category contains more than one link to another non-blacklisted category, it's considered
	* a disambiguation category instead. */
			redir_category: '已重定向的分类'

		},

		/**
		 * 初始化Cat-a-lot工具
		 * 这是主要的初始化函数，执行以下任务：
		 * 1. 注入CSS样式
		 * 2. 设置国际化消息
		 * 3. 创建用户界面元素
		 * 4. 绑定事件处理器
		 * 5. 根据当前页面类型确定搜索模式
		 * 6. 延迟加载本地化文件
		 */
		init: function () {
			// 注入内联样式
			injectStyles();
			// Prevent historical double marker (maybe remove in future)
			if ( /Cat-?a-?lot/i.test( msgs[ 'cat-a-lot-pref-save-summary' ] ) ) { mw.messages.set( { 'cat-a-lot-prefix-summary': '', 'cat-a-lot-using-summary': '' } ); } else {
				mw.messages.set( {
					'cat-a-lot-pref-save-summary': msgs[ 'cat-a-lot-prefix-summary' ] + msgs[ 'cat-a-lot-pref-save-summary' ] + msgs[ 'cat-a-lot-using-summary' ]
				} );
			}
			this._initSettings();
			$body = $(document.body);
			$container = $('<div>')
				.attr('id', 'cat_a_lot')
				.appendTo($body);
			$dataContainer = $('<div>')
				.attr('id', 'cat_a_lot_data')
				.appendTo($container);
			$searchInputContainer = $('<div>')
				.appendTo($dataContainer);
			$searchInput = $('<input>', {
				id: 'cat_a_lot_searchcatname',
				placeholder: msgs["cat-a-lot-enter-name"],
				type: 'text'
			})
				.appendTo($searchInputContainer);
			$resultList = $('<div>')
				.attr('id', 'cat_a_lot_category_list')
				.appendTo($dataContainer);
			$markCounter = $('<div>')
				.attr('id', 'cat_a_lot_mark_counter')
				.appendTo($dataContainer);
			$selections = $('<div>')
				.attr('id', 'cat_a_lot_selections')
				.text(msgs["cat-a-lot-select"] + ':')
				.appendTo($dataContainer);
			$settingsWrapper = $('<div>')
				.attr('id', 'cat_a_lot_settings')
				.appendTo($dataContainer);
			$settingsLink = $('<a>', {
				id: 'cat_a_lot_config_settings',
				title: 'Version ' + this.version,
				text: msgs["cat-a-lot-config-settings"]
			})
				.appendTo($settingsWrapper);
			$head = $('<div>')
				.attr('id', 'cat_a_lot_head')
				.appendTo($container);
			$link = $('<a>')
				.attr('id', 'cat_a_lot_toggle')
				.text('Cat-a-lot')
				.appendTo($head);
			$settingsWrapper.append($('<a>', {
				href: commonsURL + '?title=Special:MyLanguage/Help:Gadget-Cat-a-lot',
				target: '_blank',
				style: 'float:right',
				title: ($('#n-help a').attr('title') || '') + ' (v. ' + this.version + ')'
			}).text($('#mw-indicator-mw-helplink a').text() || '?'));
			$container.one('mouseover', function () { // Try load on demand earliest as possible
				mw.loader.load(['jquery.ui']);
			});

			if (this.origin && !non) {
				$overcat = $('<a>')
					.attr('id', 'cat_a_lot_overcat')
					.html(msgs["cat-a-lot-overcat"])
					.on('click', function (e) {
						CAL.getOverCat(e);
					})
					.insertBefore($selections);
			}

			if ((mw.util.getParamValue('withJS') === 'MediaWiki:Gadget-Cat-a-lot.js' &&
				!mw.util.getParamValue('withCSS')) ||
				mw.loader.getState('ext.gadget.Cat-a-lot') === 'registered') {
				// importStylesheet( 'MediaWiki:Gadget-Cat-a-lot.css' );
			}

			reCat = new RegExp('^\\s*' + CAL.localizedRegex(14, 'Category') + ':', '');

			$searchInput.on('keydown', function (e) {
				if (e.key === 'Enter') {
					CAL.updateCats($.trim($(this).val().replace(/[\u200E\u200F\u202A-\u202E]/g, '')));
					mw.cookie.set('catAlot', CAL.currentCategory);
					this.blur();
				}
			})
				.on('blur', function () {
					if (this.value) {
						CAL.updateCats($.trim($(this).val()));
					}
				})
				.on('input keyup', function () {
					var oldVal = this.value,
						newVal = oldVal.replace(reCat, '');
					if (newVal !== oldVal) { this.value = newVal; }

					if (!newVal) { mw.cookie.set('catAlot', null); }
				});

			function initAutocomplete() {
				if (CAL.autoCompleteIsEnabled) { return; }

				CAL.autoCompleteIsEnabled = true;

				if (!$searchInput.val() && mw.cookie && mw.cookie.get('catAlot')) { $searchInput.val(mw.cookie.get('catAlot')); }

				$searchInput.autocomplete({
					source: function (request, response) {
						CAL.doAPICall({
							action: 'opensearch',
							search: request.term,
							redirects: 'resolve',
							namespace: 14
						}, function (data) {
							if (data[1]) {
								response($(data[1])
									.map(function (index, item) {
										return item.replace(reCat, '');
									}));
							}

						});
					},
					open: function () {
						$('.ui-autocomplete')
							.position({
								my: is_rtl ? 'left bottom' : 'right bottom',
								at: is_rtl ? 'left top' : 'right top',
								of: $searchInput
							});
					},
					appendTo: '#cat_a_lot'
				});
			}
			$('<a>')
				// .attr( 'id', 'cat_a_lot_select_all' )
				.text(msgs["cat-a-lot-all"])
				.on('click', function () {
					CAL.toggleAll(true);
				})
				.appendTo($selections.append(' '));
			if (this.settings.editpages) {
				$selectFiles = $('<a>')
					.on('click', function () {
						CAL.toggleAll('files');
					});
				$selectPages = $('<a>')
					.on('click', function () {
						CAL.toggleAll('pages');
					});
				$selections.append($('<span>').hide().append([' / ', $selectFiles, ' / ', $selectPages]));
			}
			$selectNone = $('<a>')
				// .attr( 'id', 'cat_a_lot_select_none' )
				.text(msgs["cat-a-lot-none"])
				.on('click', function () {
					CAL.toggleAll(false);
				});
			$selectInvert = $('<a>')
				.on('click', function () {
					CAL.toggleAll(null);
				});
			$selections.append([' • ', $selectNone, ' • ', $selectInvert,
				$('<div>').append([
					$('<input>')
						.attr({
							id: 'cat_a_lot_comment',
							type: 'text',
							placeholder: msgs["cat-a-lot-comment-label"]
						})
				])
			]);

			$link
				.on('click', function () {
					$(this).toggleClass('cat_a_lot_enabled');
					// Load autocomplete on demand
					mw.loader.using('jquery.ui', initAutocomplete);

					if (!CAL.executed) {
						$.when(mw.loader.using([
							'jquery.ui',
							'jquery.ui',
							'jquery.ui',
							'mediawiki.api',
							'mediawiki.jqueryMsg'
						]), $.ready)
							.then(function () {
								return new mw.Api().loadMessagesIfMissing([
									'Cancel',
									'Categorytree-not-found',
									// 'Checkuser-all',
									// 'Code-field-select',
									// 'Export-addcat',
									'Filerevert-submit',
									'Returnto',
									'Ooui-selectfile-placeholder',
									// 'Visualeditor-clipboard-copy',
									'Prefs-files',
									'Categories',
									'Checkbox-invert',
									'Centralnotice-remove', // 'Ooui-item-remove'
									'Apifeatureusage-warnings'
								]);
							}).then(function () {
								CAL.run();
							});
					} else { CAL.run(); }
				});
			$settingsLink
				.on('click', CAL.manageSettings);
			this.localCatName = formattedNS[14] + ':';
			mw.loader.using('mediawiki.cookie', function () { // Let catAlot stay open
				var val = mw.cookie.get('catAlotO');
				if (val && Number(val) === ns) { $link.click(); }
			}
			);
		},

		/**
		 * 处理"遍历分类"功能
		 * 分析当前选中的文件，查看它们属于哪些子分类或父分类
		 * 并通过不同颜色的边框标记显示分类关系：
		 * - 橙色：目标分类
		 * - 绿色：子分类
		 * - 红色：父分类
		 * @param {Event} e - 点击事件对象
		 */
		getOverCat: function (e) {
			var files = [];
			r = 0; // result counter
			if (e) {
				e.preventDefault();
				this.files = this.getMarkedLabels(); // .toArray() not working
				for (var f = 0; f < this.files.length; f++) { files.push(this.files[f]); }

			}
			if (!files.length || !(files instanceof Array)) { return alert(mw.msg('Ooui-selectfile-placeholder')); }
			this.files = files;
			mw.loader.using(['jquery.spinner'], function () {
				$markCounter.injectSpinner('overcat');
				CAL.getFileCats();
			});
		},

		getFileCats: function () {
			var aLen = this.files.length;
			var bLen = this.selectedLabels.length;
			var file = this.files[aLen - 1][0];
			$overcat.text('…' + aLen + '\/' + bLen);
			if (file) {
				this.doAPICall({
					prop: 'categories',
					titles: file
				}, this.checkFileCats
				);
			}

		},

		checkFileCats: function (data) {
			var cc = 0; // current cat counter;
			var file = CAL.files.pop();
			if (data.query && data.query.pages) {
				$.each(data.query.pages, function (id, page) {
					if (page.categories) {
						var target = file[1].removeClass('cat_a_lot_selected');
						$.each(page.categories, function (c, cat) {
							var title = cat.title.replace(reCat, ''),
								color = 'orange',
								mark = function (kind) { // kind of category
									// TODO: store data to use this for special remove function
									if (kind === 'sub') { color = 'green'; }
									var border = '3px dotted ';
									if ($.inArray(title, CAL[kind + 'Cats']) !== -1) {
										cc++;
										target = target.parents('.gallerybox');
										target = target[0] ? target : file[1];
										target.css({
											border: border + color
										}).prop('title', msg(kind + '-cat') + title);
										color = 'red';
										return false;
									}
								};
							mark('sub');
							return mark('parent');
						});
						if (cc) { r++; }
					}
				});
			} else { mw.log('Api-fail', file, data); }
			if (CAL.files[0]) { return setTimeout(function () { CAL.getFileCats(); }, 100); } // Api has bad performance here, so we can get only each file separately
			$overcat.text(msg('pe_file', r, CAL.selectedLabels.length));
			$.removeSpinner('overcat');
		},

		/**
		 * 根据搜索模式查找页面上的所有可选择标签
		 * 支持多种MediaWiki页面类型：
		 * - search: 搜索结果页面
		 * - category: 分类页面
		 * - contribs: 用户贡献页面
		 * - prefix: 前缀索引页面
		 * - listfiles: 文件列表页面
		 * - gallery: 画廊视图页面
		 * @param {string} searchmode - 搜索模式类型
		 */
		findAllLabels: function (searchmode) {
			// It's possible to allow any kind of pages as well but what happens if you click on "select all" and don't expect it
			switch (searchmode) {
				case 'search':
					this.labels = this.labels.add($('.searchResultImage .searchResultImage-text'));
					if (this.settings.editpages) { this.labels = this.labels.add('div.mw-search-result-heading'); }

					break;
				case 'category':
					this.findAllLabels('gallery');
					this.labels = this.labels.add($('#mw-category-media').find('li[class!="gallerybox"]'));
					if (this.settings.editpages) {
						this.pageLabels = $('#mw-pages, #mw-subcategories').find('li');
						// this.files = this.labels;
						this.labels = this.labels.add(this.pageLabels);
					}
					break;
				case 'contribs':
					this.labels = this.labels.add($('ul.mw-contributions-list li'));
					// FIXME: Filter if !this.settings.editpages
					break;
				case 'prefix':
					this.labels = this.labels.add($('ul.mw-prefixindex-list li'));
					break;
				case 'listfiles':
					// this.labels = this.labels.add( $( 'table.listfiles>tbody>tr' ).find( 'td:eq(1)' ) );
					this.labels = this.labels.add($('.TablePager_col_img_name'));
					break;
				case 'gallery':
					// this.labels = this.labels.add( '.gallerybox' ); // TODO incombatible with GalleryDetails
					this.labels = this.labels.add('.gallerytext');
					break;
			}
		},

		/**
		 * 从链接元素中提取页面标题
		 * 尝试从href属性或title属性中获取规范的页面标题
		 * 处理URL解码和下划线到空格的转换
		 * @param {jQuery} $a - 包含链接的jQuery对象
		 * @returns {string} 提取的页面标题，如果提取失败返回空字符串
		 */
		getTitleFromLink: function ($a) {
			try {
				return decodeURIComponent($a.attr('href'))
					.match(/(?:\/wiki\/)?([^\/#]+)/)[1].replace(/_/g, ' ');
			} catch (ex) {
				return '';
			}
		},

		/**
		 * 获取当前选中的页面标签和标题
		 * 用于从页面中提取已选择的项目信息
		 * 兼容性：该函数在 MediaWiki:Gadget-ACDC.js 中使用，请避免不兼容的更改
		 * @returns {Array} 包含页面标题和jQuery对象元组的数组
		 */
		// this function is used in [[MediaWiki:Gadget-ACDC.js]], please avoid making incompatible changes ☺
		getMarkedLabels: function () {
			this.selectedLabels = this.labels.filter('.cat_a_lot_selected:visible');
			return this.selectedLabels.map(function () {
				var label = $(this), file = label.find('a:not([role])[title][class$="title"]');
				file = file.length ? file : label.find('a:not([role])[title]');
				var title = file.attr('title') ||
					CAL.getTitleFromLink(file) ||
					CAL.getTitleFromLink(label.find('a:not([role])')) ||
					CAL.getTitleFromLink(label.parent().find('a:not([role])')); // TODO needs optimization
				if (title.indexOf(formattedNS[2] + ':')) { return [[title, label]]; }
			});
		},

		/**
		 * 更新选择计数器显示
		 * 显示当前选中的文件数量，并设置页面离开警告
		 * 同时修复位置偏移问题
		 */
		updateSelectionCounter: function () {
			this.selectedLabels = this.labels.filter('.cat_a_lot_selected:visible');
			var first = $markCounter.is(':hidden');
			$markCounter
				.html(msg('files-selected', this.selectedLabels.length))
				.show();
			if (first && !$dataContainer.is(':hidden')) { // Workaround to fix position glitch
				first = $markCounter.innerHeight();
				$container
					.offset({ top: $container.offset().top - first })
					.height($container.height() + first);
				$(window).on('beforeunload', function () {
					if (CAL.labels.filter('.cat_a_lot_selected:visible')[0]) { return 'You have pages selected!'; } // There is a default message in the browser
				});
			}
		},

		/**
		 * 创建可点击的标签
		 * 扫描当前页面的所有标签，使其可被选择
		 * 根据搜索模式查找合适的标签
		 */
		makeClickable: function () {
			this.labels = $();
			this.pageLabels = $(); // only for distinct all selections
			this.findAllLabels(this.searchmode);
			this.labels.catALotShiftClick(function () {
				CAL.updateSelectionCounter();
			})
				.addClass('cat_a_lot_label');
		},

		/**
		 * 切换所有标签的选择状态
		 * 支持全选、取消选择、反选操作
		 * @param {string|boolean} select - 选择状态：'files'、'all'、'none'、'invert' 或布尔值
		 */
		toggleAll: function (select) {
			if (typeof select === 'string' && this.pageLabels[0]) {
				this.pageLabels.toggleClass('cat_a_lot_selected', true);
				if (select === 'files') // pages get deselected
				{ this.labels.toggleClass('cat_a_lot_selected'); }
			} else {
				// invert / none / all
				this.labels.toggleClass('cat_a_lot_selected', select);
			}
			this.updateSelectionCounter();
		},

		/**
		 * 获取子分类列表
		 * 通过API查询指定分类下的所有子分类
		 * 使用异步API调用，子分类信息存储在CAL.subCats中
		 */
		getSubCats: function () {
			var data = {
				list: 'categorymembers',
				cmtype: 'subcat',
				cmlimit: this.settings.subcatcount,
				cmtitle: 'Category:' + this.currentCategory
			};

			this.doAPICall(data, function (result) {
				var cats = (result && result.query && result.query.categorymembers) || [];
				CAL.subCats = [];
				for (var i = 0; i < cats.length; i++) { CAL.subCats.push(cats[i].title.replace(/^[^:]+:/, '')); }

				CAL.catCounter++;
				if (CAL.catCounter === 2) { CAL.showCategoryList(); }

			});
		},

		/**
		 * 获取父分类列表
		 * 通过API查询指定分类被包含在哪些父分类中
		 * 异步调用，结果存储在CAL.parentCats中
		 */
		getParentCats: function () {
			var data = {
				prop: 'categories',
				titles: 'Category:' + this.currentCategory
			};
			this.doAPICall(data, function (result) {
				if (!result) return;
				CAL.parentCats = [];
				var cats,
					pages = result.query.pages,
					table = $('<table>');

				if (pages[-1] && pages[-1].missing === '') {
					$resultList.html('<span id="cat_a_lot_no_found">' + mw.msg('Categorytree-not-found', this.currentCategory) + '</span>');
					document.body.style.cursor = 'auto';
					CAL.createCatLinks('→', [CAL.currentCategory], table);
					$resultList.append(table);
					return;
				}
				// there should be only one, but we don't know its ID
				for (var id in pages) { cats = pages[id].categories || []; }

				for (var i = 0; i < cats.length; i++) { CAL.parentCats.push(cats[i].title.replace(/^[^:]+:/, '')); }

				CAL.catCounter++;
				if (CAL.catCounter === 2) { CAL.showCategoryList(); }

			});
		},

		/**
		 * 创建本地化的命名空间正则表达式
		 * 用于生成匹配特定命名空间的正则表达式
		 * 支持大小写不敏感和空白字符匹配
		 * @param {number} namespaceNumber - 命名空间编号
		 * @param {string} fallback - 回退命名空间名称
		 * @returns {string} 编译后的正则表达式字符串
		 */
		localizedRegex: function (namespaceNumber, fallback) {
			// Copied from HotCat, thanks Lupo.
			var wikiTextBlank = '[\\t _\\xA0\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+';
			var wikiTextBlankRE = new RegExp(wikiTextBlank, 'g');
			var createRegexStr = function (name) {
				if (!name || !name.length) { return ''; }

				var regexName = '';
				for (var i = 0; i < name.length; i++) {
					var ii = name[i];
					var ll = ii.toLowerCase();
					var ul = ii.toUpperCase();
					regexName += (ll === ul) ? ii : '[' + ll + ul + ']';
				}
				return regexName.replace(/([\\\^\$\.\?\*\+\(\)])/g, '\\$1')
					.replace(wikiTextBlankRE, wikiTextBlank);
			};

			fallback = fallback.toLowerCase();
			var canonical = formattedNS[namespaceNumber].toLowerCase();
			var RegexString = createRegexStr(canonical);
			if (fallback && canonical !== fallback) { RegexString += '|' + createRegexStr(fallback); }

			for (var catName in nsIDs) { if (typeof catName === 'string' && catName.toLowerCase() !== canonical && catName.toLowerCase() !== fallback && nsIDs[catName] === namespaceNumber) { RegexString += '|' + createRegexStr(catName); } }

			return ('(?:' + RegexString + ')');
		},

		/**
		 * 构建分类正则表达式
		 * 生成用于匹配指定分类的正则表达式模式
		 * 处理大小写不敏感、空格和下划线匹配
		 * @param {string} category - 分类名称
		 * @returns {RegExp} 编译后的正则表达式
		 */
		regexCatBuilder: function (category) {
			var catname = this.localizedRegex(14, 'Category');

			// Build a regexp string for matching the given category:
			// trim leading/trailing whitespace and underscores
			category = category.replace(/^[\s_]+|[\s_]+$/g, '');

			// escape regexp metacharacters (= any ASCII punctuation except _)
			category = mw.util.escapeRegExp(category);

			// any sequence of spaces and underscores should match any other
			category = category.replace(/[\s_]+/g, '[\\s_]+');

			// Make the first character case-insensitive:
			var first = category.substr(0, 1);
			if (first.toUpperCase() !== first.toLowerCase()) { category = '[' + first.toUpperCase() + first.toLowerCase() + ']' + category.substr(1); }

			// Compile it into a RegExp that matches MediaWiki category syntax (yeah, it looks ugly):
			// XXX: the first capturing parens are assumed to match the sortkey, if present, including the | but excluding the ]]
			return new RegExp('\\[\\[[\\s_]*' + catname + '[\\s_]*:[\\s_]*' + category + '[\\s_]*(\\|[^\\]]*(?:\\][^\\]]+)*)?\\]\\]\\s*', 'g');
		},

		getContent: function (page, targetcat, mode) {
			if (!this.cancelled) {
				this.doAPICall({
					curtimestamp: 1,
					// meta: 'tokens',
					prop: 'revisions',
					rvprop: 'content|timestamp',
					titles: page[0]
				}, function (result) {
					CAL.editCategories(result, page, targetcat, mode);
				});
			}

		},

		getTargetCat: function (pages, targetcat, mode) {
			if (!this.cancelled) {
				const timer = ms => new Promise(res => setTimeout(res, ms));
				this.doAPICall({
					meta: 'tokens',
					prop: 'categories|categoryinfo',
					titles: 'Category:' + targetcat
				}, function (result) {
					if (!result || !result.query) { return; }
					CAL.edittoken = result.query.tokens.csrftoken;
					result = CAL._getPageQuery(result);
					CAL.checkTargetCat(result);
					let promise = Promise.resolve();
					for (let i = 0; i < pages.length; i++) {
						// NOTE: This timer is here to make sure edits wait for each other.
						// If CAL.getContent() and doAPICall() returned a correct Promise,
						// then the timer would not be needed.
						promise = promise.then(() => timer(userGrp?.some((group) => ['bot', 'flood'].includes(group)) ? 1000 : 21000)).then(() => {
							CAL.getContent(pages[i], targetcat, mode);
						});
					}

				});
			}

		},

		checkTargetCat: function (page) {
			var is_dab = false; // disambiguation
			var is_redir = typeof page.redirect === 'string'; // Hard redirect?
			if (typeof page.missing === 'string') { return alert(mw.msg('Apifeatureusage-warnings', mw.msg('Categorytree-not-found', page.title))); }
			var cats = page.categories;
			this.is_hidden = page.categoryinfo && typeof page.categoryinfo.hidden === 'string';

			if (!is_redir && cats && (CAL.disambig_category || CAL.redir_category)) {
				for (var c = 0; c < cats.length; c++) {
					var cat = cats[c].title;
					if (cat) { // Strip namespace prefix
						cat = cat.substring(cat.indexOf(':') + 1).replace(/_/g, ' ');
						if (cat === CAL.disambig_category) {
							is_dab = true; break;
						} else if (cat === CAL.redir_category) {
							is_redir = true; break;
						}
					}
				}
			}

			if (!is_redir && !is_dab) { return; }
			alert(mw.msg('Apifeatureusage-warnings', page.title + ' is a ' + CAL.disambig_category));
		},

		// Remove {{Uncategorized}} (also with comment). No need to replace it with anything.
		removeUncat: function (text) {
			return (this.settings.uncat ? text.replace(/\{\{\s*[Uu]ncategorized\s*[^}]*\}\}\s*(<!--.*?-->\s*)?/, '') : text);
		},

		doCleanup: function (text) {
			return (this.settings.docleanup ? text.replace(/\{\{\s*[Cc]heck categories\s*(\|?.*?)\}\}/, '') : text);
		},

		/**
		 * 编辑页面分类的核心函数
		 * 处理添加、复制、移动、移除分类操作
		 * 包含文本处理、编辑摘要生成和API调用逻辑
		 * @param {Object} result - API查询结果
		 * @param {Array} file - 页面信息数组 [标题, jQuery对象]
		 * @param {string} targetcat - 目标分类名称
		 * @param {string} mode - 操作模式：'add', 'copy', 'move', 'remove'
		 */
		editCategories: function (result, file, targetcat, mode) {
			if (!result || !result.query) {
				// Happens on unstable wifi connections..
				this.connectionError.push(file[0]);
				this.updateCounter();
				return;
			}
			var otext,
				timestamp,
				page = CAL._getPageQuery(result);
			if (!page || page.ns === 2) { return; }
			var id = page && page.revisions && page.revisions[0],
				catNS = this.localCatName; // canonical cat-name

			if (!id) {
				return;
			}
			this.starttimestamp = result.curtimestamp;
			otext = id['*'];
			timestamp = id.timestamp;

			var sourcecat = this.origin;
			// Check if that file is already in that category
			if (mode !== 'remove' && this.regexCatBuilder(targetcat).test(otext)) {
				// If the new cat is already there, just remove the old one
				if (mode === 'move') {
					mode = 'remove';
					targetcat = sourcecat;
				} else {
					this.alreadyThere.push(file[0]);
					this.updateCounter();
					return;
				}
			}

			// Text modification (following 3 functions are partialy taken from HotCat)
			var wikiTextBlankOrBidi = '[\\t _\\xA0\\u1680\\u180E\\u2000-\\u200B\\u200E\\u200F\\u2028-\\u202F\\u205F\\u3000]*';
			// Whitespace regexp for handling whitespace between link components. Including the horizontal tab, but not \n\r\f\v:
			// a link must be on one single line.
			// MediaWiki also removes Unicode bidi override characters in page titles (and namespace names) completely.
			// This is *not* handled, as it would require us to allow any of [\u200E\u200F\u202A-\u202E] between any two
			// characters inside a category link. It _could_ be done though... We _do_ handle strange spaces, including the
			// zero-width space \u200B, and bidi overrides between the components of a category link (adjacent to the colon,
			// or adjacent to and inside of "[[" and "]]").
			var findCatsRE = new RegExp('\\[\\[' + wikiTextBlankOrBidi + this.localizedRegex(14, 'Category') + wikiTextBlankOrBidi + ':[^\\]]+\\]\\]', 'g');

			function replaceByBlanks(match) {
				return match.replace(/(\s|\S)/g, ' '); // /./ doesn't match linebreaks. /(\s|\S)/ does.
			}

			function find_insertionpoint(wikitext) {
				var copiedtext = wikitext
					.replace(/<!--(\s|\S)*?-->/g, replaceByBlanks)
					.replace(/<nowiki>(\s|\S)*?<\/nowiki>/g, replaceByBlanks);
				// Search in copiedtext to avoid that we insert inside an HTML comment or a nowiki "element".
				var index = -1;
				findCatsRE.lastIndex = 0;
				while (findCatsRE.exec(copiedtext) !== null) { index = findCatsRE.lastIndex; }

				return index;
			}

			/**
	*  @brief Adds the new Category by searching the right insert point,
	*         if there is text after the category section
	*  @param [string] wikitext
	*  @param [string] toAdd
	*  @return Return wikitext
	*/
			function addCategory(wikitext, toAdd) {
				if (toAdd && toAdd[0]) {
					// TODO: support sort key
					var cat_point = find_insertionpoint(wikitext); // Position of last category
					var newcatstring = '[[' + catNS + toAdd + ']]';
					if (cat_point > -1) {
						var suffix = wikitext.substring(cat_point);
						wikitext = wikitext.substring(0, cat_point) + (cat_point ? '\n' : '') + newcatstring;
						if (suffix[0] && suffix.substr(0, 1) !== '\n') { wikitext += '\n'; }
						wikitext += suffix;
					} else {
						if (wikitext[0] && wikitext.substr(wikitext.length - 1, 1) !== '\n') { wikitext += '\n'; }

						wikitext += (wikitext[0] ? '\n' : '') + newcatstring;
					}
				}
				return wikitext;
			}
			// End HotCat functions

			var text = otext,
				arr = is_rtl ? '\u2190' : '\u2192', // left and right arrows. Don't use ← and → in the code.
				sumCmt, // summary comment
				sumCmtShort;
			// Fix text
			switch (mode) {
				case 'add':
					text = addCategory(text, targetcat);
					sumCmt = msgs["cat-a-lot-summary-add"].replace(/\$1/g, targetcat);
					sumCmtShort = '+[[' + catNS + targetcat + ']]';
					break;
				case 'copy':
					text = text.replace(this.regexCatBuilder(sourcecat), '[[' + catNS + sourcecat + '$1]]\n[[' + catNS + targetcat + '$1]]\n');
					sumCmt = msgs["cat-a-lot-summary-copy"].replace(/\$1/g, sourcecat).replace(/\$2/g, targetcat);
					sumCmtShort = '+[[' + catNS + sourcecat + ']]' + arr + '[[' + catNS + targetcat + ']]';
					// If category is added through template:
					if (otext === text) { text = addCategory(text, targetcat); }

					break;
				case 'move':
					text = text.replace(this.regexCatBuilder(sourcecat), '[[' + catNS + targetcat + '$1]]\n');
					sumCmt = msgs["cat-a-lot-summary-move"].replace(/\$1/g, sourcecat).replace(/\$2/g, targetcat);
					sumCmtShort = '±[[' + catNS + sourcecat + ']]' + arr + '[[' + catNS + targetcat + ']]';
					break;
				case 'remove':
					text = text.replace(this.regexCatBuilder(targetcat), '');
					sumCmt = msgs["cat-a-lot-summary-remove"].replace(/\$1/g, targetcat);
					sumCmtShort = '-[[' + catNS + targetcat + ']]';
					break;
			}

			if (text === otext) {
				this.notFound.push(file[0]);
				this.updateCounter();
				return;
			}
			otext = text;

			// Remove {{uncat}} after we checked whether we changed the text successfully.
			// Otherwise we might fail to do the changes, but still replace {{uncat}}
			if (mode !== 'remove' && (!non || userGrp.indexOf('autoconfirmed') > -1)) {
				if (!this.is_hidden) {
					text = this.removeUncat(text);
					if (text.length !== otext.length) { sumCmt += '; ' + msgs["cat-a-lot-uncatpref"]; }
				}
				text = this.doCleanup(text);
			}

			sumCmt += this.summary ? ' ' + this.summary : '';

			var preM = msgs["cat-a-lot-prefix-summary"];
			var usgM = msgs["cat-a-lot-using-summary"];

			// Try shorten summary
			if (preM || usgM) {
				sumCmt = (sumCmt.length > 250 - preM.length - usgM.length) ?
					sumCmt + ' (CatAlot)' : preM + sumCmt + usgM;
			}

			if (sumCmt.length > 254) // Try short summary
			{ sumCmt = sumCmtShort; }

			var data = {
				action: 'edit',
				assert: 'user',
				summary: sumCmt,
				title: file[0],
				text: text,
				bot: true,
				starttimestamp: this.starttimestamp,
				basetimestamp: timestamp,
				watchlist: this.settings.watchlist,
				tags: this.changeTag,
				token: this.edittoken
			};
			if (this.settings.minor) {
				// boolean parameters are quirky, see
				// https://commons.wikimedia.org/w/api.php?action=help&modules=main#main/datatype/boolean
				data.minor = true;
			}

			this.doAPICall(data, function (r) {
				delete CAL.XHR[file[0]];
				return CAL.updateUndoCounter(r);
			});
			this.markAsDone(file[1], mode, targetcat);
		},

		markAsDone: function (label, mode, targetcat) {
			mode = (function (m) {
				switch (m) {
					case 'add': return 'added-cat';
					case 'copy': return 'copied-cat';
					case 'move': return 'moved-cat';
					case 'remove': return 'removed-cat';
				}
			}(mode));
			label.addClass('cat_a_lot_markAsDone').append('<br>' + msg(mode, targetcat));
		},

		updateUndoCounter: function (r) {
			this.updateCounter();
			if (!r.edit || r.edit.result !== 'Success') { return; }
			r = r.edit;

			this.undoList.push({
				title: r.title,
				id: r.newrevid,
				timestamp: r.newtimestamp
			});
		},

		updateCounter: function () {
			this.counterCurrent++;
			if (this.counterCurrent > this.counterNeeded) { this.displayResult(); } else { this.domCounter.text(this.counterCurrent); }
		},

		displayResult: function () {
			document.body.style.cursor = 'auto';
			$.removeSpinner('fb-dialog');
			this.progressDialog.parent()
				.addClass('cat_a_lot_done')
				.find('.ui-dialog-buttonpane button span').eq(0)
				.text(mw.msg('Returnto', this.localCatName + mw.config.get('wgTitle')));
			var rep = this.domCounter.parent()
				.height('auto')
				.html('<h3>' + msgs["cat-a-lot-done"] + '</h3>')
				.append(msgs["cat-a-lot-all-done"] + '<br>');
			if (this.alreadyThere.length) {
				rep.append('<h5>' + msgs["cat-a-lot-skipped-already"] + ' ' + this.alreadyThere.length + '</h5>')
					.append(this.alreadyThere.join('<br>'));
			}

			if (this.notFound.length) {
				rep.append('<h5>' + msgs["cat-a-lot-skipped-not-found"] + ' ' + this.notFound.length + '</h5>')
					.append(this.notFound.join('<br>'));
			}

			if (this.connectionError.length) {
				rep.append('<h5>' + msgs["cat-a-lot-skipped-server"] + ' ' + this.connectionError.length + '</h5>')
					.append(this.connectionError.join('<br>'));
			}

		},

		/**
		 * 执行分类操作的主要函数
		 * 根据用户选择的分类和操作模式，准备API调用参数
		 * 显示进度对话框并开始批量操作流程
		 * @param {Object} targetcat - 目标分类DOM对象
		 * @param {string} mode - 操作模式：add/copy/move/remove
		 * @returns {Object} 选中的页面列表
		 */
		doSomething: function (targetcat, mode) {
			var pages = this.getMarkedLabels();
			if (!pages.length) { return alert(mw.msg('Ooui-selectfile-placeholder')); }
			targetcat = $(targetcat).closest('tr').data('cat');

			this.notFound = [];
			this.alreadyThere = [];
			this.connectionError = [];
			this.counterCurrent = 1;
			this.counterNeeded = pages.length;
			this.undoList = [];
			this.XHR = {};
			this.cancelled = 0;
			this.summary = '';

			if ($('#cat_a_lot_comment')[0].value != '') { this.summary = $('#cat_a_lot_comment')[0].value; } // TODO custom pre-value
			if (this.summary !== null) {
				mw.loader.using(['jquery.ui', 'jquery.spinner', 'mediawiki.util'], function () {
					CAL.showProgress();
					CAL.getTargetCat(pages, targetcat, mode);
				});
			}

		},

		/**
		 * 执行API调用的核心函数
		 * 处理所有与MediaWiki API的通信
		 * 包含错误处理和重试机制，支持最多30次重试
		 * @param {Object} params - API调用参数
		 * @param {Function} callback - 成功回调函数
		 */
		doAPICall: function (params, callback) {
			params = $.extend({
				action: 'query',
				format: 'json'
			}, params);

			var i = 0,
				self = this,
				apiUrl = this.apiUrl,
				doCall,
				handleError = function (jqXHR, textStatus, errorThrown) {
					mw.log('Error: ', jqXHR, textStatus, errorThrown);
					if (i < 30) {
						window.setTimeout(doCall, 1000);
						i++;
					} else if (params.title) {
						self.connectionError.push(params.title);
						self.updateCounter();
						return;
					}
				};
			doCall = function () {
				var xhr = $.ajax({
					url: apiUrl,
					cache: false,
					dataType: 'json',
					data: params,
					type: 'POST',
					success: callback,
					error: handleError
				});

				if (params.action === 'edit' && !CAL.cancelled) { CAL.XHR[params.title] = xhr; }
			};
			doCall();
		},

		createCatLinks: function (symbol, list, table) {
			list.sort();
			var button = (this.settings.button && mw.loader.getState('jquery.ui') === 'ready') ? 1 : 0;
			for (var c = 0; c < list.length; c++) {
				var $tr = $('<tr>'),
					$link = $('<a>', {
						href: mw.util.getUrl(CAL.localCatName + list[c]),
						text: list[c]
					}),
					$buttons = [];
				$tr.data('cat', list[c]);
				$link.on('click', function (e) {
					if (!e.ctrlKey) {
						e.preventDefault();
						CAL.updateCats($(this).closest('tr').data('cat'));
					}
				});

				$tr.append($('<td>').text(symbol))
					.append($('<td>').append($link));

				$buttons.push($('<a>')
					.text("移除")
					.on('click', function () {
						CAL.doSomething(this, 'remove');
					})
					.addClass('cat_a_lot_move')
				);
				if (button) {
					$buttons.slice(-1)[0].button({
						icons: { primary: 'ui-icon-minusthick' },
						showLabel: false,
						text: false
					});
				}

				if (this.origin) {
					// Can't move to source category
					if (list[c] !== this.origin) {
						$buttons.push($('<a>')
							.text(msgs["cat-a-lot-move"])
							.on('click', function () {
								CAL.doSomething(this, 'move');
							})
							.addClass('cat_a_lot_move')
						);
						if (button) {
							$buttons.slice(-1)[0].button({
								icons: { primary: 'ui-icon-arrowthick-1-e' },
								showLabel: false,
								text: false
							});
						}

						$buttons.push($('<a>')
							.text(msgs["cat-a-lot-copy"])
							.on('click', function () {
								CAL.doSomething(this, 'copy');
							})
							.addClass('cat_a_lot_action')
						);
						if (button) {
							$buttons.slice(-1)[0].button({
								icons: { primary: 'ui-icon-plusthick' },
								showLabel: false,
								text: false
							});
						}

					}
				} else {
					$buttons.push($('<a>')
						.text(msgs["cat-a-lot-add"])
						.on('click', function () {
							CAL.doSomething(this, 'add');
						})
						.addClass('cat_a_lot_action')
					);
					if (button) {
						$buttons.slice(-1)[0].button({
							icons: { primary: 'ui-icon-plusthick' },
							showLabel: false,
							text: false
						});
					}

				}
				// TODO CSS may extern
				var css = button ? { fontSize: '.6em', margin: '0', width: '2.5em' } : {};
				for (var b = 0; b < $buttons.length; b++) { $tr.append($('<td>').append($buttons[b].css(css))); }

				table.append($tr);
			}
		},

		getCategoryList: function () {
			this.catCounter = 0;
			this.getParentCats();
			this.getSubCats();
		},

		_getPageQuery: function (data) {
			// There should be only one, but we don't know its ID
			if (data && data.query && data.query.pages) {
				data = data.query.pages;
				for (var p in data) { return data[p]; }
			}
		},

		/**
	*  @brief takes this.currentCategory if redir_category is configured
	** Cat pages with more than one cat link are still not supported for sure
	*  @return soft redirected cat
	*/
		solveSoftRedirect: function () {
			this.doAPICall({
				prop: 'links', // TODO: For more accuracy the revisions could be checked
				titles: 'Category:' + this.currentCategory,
				// 'rvprop': 'content',
				// 'pllimit': 'max',
				plnamespace: 14
			}, function (page) {
				page = CAL._getPageQuery(page);
				if (page) {
					var lks = page.links;
					if (lks && lks.length === 1 && lks[0].title) {
						CAL.currentCategory = lks[0].title.replace(reCat, '');
						$searchInput.val(CAL.currentCategory);
						return CAL.getCategoryList();
					} else {
						// TODO? better translatable warning message: "Please solve the category soft redirect manually!"
						$resultList.html('<span id="cat_a_lot_no_found">' + mw.msg('Apifeatureusage-warnings', mw.msg('Categorytree-not-found', CAL.currentCategory)) + '</span>');
					}
				}
			});
		},

		showCategoryList: function () {
			if (this.settings.redir_category && this.settings.redir_category === this.parentCats[0]) { return this.solveSoftRedirect(); }

			var table = $('<table>');

			this.createCatLinks('↑', this.parentCats, table);
			this.createCatLinks('→', [this.currentCategory], table);
			// Show on soft-redirect
			if ($searchInput.val() === this.currentCategory && this.origin !== this.currentCategory) { this.createCatLinks('→', [this.origin], table); }
			this.createCatLinks('↓', this.subCats, table);

			$resultList.empty();
			$resultList.append(table);

			document.body.style.cursor = 'auto';

			// Reset width
			$container.width('');
			$container.height('');
			$container.width(Math.min(table.width() * 1.1 + 15, $(window).width() - 10));

			$resultList.css({
				maxHeight: Math.min(this.setHeight, $(window).height() - $container.position().top - $settingsLink.outerHeight() - $selections.outerHeight() - 15),
				height: ''
			});
			table.width('100%');
			$container.height(Math.min($container.height(), $head.offset().top - $container.offset().top + 10));
			$container.offset({ left: $(window).width() - $container.outerWidth() }); // Fix overlap
		},

		updateCats: function (newcat) {
			document.body.style.cursor = 'wait';
			this.currentCategory = newcat;
			$resultList.html('<div class="cat_a_lot_loading">' + mw.msg('cat-a-lot-loading') + '</div>');
			this.getCategoryList();
		},

		/**
		 * 执行撤销操作
		 * 遍历撤销列表，逐个撤销之前的编辑操作
		 * 使用MediaWiki API的undo参数进行精确撤销
		 */
		doUndo: function () {
			this.cancelled = 0;
			this.doAbort();
			if (!this.undoList.length) { return; }

			$('.cat_a_lot_feedback').removeClass('cat_a_lot_done');
			this.counterNeeded = this.undoList.length;
			this.counterCurrent = 1;

			document.body.style.cursor = 'wait';

			var query = {
				action: 'edit',
				user: mw.config.get('wgUserName'),
				bot: true,
				starttimestamp: this.starttimestamp,
				watchlist: this.settings.watchlist,
				tags: this.changeTag,
				token: this.edittoken
			};
			if (this.settings.minor) {
				// boolean parameters are quirky, see
				// https://commons.wikimedia.org/w/api.php?action=help&modules=main#main/datatype/boolean
				query.minor = true;
			}
			for (var i = 0; i < this.undoList.length; i++) {
				var uID = this.undoList[i];
				query.title = uID.title;
				query.undo = uID.id;
				query.basetimestamp = uID.timestamp;
				this.doAPICall(query, function (r) {
					// TODO: Add "details" to progressbar?
					// $resultList.append( [mw.msg('Filerevert-submit') + " done " + r.edit.title, '<br>' ] );
					if (r && r.edit) { mw.log('Revert done', r.edit.title); }
					CAL.updateCounter();
				});
			}
		},

		/**
		 * 中止操作函数
		 * 取消所有正在进行的API调用
		 * 清理进度对话框和界面状态
		 */
		doAbort: function () {
			for (var t in this.XHR) { this.XHR[t].abort(); }

			if (this.cancelled) { // still not for undo
				this.progressDialog.remove();
				this.toggleAll(false);
				$head.last().show();
			}
			this.cancelled = 1;
		},

		/**
		 * 显示进度对话框
		 * 创建模态对话框显示操作进度
		 * 包含取消功能和撤销功能
		 */
		showProgress: function () {
			document.body.style.cursor = 'wait';
			this.progressDialog = $('<div>')
				.html(' ' + msgs["cat-a-lot-editing"] + ' <span id="cat_a_lot_current">' + CAL.counterCurrent + '</span> ' + msgs["cat-a-lot-of"] + CAL.counterNeeded)
				.prepend($.createSpinner({ id: 'fb-dialog', size: 'large' }))
				.dialog({
					width: 450,
					height: 180,
					minHeight: 90,
					modal: true,
					resizable: false,
					draggable: false,
					// closeOnEscape: true,
					dialogClass: 'cat_a_lot_feedback',
					buttons: [{
						text: mw.msg('Cancel'), // Stops all actions
						click: function () {
							$(this).dialog('close');
						}
					}],
					close: function () {
						CAL.cancelled = 1;
						CAL.doAbort();
						$(this).remove();
					},
					open: function (event, ui) { // Workaround modify
						ui = $(this).parent();
						ui.find('.ui-dialog-titlebar').hide();
						ui.find('.ui-dialog-buttonpane.ui-widget-content')
							.removeClass('ui-widget-content');
						/* .find( 'span' ).css( { fontSize: '90%' } )*/
					}
				});
			if ($head.children().length < 3) {
				$('<span>')
					.css({
						'float': 'right',
						fontSize: '75%'
					})
					.append(['[ ',
						$('<a>', { title: 'Revert all last done edits' }) // TODO i18n
							.on('click', function () {
								if (window.confirm(mw.msg('Apifeatureusage-warnings', this.title + '⁉'))) {
									CAL.doUndo();
									$(this).parent().remove();
								}
								return false;
							})
							.addClass('new')
							.text(mw.msg('Filerevert-submit')),
						' ]'
					]).insertAfter($link);
			}

			this.domCounter = $('#cat_a_lot_current');
		},

		minimize: function (e) {
			CAL.top = Math.max(0, $container.position().top);
			CAL.height = $container.height();
			$dataContainer.hide();
			$container.animate({
				height: $head.height(),
				top: $(window).height() - $head.height() * 1.4
			}, function () {
				$(e.target).one('click', CAL.maximize);
			});
		},

		maximize: function (e) {
			$dataContainer.show();
			$container.animate({
				top: CAL.top,
				height: CAL.height
			}, function () {
				$(e.target).one('click', CAL.minimize);
			});
		},

		/**
		 * 主运行函数
		 * 控制Cat-a-lot工具的启动和停止
		 * 根据页面状态创建可交互界面
		 */
		run: function () {
			if ($('.cat_a_lot_enabled')[0]) {
				this.makeClickable();
				if (!this.executed) { // only once
					$selectInvert.text(mw.msg('Checkbox-invert'));
					if (this.settings.editpages && this.pageLabels[0]) {
						$selectFiles.text(mw.msg('Prefs-files'));
						$selectPages.text(mw.msg('Categories')).parent().show();
					}
					$link.after($('<a>')
						.text('–')
						.css({ fontWeight: 'bold', marginLeft: '.7em' })
						.one('click', this.minimize)
					);
				}
				$dataContainer.show();
				$container.one('mouseover', function () {
					$(this)
						.resizable({
							handles: 'n',
							alsoResize: '#cat_a_lot_category_list',
							resize: function () {
								$resultList
									.css({
										maxHeight: '',
										width: ''
									});
							},
							start: function (e, ui) { // Otherwise box get static if sametime resize with draggable
								ui.helper.css({
									top: ui.helper.offset().top - $(window).scrollTop(),
									position: 'fixed'
								});
							},
							stop: function () {
								CAL.setHeight = $resultList.height();
							}
						})
						.draggable({
							cursor: 'move',
							start: function (e, ui) {
								ui.helper.on('click.prevent',
									function (e) { e.preventDefault(); }
								);
								ui.helper.css('height', ui.helper.height());
							},
							stop: function (e, ui) {
								setTimeout(
									function () {
										ui.helper.off('click.prevent');
									}, 300
								);
							}
						})
						.one('mousedown', function () {
							$container.height($container.height()); // Workaround to calculate
						});
					$resultList
						.css({ maxHeight: 450 });
				});
				this.updateCats(this.origin || 'Images');

				$link.html($('<span>')
					.text('×')
					.css({ font: 'bold 2em monospace', lineHeight: '.75em' })
				);
				$link.next().show();
				if (this.cancelled) { $head.last().show(); }
				mw.cookie.set('catAlotO', ns); // Let stay open on new window
			} else { // Reset
				$dataContainer.hide();
				$container
					.draggable('destroy')
					.resizable('destroy')
					.removeAttr('style');
				// Unbind click handlers
				this.labels.off('click.catALot');
				this.setHeight = 450;
				$link.text('Cat-a-lot')
					.nextAll().hide();
				this.executed = 1;
				mw.cookie.set('catAlotO', null);
			}
		},

		/**
		 * 管理设置函数
		 * 启动设置管理界面
		 * 异步加载所需的外部库
		 */
		manageSettings: function () {
			mw.loader.using(['//cdn.jsdelivr.net/gh/Mustafabot/js-MoegiriPedia/SettingsManager.js', '//cdn.jsdelivr.net/gh/Mustafabot/js-MoegiriPedia/SettingsUI.js', 'jquery.ui'], CAL._manageSettings);
		},

		/**
		 * 内部设置管理函数
		 * 处理设置保存、应用和重启动逻辑
		 * 支持页面保存和账户公共设置两种保存方式
		 */
		_manageSettings: function () {
			mw.libs.SettingsUI(CAL.defaults, 'Cat-a-lot')
				.show()
				.done(function (s, verbose, loc, settingsOut, $dlg) {
					var mustRestart = false,
						_restart = function () {
							if (!mustRestart) { return; }
							$container.remove();
							CAL.labels.off('click.catALot');
							CAL.init();
						},
						_saveToJS = function () {
							var opt = mw.libs.settingsManager.option({
								optionName: 'catALotPrefs',
								value: CAL.settings,
								encloseSignature: 'catALot',
								encloseBlock: '////////// Cat-a-lot user preferences //////////\n',
								triggerSaveAt: /Cat.?A.?Lot/i,
								editSummary: msgs["cat-a-lot-pref-save-summary"]
							}),
								oldHeight = $dlg.height(),
								$prog = $('<div>');

							$dlg.css('height', oldHeight)
								.html('');
							$prog.css({
								height: Math.round(oldHeight / 8),
								'margin-top': Math.round((7 * oldHeight) / 16)
							})
								.appendTo($dlg);

							$dlg.parent()
								.find('.ui-dialog-buttonpane button')
								.button('option', 'disabled', true);

							opt.save()
								.done(function (text, progress) {
									$prog.progressbar({
										value: progress
									});
									$prog.fadeOut(function () {
										$dlg.dialog('close');
										_restart();
									});
								})
								.progress(function (text, progress) {
									$prog.progressbar({
										value: progress
									});
									// TODO: Add "details" to progressbar
								})
								.fail(function (text) {
									$prog.addClass('ui-state-error');
									$dlg.prepend($('<p>')
										.text(text));
								});
						};
					$.each(settingsOut, function (n, v) {
						if (v.forcerestart && CAL.settings[v.name] !== v.value) { mustRestart = true; }
						CAL.settings[v.name] = CAL.catALotPrefs[v.name] = v.value;
					});
					switch (loc) {
						case 'page':
							$dlg.dialog('close');
							_restart();
							break;
						case 'account-publicly':
							_saveToJS();
							break;
					}
				});
		},

		_initSettings: function () {
			if (this.settings.watchlist) { return; }
			this.catALotPrefs = window.catALotPrefs || {};
			for (var i = 0; i < this.defaults.length; i++) {
				var v = this.defaults[i];
				v.value = this.settings[v.name] = (this.catALotPrefs[v.name] === undefined ? v['default'] : this.catALotPrefs[v.name]);
				v.label = msg(v.label_i18n);
				if (v.select_i18n) {
					v.select = {};
					$.each(v.select_i18n, function (i18nk, val) {
						v.select[msg(i18nk)] = val;
					});
				}
			}
		},
		/* eslint-disable camelcase */
		defaults: [{
			name: 'watchlist',
			'default': 'preferences',
			label_i18n: 'watchlistpref',
			select_i18n: {
				watch_pref: 'preferences',
				watch_nochange: 'nochange',
				watch_watch: 'watch',
				watch_unwatch: 'unwatch'
			}
		}, {
			name: 'minor',
			'default': false,
			label_i18n: 'minorpref'
		}, {
			name: 'editpages',
			'default': project !== 'commonswiki', // on Commons false
			label_i18n: 'editpagespref',
			forcerestart: true
		}, {
			name: 'docleanup',
			'default': false,
			label_i18n: 'docleanuppref'
		}, {
			name: 'subcatcount',
			'default': 50,
			min: 5,
			max: 500,
			label_i18n: 'subcatcountpref',
			forcerestart: true
		}, {
			name: 'uncat',
			'default': project === 'commonswiki', // on Commons true
			label_i18n: 'uncatpref'
		}, {
			name: 'button',
			'default': true,
			label_i18n: 'buttonpref'
		}]
		/* eslint-enable camelcase */
	};

	// The gadget is not immediately needed, so let the page load normally
	window.setTimeout(function () {
		non = mw.config.get('wgUserName');
		if (non) {
			if (mw.config.get('wgRelevantUserName') === non) { non = 0; } else {
				$.each(['sysop', 'file-maintainer', 'patroller', 'bot', 'flood'], function (i, v) {
					non = $.inArray(v, userGrp) === -1;
					return non;
				});
			}
		} else { non = 1; }

		switch (ns) {
			case 14:
				CAL.searchmode = 'category';
				CAL.origin = mw.config.get('wgTitle');
				break;
			case -1:
				CAL.searchmode = {
					// list of accepted special page names mapped to search mode names
					Contributions: 'contribs',
					Listfiles: non ? null : 'listfiles',
					Prefixindex: non ? null : 'prefix',
					Search: 'search',
					Uncategorizedimages: 'gallery'
				}[mw.config.get('wgCanonicalSpecialPageName')];
				break;
			case 2:
			case 0:
				CAL.searchmode = 'gallery';
				var parents = $('#mw-normal-catlinks ul').find('a[title]'), n;
				parents.each(function (i) {
					if (new RegExp(mw.config.get('wgTitle'), 'i').test($(this).text())) {
						n = i;
						return false;
					}
				});
				CAL.origin = parents.eq(n || 0).text();
		}

		if (CAL.searchmode) {
			var loadingLocalizations = 1;
			var loadLocalization = function (lang, cb) {
				loadingLocalizations++;
				switch (lang) {
					case 'zh-hk':
					case 'zh-mo':
					case 'zh-tw':
						lang = 'zh-hant';
						break;
					case 'zh':
					case 'zh-cn':
					case 'zh-my':
					case 'zh-sg':
						lang = 'zh-hans';
						break;
				}

				$.ajax({
					url: commonsURL,
					dataType: 'script',
					data: {
						title: 'MediaWiki:Gadget-Cat-a-lot.js/' + lang,
						action: 'raw',
						ctype: 'text/javascript',
						// Allow caching for 28 days
						maxage: 2419200,
						smaxage: 2419200
					},
					cache: true,
					success: cb,
					error: cb
				});
			};
			var maybeLaunch = function () {
				loadingLocalizations--;
				function init() {
					$(function () {
						CAL.init();
					});
				}
				if (!loadingLocalizations) { mw.loader.using(['user'], init, init); }
			};

			var userlang = mw.config.get('wgUserLanguage'),
				contlang = mw.config.get('wgContentLanguage');
			if (userlang !== 'en') { loadLocalization(userlang, maybeLaunch); }
			if ($.inArray(contlang, ['en', userlang]) === -1) { loadLocalization(contlang, maybeLaunch); }
			maybeLaunch();
		}
	}, 400);

	/**
	 * When clicking a cat-a-lot label with Shift pressed, select all labels between the current and last-clicked one.
	 */
	$.fn.catALotShiftClick = function (cb) {
		var prevCheckbox = null,
			$box = this;
		// When our boxes are clicked..
		$box.on('click.catALot', function (e) {
			// Prevent following the link and text selection
			if (!e.ctrlKey) { e.preventDefault(); }
			// Highlight last selected
			$('#cat_a_lot_last_selected')
				.removeAttr('id');
			var $thisControl = $(e.target),
				method;
			if (!$thisControl.hasClass('cat_a_lot_label')) { $thisControl = $thisControl.parents('.cat_a_lot_label'); }

			$thisControl.attr('id', 'cat_a_lot_last_selected')
				.toggleClass('cat_a_lot_selected');
			// And one has been clicked before…
			if (prevCheckbox !== null && e.shiftKey) {
				method = $thisControl.hasClass('cat_a_lot_selected') ? 'addClass' : 'removeClass';
				// Check or uncheck this one and all in-between checkboxes
				$box.slice(
					Math.min($box.index(prevCheckbox), $box.index($thisControl)),
					Math.max($box.index(prevCheckbox), $box.index($thisControl)) + 1
				)[method]('cat_a_lot_selected');
			}
			// Either way, update the prevCheckbox variable to the one clicked now
			prevCheckbox = $thisControl;
			if ($.isFunction(cb)) { cb(); }
		});
		return $box;
	};

}(jQuery, mediaWiki));