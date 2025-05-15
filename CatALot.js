(() => {

	"use strict";
	
	// dist/Cat-a-lot/Cat-a-lot.js
	var _templateObject;
	var _templateObject2;
	var _templateObject3;
	function asyncGeneratorStep(n, t, e, r, o, a, c) {
	  try {
		var i = n[a](c), u = i.value;
	  } catch (n2) {
		return void e(n2);
	  }
	  i.done ? t(u) : Promise.resolve(u).then(r, o);
	}
	function _asyncToGenerator(n) {
	  return function() {
		var t = this, e = arguments;
		return new Promise(function(r, o) {
		  var a = n.apply(t, e);
		  function _next(n2) {
			asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
		  }
		  function _throw(n2) {
			asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
		  }
		  _next(void 0);
		});
	  };
	}
	function _taggedTemplateLiteral(e, t) {
	  return t || (t = e.slice(0)), Object.freeze(Object.defineProperties(e, { raw: { value: Object.freeze(t) } }));
	}
	function _createForOfIteratorHelper(r, e) {
	  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	  if (!t) {
		if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
		  t && (r = t);
		  var n = 0, F = function() {
		  };
		  return { s: F, n: function() {
			return n >= r.length ? { done: true } : { done: false, value: r[n++] };
		  }, e: function(r2) {
			throw r2;
		  }, f: F };
		}
		throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	  }
	  var o, a = true, u = false;
	  return { s: function() {
		t = t.call(r);
	  }, n: function() {
		var r2 = t.next();
		return a = r2.done, r2;
	  }, e: function(r2) {
		u = true, o = r2;
	  }, f: function() {
		try {
		  a || null == t.return || t.return();
		} finally {
		  if (u) throw o;
		}
	  } };
	}
	function _unsupportedIterableToArray(r, a) {
	  if (r) {
		if ("string" == typeof r) return _arrayLikeToArray(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	  }
	}
	function _arrayLikeToArray(r, a) {
	  (null == a || a > r.length) && (a = r.length);
	  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	  return n;
	}
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
	  if (from && typeof from === "object" || typeof from === "function") {
		var _iterator = _createForOfIteratorHelper(__getOwnPropNames(from)), _step;
		try {
		  for (_iterator.s(); !(_step = _iterator.n()).done; ) {
			let key = _step.value;
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			  get: () => from[key],
			  enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		  }
		} catch (err) {
		  _iterator.e(err);
		} finally {
		  _iterator.f();
		}
	  }
	  return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
	  // If the importer is in node compatibility mode or this is not an ESM
	  // file that has been converted to a CommonJS file using a Babel-
	  // compatible transform (i.e. "__esModule" has not been set), then set
	  // "default" to the CommonJS "module.exports" for node compatibility.
	  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	  }) : target,
	  mod
	));
	//! src/Cat-a-lot/options.json
	var apiTag = mw.config.get( 'wgUserGroups' ).includes('bot') ? 'Bot' : 'Automation tool';
	var targetNamespace = 14;
	var version = "6.0";
	var storageKey = "ext.gadget.Cat-a-Lot_results-";
	//! src/Cat-a-lot/modules/constant.ts
	var CLASS_NAME = "gadget-cat_a_lot";
	var CLASS_NAME_CONTAINER = "".concat(CLASS_NAME, "-container");
	var CLASS_NAME_CONTAINER_DATA = "".concat(CLASS_NAME_CONTAINER, "__data");
	var CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST = "".concat(CLASS_NAME_CONTAINER_DATA, "__category-list");
	var CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_ACTION = "".concat(CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST, "__action");
	var CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_NO_FOUND = "".concat(CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST, "--no-found");
	var CLASS_NAME_CONTAINER_DATA_MARK_COUNTER = "".concat(CLASS_NAME_CONTAINER_DATA, "__mark-counter");
	var CLASS_NAME_CONTAINER_DATA_SEARCH_INPUT_CONTAINER_INPUT = "".concat(CLASS_NAME_CONTAINER_DATA, "__search-input-container__input");
	var CLASS_NAME_CONTAINER_DATA_SELECTIONS = "".concat(CLASS_NAME_CONTAINER_DATA, "__selections");
	var CLASS_NAME_CONTAINER_DATA_SELECTIONS_ALL = "".concat(CLASS_NAME_CONTAINER_DATA_SELECTIONS, "__all");
	var CLASS_NAME_CONTAINER_DATA_SELECTIONS_NONE = "".concat(CLASS_NAME_CONTAINER_DATA_SELECTIONS, "__none");
	var CLASS_NAME_CONTAINER_HEAD = "".concat(CLASS_NAME_CONTAINER, "__head");
	var CLASS_NAME_CONTAINER_HEAD_LINK = "".concat(CLASS_NAME_CONTAINER_HEAD, "__link");
	var CLASS_NAME_CONTAINER_HEAD_LINK_ENABLED = "".concat(CLASS_NAME_CONTAINER_HEAD_LINK, "--enabled");
	var CLASS_NAME_CURRENT_COUNTER = "".concat(CLASS_NAME, "-current_counter");
	var CLASS_NAME_FEEDBACK = "".concat(CLASS_NAME, "-feedback");
	var CLASS_NAME_FEEDBACK_DONE = "".concat(CLASS_NAME_FEEDBACK, "--done");
	var CLASS_NAME_LABEL = "".concat(CLASS_NAME, "-label");
	var CLASS_NAME_LABEL_DONE = "".concat(CLASS_NAME_LABEL, "--done");
	var CLASS_NAME_LABEL_LAST_SELECTED = "".concat(CLASS_NAME_LABEL, "--last-selected");
	var CLASS_NAME_LABEL_SELECTED = "".concat(CLASS_NAME_LABEL, "--selected");
	var DEFAULT_SETTING = {
	  docleanup: {
		default: false,
		label_i18n: "docleanuppref"
	  },
	  editpages: {
		default: true,
		label_i18n: "editpagespref"
	  },
	  minor: {
		default: false,
		label_i18n: "minorpref"
	  },
	  subcatcount: {
		default: 50,
		label_i18n: "subcatcountpref"
	  },
	  watchlist: {
		default: "preferences",
		label_i18n: "watchlistpref",
		select_i18n: {
		  watch_nochange: "nochange",
		  watch_pref: "preferences",
		  watch_unwatch: "unwatch",
		  watch_watch: "watch"
		}
	  }
	};
	var VARIANTS = ["zh-hans", "zh-hant", "zh-cn", "zh-my", "zh-sg", "zh-hk", "zh-mo", "zh-tw"];
	//! src/Cat-a-lot/modules/messages.ts
	var {
	  wgUserLanguage
	} = mw.config.get();
	var DEFAULT_MESSAGES = {
	  // as in 17 files selected
	  "cat-a-lot-files-selected": "{{PLURAL:$1|One file|$1 files}} selected.",
	  // Actions
	  "cat-a-lot-copy": "Copy",
	  "cat-a-lot-move": "Move",
	  "cat-a-lot-add": "Add",
	  "cat-a-lot-remove-from-cat": "Remove from this category",
	  "cat-a-lot-enter-name": "Enter category name",
	  "cat-a-lot-select": "Select",
	  "cat-a-lot-all": "all",
	  "cat-a-lot-none": "none",
	  "cat-a-lot-none-selected": "No files selected!",
	  // Preferences
	  "cat-a-lot-watchlistpref": "Watchlist preference concerning files edited with Cat-A-Lot",
	  "cat-a-lot-watch_pref": "According to your general preferences",
	  "cat-a-lot-watch_nochange": "Do not change watchstatus",
	  "cat-a-lot-watch_watch": "Watch pages edited with Cat-A-Lot",
	  "cat-a-lot-watch_unwatch": "Remove pages while editing with Cat-A-Lot from your watchlist",
	  "cat-a-lot-minorpref": "Mark edits as minor (if you generally mark your edits as minor, this won't change anything)",
	  "cat-a-lot-editpagespref": "Allow categorising pages (including categories) that are not files",
	  "cat-a-lot-docleanuppref": "Remove {{Check categories}} and other minor cleanup",
	  "cat-a-lot-subcatcountpref": "Sub-categories to show at most",
	  // Progress
	  "cat-a-lot-loading": "Loading...",
	  "cat-a-lot-editing": "Editing page",
	  "cat-a-lot-of": "of ",
	  "cat-a-lot-skipped-already": "The following {{PLURAL:$1|page was|$1 pages were}} skipped, because the page was already in the category:",
	  "cat-a-lot-skipped-not-found": "The following {{PLURAL:$1|page was|$1 pages were}} skipped, because the old category could not be found:",
	  "cat-a-lot-skipped-server": "The following {{PLURAL:$1|page|$1 pages}} couldn't be changed, since there were problems connecting to the server:",
	  "cat-a-lot-all-done": "All pages are processed.",
	  "cat-a-lot-done": "Done!",
	  "cat-a-lot-added-cat": "Added category $1",
	  "cat-a-lot-copied-cat": "Copied to category $1",
	  "cat-a-lot-moved-cat": "Moved to category $1",
	  "cat-a-lot-removed-cat": "Removed from category $1",
	  "cat-a-lot-return-to-page": "Return to page",
	  "cat-a-lot-cat-not-found": "Category not found.",
	  // Summaries:
	  "cat-a-lot-summary-add": "[[Help:Cat-a-lot|Cat-a-lot]]: Adding [[Category:$1]]",
	  "cat-a-lot-summary-copy": "[[Help:Cat-a-lot|Cat-a-lot]]: Copying from [[Category:$1]] to [[Category:$2]]",
	  "cat-a-lot-summary-move": "[[Help:Cat-a-lot|Cat-a-lot]]: Moving from [[Category:$1]] to [[Category:$2]]",
	  "cat-a-lot-summary-remove": "[[Help:Cat-a-lot|Cat-a-lot]]: Removing from [[Category:$1]]"
	};
	var setMessages = () => {
	  /*! Cat-a-lot messages | CC-BY-SA-4.0 <https://qwbk.cc/H:CC-BY-SA-4.0> */
	  if (wgUserLanguage === "en") {
		return;
	  }
	  if (["zh-hant", "zh-hk", "zh-mo", "zh-tw"].includes(wgUserLanguage)) {
		mw.messages.set({
		  // as in 17 files selected
		  "cat-a-lot-files-selected": "$1個文件已選擇",
		  // Actions
		  "cat-a-lot-copy": "複製",
		  "cat-a-lot-move": "移動",
		  "cat-a-lot-add": "增加",
		  "cat-a-lot-remove-from-cat": "從此分類移除",
		  "cat-a-lot-enter-name": "輸入分類名稱",
		  "cat-a-lot-select": "選擇",
		  "cat-a-lot-all": "全部",
		  "cat-a-lot-none": "無",
		  "cat-a-lot-none-selected": "沒有選擇文件！",
		  // Preferences
		  "cat-a-lot-watchlistpref": "使用Cat-A-Lot編輯文件時的監視列表選項",
		  "cat-a-lot-watch_pref": "與系統參數設置相同",
		  "cat-a-lot-watch_nochange": "不要更改監視狀態",
		  "cat-a-lot-watch_watch": "監視使用Cat-A-Lot編輯的頁面",
		  "cat-a-lot-watch_unwatch": "將使用Cat-A-Lot編輯的頁面從監視列表移除",
		  "cat-a-lot-minorpref": "將編輯標記爲小修改（若您在系統參數設置中已設置將所有編輯標記爲小修改，此選項不會對現有行爲進行改動）",
		  "cat-a-lot-editpagespref": "允許對不是文件的頁面和子分類進行分類操作",
		  "cat-a-lot-docleanuppref": "移除{{Check categories}}並進行其他細節清理",
		  "cat-a-lot-subcatcountpref": "最多顯示的子分類數量",
		  // Progress
		  "cat-a-lot-loading": "正在加載……",
		  "cat-a-lot-editing": "正在編輯頁面",
		  "cat-a-lot-of": "，共有",
		  "cat-a-lot-skipped-already": "以下頁面已跳過，因爲頁面已經在分類中：",
		  "cat-a-lot-skipped-not-found": "以下頁面已跳過，因爲找不到現有分類：",
		  "cat-a-lot-skipped-server": "以下頁面無法編輯，因爲連接服務器出錯：",
		  "cat-a-lot-all-done": "全部頁面已處理。",
		  "cat-a-lot-done": "已完成！",
		  "cat-a-lot-added-cat": "已加入分類",
		  "cat-a-lot-copied-cat": "已複製到分類",
		  "cat-a-lot-moved-cat": "已移動到分類",
		  "cat-a-lot-removed-cat": "已從分類移除",
		  "cat-a-lot-return-to-page": "返回到頁面",
		  "cat-a-lot-cat-not-found": "找不到分類。",
		  // Summaries
		  "cat-a-lot-summary-add": "[[Help:Cat-a-lot|Cat-a-lot]]：加入分類[[Category:$1]]",
		  "cat-a-lot-summary-copy": "[[Help:Cat-a-lot|Cat-a-lot]]：分類間複製：從[[Category:$1]]到[[Category:$2]]",
		  "cat-a-lot-summary-move": "[[Help:Cat-a-lot|Cat-a-lot]]：分類間移動：從[[Category:$1]]到[[Category:$2]]",
		  "cat-a-lot-summary-remove": "[[Help:Cat-a-lot|Cat-a-lot]]：從分類移除：[[Category:$1]]"
		});
	  } else {
		mw.messages.set({
		  // as in 17 files selected
		  "cat-a-lot-files-selected": "已选择$1个页面或文件",
		  // Actions
		  "cat-a-lot-copy": "复制",
		  "cat-a-lot-move": "移动",
		  "cat-a-lot-add": "增加",
		  "cat-a-lot-remove-from-cat": "从此分类移除",
		  "cat-a-lot-enter-name": "输入分类名称",
		  "cat-a-lot-select": "选择",
		  "cat-a-lot-all": "全部",
		  "cat-a-lot-none": "无",
		  "cat-a-lot-none-selected": "没有选择任何页面或文件！",
		  // Preferences
		  "cat-a-lot-watchlistpref": "使用Cat-a-lot编辑文件时的监视列表选项",
		  "cat-a-lot-watch_pref": "与系统参数设置相同",
		  "cat-a-lot-watch_nochange": "不要更改监视状态",
		  "cat-a-lot-watch_watch": "监视使用Cat-a-lot编辑的页面",
		  "cat-a-lot-watch_unwatch": "将使用Cat-a-lot编辑的页面从监视列表移除",
		  "cat-a-lot-minorpref": "将编辑标记为小修改（若您在系统参数设置中已设置将所有编辑标记为小修改，此选项不会对现有行为进行改动）",
		  "cat-a-lot-editpagespref": "允许对不是文件的页面和子分类进行分类操作",
		  "cat-a-lot-docleanuppref": "移除{{Check categories}}并进行其他细节清理",
		  "cat-a-lot-subcatcountpref": "最多显示的子分类数量",
		  // Progress
		  "cat-a-lot-loading": "正在加载……",
		  "cat-a-lot-editing": "正在编辑页面",
		  "cat-a-lot-of": "，共有",
		  "cat-a-lot-skipped-already": "以下页面已跳过，因为页面已经在分类中：",
		  "cat-a-lot-skipped-not-found": "以下页面已跳过，因为找不到现有分类：",
		  "cat-a-lot-skipped-server": "以下页面无法编辑，因为连接服务器出错：",
		  "cat-a-lot-all-done": "全部页面已处理。",
		  "cat-a-lot-done": "已完成！",
		  "cat-a-lot-added-cat": "已加入分类",
		  "cat-a-lot-copied-cat": "已复制到分类",
		  "cat-a-lot-moved-cat": "已移动到分类",
		  "cat-a-lot-removed-cat": "已从分类移除",
		  "cat-a-lot-return-to-page": "返回到页面",
		  "cat-a-lot-cat-not-found": "找不到分类。",
		  // Summaries
		  "cat-a-lot-summary-add": "[[Help:Cat-a-lot|Cat-a-lot]]：加入分类[[Category:$1]]",
		  "cat-a-lot-summary-copy": "[[Help:Cat-a-lot|Cat-a-lot]]：分类间复制：从[[Category:$1]]到[[Category:$2]]",
		  "cat-a-lot-summary-move": "[[Help:Cat-a-lot|Cat-a-lot]]：分类间移动：从[[Category:$1]]到[[Category:$2]]",
		  "cat-a-lot-summary-remove": "[[Help:Cat-a-lot|Cat-a-lot]]：从分类移除：[[Category:$1]]"
		});
	  }
	};
	//! src/Cat-a-lot/modules/core.tsx
	var import_ext_gadget2 = require("ext.gadget.Util");
	var import_ext_gadget3 = __toESM(require("ext.gadget.JSX"), 1);
	//! src/Cat-a-lot/modules/api.ts
	var import_ext_gadget = require("ext.gadget.Util");
	var api = (0, import_ext_gadget.initMwApi)("Cat-a-lot/".concat(version));
	//! src/Cat-a-lot/modules/core.tsx
	var {
	  wgCanonicalSpecialPageName,
	  wgFormattedNamespaces,
	  wgNamespaceIds,
	  wgNamespaceNumber,
	  wgTitle
	} = mw.config.get();
	var catALot = () => {
	  /*! Cat-a-lot | CC-BY-SA-4.0 <https://qwbk.cc/H:CC-BY-SA-4.0> */
	  class CAL {
		static isSearchMode = false;
		static MESSAGES = /* @__PURE__ */ (() => DEFAULT_MESSAGES)();
		static DEFAULT_SETTING = /* @__PURE__ */ (() => DEFAULT_SETTING)();
		static API_TAG = /* @__PURE__ */ (() => apiTag)();
		static TARGET_NAMESPACE = /* @__PURE__ */ (() => targetNamespace)();
		static CURRENT_CATEGROY = /* @__PURE__ */ (() => wgTitle)();
		static wgFormattedNamespaces = /* @__PURE__ */ (() => wgFormattedNamespaces)();
		static wgNamespaceIds = /* @__PURE__ */ (() => wgNamespaceIds)();
		static isAutoCompleteInit = false;
		static api = /* @__PURE__ */ (() => api)();
		static alreadyThere = [];
		static connectionError = [];
		static notFound = [];
		static counterCurrent = 0;
		static counterNeeded = 0;
		static counterCat = 0;
		static currentCategory = "";
		static dialogHeight = 450;
		static editToken = "";
		static localCatName = (() => wgFormattedNamespaces[CAL.TARGET_NAMESPACE])();
		static parentCats = [];
		static subCats = [];
		static settings = {};
		static variantCache = {};
		static $counter = (() => $())();
		static $progressDialog = (() => $())();
		static $labels = (() => $())();
		static $selectedLabels = (() => $())();
		$body;
		$container;
		$dataContainer;
		$markCounter;
		$resultList;
		$searchInput;
		$head;
		$link;
		constructor($body) {
		  var _mw$util$getParamValu;
		  if (!mw.msg("cat-a-lot-loading")) {
			mw.messages.set(CAL.MESSAGES);
		  }
		  this.$body = $body;
		  CAL.initSettings();
		  const container = /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: [CLASS_NAME, CLASS_NAME_CONTAINER, "noprint"]
		  }, /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: CLASS_NAME_CONTAINER_DATA
		  }, /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: CLASS_NAME_CONTAINER_DATA_MARK_COUNTER
		  }), /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST
		  }), /* @__PURE__ */ import_ext_gadget3.default.createElement("div", null, /* @__PURE__ */ import_ext_gadget3.default.createElement("input", {
			className: CLASS_NAME_CONTAINER_DATA_SEARCH_INPUT_CONTAINER_INPUT,
			placeholder: CAL.msg("enter-name"),
			type: "text",
			value: CAL.isSearchMode ? (_mw$util$getParamValu = mw.util.getParamValue("search")) !== null && _mw$util$getParamValu !== void 0 ? _mw$util$getParamValu : "" : "",
			onKeyDown: (event) => {
			  const $element = $(event.currentTarget);
			  if (event.key === "Enter") {
				var _$element$val$trim, _$element$val;
				const cat = (_$element$val$trim = (_$element$val = $element.val()) === null || _$element$val === void 0 ? void 0 : _$element$val.trim()) !== null && _$element$val$trim !== void 0 ? _$element$val$trim : "";
				if (cat) {
				  this.updateCats(cat);
				}
			  }
			}
		  })), /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: CLASS_NAME_CONTAINER_DATA_SELECTIONS
		  }, [CAL.msg("select"), " "], /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
			className: CLASS_NAME_CONTAINER_DATA_SELECTIONS_ALL,
			onClick: () => {
			  this.toggleAll(true);
			}
		  }, CAL.msg("all")), " • ", /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
			className: CLASS_NAME_CONTAINER_DATA_SELECTIONS_NONE,
			onClick: () => {
			  this.toggleAll(false);
			}
		  }, CAL.msg("none")))), /* @__PURE__ */ import_ext_gadget3.default.createElement("div", {
			className: CLASS_NAME_CONTAINER_HEAD
		  }, /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
			className: CLASS_NAME_CONTAINER_HEAD_LINK
		  }, "Cat-a-lot")));
		  this.$container = $(container);
		  this.$container.appendTo(this.$body);
		  this.$dataContainer = this.$container.find(".".concat(CLASS_NAME_CONTAINER_DATA));
		  this.$markCounter = this.$dataContainer.find(".".concat(CLASS_NAME_CONTAINER_DATA_MARK_COUNTER));
		  this.$resultList = this.$dataContainer.find(".".concat(CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST));
		  this.$searchInput = this.$dataContainer.find(".".concat(CLASS_NAME_CONTAINER_DATA_SEARCH_INPUT_CONTAINER_INPUT));
		  this.$head = this.$container.find(".".concat(CLASS_NAME_CONTAINER_HEAD));
		  this.$link = this.$head.find(".".concat(CLASS_NAME_CONTAINER_HEAD_LINK));
		}
		buildElements() {
		  const regexCat = new RegExp("^\\s*".concat(CAL.localizedRegex(CAL.TARGET_NAMESPACE, "Category"), ":"), "");
		  let isCompositionStart;
		  this.$searchInput.on("compositionstart", () => {
			isCompositionStart = true;
		  });
		  this.$searchInput.on("compositionend", () => {
			isCompositionStart = false;
		  });
		  this.$searchInput.on("input keyup", (event) => {
			if (isCompositionStart) {
			  return;
			}
			const {
			  currentTarget
			} = event;
			const {
			  value: oldVal
			} = currentTarget;
			const newVal = oldVal.replace(regexCat, "");
			if (newVal !== oldVal) {
			  currentTarget.value = newVal;
			}
		  });
		  const initAutocomplete = () => {
			if (CAL.isAutoCompleteInit) {
			  return;
			}
			CAL.isAutoCompleteInit = true;
			this.$searchInput.autocomplete({
			  source: (request, response) => {
				this.doAPICall({
				  action: "opensearch",
				  namespace: CAL.TARGET_NAMESPACE,
				  redirects: "resolve",
				  search: request.term
				}, (result) => {
				  if (result[1]) {
					response($(result[1]).map((_index, item) => item.replace(regexCat, "")));
				  }
				});
			  },
			  position: {
				my: "right bottom",
				at: "right top",
				of: this.$searchInput
			  },
			  appendTo: ".".concat(CLASS_NAME_CONTAINER)
			});
		  };
		  this.$link.on("click", (event) => {
			$(event.currentTarget).toggleClass(CLASS_NAME_CONTAINER_HEAD_LINK_ENABLED);
			initAutocomplete();
			this.run();
		  });
		}
		static initSettings() {
		  var _window$CatALotPrefs;
		  let catALotPrefs = (_window$CatALotPrefs = window.CatALotPrefs) !== null && _window$CatALotPrefs !== void 0 ? _window$CatALotPrefs : {};
		  const typeOfCatALotPrefs = typeof catALotPrefs;
		  if (typeOfCatALotPrefs === "object" && !Array.isArray(catALotPrefs) || typeOfCatALotPrefs !== "object") {
			catALotPrefs = {};
		  }
		  for (var _i = 0, _Object$keys = Object.keys(CAL.DEFAULT_SETTING); _i < _Object$keys.length; _i++) {
			var _catALotPrefs$setting;
			const settingKey = _Object$keys[_i];
			const setting = CAL.DEFAULT_SETTING[settingKey];
			CAL.settings[settingKey] = (_catALotPrefs$setting = catALotPrefs[settingKey]) !== null && _catALotPrefs$setting !== void 0 ? _catALotPrefs$setting : setting.default;
			if (!setting.select_i18n) {
			  continue;
			}
			setting.select = {};
			for (var _i2 = 0, _Object$keys2 = Object.keys(setting.select_i18n); _i2 < _Object$keys2.length; _i2++) {
			  const messageKey = _Object$keys2[_i2];
			  const message = setting.select_i18n[messageKey];
			  setting.select[CAL.msg(messageKey)] = message;
			}
		  }
		}
		static msg(key, ...args) {
		  const fullKey = "cat-a-lot-".concat(key);
		  return args.length ? mw.message(fullKey, ...args).parse() : mw.message(fullKey).plain();
		}
		static localizedRegex(namespaceNumber, fallback) {
		  var _CAL$wgFormattedNames;
		  const wikiTextBlank = String.raw(_templateObject || (_templateObject = _taggedTemplateLiteral(["[	 _  ᠎ - \u2028\u2029  　]+"], ["[\\t _\\xA0\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+"])));
		  const wikiTextBlankRE = new RegExp(wikiTextBlank, "g");
		  const createRegexStr = (name) => {
			if (!(name !== null && name !== void 0 && name.length)) {
			  return "";
			}
			let regexName = "";
			for (let i = 0; i < name.length; i++) {
			  const initial = name.slice(i, i + 1);
			  const ll = initial.toLowerCase();
			  const ul = initial.toUpperCase();
			  regexName += ll === ul ? initial : "[".concat(ll).concat(ul, "]");
			}
			return regexName.replace(/([$()*+.?\\^])/g, String.raw(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["$1"], ["\\$1"])))).replace(wikiTextBlankRE, wikiTextBlank);
		  };
		  fallback = fallback.toLowerCase();
		  const canonical = (_CAL$wgFormattedNames = CAL.wgFormattedNamespaces[namespaceNumber]) === null || _CAL$wgFormattedNames === void 0 ? void 0 : _CAL$wgFormattedNames.toLowerCase();
		  let regexString = createRegexStr(canonical);
		  if (fallback && canonical !== fallback) {
			regexString += "|".concat(createRegexStr(fallback));
		  }
		  for (var _i3 = 0, _Object$keys3 = Object.keys(CAL.wgNamespaceIds); _i3 < _Object$keys3.length; _i3++) {
			const catName = _Object$keys3[_i3];
			if (catName.toLowerCase() !== canonical && catName.toLowerCase() !== fallback && CAL.wgNamespaceIds[catName] === namespaceNumber) {
			  regexString += "|".concat(createRegexStr(catName));
			}
		  }
		  return "(?:".concat(regexString, ")");
		}
		updateSelectionCounter() {
		  CAL.$selectedLabels = CAL.$labels.filter(".".concat(CLASS_NAME_LABEL_SELECTED));
		  this.$markCounter.show().html(CAL.msg("files-selected", CAL.$selectedLabels.length.toString()));
		}
		toggleAll(select) {
		  CAL.$labels.toggleClass(CLASS_NAME_LABEL_SELECTED, select);
		  this.updateSelectionCounter();
		}
		static findAllVariants(category) {
		  return _asyncToGenerator(function* () {
			if (CAL.variantCache[category] !== void 0) {
			  return CAL.variantCache[category];
			}
			if (mw.storage.getObject(storageKey + category)) {
			  CAL.variantCache[category] = mw.storage.getObject(storageKey + category);
			  return CAL.variantCache[category];
			}
			let results = [];
			const params = {
			  action: "parse",
			  format: "json",
			  formatversion: "2",
			  text: category,
			  title: "temp"
			};
			for (var _i4 = 0, _VARIANTS = VARIANTS; _i4 < _VARIANTS.length; _i4++) {
			  const variant = _VARIANTS[_i4];
			  try {
				const {
				  parse
				} = yield CAL.api.get({
				  ...params,
				  variant
				});
				const {
				  text
				} = parse;
				const result = $(text).eq(0).text().trim();
				results[results.length] = result;
			  } catch {
			  }
			}
			results = (0, import_ext_gadget2.uniqueArray)(results);
			CAL.variantCache[category] = results;
			mw.storage.setObject(storageKey + category, results, 60 * 60 * 24);
			return results;
		  })();
		}
		static regexBuilder(category) {
		  return _asyncToGenerator(function* () {
			const catName = CAL.localizedRegex(CAL.TARGET_NAMESPACE, "Category");
			category = category.replace(/^[\s_]+/, "").replace(/[\s_]+$/, "");
			const variants = yield CAL.findAllVariants(category);
			const variantRegExps = [];
			var _iterator2 = _createForOfIteratorHelper(variants), _step2;
			try {
			  for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
				let variant = _step2.value;
				variant = mw.util.escapeRegExp(variant);
				variant = variant.replace(/[\s_]+/g, String.raw(_templateObject3 || (_templateObject3 = _taggedTemplateLiteral(["[s_]+"], ["[\\s_]+"]))));
				const first = variant.slice(0, 1);
				if (first.toUpperCase() !== first.toLowerCase()) {
				  variant = "[".concat(first.toUpperCase()).concat(first.toLowerCase(), "]").concat(variant.slice(1));
				}
				variantRegExps[variantRegExps.length] = variant;
			  }
			} catch (err) {
			  _iterator2.e(err);
			} finally {
			  _iterator2.f();
			}
			return new RegExp("\\[\\[[\\s_]*".concat(catName, "[\\s_]*:[\\s_]*(?:").concat(variantRegExps.join("|"), ")[\\s_]*(\\|[^\\]]*(?:\\][^\\]]+)*)?\\]\\]"), "g");
		  })();
		}
		doAPICall(_params, callback) {
		  const params = _params;
		  params["format"] = "json";
		  params["formatversion"] = "2";
		  let i = 0;
		  const doCall = () => {
			const handleError = (error) => {
			  mw.log.error("[Cat-a-lot] Ajax error:", error);
			  if (i < 4) {
				setTimeout(doCall, 300);
				i++;
			  } else if (params["title"]) {
				CAL.connectionError[CAL.connectionError.length] = params["title"];
				this.updateCounter();
			  }
			};
			if (params["action"] === "query") {
			  CAL.api.get(params).then(callback).catch(handleError);
			} else {
			  CAL.api.post(params).then(callback).catch(handleError);
			}
		  };
		  doCall();
		}
		static markAsDone($markedLabel, targetCategory, mode) {
		  $markedLabel.addClass(CLASS_NAME_LABEL_DONE);
		  switch (mode) {
			case "add":
			  $markedLabel.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", null), CAL.msg("added-cat", targetCategory)));
			  break;
			case "copy":
			  $markedLabel.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", null), CAL.msg("copied-cat", targetCategory)));
			  break;
			case "move":
			  $markedLabel.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", null), CAL.msg("moved-cat", targetCategory)));
			  break;
			case "remove":
			  $markedLabel.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", null), CAL.msg("removed-cat", targetCategory)));
			  break;
		  }
		}
		static doCleanup(text) {
		  return CAL.settings.docleanup ? text.replace(/{{\s*[Cc]heck categories\s*(\|?.*?)}}/, "") : text;
		}
		// Remove {{Uncategorized}} (also with comment). No need to replace it with anything
		static removeUncat(text) {
		  return text.replace(/\{\{\s*[Uu]ncategorized\s*(\|?.*?)\}\}/, "");
		}
		displayResult() {
		  this.$body.css({
			cursor: "",
			overflow: ""
		  });
		  this.$body.find(".".concat(CLASS_NAME_FEEDBACK)).addClass(CLASS_NAME_FEEDBACK_DONE);
		  const $parent = CAL.$counter.parent();
		  $parent.html(/* @__PURE__ */ import_ext_gadget3.default.createElement("h3", null, CAL.msg("done")));
		  $parent.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, CAL.msg("all-done"), /* @__PURE__ */ import_ext_gadget3.default.createElement("br", null)));
		  $parent.append(/* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
			onClick: () => {
			  CAL.$progressDialog.remove();
			  this.toggleAll(false);
			}
		  }, CAL.msg("return-to-page")));
		  if (CAL.alreadyThere.length) {
			$parent.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("h5", null, CAL.msg("skipped-already", CAL.alreadyThere.length.toString())), CAL.alreadyThere.reduce((pre, cur, index) => index < CAL.alreadyThere.length - 1 ? [...pre, cur, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", {
			  key: index
			})] : [...pre, cur], [])));
		  }
		  if (CAL.notFound.length) {
			$parent.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("h5", null, CAL.msg("skipped-not-found", CAL.notFound.length.toString())), CAL.notFound.reduce((pre, cur, index) => index < CAL.notFound.length - 1 ? [...pre, cur, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", {
			  key: index
			})] : [...pre, cur], [])));
		  }
		  if (CAL.connectionError.length) {
			$parent.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("h5", null, CAL.msg("skipped-server", CAL.connectionError.length.toString())), CAL.connectionError.reduce((pre, cur, index) => index < CAL.connectionError.length - 1 ? [...pre, cur, /* @__PURE__ */ import_ext_gadget3.default.createElement("br", {
			  key: index
			})] : [...pre, cur], [])));
		  }
		}
		updateCounter() {
		  CAL.counterCurrent++;
		  if (CAL.counterCurrent > CAL.counterNeeded) {
			this.displayResult();
		  } else {
			CAL.$counter.text(CAL.counterCurrent);
		  }
		}
		editCategories(result, markedLabel, targetCategory, mode) {
		  var _this = this;
		  return _asyncToGenerator(function* () {
			var _page$revisions;
			const [markedLabelTitle, $markedLabel] = markedLabel;
			if (!(result !== null && result !== void 0 && result["query"])) {
			  CAL.connectionError[CAL.connectionError.length] = markedLabelTitle;
			  _this.updateCounter();
			  return;
			}
			let originText = "";
			let starttimestamp = 0;
			let timestamp = 0;
			CAL.editToken = result["query"].tokens.csrftoken;
			const {
			  pages
			} = result["query"];
			const [page] = pages;
			originText = page === null || page === void 0 || (_page$revisions = page.revisions) === null || _page$revisions === void 0 ? void 0 : _page$revisions[0].slots.main.content;
			({
			  starttimestamp
			} = page);
			[{
			  timestamp
			}] = page.revisions;
			const sourcecat = CAL.CURRENT_CATEGROY;
			const targeRegExp = yield CAL.regexBuilder(targetCategory);
			if (mode !== "remove" && targeRegExp.test(originText) && mode !== "move") {
			  CAL.alreadyThere[CAL.alreadyThere.length] = markedLabelTitle;
			  _this.updateCounter();
			  return;
			}
			let text = originText;
			let summary;
			const sourceCatRegExp = yield CAL.regexBuilder(sourcecat);
			switch (mode) {
			  case "add":
				text += "\n[[".concat(CAL.localCatName, ":").concat(targetCategory, "]]\n");
				summary = CAL.msg("summary-add").replace("$1", targetCategory);
				break;
			  case "copy":
				text = text.replace(sourceCatRegExp, "[[".concat(CAL.localCatName, ":").concat(sourcecat, "$1]]\n[[").concat(CAL.localCatName, ":").concat(targetCategory, "$1]]"));
				summary = CAL.msg("summary-copy").replace("$1", sourcecat).replace("$2", targetCategory);
				if (originText === text) {
				  text += "\n[[".concat(CAL.localCatName, ":").concat(targetCategory, "]]");
				}
				break;
			  case "move":
				text = text.replace(sourceCatRegExp, "[[".concat(CAL.localCatName, ":").concat(targetCategory, "$1]]"));
				summary = CAL.msg("summary-move").replace("$1", sourcecat).replace("$2", targetCategory);
				break;
			  case "remove":
				text = text.replace(sourceCatRegExp, "");
				summary = CAL.msg("summary-remove").replace("$1", sourcecat);
				break;
			}
			if (text === originText) {
			  CAL.notFound[CAL.notFound.length] = markedLabelTitle;
			  _this.updateCounter();
			  return;
			}
			if (mode !== "remove") {
			  text = CAL.doCleanup(CAL.removeUncat(text));
			}
			_this.doAPICall({
			  action: "edit",
			  token: CAL.editToken,
			  tags: CAL.API_TAG,
			  title: markedLabelTitle,
			  assert: "user",
			  bot: true,
			  basetimestamp: timestamp,
			  watchlist: CAL.settings.watchlist,
			  text,
			  summary,
			  starttimestamp
			}, () => {
			  _this.updateCounter();
			});
			CAL.markAsDone($markedLabel, targetCategory, mode);
		  })();
		}
		getContent(markedLabel, targetCategory, mode) {
		  this.doAPICall({
			action: "query",
			formatversion: "2",
			meta: "tokens",
			titles: markedLabel[0],
			prop: "revisions",
			rvprop: ["content", "timestamp"],
			rvslots: "main"
		  }, (result) => {
			void this.editCategories(result, markedLabel, targetCategory, mode);
		  });
		}
		static getTitleFromLink(href) {
		  try {
			var _decodeURIComponent$m, _decodeURIComponent$m2;
			return ((_decodeURIComponent$m = (_decodeURIComponent$m2 = decodeURIComponent(href !== null && href !== void 0 ? href : "").match(/wiki\/(.+?)(?:#.+)?$/)) === null || _decodeURIComponent$m2 === void 0 ? void 0 : _decodeURIComponent$m2[1]) !== null && _decodeURIComponent$m !== void 0 ? _decodeURIComponent$m : "").replace(/_/g, " ");
		  } catch {
			return "";
		  }
		}
		getMarkedLabels() {
		  const markedLabels = [];
		  CAL.$selectedLabels = CAL.$labels.filter(".".concat(CLASS_NAME_LABEL_SELECTED));
		  CAL.$selectedLabels.each((_index, label) => {
			var _$labelLink$attr;
			const $label = $(label);
			const $labelLink = $label.find("a:not(.CategoryTreeToggle)[title]");
			const title = ((_$labelLink$attr = $labelLink.attr("title")) === null || _$labelLink$attr === void 0 ? void 0 : _$labelLink$attr.trim()) || CAL.getTitleFromLink($labelLink.attr("href")) || CAL.getTitleFromLink($label.find("a:not(.CategoryTreeToggle)").attr("href"));
			markedLabels[markedLabels.length] = [title, $label];
		  });
		  return markedLabels;
		}
		showProgress() {
		  this.$body.css({
			cursor: "wait",
			overflow: "hidden"
		  });
		  CAL.$progressDialog = $(/* @__PURE__ */ import_ext_gadget3.default.createElement("div", null, CAL.msg("editing"), /* @__PURE__ */ import_ext_gadget3.default.createElement("span", {
			className: CLASS_NAME_CURRENT_COUNTER
		  }, CAL.counterCurrent), [CAL.msg("of"), CAL.counterNeeded])).dialog({
			dialogClass: CLASS_NAME_FEEDBACK,
			minHeight: 90,
			height: 90,
			width: 450,
			modal: true,
			closeOnEscape: false,
			draggable: false,
			resizable: false
		  });
		  this.$body.find(".".concat(CLASS_NAME_FEEDBACK, " .ui-dialog-titlebar")).hide();
		  this.$body.find(".".concat(CLASS_NAME_FEEDBACK, " .ui-dialog-content")).height("auto");
		  CAL.$counter = this.$body.find(".".concat(CLASS_NAME_CURRENT_COUNTER));
		}
		doSomething(targetCategory, mode) {
		  const markedLabels = this.getMarkedLabels();
		  if (!markedLabels.length) {
			void mw.notify(CAL.msg("none-selected"), {
			  tag: "catALot"
			});
			return;
		  }
		  CAL.alreadyThere = [];
		  CAL.connectionError = [];
		  CAL.notFound = [];
		  CAL.counterCurrent = 1;
		  CAL.counterNeeded = markedLabels.length;
		  this.showProgress();
		  var _iterator3 = _createForOfIteratorHelper(markedLabels), _step3;
		  try {
			for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
			  const markedLabel = _step3.value;
			  this.getContent(markedLabel, targetCategory, mode);
			}
		  } catch (err) {
			_iterator3.e(err);
		  } finally {
			_iterator3.f();
		  }
		}
		addHere(targetCategory) {
		  this.doSomething(targetCategory, "add");
		}
		copyHere(targetCategory) {
		  this.doSomething(targetCategory, "copy");
		}
		moveHere(targetCategory) {
		  this.doSomething(targetCategory, "move");
		}
		createCatLinks(symbol, categories) {
		  categories.sort();
		  var _iterator4 = _createForOfIteratorHelper(categories), _step4;
		  try {
			for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
			  const category = _step4.value;
			  const $tr = $(/* @__PURE__ */ import_ext_gadget3.default.createElement("tr", {
				dataset: {
				  category
				}
			  }, /* @__PURE__ */ import_ext_gadget3.default.createElement("td", null, symbol), /* @__PURE__ */ import_ext_gadget3.default.createElement("td", null, /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
				onClick: (event) => {
				  const $element = $(event.currentTarget);
				  this.updateCats($element.closest("tr").data("category"));
				}
			  }, category))));
			  if (category !== CAL.CURRENT_CATEGROY && CAL.isSearchMode) {
				$tr.append(/* @__PURE__ */ import_ext_gadget3.default.createElement("td", null, /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
				  className: CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_ACTION,
				  onClick: (event) => {
					const $element = $(event.currentTarget);
					this.addHere($element.closest("tr").data("category"));
				  }
				}, CAL.msg("add"))));
			  } else if (category !== CAL.CURRENT_CATEGROY && !CAL.isSearchMode) {
				$tr.append(/* @__PURE__ */ import_ext_gadget3.default.createElement(import_ext_gadget3.default.Fragment, null, /* @__PURE__ */ import_ext_gadget3.default.createElement("td", null, /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
				  className: CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_ACTION,
				  onClick: (event) => {
					const $element = $(event.currentTarget);
					this.copyHere($element.closest("tr").data("category"));
				  }
				}, CAL.msg("copy"))), /* @__PURE__ */ import_ext_gadget3.default.createElement("td", null, /* @__PURE__ */ import_ext_gadget3.default.createElement("a", {
				  className: CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_ACTION,
				  onClick: (event) => {
					const $element = $(event.currentTarget);
					this.moveHere($element.closest("tr").data("category"));
				  }
				}, CAL.msg("move")))));
			  }
			  this.$resultList.find("table").append($tr);
			}
		  } catch (err) {
			_iterator4.e(err);
		  } finally {
			_iterator4.f();
		  }
		}
		showCategoryList() {
		  var _this$$container$widt, _$$width;
		  this.$body.css("cursor", "");
		  const currentCategories = [CAL.currentCategory];
		  this.$resultList.empty();
		  this.$resultList.append(/* @__PURE__ */ import_ext_gadget3.default.createElement("table", null));
		  this.createCatLinks("↑", CAL.parentCats);
		  this.createCatLinks("→", currentCategories);
		  this.createCatLinks("↓", CAL.subCats);
		  this.$container.width("");
		  this.$container.height("");
		  this.$container.width(Math.min(((_this$$container$widt = this.$container.width()) !== null && _this$$container$widt !== void 0 ? _this$$container$widt : 0) * 1.1 + 15, ((_$$width = $(window).width()) !== null && _$$width !== void 0 ? _$$width : 0) - 10));
		  this.$resultList.css({
			"max-height": "".concat(CAL.dialogHeight, "px"),
			height: ""
		  });
		}
		getParentCats() {
		  this.doAPICall({
			action: "query",
			titles: "Category:".concat(CAL.currentCategory),
			prop: "categories"
		  }, (result) => {
			var _pages$, _pages$2;
			if (!result) {
			  return;
			}
			CAL.parentCats = [];
			const {
			  pages
			} = result.query;
			if ((_pages$ = pages[0]) !== null && _pages$ !== void 0 && _pages$.missing) {
			  this.$body.css("cursor", "");
			  this.$resultList.html(/* @__PURE__ */ import_ext_gadget3.default.createElement("span", {
				className: CLASS_NAME_CONTAINER_DATA_CATEGORY_LIST_NO_FOUND
			  }, CAL.msg("cat-not-found")));
			  this.createCatLinks("→", [CAL.currentCategory]);
			  return;
			}
			let categories = [];
			if ((_pages$2 = pages[0]) !== null && _pages$2 !== void 0 && _pages$2.categories) {
			  [{
				categories
			  }] = pages;
			}
			var _iterator5 = _createForOfIteratorHelper(categories), _step5;
			try {
			  for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
				const cat = _step5.value;
				CAL.parentCats[CAL.parentCats.length] = cat.title.replace(/^[^:]+:/, "");
			  }
			} catch (err) {
			  _iterator5.e(err);
			} finally {
			  _iterator5.f();
			}
			CAL.counterCat++;
			if (CAL.counterCat === 2) {
			  this.showCategoryList();
			}
		  });
		}
		getSubCats() {
		  this.doAPICall({
			action: "query",
			list: "categorymembers",
			cmtype: "subcat",
			cmlimit: CAL.settings.subcatcount,
			cmtitle: "Category:".concat(CAL.currentCategory)
		  }, (result) => {
			var _result$query;
			const cats = (result === null || result === void 0 || (_result$query = result.query) === null || _result$query === void 0 ? void 0 : _result$query.categorymembers) || [];
			CAL.subCats = [];
			var _iterator6 = _createForOfIteratorHelper(cats), _step6;
			try {
			  for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
				const cat = _step6.value;
				CAL.subCats[CAL.subCats.length] = cat.title.replace(/^[^:]+:/, "");
			  }
			} catch (err) {
			  _iterator6.e(err);
			} finally {
			  _iterator6.f();
			}
			CAL.counterCat++;
			if (CAL.counterCat === 2) {
			  this.showCategoryList();
			}
		  });
		}
		getCategoryList() {
		  CAL.counterCat = 0;
		  this.getParentCats();
		  this.getSubCats();
		}
		updateCats(cat) {
		  this.$body.css("cursor", "wait");
		  CAL.currentCategory = cat;
		  this.$resultList.html(/* @__PURE__ */ import_ext_gadget3.default.createElement("div", null, CAL.msg("loading")));
		  this.getCategoryList();
		}
		findAllLabels() {
		  if (CAL.isSearchMode) {
			CAL.$labels = this.$body.find("table.searchResultImage").find("tr>td").eq(1);
			if (CAL.settings.editpages) {
			  CAL.$labels = CAL.$labels.add("div.mw-search-result-heading");
			}
		  } else {
			CAL.$labels = this.$body.find("div.gallerytext").add(this.$body.find("div#mw-category-media").find('li[class!="gallerybox"]'));
			if (CAL.settings.editpages) {
			  const $pages = this.$body.find("div#mw-pages, div#mw-subcategories").find("li");
			  CAL.$labels = CAL.$labels.add($pages);
			}
		  }
		}
		makeClickable() {
		  this.findAllLabels();
		  CAL.$labels.addClass(CLASS_NAME_LABEL).onCatALotShiftClick(() => {
			this.updateSelectionCounter();
		  });
		}
		run() {
		  if (this.$link.hasClass(CLASS_NAME_CONTAINER_HEAD_LINK_ENABLED)) {
			this.makeClickable();
			this.$dataContainer.show();
			this.$container.resizable({
			  alsoResize: this.$resultList,
			  handles: "n",
			  resize: (event) => {
				var _$currentTarget$heigh;
				const $currentTarget = $(event.currentTarget);
				$currentTarget.css({
				  left: "",
				  top: ""
				});
				CAL.dialogHeight = (_$currentTarget$heigh = $currentTarget.height()) !== null && _$currentTarget$heigh !== void 0 ? _$currentTarget$heigh : CAL.dialogHeight;
				this.$resultList.css({
				  maxHeight: "",
				  width: ""
				});
			  }
			});
			this.$resultList.css("max-height", "450px");
			if (CAL.isSearchMode) {
			  this.updateCats("Pictures and images");
			} else {
			  this.updateCats(CAL.CURRENT_CATEGROY);
			}
		  } else {
			this.$dataContainer.hide();
			this.$container.resizable("destroy");
			this.$container.css("width", "");
			CAL.$labels.off("click.catALot");
		  }
		}
	  }
	  if (wgNamespaceNumber === -1 && wgCanonicalSpecialPageName === "Search" || wgNamespaceNumber === targetNamespace) {
		if (wgNamespaceNumber === -1) {
		  CAL.isSearchMode = true;
		}
		/*! Cat-a-lot messages | CC-BY-SA-4.0 <https://qwbk.cc/H:CC-BY-SA-4.0> */
		setMessages();
		void (0, import_ext_gadget2.getBody)().then(($body) => {
		  new CAL($body).buildElements();
		});
	  }
	};
	//! src/Cat-a-lot/modules/extendJQueryPrototype.ts
	var extendJQueryPrototype = () => {
	  $.fn.extend({
		onCatALotShiftClick: function(callback) {
		  let prevCheckbox;
		  this.on("click.catALot", (event) => {
			if (!event.ctrlKey) {
			  event.preventDefault();
			}
			this.parents("body").find(".".concat(CLASS_NAME_LABEL_LAST_SELECTED)).removeClass(CLASS_NAME_LABEL_LAST_SELECTED);
			let $thisControl = $(event.target);
			if (!$thisControl.hasClass(CLASS_NAME_LABEL)) {
			  $thisControl = $thisControl.parents(".".concat(CLASS_NAME_LABEL));
			}
			$thisControl.addClass(CLASS_NAME_LABEL_LAST_SELECTED).toggleClass(CLASS_NAME_LABEL_SELECTED);
			if (prevCheckbox && event.shiftKey) {
			  const method = $thisControl.hasClass(CLASS_NAME_LABEL_SELECTED) ? "addClass" : "removeClass";
			  this.slice(Math.min(this.index(prevCheckbox), this.index($thisControl)), Math.max(this.index(prevCheckbox), this.index($thisControl)) + 1)[method](CLASS_NAME_LABEL_SELECTED);
			}
			prevCheckbox = $thisControl;
			if (typeof callback === "function") {
			  callback();
			}
		  });
		  return this;
		}
	  });
	};
	//! src/Cat-a-lot/Cat-a-lot.ts
	/*! Cat-a-lot | CC-BY-SA-4.0 <https://qwbk.cc/H:CC-BY-SA-4.0> */
	extendJQueryPrototype();
	catALot();
	
	})();