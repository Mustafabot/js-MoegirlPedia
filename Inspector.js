//<nowiki>
"use strict";
/* jshint bitwise: true, curly: true, nonew: true, singleGroups: true, unused: true, varstmt: true */
/*global mw, $, OO, CodeMirror, inspector*/
// Warning: 这个小工具完全没有对其他浏览器或用户设置进行兼容，提交编辑后请务必检查有无未预期的错误
// 使用方法：mw.loader.load('/index.php?title=user:bhsd/js/inspect.js&action=raw&ctype=text/javascript')
if (mw.config.get( 'wgIsArticle' ) && mw.config.get( 'wgUserGroups' ).includes( 'autoconfirmed' )) {
 
window.inspector = $.extend({summary: ''}, window.inspector);
mw.loader.load( '/index.php?title=user:bhsd/inspect.css&action=raw&ctype=text/css&_=1', 'text/css' );
// 预备公有函数
mw.confirm = (text, flags) => OO.ui.confirm(text, {actions: [ {label: mw.msg( 'ooui-dialog-message-reject' )},
	{label: mw.msg( 'ooui-dialog-message-accept' ), flags, action: 'accept'} ]});
mw.prompt = (text, flags, config) => OO.ui.prompt(text, {actions: [ {label: mw.msg( 'ooui-dialog-message-reject' )},
	{label: mw.msg( 'ooui-dialog-message-accept' ), flags: flags, action: 'accept'} ], textInput: config});
mw.sectionQuery = (api, params) => api.get(
	$.extend({action: 'parse', prop: 'wikitext|revid', formatversion: 2}, params)
).then(({parse}) => parse, reason => { throw reason; });
mw.timedParse = (api, params) => api.post($.extend({ action: 'parse', disablelimitreport: 1, disableeditsection: 1,
	pst: 1, preview: 1, formatversion: 2}, params)).then(({parse}) => parse, reason => { throw reason; });
mw.forceEdit = (api, params, returnValue) =>
	api.postWithToken('csrf', $.extend({action: 'edit', formatversion: 2}, params)).then(({edit: {result, warning}}) =>
	result == 'Success' ? returnValue : warning, reason => {
	mw.notify(`编辑失败！错误原因：${reason}`, {type: 'error', autoHideSeconds: 'long', tag: 'safeEdit'});
	throw 'editFailure';
});
mw.safeEdit = (api, params, cid = mw.config.get( 'wgCurRevisionId' )) =>
	api.get({action: 'query', prop: 'info', titles: params.title, formatversion: 2}).then(data => {
	if (data.query.pages[0].lastrevid > cid) {
		mw.notify('编辑冲突！请复制编辑内容后前往编辑页面提交。', {type: 'error', tag: 'safeEdit'});
		throw 'editConflict';
	}
	return mw.forceEdit(api, params, 'noConflict');
}, () => mw.forceEdit(api, params, 'maybeConflict'));
$.when($.ready, mw.loader.using([ 'mediawiki.api', 'oojs-ui-core', 'oojs-ui-windows',
	...inspector.replace ? ['jquery.ui.draggable'] : [],
	...inspector.resizable && inspector.layout != 'vertical' ? ['jquery.ui.resizable'] : [],
	...inspector.link ? ['mediawiki.Title'] : []
])).then(() => {
	// 预备变量
	let value, cm, $wrapper, $replace, section, cid, mode, secTitle = '', summary = '',
		lang = mw.config.get( 'wgUserVariant' ),
		active = false,
		title = mw.config.get( 'wgPageName' ),
		contentModel = mw.config.get( 'wgPageContentModel' ),
		ns = mw.config.get( 'wgNamespaceNumber' ),
		headline = document.getElementById( 'firstHeading' );
	// 预备常数
	const oldid = mw.config.get( 'wgRevisionId' ),
		page = title,
		pageModel = contentModel,
		modes = { css: ['css', '//fastly.jsdelivr.net/npm/codemirror@5.65.3/mode/css/css.min.js'],
		'sanitized-css': ['css', '//fastly.jsdelivr.net/npm/codemirror@5.65.3/mode/css/css.min.js'],
		javascript: ['javascript', '//fastly.jsdelivr.net/npm/codemirror@5.65.3/mode/javascript/javascript.min.js'],
		json: ['javascript', '//fastly.jsdelivr.net/npm/codemirror@5.65.3/mode/javascript/javascript.min.js'],
		Scribunto: ['lua', '//fastly.jsdelivr.net/npm/codemirror@5.65.3/mode/lua/lua.min.js'],
		wikitext: ['mediawiki', '//fastly.jsdelivr.net/gh/bhsd-harry/codemirror-mediawiki@1.1.1/mediawiki.min.js']
	},
	// 预备DOM元素
		$window = $(window),
		$content = $('#mw-content-text'),
		$header = $('#moe-global-header'),
		$original = $content.children( '.mw-parser-output:first, .mw-code, .mw-json' ),
		$outer = $('<div>', {id: 'inspector', lang: mw.config.get( 'wgUserLanguage' )}).hide().insertBefore( $original.first() ),
		$heading = $('#firstHeading'),
		$cat = $('#catlinks'),
		$indicator = $('.mw-indicator'),
		placeholder = [
		$('<div>', {class: "mw-parser-output"}),
		$('<' + 'h1>', {id: 'firstHeading', class: 'firstHeading'}),
		$('<div>', {id: 'catlinks', class: 'catlinks catlinks-allhidden', 'data-mw': 'interface'}),
		$('.mw-indicators')
	],
		$warning = $('<div>', {html: "确定要还原为未编辑的状态吗？<br>建议您做好编辑内容备份。"}),
		$abuseFilter = $('<div>'),
		$note = $('<div>', {class: 'previewnote'}),
		$btns = $('<div>', {id: 'inspector-btns', style: 'width: auto !important; right: 30px;'}),
	// 预备API对象
		api = new mw.Api(),
	// 预备私有函数
		getOutput = () =>
		$outer.next( '.previewnote' ).addBack().next( '.mw-parser-output' ).add( $outer.nextAll( '.mw-code, .mw-json' ) ),
		getWikitext = () => mw.sectionQuery(api, $.extend({section}, {page: title})),
		getHighlight = () => {
		mode = modes[ contentModel ];
		const getJSON = contentModel != 'wikitext' || window.mwConfig ? Promise.resolve() : $.get({
			dataType: 'json', cache: true,
			url: '//fastly.jsdelivr.net/gh/bhsd-harry/LLWiki@2.16/otherwiki/gadget-CodeMirror.json'
		}).then(config => {
			window.mwConfig = config;
			mw.loader.load('//fastly.jsdelivr.net/gh/bhsd-harry/codemirror-mediawiki@1.1.1/mediawiki.min.css', 'text/css');
			if (ns == 274) {
				config.tags = $.extend(config.tags, {script: true, style: true});
				config.tagModes = $.extend(config.tagModes, {script: 'javascript', style: 'css'});
			}
		}),
			getExt = (window.CodeMirror ? Promise.resolve() : $.get({ dataType: 'script', cache: true,
			url: '//fastly.jsdelivr.net/npm/codemirror@5.65.3/lib/codemirror.min.js' })).then(() => {
			if (ns == 274) {
				const modesAvail = (window.CodeMirror || {modes: {}}).modes;
				return Promise.all( ['wikitext', 'javascript', 'css'].map(ele => modes[ ele ])
					.filter(ele => !modesAvail[ ele[0] ])
					.map(ele => $.get({dataType: 'script', cache: true, url: ele[1]}))
				);
			}
			if (!(window.CodeMirror || {modes: {}}).modes[ mode[0] ]) {
				return $.get({dataType: 'script', cache: true, url: mode[1]});
			}
		});
		return Promise.all([getWikitext(), getJSON, getExt]).catch(reason => {
			mw.notify(`无法获取CodeMirror设置或页面Wikitext，请重试。错误原因：${reason}`, {type: 'error'});
			throw null;
		});
	},
		updateSection = (node) => {
		const $this = $(node),
			href = $this.children( '.mw-editsection' ).children( 'a' ).attr( 'href' );
		headline = node;
		if (href) {
			secTitle = '/* ' + $this.children( '.mw-headline' ).attr( 'id' ) + '*/';
			section = mw.util.getParamValue('section', href);
			title = page;
			if (!section.startsWith( 'T-' )) { return; }
			section = section.slice( 2 );
			title = mw.util.getParamValue('title', href);
			if (pageModel == 'Scribunto') { contentModel = 'wikitext'; }
		} else {
			secTitle = '';
			section = undefined;
			title = page;
			contentModel = pageModel;
		}
	},
		inViewport = (ele, h) => {
		const rect = ele.getBoundingClientRect();
		return rect.top < h && rect.bottom > 0 && ((rect.top >= 0) + (rect.bottom <= h) || 1);
	},
		render = (text) => {
		if (contentModel != 'wikitext') { return $('<p>', {text}); }
		const html = text.replaceAll( /'''(.+?)'''/g, '<b>$1</b>' )
			.replaceAll( /\[\[:(.+?)]]/g, (_, p) => {
			if (p == title) { return `<a class="mw-selflink selflink">${ p }</a>`; }
			return `<a title="${ p }" href="/${ decodeURIComponent( p ) }">${ p }</a>`;
		});
		return $('<p>', {html});
	},
	// 预备OOUI对象
		btns = [new OO.ui.ButtonWidget({label: '提交', flags: ['primary', 'progressive'], disabled: true})
		.on('click', () => {
		$abuseFilter.remove();
		$note.remove();
		btns[0].setDisabled( true );
		mw.safeEdit(api, {title, text: cm.getValue(), section, summary: secTitle + (summary || inspector.summary)},
			cid).then(state => {
			if (state == 'maybeConflict') {
				mw.notify('编辑成功！即将前往历史页面检查有无编辑冲突。', {type: 'success', tag: 'safeEdit'});
				setTimeout(() => { location.href = mw.util.getUrl(title, {action: 'history'}); }, 2000);
			}
			else if (state == 'noConflict') {
				mw.notify('编辑成功！即将刷新页面。', {type: 'success', tag: 'safeEdit'});
				setTimeout(() => { location.href = mw.util.getUrl( title ); }, 2000);
			}
			else {
				$abuseFilter.html( state ).prependTo( $outer.next( '.mw-parser-output' ))[0]
					.scrollIntoView( {behavior: 'smooth'} );
				btns[0].setDisabled( false );
			}
		}, reason => { btns[0].setDisabled( reason == 'editConflict' ); });
	}), new OO.ui.ButtonWidget({label: '预览', disabled: true}).on('click', () => {
		$abuseFilter.remove();
		$note.remove();
		btns[1].setDisabled( true );
		const newtext = cm.getValue();
		mw.timedParse(api, $.extend({ uselang: lang, templatesandboxtitle: title, templatesandboxtext: newtext,
			prop: 'text|categorieshtml|displaytitle|indicators|parsewarnings'
		}, title == page ? {title, text: newtext} : {page}))
			.then(parse => {
			if ($content.attr('lang', lang)[0].contains( $original[0] )) {
				$original.last().after( placeholder[0] );
				$original.detach();
				$heading.after( placeholder[1].empty() ).detach();
				$cat.after( placeholder[2].hide() ).detach();
				$indicator.detach();
			}
			const $output = getOutput();
			$output.first().before( parse.text );
			$output.remove();
			mw.hook( 'wikipage.content' ).fire( $content );
			$('#catlinks').replaceWith( parse.categorieshtml );
			placeholder[1].html( parse.displaytitle );
			placeholder[3].html( Object.entries( parse.indicators ).map(ele =>
				$('<div>', {class: 'mw-indicator', id: `mw-indicator-${ele[0]}`, html: ele[1]})) );
			if (!parse.parsewarnings || parse.parsewarnings.length === 0) { return; }
			$note.html( parse.parsewarnings.map( render ) ).append( '<hr>' )
				.insertAfter( $outer )[0].scrollIntoView( {behavior: 'smooth'} );
		}, reason => { mw.notify(`预览失败！错误原因：${reason}`, {type: 'error'}); })
			.then(() => { btns[1].setDisabled( false ); });
	}), new OO.ui.ButtonWidget({label: '还原', flags: 'destructive', disabled: true}).on('click', () => {
		$abuseFilter.remove();
		$note.remove();
		mw.confirm($warning, ['primary', 'destructive']).then(confirm => {
			if (!confirm) { return; }
			cm.setValue( value );
			if ($content[0].contains( $original[0] )) { return; }
			const $output = getOutput();
			$output.first().before( $original );
			$output.remove();
			placeholder[1].replaceWith( $heading );
			$('#catlinks').replaceWith( $cat );
			placeholder[3].html( $indicator );
		});
	}), new OO.ui.ButtonWidget({label: '显示'}).on('click', () => {
		btns[3].setLabel( active ? '显示' : '隐藏');
		if ($replace && active) { $replace.hide(); }
		active = !active;
		const height = $window.height(),
			children = [ ...getOutput().children( 'ol, ul' )
			.addBack( '.mw-parser-output' ).add( $outer.next( '.previewnote' ) ).children()
		],
			states = children.map(ele => inViewport(ele, height)),
			first = states.findIndex((e, i) => e == 2 || i == states.length - 1 || e == 1 && e > states[i + 1] );
		if ($wrapper) {
			$wrapper.toggle();
			$content.toggleClass( 'active' );
			$header.toggleClass( 'inspecting' );
			cm.setSize();
			if (first >= 0) { children[ first ].scrollIntoView( {behavior: 'smooth'} ); }
			$outer[0].scrollIntoView( {behavior: 'smooth'} );
			return;
		}
		$outer.addClass( 'mw-ajax-loader' );
		$content.addClass( 'active' );
		$header.addClass( 'inspecting' );
		mw.loader.load('//fastly.jsdelivr.net/npm/codemirror@5.65.3/lib/codemirror.min.css', 'text/css');
		getHighlight().then(([parse]) => {
			$outer.removeClass( 'mw-ajax-loader' );
			if (title != page) { cid = parse.revid; }
			value = parse.wikitext;
			cm = new CodeMirror($outer[0], $.extend({value, mode: mode[0], lineWrapping: true, lineNumbers: true},
				contentModel == 'wikitext' ? {mwConfig: window.mwConfig} :
				{indentUnit: 4, indentWithTabs: true, json: contentModel == 'json'}
			));
			mw.hook( 'inspector' ).fire( cm );
			$wrapper = $( cm.getWrapperElement() );
			btns[0].setDisabled( !mw.config.get( 'wgIsProbablyEditable' ) );
			btns.slice(1, 3).forEach(ele => { ele.setDisabled( false ); });
			$btns.removeAttr( 'style' ).prepend( btns.slice(0, 3).map(ele => ele.$element) );
			if (first >= 0) { children[ first ].scrollIntoView( {behavior: 'smooth'} ); }
			$outer[0].scrollIntoView( {behavior: 'smooth'} );
		}, () => {
			btns[3].setLabel( '显示' );
			active = false;
			$outer.removeClass( 'mw-ajax-loader' );
			$content.removeClass( 'active' );
			$header.removeClass( 'inspecting' );
		});
	})];
	$btns.append( btns[3].$element ).appendTo( $outer );
	if (inspector.resizable && inspector.layout != 'vertical') { $outer.resizable( {handles: 'w', minWidth: 300} ); }
	btns[0].$element.contextmenu(e => {
		e.preventDefault();
		mw.prompt('请输入编辑摘要：', null, {value: summary}).then(input => {
			if (input !== null) { summary = input; }
		});
	});
	$(':header:has( .mw-editsection )').add( $heading ).dblclick(function(e) {
		if (e.target.tagName == 'A' || headline === this) { return; }
		if (!$wrapper) {
			updateSection( this );
			return;
		}
		mw.confirm('确定要更换编辑的章节吗？', ['primary', 'destructive']).then(confirm => {
			if (!confirm) { return; }
			updateSection( this );
			getHighlight().then(([parse]) => { cm.operation(() => {
				if (title != page) { cid = parse.revid; }
				value = parse.wikitext;
				cm.setValue( value );
				if (pageModel != 'Scribunto') { return; }
				const isWikitext = contentModel == 'wikitext';
				if (isWikitext) { cm.setOption('mwConfig', window.mwConfig); }
				cm.setOption('mode', mode[0]);
				cm.setOption('indentUnit', isWikitext ? 2 : 4);
				cm.setOption('indentWithTabs', !isWikitext);
			}) });
		});
	});
 
	// 扩展：预览语言变体
	if (inspector.variants) {
		const options = [{label: "大陆简体", data: "zh-cn"}, {label: "臺灣繁體", data: "zh-tw"}, {label: "香港繁體", data: "zh-hk"}],
			select = new OO.ui.DropdownInputWidget({classes: ['inspector-variant'], options, value: lang})
			.on('change', () => { lang = select.getValue(); }),
			$menu = select.$element.find( '.oo-ui-menuSelectWidget' )
			.click(() => { $menu.addClass( 'oo-ui-element-hidden' ); });
		btns[1].$element.prepend( select.$element ).contextmenu(e => {
			e.preventDefault();
			$menu.removeClass( 'oo-ui-element-hidden' );
		}).children( 'a' ).blur(() => { $menu.addClass( 'oo-ui-element-hidden' ); });
	}
 
	// 扩展：搜索，以下大量内容引自 https://codemirror.net/addon/search/search.js
	mw.loader.addStyleTag( '.cm-search { background-color: #ffc0cbb3; }' );
	let regexp, regexpAll, lastRegexp, isRegex, findNew, pattern = '';
	const token = (regex) => ((stream) => {
		regex.lastIndex = stream.pos;
		const match = regex.exec( stream.string );
		if (!match) { stream.skipToEnd(); }
		else if (match.index == stream.pos) {
			stream.pos += match[0].length || 1;
			return 'search';
		} else { stream.pos = match.index; }
	}),
		overlay = {token: () => {}},
		find = (noSelect, dir = false) => { // noSelect仅用于replaceNext函数
		return cm.operation(() => {
		const temp = lastRegexp;
		if (regexpAll != lastRegexp) {
			lastRegexp = regexpAll;
			cm.removeOverlay( overlay );
		}
		if (!pattern) { return Promise.resolve(); }
		if (regexpAll != temp && !/(\\n|\\s|\\W|\\D)/.test( regexpAll.source )) {
			overlay.token = token( regexpAll );
			cm.addOverlay( overlay );
		}
		const allSearch = [...cm.getValue().matchAll( regexpAll )];
		if (allSearch.length === 0) {
			mw.notify(['全文未找到内容：', $('<b>', {text: isRegex ? regexp : pattern})], {type: 'warn', tag: 'search'});
			return Promise.resolve();
		} else if (allSearch.some(ele => ele[0].length === 0)) {
			mw.notify('匹配到空字符串！请检查您的正则表达式。', {type: 'error', tag: 'search'});
			return Promise.resolve();
		}
		let search;
		const cur = cm.indexFromPos( cm.getCursor() ),
			next = allSearch.findIndex(ele => ele.index >= cur);
		if (next === 0 && !dir) {
			mw.notify('未找到内容，已从文档底部开始查找。', {type: 'warn', tag: 'search'});
			search = allSearch[ allSearch.length - 1 ];
		} else if (next == -1) {
			if (dir) {
				mw.notify('未找到内容，已从文档顶部开始查找。', {type: 'warn', tag: 'search'});
				search = allSearch[0];
			} else { search = allSearch[ allSearch.length - 1 ]; }
		} else { search = allSearch[ next - 1 + dir ]; }
		const index = search.index,
			from = cm.posFromIndex( index + (dir ? 0 : search[0].length) ),
			to = cm.posFromIndex( index + (dir ? search[0].length : 0) );
		if (noSelect !== true) {
			cm.setSelection(from, to);
			cm.scrollIntoView({from, to});
		}
		return Promise.resolve({ from, to });
	}) },
		findNext = (noSelect) => find( noSelect, true );
	if (inspector.replace) {
		findNew = () => {
			if ($replace) {
				$replace.show();
				ptn.select();
				return;
			}
			$replace = $('<div>', {class: 'inspector-field', html: [
				$('<div>', {html: ['查找：', ptn.$element]}),
				$('<div>', {html: ['替换：', val.$element]}),
				$('<div>', {html: [
					new OO.ui.FieldLayout(regex, {label: '正则', align: 'inline'}).$element,
					new OO.ui.FieldLayout(modifier,
						{label: $('<i>', {text: 'i'}), align: 'inline', title: '不区分大小写'}).$element,
					findBtn.$element, replaceNextBtn.$element, replaceBtn.$element, undoBtn.$element, hideBtn.$element
				]})
			]}).keydown(e => {
				if (e.key != 'Escape') { return; }
				$replace.hide();
				return false;
			}).appendTo( document.body ).draggable();
			ptn.focus();
		};
		const val = new OO.ui.MultilineTextInputWidget({autosize: true, maxRows: 3}),
			regex = new OO.ui.CheckboxInputWidget(),
			modifier = new OO.ui.CheckboxInputWidget({selected: true}),
			fullFindNext = (noSelect) => ptn.getValidity().then(() => {
			isRegex = regex.isSelected();
			pattern = ptn.getValue();
			const source = isRegex ? pattern : mw.RegExp.escape( pattern ),
				flags = modifier.isSelected() ? 'im' : 'm';
			regexp = new RegExp(source, flags),
			regexpAll = new RegExp(source, flags + 'g');
		}, () => {
			mw.notify('正则表达式错误！', {type: 'error', tag: 'search'});
			throw null;
		}).then(() => findNext( noSelect ), () => {}),
			replaceNext = () => {
			fullFindNext( true ).then(cursor => { cm.operation(() => {
				if (!cursor) { return; }
				if (/^\(\?<[=!]/.test( regexpAll.source )) {
					mw.notify('含后行断言的正则表达式无法逐个替换！', {type: 'error', tag: 'search'});
					return;
				}
				const lastLine = cm.lastLine(),
					text = cm.getRange(cursor.from, {line: lastLine, ch: cm.getLine( lastLine ).length}),
					newText = text.replace( regexp, val.getValue() ),
					toIndex = cm.indexFromPos( cursor.to ) - text.length + newText.length;
				cm.setValue( cm.getRange({line: 0, ch: 0}, cursor.from) + newText );
				const to = cm.posFromIndex( toIndex );
				cm.setSelection( cursor.from, to );
				cm.scrollIntoView( {from: cursor.from, to} );
			}) });
		},
			replaceAll = () => { cm.operation(() => {
			const from = cm.getCursor( 'anchor' ),
				to = cm.getCursor( 'head' );
			cm.execCommand( 'goDocStart' );
			fullFindNext().then(cursor => {
				if (cursor) {
					cm.setValue( cm.getValue().replace(regexpAll, val.getValue()) );
					cm.setCursor( cursor.from );
					mw.notify('已全部替换完成！', {type: 'success', tag: 'search'});
				} else {
					cm.setSelection(from, to);
					cm.scrollIntoView( {from, to} );
				}
			});
		}) },
			ptn = new OO.ui.TextInputWidget({validate: str => {
			if (!regex.isSelected()) { return true; }
			try {
				RegExp( str );
				return true;
			} catch(e) { return false; }
		}}).on('enter', fullFindNext),
			findBtn = new OO.ui.ButtonWidget({label: '查找'}).on('click', fullFindNext),
			replaceNextBtn = new OO.ui.ButtonWidget({label: '替换', flags: ['progressive']}).on('click', replaceNext),
			replaceBtn = new OO.ui.ButtonWidget({label: '替换全部', flags: ['progressive']}).on('click', replaceAll),
			undoBtn = new OO.ui.ButtonWidget({label: '撤销', flags: ['destructive']})
			.on('click', () => { cm.undo(); }),
			hideBtn = new OO.ui.ButtonWidget({label: '关闭'}).on('click', () => { $replace.hide(); });
		mw.hook( 'inspector' ).add(() => {
			cm.addKeyMap({ 'Cmd-H': replaceNext, 'Ctrl-H': replaceNext });
		});
	} else {
		findNew = () => mw.prompt('请输入搜索内容：', null, {value: pattern}).then(str => {
			if (str === null) { return; }
			const source = mw.RegExp.escape( str );
			pattern = str;
			regexp = new RegExp(source, 'i');
			regexpAll = new RegExp(source, 'ig');
			findNext();
		});
	}
	mw.hook( 'inspector' ).add(() => {
		cm.addKeyMap({ 'Cmd-F': findNew, 'Ctrl-F': findNew, 'Cmd-G': findNext, 'Ctrl-G': findNext,
			'Shift-Cmd-G': find, 'Shift-Ctrl-G': find });
	});
 
	// 扩展：HTML实体
	if (inspector.entity) {
		const entity = {'"': '&quot;', "'": '&apos;', '<': '&lt;', '>': '&gt;', '&': '&amp;', ' ': '&nbsp;'},
			numberCode = (code) => code < 256 ? `&#${ code };` : `&#x${ code.toString(16) };`,
			f = (str) => str.split( '' ).map(c => entity[c] || numberCode( c.charCodeAt() )).join( '' ),
			convert = (fun) => (() => {
			if (cm.getOption( 'mode' ) != 'mediawiki') { return; }
			cm.replaceSelection( fun( cm.getSelection() ), 'around' );
		}),
			escapeHTML = convert( f ),
			encode = convert( encodeURIComponent );
		mw.hook( 'inspector' ).add(() => {
			cm.addKeyMap({ 'Cmd-/': escapeHTML, 'Ctrl-/': escapeHTML, 'Cmd-\\': encode, 'Ctrl-\\': encode });
		});
	}
 
	// 扩展：跳转到指定差异行
	if (inspector.diff) {
		$('.diff').on('dblclick', 'tr:not(.diff-title)', function() {
			if (!cm) {
				mw.notify('请先点击“显示”按钮加载编辑器。', {type: 'warn', tag: 'diff'});
				return;
			}
			if (section !== undefined) {
				mw.notify('您只能在全文编辑模式下跳转至指定差异行。', {type: 'warn', tag: 'diff'});
				return;
			}
			const $row = $(this),
				isLineno = $row.children( '.diff-lineno' ).length > 0,
				$rowLineno = isLineno ? $row : $row.prevAll( ':has( .diff-lineno )' ).first(),
				n = parseInt( $rowLineno.children().last().text().match(/\d+/) ) +
				$row.index() - $rowLineno.index() - 2 + isLineno;
			if (cm.lineCount() > n) {
				if (!active) { btns[3].emit( 'click' ); }
				cm.operation(() => {
					cm.execCommand( 'goDocEnd' );
					cm.scrollIntoView( n );
				});
			} else { mw.notify( '当前不存在该行！', {type: 'warn', tag: 'diff'} ); }
		});
	}
 
	// 扩展：更改显示格局
	if (inspector.layout == 'vertical') {
		if (mw.config.get( 'wgPageContentModel' ) == 'wikitext' &&
			mw.config.get( 'wgRevisionId' ) == mw.config.get( 'wgCurRevisionId' ) &&
			!mw.config.get( 'wgDiffOldId' ) && !mw.config.get( 'wgDiffNewId' )) {
			mw.loader.addStyleTag(
				'#mw-content-text.active, #mw-content-text.active > #inspector, #mw-content-text.active .mw-parser-output' +
				'{ transform: rotate(180deg); }'
			);
		}
		mw.loader.addStyleTag('#mw-content-text.active > div#inspector { width: 100%; float: none; }' +
			'#mw-content-text.active > div#inspector ~ .mw-parser-output,' +
			'#mw-content-text.active > div#inspector ~ .mw-code { display: block; }' +
			'#mw-content-text.active > div#inspector ~ .mw-parser-output { border: none; }'
		);
	}
});
 
}
//</nowiki>