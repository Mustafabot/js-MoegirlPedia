(function ($) {
	const TRAD_VARIANTS = ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo'];
	const detectVariant = () => {
		const variant = mw.config.get('wgUserVariant') || mw.config.get('wgUserLanguage') || 'zh-hans';
		return TRAD_VARIANTS.includes(variant) ? 'zh-hant' : 'zh-hans';
	};
	
	var nsNumber = mw.config.get('wgNamespaceNumber'),
		origPageName = mw.config.get('wgPageName'),
		scriptPath = mw.config.get('wgScriptPath');

	var SUFFIX_APPEND = 0,
		SUFFIX_REPLACE = 1,
		SUFFIX_SETDEFAULT = 2,
		isCategory = nsNumber === 14;

	if (nsNumber === -1) {
		var chainNoop = function () { return this; };
		var noop = function () {};
		mw.toolsRedirect = {
			SUFFIX_APPEND,
			SUFFIX_REPLACE,
			SUFFIX_SETDEFAULT,
			findRedirectCallback: chainNoop,
			findRedirectBySelector: chainNoop,
			setRedirectTextSuffix: noop
		};
		return;
	}

	var _TR,
		_findRedirectCallbacks = [],
		_pageWithRedirectTextSuffix = {};
	var _nsCanonPrefix = origPageName.split(':')[0] + ':',
		_nsPrefixPattern = $.map(mw.config.get('wgNamespaceIds'), function (nsid, text) {
			return nsid === nsNumber ? text : null;
		}).join('|');
	_nsPrefixPattern = new RegExp('^(' + _nsPrefixPattern + '):', 'i');

	if (nsNumber === 0) {
		// articles
		_nsCanonPrefix = '';
		_nsPrefixPattern = /^/;
	}

	function fixNamespace(title) {
		if (nsNumber === 0) {
			// do nothing if it's articles
			return title;
		} else if (_nsPrefixPattern.test(title)) {
			// canonize the namespace
			return title.replace(_nsPrefixPattern, _nsCanonPrefix);
		} else {
			// don't have a namespace
			return _nsCanonPrefix + title;
		}
	}

	mw.toolsRedirect = {
		SUFFIX_APPEND: SUFFIX_APPEND,
		SUFFIX_REPLACE: SUFFIX_REPLACE,
		SUFFIX_SETDEFAULT: SUFFIX_SETDEFAULT,

		findRedirectCallback: function (callback) {
			/* Add new custom callback for finding new
			 * potential redirect titles.
			 *
			 * @param {function} callback( pagename, $content, titles ) -> title list
			 */
			if (arguments.length === 1) {
				_findRedirectCallbacks.push(callback);
			} else {
				$.merge(_findRedirectCallbacks, arguments);
			}
			return this;
		},

		findRedirectBySelector: function (selector) {
			/* A shortcut to add CSS selectors as rule to find new potential
			 * redirect titles.
			 *
			 * @param {string} selector
			 */
			_findRedirectCallbacks.push(function () {
				return $(selector).map(function () {
					var title = $(this).text();
					return title || null;
				});
			});
			return this;
		},

		setRedirectTextSuffix: function (title, suffix, flag) {
			var flag_set = false,
				flag_append = false;
			flag = flag || SUFFIX_APPEND; // default append
			flag_set = flag === SUFFIX_REPLACE;
			title = fixNamespace(title);
			if (title in _pageWithRedirectTextSuffix) {
				flag_append = flag === SUFFIX_APPEND;
			} else {
				// if not exist, every flag can set
				flag_set = true;
			}

			if (flag_set) {
				_pageWithRedirectTextSuffix[title] = suffix;
			} else if (flag_append) {
				_pageWithRedirectTextSuffix[title] = _pageWithRedirectTextSuffix[title] + suffix;
			}
		},
	};

	_TR = {
		msg: null,
		tabselem: null,
		tagselem: null,
		init: function () {
			if (!this.msg) {
				return;
			} // not setup correctly
			mw.util.addCSS('.tools-redirect_methods-link + .tools-redirect_methods-link { margin-left: 0.4em; }');
			var self = this,
				btn = $(mw.util.addPortletLink('p-views', '#', this.msg.btntitle, 'ca-redirect', this.msg.btndesc, null, '#ca-watch')).addClass('collapsible').css('cursor', 'pointer');
			btn.click(function (evt) {
				evt.preventDefault();
				self.dialog();
			});
			mw.config.get('skin') === 'vector-2022' ? $('#p-cactions ul').append(btn) : $('li#ca-history').after(btn);
		},
		dialog: function () {
			var dlg = $('<div class="dialog-redirect" title="' + this.msg.dlgtitle + '">').dialog({
				bgiframe: true,
				resizable: false,
				modal: true,
				width: 600,
			});
			this.tabselem = $('<div class="tab-redirect">').appendTo(dlg);
			this.tagselem = $('<ul>').appendTo(this.tabselem);
			this.addTabs();
			this.tabselem.tabs();
		},
		addTabs: function () {
			for (var kname in this.tabs) {
				if (this.tabs[kname] === null) {
					this.tabs[kname] = this['_initTab' + kname[0].charAt(0).toUpperCase() + kname.slice(1)]();
				}
				var tab = this.tabs[kname];
				this.tagselem.append(tab.tag);
				this.tabselem.append(tab.cont);
			}
			// default tab, autoload when dialog initiate
			this.loadView();
		},
		createTab: function (tabname, tabtitle, onClick) {
			var self = this,
				tag = $('<li><a href="#tab-' + tabname + '">' + tabtitle + '</a></li>'),
				cont = $('<div id="tab-' + tabname + '"/>');
			$('a', tag).on('click', function () {
				onClick.call(self);
			});
			return {tag: tag, cont: cont, loaded: false};
		},
		_initTabView: function () {
			return this.createTab('view', this.msg.tabviewtitle, this.loadView);
		},
		_initTabCreate: function () {
			return this.createTab('create', this.msg.tabcreatetitle, this.loadCreate);
		},
		tabs: {
			view: null,
			create: null,
		},
		fix: function (pagenames) {
			var self = this;
			$('p.desc', this.tabs.view.cont).text(this.msg.fixloading);
			$('p[class!=desc]', this.tabs.view.cont).remove();
			this.loading(this.tabs.view.cont);
			this.bulkEditByRegex(pagenames, / \[\[(.*?)\]\]/, (_, oldRedirectTarget) => {
				let newRedirectTarget = origPageName;
				if (oldRedirectTarget.includes('#')) {
					// 嘗試複製章節
					const oldRedirectTitle = mw.Title.newFromText(oldRedirectTarget);
					if (oldRedirectTitle && oldRedirectTitle.fragment) {
						newRedirectTarget += `#${oldRedirectTitle.fragment}`;
					}
				}
				return ` [[${newRedirectTarget}]]`;
			}, this.msg.fixsummary).done(function () {
				// delay load before the asynchronous tasks on server finished
				setTimeout(function () {
					self.loaded(self.tabs.view.cont);
					self.loadView(true);
				}, 3000);
			});
		},
		create: function (pagenames) {
			var self = this;
			$('p.desc', this.tabs.create.cont).text(this.msg.createloading);
			$('p[class!=desc]', this.tabs.create.cont).remove();
			this.loading(this.tabs.create.cont);
			this.bulkEdit(pagenames, this.msg.createtext.replace('$1', origPageName), this.msg.createsummary.replace('$1', origPageName)).done(function () {
				// delay load before the asynchronous tasks on server finished
				setTimeout(function () {
					self.loaded(self.tabs.create.cont);
					self.tabs.view.loaded = false;
					self.loadCreate(true);
				}, 500);
			});
		},
		addRedirectTextSuffix: function (title, text) {
			if (title in _pageWithRedirectTextSuffix) {
				text = text + _pageWithRedirectTextSuffix[title];
			}
			return text;
		},
		bulkEdit: function (titles, text, summary) {
			var self = this;
			titles = titles.filter(function (v, i, arr) {
				return arr.indexOf(v) === i;
			});
			titles = titles.join('|');
			return $.ajax(this.buildQuery({action: 'query', prop: 'info', titles: titles, meta: 'tokens'})).then(function (data) {
				var deferreds = [];
				$.each(data.query.pages, function (idx, page) {
					deferreds.push(
						$.ajax(
							self.buildQuery({
								action: 'edit',
								title: page.title,
								token: data.query.tokens.csrftoken,
								text: self.addRedirectTextSuffix(page.title, text),
								summary: summary,
								tag:'Automation tool',
							})
						)
					);
				});
				return $.when.apply($, deferreds);
			});
		},
		bulkEditByRegex: function (titles, r, t, summary) {
			var self = this;
			titles = titles.filter(function (v, i, arr) {
				return arr.indexOf(v) === i;
			});
			titles = titles.join('|');
			return $.ajax(this.buildQuery({ action: 'query', prop: 'revisions', titles: titles, rvprop: 'content', meta: 'tokens' })).then(function (data) {
				var deferreds = [];
				$.each(data.query.pages, function (idx, page) {
					var content = page.revisions[0]['*'];
					var newContent = content.replace(r, t);
					deferreds.push(
						$.ajax(
							self.buildQuery({
								action: 'edit',
								title: page.title,
								token: data.query.tokens.csrftoken,
								text: newContent,
								summary: summary,
								basetimestamp: page.revisions[0].timestamp,
								tag: 'Automation tool',
							})
						)
					);
				});
				return $.when.apply($, deferreds);
			});
		},
		loadTabCont: function (tabname, callback, reload) {
			var self = this,
				tab = this.tabs[tabname];
			if (reload) {
				tab.loaded = false;
			}
			if (!tab.loaded) {
				tab.cont.html('');
				var $desc = $('<p class="desc"><span class="desc-text">' + this.msg.rediloading + '</span></p>').appendTo(tab.cont),
					$text = $desc.find('> .desc-text');
				callback
					.apply(this)
					.done(function () {
						$text.text(self.msg['tab' + tabname + 'desc']);
					})
					.fail(function () {
						$text.text(self.msg['tab' + tabname + 'notfound']);
					})
					.always(function () {
						self.addMethods($desc, [
							{
								href: '#refresh',
								title: self.msg.refresh,
								click: function (evt) {
									evt.preventDefault();
									self.loadTabCont(tabname, callback, true);
								},
							},
						]);
					});
				tab.loaded = true;
			}
		},
		loading: function (container) {
			if (container.prop('tagName').toLowerCase() === 'span') {
				container.addClass('mw-ajax-loader');
			} else if ($('span.mw-ajax-loader', container).length === 0) {
				$('<span class="mw-ajax-loader"></span>').appendTo(container);
			}
		},
		loaded: function (container) {
			if (container.prop('tagName').toLowerCase() === 'span') {
				container.removeClass('mw-ajax-loader');
			} else {
				$('span.mw-ajax-loader', container).remove();
			}
		},
		selectAll: function (cont) {
			$('input[type=checkbox]:not(:disabled)', cont).prop('checked', true);
		},
		selectInverse: function (cont) {
			$('input[type=checkbox]:not(:disabled)', cont).each(function () {
				var e = $(this);
				e.prop('checked', !e.prop('checked'));
			});
		},
		selectAction: function (cont, cb) {
			var pagenames = [];
			$('input[type=checkbox]:checked', cont).each(function () {
				pagenames.push($(this).data('page-title'));
			});
			if (pagenames.length) {
				cb.call(this, pagenames);
			}
		},
		clickAction: function (cont, cb) {
			var pagename = $('input[type="checkbox"]', cont).data('page-title');
			cb.call(this, [pagename]);
		},
		buildLink: function (attr) {
			var a = $('<a href="' + attr.href + '" title="' + attr.title + '" target="blank">' + attr.title + '</a>');
			if (attr.click) {
				a.on('click', attr.click);
			}
			if (attr.classname) {
				a.addClass(attr.classname);
			}
			return $('<span class="tools-redirect_link">').append(a);
		},
		addMethods: function ($parent, methods) {
			var self = this,
				$container = $parent.find('> .tools-redirect_methods');

			function methodExist(method) {
				return $container.find('a[href=' + JSON.stringify(method.href) + ']').length > 0;
			}

			if ($container.length === 0) {
				$container = $('<span class="tools-redirect_methods">');
				$parent.append(' (', $container, ')');
			}

			$.each(methods, function (idx, method) {
				if (!methodExist(method)) {
					if ($container.children('.tools-redirect_link').length > 0) {
						$container.append(' | ');
					}
					self.buildLink(method).appendTo($container);
				}
			});
		},
		buildSelection: function (main, metd, mt, dsab) {
			var cont = $('<span>'),
				sele = $('<input type="checkbox"/>').appendTo(cont);
			this.buildLink(main).appendTo(cont);
			this.addMethods(cont, metd);
			sele.data('page-title', mt);
			if (dsab) {
				sele.attr('disabled', true);
			}
			return cont;
		},
		loadView: function (reload) {
			var $container = this.tabs.view.cont;
			this.loadTabCont(
				'view',
				function () {
					return this.loadRedirect(origPageName, $container, 0);
				},
				reload
			);
		},
		loadCreate: function (reload) {
			this.loadTabCont(
				'create',
				function () {
					return this.findRedirect(origPageName);
				},
				reload
			);
		},
		loadRedirect: function (pagename, container, deep, loaded) {
			this.loading(container);
			var self = this,
				deferObj = $.Deferred(),
				top = deep ? $('<dl>').appendTo(container) : container;

			if (!loaded) {
				loaded = {};
				loaded[pagename] = true;
			}

			function onClickFix(evt) {
				/* jshint validthis: true */
				var entry = $(this).parents('dd, p').first();
				evt.preventDefault();
				self.clickAction(entry, self.fix);
			}

			$.ajax(this.buildQuery({action: 'query', prop: 'redirects', titles: pagename, rdlimit: 'max'})).done(function (data) {
				self.loaded(container);
				var has_redirect = false,
					desc = $('p.desc', self.tabs.view.cont),
					maximumRedirectDepth = mw.config.get('toolsRedirectMaximumRedirectDepth', 10);

				$.each(data.query.pages, function (_, page) {
					if (!('redirects' in page)) {
						return;
					}
					$.each(page.redirects, function (_, rdpage) {
						var $container,
							isCycleRedirect,
							rdtitle = rdpage.title,
							ultitle = rdtitle.replace(/ /g, '_'),
							baseuri = scriptPath + '/index.php?title=' + encodeURIComponent(ultitle),
							entry = (deep ? $('<dd>') : $('<p>')).appendTo(top),
							methods = [
								{
									href: baseuri + '&action=edit',
									title: self.msg.rediedit,
								},
							];
						isCycleRedirect = rdtitle in loaded;
						loaded[rdtitle] = true;
						if (!isCycleRedirect && deep) {
							methods.push({
								href: '#fix-redirect',
								title: self.msg.tabviewfix,
								click: onClickFix,
							});
						}
						$container = self.buildSelection({href: baseuri + '&redirect=no', title: rdtitle}, methods, ultitle, !deep).appendTo(entry);
						if (isCycleRedirect) {
							$container.append('<span class="error">' + self.msg.errcycleredirect + '</span>');
						} else if (deep < maximumRedirectDepth) {
							deferObj.done(function () {
								return self.loadRedirect(rdtitle, entry, deep + 1, loaded);
							});
						}
						has_redirect = true;
					});
				});

				if (has_redirect && deep === 1) {
					self.addMethods(desc, [
						{
							href: '#select-all',
							title: self.msg.selectall,
							click: function (evt) {
								evt.preventDefault();
								self.selectAll(self.tabs.view.cont);
							},
						},
						{
							href: '#select-inverse',
							title: self.msg.selectinverse,
							click: function (evt) {
								evt.preventDefault();
								self.selectInverse(self.tabs.view.cont);
							},
						},
						{
							href: '#fix-selected',
							title: self.msg.tabviewfix,
							click: function (evt) {
								evt.preventDefault();
								self.selectAction(self.tabs.view.cont, self.fix);
							},
						},
					]);
				}

				if (has_redirect) {
					deferObj.resolveWith(self);
				} else {
					deferObj.rejectWith(self);
				}
			});

			return deferObj.promise();
		},
		findVariants: function (pagename, titles) {
			return this.findNotExists($.map(titles, function (title) {
				return fixNamespace(title);
			}));
		},

		findNotExists: function (titles) {
			var self = this,
				excludes = ['用字模式'];
			titles = $.uniqueSort(titles);
			return $.ajax(
				self.buildQuery({
					action: 'query',
					prop: 'info',
					titles: titles.join('|'),
				})
			).then(function (data) {
				var result = [];
				$.each(data.query.pages, function (pageid, page) {
					var title = page.title;
					if (pageid < 0 && excludes.indexOf(title) === -1) {
						result.push(title);
						if (isCategory) {
							var target = origPageName.replace(/^Category:/, '');
							mw.toolsRedirect.setRedirectTextSuffix(title, '\n{{分类重定向|$1}}'.replace('$1', target));
						}
					}
				});
				return result;
			});
		},

		findRedirect: function (pagename) {
			var self = this,
				titles = [],
				frcDeferreds = [],
				container = this.tabs.create.cont,
				$content = $('#mw-content-text > div.mw-parser-output'),
				deferObj = $.Deferred();
			this.loading(container);
			$.each(_findRedirectCallbacks, function (_, callback) {
				var ret = callback(pagename, $content, titles);
				if (typeof ret === 'string') {
					titles.push(ret);
				} else if ('done' in ret) {
					// is Deferred
					frcDeferreds.push(ret);
				} else {
					$.merge(titles, ret);
				}
			});
			// remove all empty titles
			titles = $.map(titles, function (title) {
				return title || null;
			});
			function onClickCreate(evt) {
				/* jshint validthis: true */
				var entry = $(this).parents('p:first');
				evt.preventDefault();
				self.clickAction(entry, self.create);
			}
			// handles the deferred callbacks
			$.when
				.apply($, frcDeferreds)
				.then(function () {
					$.each(arguments, function (_, ret) {
						if (typeof ret === 'string') {
							titles.push(ret);
						} else {
							$.merge(titles, ret);
						}
					});
					return self.findVariants(pagename, titles);
				})
				.done(function (titles) {
					// build HTML
					self.loaded(container);
					$.each(titles, function (_, title) {
						var ultitle = title.replace(' ', '_'),
							baseuri = scriptPath + '/index.php?title=' + encodeURIComponent(ultitle),
							entry = $('<p>').appendTo(container);
						self.buildSelection(
							{
								href: baseuri + '&action=edit&redlink=1',
								title: title,
								classname: 'new',
							},
							[
								{
									href: '#create-redirect',
									title: self.msg.tabcreatetitle,
									click: onClickCreate,
								},
							],
							ultitle,
							false
						).appendTo(entry);
					});
					var desc = $('p.desc', container);
					if (titles.length > 0) {
						self.addMethods(desc, [
							{
								href: '#select-all',
								title: self.msg.selectall,
								click: function (evt) {
									evt.preventDefault();
									self.selectAll(container);
								},
							},
							{
								href: '#select-inverse',
								title: self.msg.selectinverse,
								click: function (evt) {
									evt.preventDefault();
									self.selectInverse(container);
								},
							},
							{
								href: '#create-selected',
								title: self.msg.tabcreatetitle,
								click: function (evt) {
									evt.preventDefault();
									self.selectAction(container, self.create);
								},
							},
						]);
						deferObj.resolveWith(self, [titles]);
					} else {
						deferObj.rejectWith(self, [titles]);
					}
				});
			return deferObj.promise();
		},
		buildQuery: function (data) {
			var query = {url: scriptPath + '/api.php', dataType: 'json', type: 'POST'};
			query.data = data;
			query.data.format = 'json';
			return query;
		},
	};
	const MSG = {
		'zh-hans': {
			btntitle: '重定向',
			btndesc: '创建和管理本页面的重定向。',
			dlgtitle: '创建和管理重定向',
			rediloading: '数据加载中，请稍候……',
			rediedit: '编辑',
			selectall: '全选',
			selectinverse: '反选',
			tabviewtitle: '查看',
			tabviewdesc: '以下是指向本页面的重定向页：',
			tabviewnotfound: '没有找到任何指向本页面的重定向页。',
			tabviewmulti: '多重',
			tabviewfix: '修复',
			fixloading: '请稍候，正在自动修复重定向……',
			fixtext: '#REDIRECT [[$1]]',
			fixsummary: '编辑工具：修复多重重定向',
			tabcreatetitle: '创建',
			tabcreatedesc: '以下是尚未创建的重定向页：',
			tabcreatenotfound: '没有找到可以创建的重定向页。',
			tabcreateall: '全部创建',
			createloading: '请稍候，正在自动创建重定向……',
			createtext: '#REDIRECT [[$1]]',
			createsummary: '编辑工具：自动创建重定向到[[$1]]',
			errcycleredirect: '无法自动修复：发现循环重定向',
			refresh: '刷新'
		},
		'zh-hant': {
			btntitle: '重新導向',
			btndesc: '建立和管理本頁面的重新導向。',
			dlgtitle: '建立和管理重新導向',
			rediloading: '資料載入中，請稍候……',
			rediedit: '編輯',
			selectall: '全選',
			selectinverse: '反選',
			tabviewtitle: '檢視',
			tabviewdesc: '以下是指向本頁面的重新導向頁面：',
			tabviewnotfound: '沒有找到任何指向本頁面的重新導向頁面。',
			tabviewmulti: '多重',
			tabviewfix: '修復',
			fixloading: '請稍候，正在自動修復重新導向……',
			fixtext: '#REDIRECT [[$1]]',
			fixsummary: '編輯工具：修復多重重新導向',
			tabcreatetitle: '建立',
			tabcreatedesc: '以下是尚未建立的重新導向頁面：',
			tabcreatenotfound: '沒有找到可以建立的重新導向頁面。',
			tabcreateall: '全部建立',
			createloading: '請稍候，正在自動建立重新導向……',
			createtext: '#REDIRECT [[$1]]',
			createsummary: '編輯工具：自動建立重新導向到[[$1]]',
			errcycleredirect: '無法自動修復：發現循環重新導向',
			refresh: '重新整理'
		}
	};
	$(function () {
		_TR.msg = MSG[detectVariant()];
		// Vector 2022 皮肤不默认加载 mediawiki.util，需手动加载
		var loadModules = mw.loader.using || mw.loader.load;
		loadModules('mediawiki.util').then(function () {
			_TR.init();
		}, function () {
			mw.log.error('[ToolsRedirect] 无法加载 mediawiki.util 模块');
		});
	});
})(jQuery);