/**
* -------------------------------------------------------------------------
* !!! DON'T MODIFY THIS PAGE MANUALLY, YOUR CHANGES WILL BE OVERWRITTEN !!!
* -------------------------------------------------------------------------
*/
var _addText = '{{GHIACode|page=GHIA:MoegirlPediaInterfaceCodes/blob/master/src/gadgets/rollback-summary/MediaWiki:Gadget-rollback-summary.js|user=[[U:AnnAngela]]|co-authors=[[U:Bhsd]]、GH:github-actions[bot]|longId=bf83eaea8eb4d94405bdf6885ec072fec997dd56|shortId=bf83eaea|summary=ci: use eslint flat config (#400)|body=<nowiki>Co-authored-by: Bhsd <55071315+bhsd-harry📧users.noreply.github.com>↩Co-authored-by: github-actions[bot] <41898282+github-actions[bot]📧users.noreply.github.com></nowiki>}}';
/* <pre> */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
return new (P || (P = Promise))(function (resolve, reject) {
function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
step((generator = generator.apply(thisArg, _arguments || [])).next());
});
};
var __generator = (this && this.__generator) || function (thisArg, body) {
var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
function verb(n) { return function (v) { return step([n, v]); }; }
function step(op) {
if (f) throw new TypeError("Generator is already executing.");
while (g && (g = 0, op[0] && (_ = 0)), _) try {
if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
if (y = 0, t) op = [op[0] & 2, t.value];
switch (op[0]) {
case 0: case 1: t = op; break;
case 4: _.label++; return { value: op[1], done: false };
case 5: _.label++; y = op[1]; op = [0]; continue;
case 7: op = _.ops.pop(); _.trys.pop(); continue;
default:
if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
if (t[2]) _.ops.pop();
_.trys.pop(); continue;
}
op = body.call(thisArg, _);
} catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
}
};
$(function () {
var wgUserGroups = mw.config.get("wgUserGroups", []);
if (!wgUserGroups.includes("sysop") && !wgUserGroups.includes("patroller")) {
return;
}
mw.config.set({
wgRollbacking: false,
wgRollbackTool: "inited"
});
var possibleError = {
alreadyrolled: wgULS("已被回退", "已被還原"),
onlyauthor: wgULS("该页面只有一位编辑者参与编辑，无法回退", "該頁面只有一位編輯者參與編輯，無法還原"),
missingparams: wgULS('必须要有参数"title"或参数"pageid"之一', '必須存在參數"title"或參數"pageid"之一'),
notitle: wgULS('参数"title"必须被设置', '參數"title"必須被設置'),
notoken: wgULS('参数"token"必须被设置', '參數"token"必須被設置'),
nouser: wgULS('参数"user"必须被设置', '參數"user"必須被設置')
};
var loop = function (_, ele) {
var self = $(ele);
self.data("href", self.attr("href")).removeAttr("href")
.attr("title", "".concat(ele.title, "\uFF08\u542F\u7528\u81EA\u5B9A\u4E49\u6458\u8981\uFF09")).css("cursor", "pointer").append("<sup>+</sup>");
if ($(".ns-special")[0] && self.text().includes("10")) {
self.parent().text(wgULS("[超过10次的编辑]", "[超過10次的編輯]")).attr("title", "超过10次的编辑请使用撤销功能，以便检查差异（自定义摘要小工具）");
}
ele.onmouseover = $.noop;
ele.onmouseout = $.noop;
ele.onmousedown = $.noop;
};
var exit = function () {
var rbcount = $("#rbcount");
var count = 3;
setInterval(function () {
if (--count === 0) {
window.location.reload();
}
rbcount.text(count > 0 ? count : "0");
}, 1000);
};
$(".mw-rollback-link a").each(loop);
var api = new mw.Api();
$(document.body).on("click", function (event) { return __awaiter(void 0, void 0, void 0, function () {
var target, self, parent, rollbackSummary, uri, rbing, summary, e_1, errorText;
return __generator(this, function (_a) {
switch (_a.label) {
case 0:
target = event.target;
if (!$(target).is(".mw-rollback-link a")) {
return [2, true];
}
self = $(target);
parent = self.parent();
if (!self.data("href")) {
loop(null, target);
}
if (!parent.find(self)[0]) {
return [2, false];
}
if (mw.config.get("wgRollbacking")) {
return [2, false];
}
return [4, oouiDialog.prompt("<ul><li>".concat(wgULS("回退操作的编辑摘要", "還原操作的編輯摘要"), "\uFF1A<code>xxx//Rollback</code></li><li>").concat(wgULS("空白则使用默认回退摘要", "留空則使用默認的還原摘要"), "\uFF0C").concat(wgULS("取消则不进行回退", "取消則不進行還原"), "</li></ul><hr>").concat(wgULS("请输入回退摘要", "請輸入還原摘要"), "\uFF1A"), {
title: "回退小工具",
size: "medium",
required: false
})];
case 1:
rollbackSummary = _a.sent();
if (!(rollbackSummary !== null)) return [3, 8];
uri = new mw.Uri(self.data("href"));
self.replaceWith("<span id=\"rbing\"><img src=\"https://img.moegirl.org.cn/common/d/d1/Windows_10_loading.gif\" style=\"height: 1em; margin-top: -.25em;\">".concat(wgULS("正在回退中", "正在還原"), "\u2026\u2026</span>"));
rbing = $("#rbing");
$(".mw-rollback-link a").not(rbing).css({
color: "#aaa",
"text-decoration": "none"
});
mw.config.set("wgRollbacking", true);
summary = rollbackSummary ? "".concat(rollbackSummary, " //Rollback") : "//Rollback";
if (!uri.query.from) return [3, 7];
_a.label = 2;
case 2:
_a.trys.push([2, 4, 5, 6]);
return [4, api.post({
action: "rollback",
assertuser: mw.config.get("wgUserName"),
title: uri.query.title,
user: uri.query.from,
summary: summary,
token: uri.query.token,
format: "json"
})];
case 3:
_a.sent();
rbing.css("color", "green").html("\u6210\u529F\uFF01".concat(wgULS("将在", "將在"), "<span id=\"rbcount\">3</span>\u79D2").concat(wgULS("内刷新", "內重新整理")));
return [3, 6];
case 4:
e_1 = _a.sent();
errorText = e_1 instanceof Error ? "".concat(e_1, " ").concat(e_1.stack.split("\n")[1].trim()) : $.isPlainObject(e_1) ? JSON.stringify(e_1) : typeof e_1 === "string" && Reflect.has(possibleError, e_1) ? possibleError[e_1] : "".concat(e_1);
rbing.css("color", "red").html("".concat(wgULS("错误", "錯誤"), "\uFF1A").concat(errorText, "\u3002").concat(wgULS("将在", "將在"), "<span id=\"rbcount\">3</span>").concat(wgULS("秒内刷新", "秒內重新整理")));
return [3, 6];
case 5:
exit();
return [7];
case 6: return [3, 8];
case 7:
uri.query.summary = summary;
window.open(uri.toString(), "_self");
_a.label = 8;
case 8: return [2, false];
}
});
}); });
new Image().src = "https://img.moegirl.org.cn/common/d/d1/Windows_10_loading.gif";
});
/* </pre> */