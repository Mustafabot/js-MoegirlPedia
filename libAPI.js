/**
**  This module provides an edit/move/delete api
**  catching server-, connection-, and other errors
**  enqueueing large batches in order to avoid
**  flooding the API
**
**  Public interface begins at "mw.libs.commons.api"
**
**  Fires ``mw.hook('libapi.prompt').fire('open', 'what');``
**  and ``mw.hook('libapi.prompt').fire('close', 'what');``
**
**  @author
**    Rainer Rillke - 2012
**  @license
**    GPL v.3
**  @version
**    see below
**/

/* global jQuery, mediaWiki, Geo */
/* eslint one-var:0, vars-on-top:0, indent:0, no-underscore-dangle:0, no-unused-vars:0, key-spacing:0, no-multi-spaces:0, dot-notation:0,
valid-jsdoc:0, no-bitwise:1, curly:0, space-in-parens:0, computed-property-spacing:0, array-bracket-spacing:0 */
/* jshint curly:false */
(function ($, mw) {
    'use strict';
    
    if (!mw.libs.commons) mw.libs.commons = {};
    else if (mw.libs.commons.api) return;
    
    var apiURL = mw.util.wikiScript('api'),
        tokens = mw.user.tokens,
        slice = Array.prototype.slice, // arguments are not of type array so we can't just write arguments.slice
        $win = $(window),
        corsSupport = 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
        corsEnabled = $.support.cors,
        username = mw.config.get('wgUserName') || Geo.IP,
        doRequest, api, currentDate, pendingQueries = 0, queryQueue = [];
    
    if (!tokens.exists('deleteToken')) tokens.set('deleteToken', tokens.get('csrfToken'));
    
    function firstItem(o) { for (var i in o) if (o.hasOwnProperty(i)) return o[i]; }
    
    var msgs = {
        'api-captcha-text': 'Because you are either unregistered or your account is too new, you must enter a CAPTCHA for each page you edit when adding a URL. ' +
            'To avoid this, create an account (if you do not have one) and wait 4 days.',
        'api-captcha-title': 'Please enter the letters into the textbox and submit.',
        'api-captcha-ok': 'OK',
        'api-ratelimit-text': 'Some edits exceeded your rate limit of $1 edits per $2 seconds.' +
    ' Please let this tab open until this dialog disappeared or you got a positive response from the tool you are using.' +
    ' It will take approx. $3 seconds to complete this task.',
        'api-ratelimit-title': 'Ratelimit exceeded: Don\'t close this tab',
        'api-assertion-title': 'Logged out',
        'api-assertion-text': 'While you were apparently logged in when starting ' +
    'to contribute, you are now logged out. ' +
    'To protect your privacy, no further action has been run ' +
    'anonymously (which would reveal your IP address).\n\n' +
    '[[Special:UserLogin|Log in]] in a new tab in order to proceed!\n\n' +
    'Reload this page if you wish to abort the ongoing process, instead.\n\n',
        'api-notice-proceed-button': 'Proceed',
        'api-notice-self-reference': 'This message is brought to you by ' +
    '[[MediaWiki:Gadget-libAPI.js|Gadget-libAPI.js]].'
    };
    mw.messages.set(msgs);
    var getMessage = function (/* params*/) {
        var args = slice.call(arguments, 0);
        args[0] = 'api-' + args[0];
        args[args.length] = api.version;
        return mw.message.apply(this, args).parse();
    };
    
    // Counters, Timeouts & Statistics
    var pendingRequests = 0,
        totalEdits = 0,
        successfulEdits = 0,
    // failedEdits = 0,
        totalMoves = 0,
        successfulMoves = 0,
    // failedMoves = 0,
        totalDeletions = 0,
        successfulDeletions = 0,
    // failedDeletions = 0,
        currentRequestId = 0,
    // Ratelimit
        editRls = null,
        editRlExceeded = 0,
        editRlExceededTimeout = 0,
        editRlDlgInterval = 0,
        $editRlDlg = null,
        editRlRemaining = 0,
        apiRequestQueue = [];
    
    var getRatelimits = function (cb) {
        var doCb = function () {
            if ($.isFunction(cb)) cb(editRls);
        };
        if (editRls)
            return doCb();
    
        var defEditRatelimits = {
            hits: 8,
            seconds: 60
        };
    
        var gotResult = function (result) {
            try {
                var ui = result.query.userinfo;
    // Update user name (since we get this info for free)
                username = ui.name;
    // TODO: there are different types of limit, edit/move to specify!?
                if (ui.ratelimits) {
                    if (ui.ratelimits.edit)
                        editRls = firstItem(ui.ratelimits.edit);
                    else if (ui.ratelimits.move) // hacky fallback
                        editRls = firstItem(ui.ratelimits.move);
                    else // No limit?
                        editRls = {
                            hits: 0,
                            seconds: 0
                        };
                } else
                    editRls = defEditRatelimits;
            } catch (ex) {
                editRls = defEditRatelimits;
            }
            return doCb();
        };
    
        $.getJSON(apiURL, {
            format: 'json',
            action: 'query',
            meta: 'userinfo',
            uiprop: 'ratelimits'
        }, gotResult).fail(function () {
    // guess them
            editRls = defEditRatelimits;
            return doCb();
        });
    };
    
    var editedPage = function (title, comment, count, cb) {
        var foundIt = false;
        count = Math.min(count, 500);
        var gotResult = function (result) {
            if (!result || !result.query)
                return cb(-1, title);
    
            $.each(result.query.usercontribs, function (i, contrib) {
                if (contrib.comment === comment && contrib.title === title) {
                    cb(1, title);
                    foundIt = true;
                    return false;
                }
            });
            if (!foundIt) cb(0, title);
        };
        $.getJSON(apiURL, {
            format: 'json',
            action: 'query',
            list: 'usercontribs',
            ucuser: username,
            ucprop: 'title|comment',
            uclimit: count
        }, gotResult).fail(function () {
            cb(-1, title);
        });
    };
    
    var movedPage = function (from, summary, to, cb) {
        var foundIt = false;
        var gotResult = function (result) {
            if (!result || !result.query)
                return cb(-1, from);
    
            $.each(result.query.logevents, function (i, le) {
                if (le.comment === summary && le.move && le.move.new_title === to) {
                    cb(1, from);
                    foundIt = true;
                    return false;
                }
            });
            if (!foundIt) cb(0, from);
        };
        $.getJSON(apiURL, {
            format: 'json',
            action: 'query',
            list: 'logevents',
            letype: 'move',
            letitle: from,
            leuser: username,
            lelimit: 10
        }, gotResult).fail(function () {
            cb(-1, from);
        });
    };
    
    var deletedPage = function (title, summary, cb) {
        var foundIt = false;
        var gotResult = function (result) {
            if (!result || !result.query)
                return cb(-1, title);
    
            $.each(result.query.logevents, function (i, le) {
                if (le.comment === summary && le.action === 'delete') {
                    cb(1, title);
                    foundIt = true;
                    return false;
                }
            });
            if (!foundIt) cb(0, title);
        };
        $.getJSON(apiURL, {
            format: 'json',
            action: 'query',
            list: 'logevents',
            letype: 'delete',
            letitle: title,
            leuser: username,
            lelimit: 10
        }, gotResult).fail(function () {
            cb(-1, title);
        });
    };
    
    var refreshToken = function (which, cb) {
        var gotResult = function (result) {
            if (!result || !result.query) return cb();
            return cb(result.query.tokens.csrftoken);
        };
        $.getJSON(apiURL, {
            format: 'json',
            action: 'query',
            meta: 'tokens',
            type: 'csrf'
        }, gotResult).fail(function () {
            cb();
        });
    };
    
    /**
    * Does a mediaWiki-API call for action=edit|move|delete
    * Sophisticated method for a maximum of stability, convenience and reliability
    * Features include very smart error handling and even dialogs
    * asking the user for captchas or to wait if an edit-ratelimit was exceeded
    * are created
    *
    * @example see calls to this method
    * @param {Object} hash this will be passed to the data-member
    *        of the object that is passed to $.ajax;
    *        something like { action: edit, title: "FAQ", appendtext: "\n--- Vandalism!!!" }
    * @param {Function} cb Success-callback. The first argument supplied depends on the action.
    * @param {Function} errCb Error-callback.
    *        Arg 1 supplied is informational text; Arg 2 the result, if available;
    *        Arg 3 the hash you passed in
    * @param {number} retryCount For internal use only.
    * @private
    */
    
    doRequest = function (hash, cb, errCb, retryCount) {
        var requestArgs = slice.call(arguments, 0),
            tokenType,
            isEdit,
            isMove,
    // isUndelete,
            isDelete;
    // Just an internal requestId handler/ counter
        var reqId = currentRequestId;
        currentRequestId++;
    
        switch (hash.action) {
            case 'edit':
                isEdit = true;
                tokenType = 'csrfToken';
                break;
            case 'move':
                isMove = true;
                tokenType = 'csrfToken';
                break;
            case 'delete':
                isDelete = true;
                tokenType = 'deleteToken';
                break;
            default:
                throw new Error('Commons edit API is for changing content only. You did not set an appropriate action.');
        }
    
        hash.token = tokens.get(tokenType);
    
        if (!retryCount) {
            retryCount = 0;
            requestArgs[3] = retryCount;
            if (isEdit) totalEdits++;
            if (isMove) totalMoves++;
            if (isDelete) totalDeletions++;
        }
    
        if (api.config.maxSimultaneousReq > 0 && (pendingRequests >= api.config.maxSimultaneousReq)) {
            apiRequestQueue.push(requestArgs);
            return;
        }
    
        pendingRequests++;
        retryCount++;
        requestArgs[3] = retryCount;
    
    /**
    * Updates statistics about pending requests and starts
    * new requests from the queue when appropriate
    *
    * Should be always called immediately after a request failed or succeeded
    * We can't use jQuery's always handler because it is called after the
    * success/error callback returned
    */
        var always = function () {
            pendingRequests--;
            var i = Math.min(api.config.maxSimultaneousReq - pendingRequests, apiRequestQueue.length);
            for (;i > 0; i--) {
                var args = apiRequestQueue.shift();
                if (args[0].action === 'edit') totalEdits--;
                if (args[0].action === 'move') totalMoves--;
                if (args[0].action === 'delete') totalDeletions--;
                doRequest.apply(window, args);
            }
        };
    
    /**
    * Invoke doRequest again
    * @param {number} defaultTimeout Milliseconds to wait the first time
    * @param {bolean} dontMultiply Set to true to prevent that each time
    *        doRequest is re-called, the defaultTimeout is multiplied by the number of calles
    */
        var recallme = function (defaultTimeout, dontMultiply) {
            if (!dontMultiply) defaultTimeout = defaultTimeout * retryCount;
            setTimeout(function () {
                doRequest.apply(window, requestArgs);
            }, defaultTimeout);
        };
    
    /**
    * Heuristical test whether the tasks was done;
    * if not try it again, if it was, call the success handler
    * @param {Function} errHandler Callback in case the heuristic is unable to determine whether the tasks was done
    * @param {string} text The text to pass as first parameter to the errHandler
    */
        var smartRetry = function (errHandler, text) {
            if (isEdit) {
                editedPage(hash.title, hash.summary, Math.round((currentRequestId - reqId + 1) * 1.1), function (edited) {
                    switch (edited) {
                        case 1: successfulEdits++;
                            if ($.isFunction(cb)) cb({}, hash);
                            return;
                        case 0:
                            return recallme(500);
                        case -1: // Error!
                            return errHandler(text);
                    }
                });
            } else if (isMove) {
                movedPage(hash.from, hash.reason, hash.to, function (moved) {
                    switch (moved) {
                        case 1: successfulMoves++;
                            if ($.isFunction(cb)) cb({}, hash);
                            return;
                        case 0:
                            return recallme(500);
                        case -1: // Error!
                            return errHandler(text);
                    }
                });
            } else if (isDelete) {
                deletedPage(hash.title, hash.reason, function (deleted) {
                    switch (deleted) {
                        case 1: successfulDeletions++;
                            if ($.isFunction(cb)) cb({}, hash);
                            return;
                        case 0:
                            return recallme(500);
                        case -1: // Error!
                            return errHandler(text);
                    }
                });
            }
        };
    
    /**
    * Displays a notice and continues when the notice is dismissed
    * @param {string} title Message key for the notice's title
    * @param {string} content Message key for the notice's body
    * @param {string} type Notice identifier that is broadcasted through a hook
    */
        var displayNoticeAndContinue = function (title, content, type) {
            mw.hook('libapi.notice').fire('open', type);
    
            mw.loader.using(['jquery.ui'], function () {
                $('<div>')
                    .html(getMessage('notice-self-reference'))
                    .prepend($('<p>').html(getMessage(content)))
                    .dialog({
                        title: getMessage(title),
                        show: { effect: 'highlight', duration: 600 },
                        buttons: [{
                            text: getMessage('notice-proceed-button'),
                            click: function () {
                                $(this).dialog('close');
                            }
                        }],
                        close: function () {
                            $(this).remove();
                            recallme(5, true);
                            mw.hook('libapi.prompt').fire('close', type);
                        }
                    });
            });
        };
    
    /**
    * Displays a notice and continues when the notice is dismissed
    */
        var assertionFailed = function () {
            displayNoticeAndContinue(
                'assertion-title',
                'assertion-text',
                'assertion'
            );
        };
    
        hash.format = 'json';
        $.ajax({
            url: apiURL,
            cache: false,
            dataType: 'json',
            data: hash,
            type: 'POST',
            headers: api.config.headers,
            success: function (result, status, x) {
    // cache the current date and time if not done, yet
                if (!currentDate && x && x.getResponseHeader) setCurrentDate(x);
    
    // In case we have to solve a captcha - re-enqueue and prompt
                if (result && result.edit && result.edit.captcha) {
                    var captcha = result.edit.captcha,
                        $buttons,
                        $cDlg = $('<div>', { id: 'apiCaptchaDialog' });
    
                    $('<p>', {
                        text: getMessage('captcha-text')
                    })
                        .appendTo($cDlg);
    
                    var $img = $('<img>', {
                            id: 'apiCaptchaImg',
                            alt: 'captcha',
                            src: captcha.url
                        })
                            .appendTo($cDlg),
                        dlgW = Math.min($win.width(), Math.max(310, $img.width() + 30)),
                        $w = $('<input type="text" size="30"/>').appendTo($cDlg.append(' ')),
                        dlgButtons = {};
    
                    $img.on('load', function () {
                        $cDlg.dialog({
                            width: Math.min($win.width(), Math.max(310, $img.width() + 30))
                        });
                    });
                    $w.keyup(function (e) {
                        if (Number(e.which) === 13) $buttons.eq(0).click();
                    });
                    dlgButtons[getMessage('captcha-ok')] = function () {
                        $(this).dialog('close');
                    };
                    mw.loader.using(['jquery.ui'], function () {
                        $cDlg.dialog({
                            title: getMessage('captcha-title'),
                            buttons: dlgButtons,
                            show: { effect: 'highlight', duration: 600 },
                            width: dlgW,
                            close: function () {
                                $cDlg.remove();
                                hash.captchaid = captcha.id;
                                hash.captchaword = $w.val();
                                pendingRequests--;
                                recallme(50);
                                mw.hook('libapi.prompt').fire('close', 'captcha');
                            },
                            open: function () {
                                var $dlg = $(this).parent();
                                $buttons = $dlg.find('.ui-dialog-buttonpane button');
                                $buttons.eq(0).button({ icons: { primary: 'ui-icon-circle-check' } });
                                $w.focus();
                                mw.hook('libapi.prompt').fire('open', 'captcha');
                            }
                        });
                    });
                    return;
                }
    
    // In case we hit a rate limit, display a dialog
                if (result.error && result.error.code === 'ratelimited') {
                    getRatelimits(function (limits) {
                        editRlExceeded++;
                        clearTimeout(editRlExceededTimeout);
                        editRlExceededTimeout = setTimeout(function () {
                // Reset counter
                            editRlExceeded = 0;
                        }, (1000 * limits.seconds) + 5000);
    
            // How many times we hitted the ratelimit
                        var secondsToWait = (editRlRemaining = limits.seconds * (Math.floor(editRlExceeded / limits.hits) + 1));
    
                        if (!$editRlDlg) {
                            mw.hook('libapi.prompt').fire('open', 'ratelimit');
                            mw.loader.using(['jquery.ui'], function () {
                                $editRlDlg = $('<div>')
                                    .append($('<p>').text(
                                        getMessage('ratelimit-text', limits.hits, limits.seconds, editRlRemaining))
                                    )
                                    .dialog({
                                        title: getMessage('ratelimit-title'),
                                        close: function () {
                                            $editRlDlg.remove();
                                            $editRlDlg = null;
                                            clearInterval(editRlDlgInterval);
                                            mw.hook('libapi.prompt').fire('close', 'ratelimit');
                                        }
                                    });
    
                    // Set a timeout to keep the dialog up-to-date
                                editRlDlgInterval = setInterval(function () {
                                    $editRlDlg.find('p').text(getMessage('ratelimit-text', limits.hits, limits.seconds, editRlRemaining));
                        // If no time is remaining, close this dialog
                                    if (editRlRemaining < 0)
                                        $editRlDlg.dialog('close');
    
                                    editRlRemaining--;
                                }, 999);
                            });
                        }
    
                        pendingRequests--;
            // recallme takes ms
                        recallme(1000 * secondsToWait, true);
                    });
                    return;
                }
    
    // Call always first; jQuery complete-evt is called after that
                always();
    
                var doErrCB = function (text) {
                    var serverDateTime = '',
                        apiServer = '';
                    if (x && x.getResponseHeader) serverDateTime = ' <i>at ' + x.getResponseHeader('date') + '</i>';
                    if (result && result.servedby) apiServer = ' <u>served by ' + result.servedby + '</u>';
                    if ($.isFunction(errCb)) {
                        return errCb(text + serverDateTime + apiServer, result, hash);
                    }
                // else TODO: ignore error or create a report page ?
                };
    
                if (!result) return smartRetry(doErrCB, 'API returned empty result.');
    
                if (result.error) {
        // In case we get the mysterious 231 unknown error, just try again
                    if (result.error.info.indexOf('231') !== -1 && retryCount < 20) return recallme(500);
    
        // In case we get edit conflicts
                    if (result.error.code === 'editconflict' && (hash.prependtext || hash.appendtext) && retryCount < 20) return recallme(500);
    
        // If the edit-conflict is about the full text, we could re-obtain the text and perform the opteration again
        // ...
        // If the edit-token is expired or corrupt
                    if (!!({ notoken: 1, badtoken: 1 })[result.error.code] && retryCount < 20) {
                        return refreshToken(hash.action, function (token) {
                            if (token) {
                                tokens.set(tokenType, token);
                                recallme(0);
                            } else {
                                return doErrCB('notoken - API request failed (' + result.error.code + '): ' + result.error.info);
                            }
                        });
                    }
            // If the user is suddenly reported to be logged-out
                    if (result.error.code === 'assertuserfailed') return assertionFailed();
                    if (isMove && ($.inArray(result.error.code, ['articleexists', 'unknownerror']) > -1) && retryCount < 4)
                        return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
    
                    if (isDelete) {
                        if (result.error.code === 'cantdelete' && retryCount < 3) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
            // If the title does not exist, we can't do anything but it's possible that we deleted them ourselves
                        if (result.error.code === 'missingtitle' && retryCount < 2) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
            // Catch https://bugzilla.wikimedia.org/show_bug.cgi?id=46086
                        if (result.error.code === 'internal_api_error_DBQueryError' && retryCount < 5) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
                    }
            // Temporarily to catch errors of https://bugzilla.wikimedia.org/show_bug.cgi?id=37225#c65
                    if (isEdit && result.error.code === 'internal_api_error_MWException' && retryCount < 3) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
    
                    var errText = 'API request failed (' + result.error.code + '): ' + result.error.info;
                    if (result.error.code === 'hookaborted')
                        errText += '\nHelp: Often, AbuseFilter is responsible for this kind of error. Please try another file name or text, ensure you are not blocked and ask at the Village Pump or your local Community Forum.';
    
                    if (result.error.code === 'protectedpage' && hash.title)
                        errText += '\nHelp: You can request an edit to \'' + hash.title + '\' at COM:AN (the Administrators’ noticeboard).';
    
                    if (result.error.code === 'missingtitle' && hash.title)
                        errText += '\nHelp: \'' + hash.title + '\' was possibly deleted or moved.';
    
                    return doErrCB(errText);
                }
                if (result.edit && result.edit.spamblacklist)
                    return doErrCB('The edit failed because ' + result.edit.spamblacklist + ' is on the Spam Blacklist');
    
                if (isEdit && retryCount < 10 && !result.edit || (result.edit && (!result.edit.result || result.edit.result !== 'Success')))
                    return smartRetry(doErrCB, 'Edit did not succeed.');
    
                if (isMove && retryCount < 5 && (!result.move || !result.move.to))
                    return smartRetry(doErrCB, 'Move did not succeed.');
    
                if (isDelete && retryCount < 2 && (!result['delete']))
                    return smartRetry(doErrCB, 'Deletion did not succeed.');
    
                if (isEdit)
                    successfulEdits++;
                else if (isMove)
                    successfulMoves++;
                else if (isDelete)
                    successfulDeletions++;
    
                if ($.isFunction(cb)) cb(result, hash);
            },
            error: function (x, status, error) {
    // Call always first; jQuery complete-evt is called after that
                always();
    
                var doErrCB = function () {
                    if ($.isFunction(errCb)) {
                        return errCb('Server status: ' + x.status + ' - Error:' + error, null, hash);
                    }
                    // else TODO: ignore error or create a report page ?
                };
    
    // Catch nasty server errors and retry; 50x are timeouts and similar, 200 is a JSON parser error so the server sent something terribly wrong
    // 12152 (ERROR_HTTP_INVALID_SERVER_RESPONSE), 12002 (ERROR_INTERNET_TIMEOUT), 408 (Request timed out) are common IE/WinInet errors
    // http://stackoverflow.com/questions/3731420/why-does-ie-issue-random-xhr-408-12152-responses-using-jquery-post
                if (x && x.status && ((x.status > 499 && x.status < 600) || ($.inArray(x.status, [12152, 12002, 408, 200, 0]) > -1)) && retryCount < 20)
                    return smartRetry(doErrCB);
    
                doErrCB();
            }
        });
    };
    
    /**
    * Stores the (server) date from an XHR into a local variable
    * This is useful because sometimes computers
    * with wrong date/time settings are used and we have to rely
    * on a correct date (e.g. identifying the right sub-page)
    * use mw.libs.commons.api.getCurrentDate() for getting
    * the stored date.
    * @param {jqXHR} x a jqXHR object you obtained from
    *        the supplied success/error callbacks to $.ajax
    *
    */
    function setCurrentDate(x) {
        var shortNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        try {
            var dat = x.getResponseHeader('date').match(/\D+(\d\d) (\D{3}) (\d{4}) (\d\d):(\d\d):(\d\d)/);
            currentDate = new Date(dat[3], $.inArray(dat[2], shortNames), dat[1], dat[4], dat[5], dat[6]);
    // The date is initialized/ constructed in local time but the server returned GMT-Time, so remove the offset
    // According to w3c under- and overflow (<0, >60) are handled by the date-object itself
            currentDate.setMinutes(currentDate.getMinutes() - currentDate.getTimezoneOffset());
        } catch (ex) {
            currentDate = new Date();
        }
    }
    
    /**
     * ALWAYS bump the revision number
     *
     * mw.libs.commons.api.config - you are free to adjust the config according to your needs
     *  - maxSimultaneousReq:   maximum number of requests to send to the API simultaneously
     *                          the API-etiquette asks you only sending one requests at once
     *  - parserDelay:          Default delay in ms to wait before sending a request to the parser
     *  - parserDelayIncrement: Time in ms to add to the parserDelay each time a parse-request is sent
     *                          This is preventing sending a request for each letter for slow-typing people
     *  - parserMaxTimeout:     Maximum delay in ms to wait before sending a request to the parser
     *
     *
     * The methods editPage, movePage and deletePage can be invoked with a single object or with
     * multiple arguments:
     * @example
         mw.libs.commons.api.editPage(mySuccessCallback, myErrorCallback, 'appendtext', "Commons:FAQ", "\n -- Vandalism", "edit summary");
     * is the same as:
     * @example
    mw.libs.commons.api.editPage({
        cb: mySuccessCallback,
        errCb: myErrorCallback,
        editType: 'appendtext',
        title: "Commons:FAQ",
        text: "\n -- Vandalism",
        summary: "edit summary"
    });
    *
     *
     * For a complete list of available arguments, refer accordingly to editArgs, moveArgs, deleteArgs
     * mw.libs.commons.api.editPage - replace page text, prepends or appends text
     * mw.libs.commons.api.movePage - move a page from a source to a destination
     * mw.libs.commons.api.deletePage - delete a page with a given reason
     *
     * mw.libs.commons.api.query - run a query to the MediaWiki API
     * @example
    mw.libs.commons.api.query({
        action: 'query',
        prop: 'info',
        titles: 'Commons:FAQ'
    }, {
        cb: function (result, paramsPassedIn) {
            // ...
        },
        errCb: function (errText, paramsPassedIn, result) {
            // ...
        }
    });
    *
     * Auto-Query
     * Ever experienced ['query-continue']? Hard to deal with?
     * Not with libAPI! libAPI's $autoQuery will automatically
     * continue the query until all elements were returned,
     * or a certain number of cycles (quota) is reached.
     *
     * @example
        mw.loader.using('ext.gadget.libAPI', function() {
            mw.libs.commons.api.$autoQuery({ action: 'sitematrix' })
                    .progress(function(result, params) {
                        console.log('handle result: ', result)
                    })
                    .done(function(fullResult) {
                        console.log('fullResult may be wrong, in case Arrays are involved. Proceed with the application’s logic after all parts of the list were loaded')
                    });
        });
     *
    */
    
    api = mw.libs.commons.api = {
        version: '0.3.14.1',
        config: {
            maxSimultaneousReq: 1,
            parserDelay: 900,
            parserDelayIncrement: 70,
            parserMaxTimeout: 3500,
            queryMaxSimultaneousReq: 5,
            headers: { 'Api-User-Agent': 'libAPI' },
            preferencesKey: 'com-libapi-prefs'
        },
        preferences: {
            edit: {
                summary: {
                    prepend: ''
                },
                flagAsBotEdit: false
            }
        },
        errors: {
            badInput: { code: 1, description: 'Invalid arguments: Neither a hash nor a string.' },
            badType: { code: 2, description: 'Invalid arguments: Type mismatch for %ARG%. Type is %CT%. Required %RT%.' },
            notSet: { code: 3, description: 'Missing argument: %ARG% Is required!' }
        },
        mergePreferences: function () {
            var opt = mw.user.options.get(api.config.preferencesKey);
            $.extend(true, api.preferences, opt);
        },
        applyPreferences: function (action, hash) {
            switch (action) {
                case 'edit':
                    var prefs = api.preferences.edit;
                    hash.summary = prefs.summary.prepend + hash.summary;
                    if (prefs.flagAsBotEdit) hash.bot = 1;
                    break;
                case 'delete':
                case 'move':
                    break;
            }
        },
        createHash: function (args, possibleArgs) {
            var query = {
                format: 'json'
            };
    
            var arg0 = args[0],
                arg0Type = typeof arg0,
                argCurrent,
                argCurrentType;
    
            var addArg = function (a, def, argCurrent) {
                argCurrentType = typeof argCurrent;
    
                if (def.required && argCurrentType !== def.type) throw new Error(api.errors.badType.description.replace('%ARG%', a).replace('%CT%', argCurrentType).replace('%RT%', def.type));
                switch (argCurrentType) {
                    case 'undefined':
                        if (def.required)
                            throw new Error(api.errors.notSet.description.replace('%ARG%', a));
    
                        return;
                    case 'function':
                        return;
                    case 'boolean':
            // The API does not really want boolean values
                        if (argCurrent) {
                            argCurrent = 1;
                        } else {
                            if (def.ifFalse)
                                a = def.ifFalse;
                            else
                                return;
                        }
                        break;
                }
    
                if (def.noadd) return;
                query[a] = argCurrent;
            };
    
            switch (arg0Type) {
                case 'function':
                    $.each(possibleArgs, function (a, def) {
                        argCurrent = args[def.id];
                        return addArg(a, def, argCurrent);
                    });
                    break;
                case 'object':
                    $.each(possibleArgs, function (a, def) {
                        argCurrent = arg0[a];
                        return addArg(a, def, argCurrent);
                    });
                    break;
                default:
                    throw new Error(api.errors.badInput.description);
        // break;
            }
            return query;
        },
        getArg: function (args, possibleArgs, argDesired) {
            return args[0][argDesired] || args[possibleArgs[argDesired].id];
        },
        $DeferredFromArgs: function (argsIn, op) {
            var args = slice.call(argsIn, 0),
                arg0 = args[0],
                arg0Type = typeof arg0,
                $def = $.Deferred(),
                $cbs = $.Callbacks().add($.proxy($def.notify, $def)).add($.proxy($def.resolve, $def)),
                __ok = $.proxy($cbs.fire, $cbs),
                __err = $.proxy($def.reject, $def);
    
            switch (arg0Type) {
                case 'function':
                    args[0] = __ok;
                    args[1] = __err;
                    break;
                case 'string':
                    args.unshift(__ok, __err);
                    break;
                case 'object':
                    args[0].cb = __ok;
                    args[0].errCb = __err;
                    break;
            }
            api[op].apply(api, args);
            return $def;
        },
        checkAssertions: function (hash, cb) {
            if (hash.assert)
                return cb(hash);
    
            mw.loader.using(['mediawiki.user'], function () {
                if (!mw.user.isAnon())
                    hash.assert = 'user';
    
                cb(hash);
            }, function () {
                cb(hash);
            });
        },
        abortPendingRequests: function() {
            apiRequestQueue.length = 0; // truncate / empty / clear the queue
        },
        editArgs: {
            cb:             { id: 0,  type: 'function' },
            errCb:          { id: 1,  type: 'function' },
            editType:       { id: 2,  type: 'string', noadd: true },
            title:          { id: 3,  type: 'string', required: true },
            text:           { id: 4,  type: 'string', required: true, noadd: true },
            summary:        { id: 5,  type: 'string' },
            minor:          { id: 6,  type: 'boolean', ifFalse: 'notminor' },
            basetimestamp:  { id: 7,  type: 'string' },
            starttimestamp: { id: 8,  type: 'string' },
            recreate:       { id: 9,  type: 'boolean' },
            createonly:     { id: 10, type: 'boolean' },
            nocreate:       { id: 11, type: 'boolean' },
            redirect:       { id: 12, type: 'boolean' },
            md5:            { id: 13, type: 'string' },
            watchlist:      { id: 14, type: 'string' },
            bot:            { id: 15, type: 'boolean' },
            assert:         { id: 16, type: 'string' },
            tags:           { id: 17, type: 'string' },
            section:        { id: 18, type: 'string' }
        },
        editPage: function (/* paramArray*/) {
            var hash = api.createHash(arguments, api.editArgs),
                args = arguments;
            hash.action = 'edit';
    
            var editType = api.getArg(args, api.editArgs, 'editType');
            hash[editType] = api.getArg(args, api.editArgs, 'text');
            if (hash.redirect && editType === 'text') {
                delete hash.redirect;
                mw.log.warn('Dropped redirect parameter from action=edit because editing full text.');
            }
    
            api.mergePreferences();
            api.applyPreferences('edit', hash);
    
            api.checkAssertions(hash, function () {
                doRequest(hash, api.getArg(args, api.editArgs, 'cb'), api.getArg(args, api.editArgs, 'errCb'));
            });
        },
        $editPage: function (/* args*/) {
            return api.$DeferredFromArgs(arguments, 'editPage');
        },
        moveArgs: {
            cb:             { id: 0,  type: 'function' },
            errCb:          { id: 1,  type: 'function' },
            from:           { id: 2,  type: 'string', required: true },
            to:             { id: 3,  type: 'string', required: true },
            reason:         { id: 4,  type: 'string' },
            movetalk:       { id: 5,  type: 'boolean' },
            movesubpages:   { id: 6,  type: 'boolean' },
            noredirect:     { id: 7,  type: 'boolean' },
            ignorewarnings: { id: 8,  type: 'boolean' },
            watchlist:      { id: 9,  type: 'string' },
            assert:         { id: 10, type: 'string' },
            tags:           { id: 11, type: 'string' }
        },
        movePage: function (/* paramArray*/) {
            var hash = api.createHash(arguments, api.moveArgs),
                args = arguments;
            hash.action = 'move';
    
            api.checkAssertions(hash, function () {
                doRequest(hash, api.getArg(args, api.moveArgs, 'cb'), api.getArg(args, api.moveArgs, 'errCb'));
            });
        },
        $movePage: function (/* args*/) {
            return api.$DeferredFromArgs(arguments, 'movePage');
        },
        deleteArgs: {
            cb:        { id: 0,  type: 'function' },
            errCb:     { id: 1,  type: 'function' },
            title:     { id: 2,  type: 'string', required: true },
            reason:    { id: 3,  type: 'string', required: true },
            watchlist: { id: 4,  type: 'string' },
            oldimage:  { id: 5,  type: 'string' },
            assert:    { id: 6,  type: 'string' },
            tags:      { id: 7,  type: 'string' }
        },
        deletePage: function (/* paramArray*/) {
            var hash = api.createHash(arguments, api.deleteArgs),
                args = arguments;
            hash.action = 'delete';
    
            api.checkAssertions(hash, function () {
                doRequest(hash, api.getArg(args, api.deleteArgs, 'cb'), api.getArg(args, api.deleteArgs, 'errCb'));
            });
        },
        $deletePage: function (/* args*/) {
            return api.$DeferredFromArgs(arguments, 'deletePage');
        },
        $changeText: function (titleOrID, textChangeCallback, section) {
            var $def = $.Deferred(),
                t = typeof titleOrID === 'string' ? 'title' : 'pageid',
                q = {
                    action: 'query',
                    curtimestamp: 1,
                    prop: 'revisions|info',
                    meta: 'tokens',
                    rvprop: 'content|timestamp',
                    rvslots: 'main'
                };
    
            q[t + 's'] = titleOrID;
            if (section) q.rvsection = section;
            api.query(q, undefined, function (r) {
                try {
                    var pg = firstItem(r.query.pages),
                        rv = pg.revisions[0],
                        tns = textChangeCallback(rv.slots.main['*']),
                        e = {
                            editType: 'text',
                            basetimestamp: rv.timestamp,
                            starttimestamp: r.curtimestamp,
                            cb: $.proxy($def.resolve, $def),
                            errCb: $.proxy($def.reject, $def)
                        };
    
                    e = $.extend({}, tns, e);
                    if (section) e.section = section;
                    e[t] = titleOrID;
                    if (r.query.tokens)
                        mw.user.tokens.set('csrfToken', r.query.tokens.csrftoken);
                    api.editPage(e);
                } catch (ex) {
                    $def.reject(ex);
                }
            }, function (r) {
                $def.reject(r);
            });
    
            return $def;
        },
        query: function (params, specs, callback, errCb, retryCount) {
            if (pendingQueries >= api.config.queryMaxSimultaneousReq) {
    // see me later
                return queryQueue.push(slice.call(arguments, 0));
            }
            var always = function () {
                pendingQueries--;
                var i = Math.min(api.config.queryMaxSimultaneousReq - pendingQueries, queryQueue.length);
                for (; i > 0; i--) {
                    var args = queryQueue.shift();
                    api.query.apply(api, args);
                }
            };
            var newParams = {
                format: 'json'
            };
    
            var url, method, cache, withCredentials;
            if (typeof specs === 'object') {
                url = specs.url;
                method = specs.method;
                cache = specs.cache;
                withCredentials = 'withCredentials' in specs ?
                    specs.withCredentials : (url && corsSupport);
                callback = callback || specs.callback || specs.cb;
                errCb = errCb || specs.errCallback || specs.errCb;
            }
    
            if (!retryCount) retryCount = 0;
            retryCount++;
            if ($.inArray(params.action, ['sitematrix', 'query', 'userdailycontribs', 'titleblacklist', 'parse']) === -1)
                throw new Error('api.query is for queries only. For editing use the stable Commons edit-api.');
    // At least let's try to send the format first
    // If the POST-request is cut off, we get "invalid token" or other errors
            $.extend(newParams, params);
    
            var datatype = 'json',
                xhrFields = {};
            if (url) {
                if (corsSupport) {
                    $.support.cors = true;
                    newParams.origin = document.location.protocol + '//' + document.location.hostname;
                    if (withCredentials)
                        xhrFields.withCredentials = true;
    
                } else {
                    datatype = 'jsonp';
                }
            }
            url = url || apiURL;
            method = method || 'GET';
            if (typeof cache !== 'boolean') cache = true;
    
            var retry = function (timeout, errText) {
                if (retryCount > 10) {
                    if (!$.isFunction(errCb)) return;
                    return errCb(errText, params);
                } else {
                    return setTimeout(function () {
                        api.query(params, specs, callback, errCb, retryCount);
                    }, timeout * retryCount);
                }
            };
    
            pendingQueries++;
            var jqXHR = $.ajax({
                url: url,
                cache: cache,
                dataType: datatype,
                data: newParams,
                type: method,
                xhrFields: xhrFields,
                success: function (result, status, x) {
                    always();
                    if (!currentDate && x && x.getResponseHeader)
                        setCurrentDate(x);
                    if (!result)
                        return retry(500, 'Received empty API response:\n' + x.responseText);
        // In case we get the mysterious 231 unknown error, just try again
                    if (result.error) {
                        if (result.error.info.indexOf('231') !== -1)
                            return retry(500, 'mysterious 231 unknown error');
                        if (!$.isFunction(errCb))
                            return;
                        return errCb('API request failed (' + result.error.code + '): ' + result.error.info, params, result);
                    }
                    callback(result, params);
                },
                error: function (x, status, error) {
                    always();
                    return retry(1500, 'API request returned code ' + x.status + ' ' + status + '. Error code is ' + error);
                }
            });
            $.support.cors = corsEnabled;
            return jqXHR;
        },
        getRunningQueryCount: function () {
            return pendingQueries;
        },
    // Though the query-method returns a $.Deferred, it is not recommended to use it because the operation may have failed despite status 200 OK
    // Instead use this wrapper-method or call api.query directly supplying callback arguments
        $query: function (query, specs) {
            var $def = $.Deferred();
            api.query(query, specs, function (/* p*/) {
                $def.resolve.apply($def, slice.call(arguments, 0));
            }, function (/* p*/) {
                $def.reject.apply($def, slice.call(arguments, 0));
            });
            return $def;
        },
        $continueQuery: function (query, result, specs) {
            var qc = result['query-continue'],
                oldProp = query.prop,
                oldList = query.list,
                props = [],
                lists = [];
    
            if (qc) {
    // support old-style continuation
                $.each(qc, function (k, v) {
                    if (oldProp && oldProp.indexOf(k) > -1)
                        props.push(k);
    
                    if (oldList && oldList.indexOf(k) > -1)
                        lists.push(k);
    
                    $.extend(query, v);
                });
                if (props.length)
                    query.prop = props.join('|');
                else
                    delete query.prop;
    
                if (lists.length)
                    query.list = lists.join('|');
                else
                    delete query.list;
    
            } else if (result['continue']) {
    // as well as the new style
                $.extend(query, result['continue']);
            } else {
                return null;
            }
    
            return api.$query(query, specs);
        },
    // Returns a jQuery-Deferred-object
    // you can kill the loop by setting the kill property of the returned deferred object to true
        $autoQuery: function (params, specs, maxcycles) {
            if (!maxcycles) maxcycles = 10;
    
            var $def = $.Deferred(),
                $mergedResult = {},
                _onReady = function () {
                    $def.resolve($mergedResult);
                },
                _onFail = function () {
                    $def.reject.apply($def, slice.call(arguments, 0));
                },
                _onStep = function (result, query) {
                    $def.notify.apply($def, slice.call(arguments, 0));
                    $.extend(true, $mergedResult, result);
    
                    maxcycles--;
                    if (maxcycles <= 0) return _onReady();
                    if ($def.kill) return _onReady();
    
                    var $defStep = api.$continueQuery(query, result, specs);
                    if (!$defStep) return _onReady();
                    $defStep.done(_onStep).fail(_onFail);
                };
    
            api.$query(params, specs)
                .done(_onStep)
                .fail(_onFail);
    
            return $def;
        },
    
    // This should be better an object - or not?
    // There is no real need for more than one parser xhr running at one time
    // "immediate" allows skipping smartParse
    // smartParse only sends requests to the server if required and
    // discards obsolete requests
    // The ideal choice for direct binding to text inputs for a live-preview
        parse: function (text, lang, title, cb, immediate) {
            var query = {
                format: 'json',
                action: 'parse',
                prop: 'text',
                pst: true,
                text: text
            };
            if (lang) query.uselang = lang;
            if (title) query.title = title;
            var gotJSON = function (r) {
                api.config.parserDelay += api.config.parserDelayIncrement;
                try {
                    cb(r.parse.text['*']);
                } catch (ex) {
                    cb('');
                }
            };
            var doParse = function () {
                if (api.parserjqXHR && !immediate) api.parserjqXHR.abort();
                if (!text || !/(?:<|\/\/|\[|'|\{|~~)/.test(text))
                    return cb('<p>' + (text || '') + '</p>');
    
                if (immediate) {
                    var parserjqXHR = $.getJSON(apiURL, query, gotJSON);
                    parserjqXHR.error = gotJSON;
                } else {
                    api.parserjqXHR = $.getJSON(apiURL, query, gotJSON);
                    api.parserjqXHR.error = gotJSON;
                }
            };
            if (immediate) {
                doParse();
            } else {
                if (this.parserTimeout) clearTimeout(this.parserTimeout);
                this.parserTimeout = setTimeout(doParse, Math.min(this.config.parserDelay, this.config.parserMaxTimeout));
            }
    
        },
        getCurrentDate: function () {
            return currentDate || new Date();
        }
    };
    }(jQuery, mediaWiki));/**
**  This module provides an edit/move/delete api
**  catching server-, connection-, and other errors
**  enqueueing large batches in order to avoid
**  flooding the API
**
**  Public interface begins at "mw.libs.commons.api"
**
**  Fires ``mw.hook('libapi.prompt').fire('open', 'what');``
**  and ``mw.hook('libapi.prompt').fire('close', 'what');``
**
**  @author
**    Rainer Rillke - 2012
**  @license
**    GPL v.3
**  @version
**    see below
**/

/* global jQuery, mediaWiki, Geo */
/* eslint one-var:0, vars-on-top:0, indent:0, no-underscore-dangle:0, no-unused-vars:0, key-spacing:0, no-multi-spaces:0, dot-notation:0,
valid-jsdoc:0, no-bitwise:1, curly:0, space-in-parens:0, computed-property-spacing:0, array-bracket-spacing:0 */
/* jshint curly:false */
(function ($, mw) {
'use strict';

if (!mw.libs.commons) mw.libs.commons = {};
else if (mw.libs.commons.api) return;

var apiURL = mw.util.wikiScript('api'),
	tokens = mw.user.tokens,
	slice = Array.prototype.slice, // arguments are not of type array so we can't just write arguments.slice
	$win = $(window),
	corsSupport = 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
	corsEnabled = $.support.cors,
	username = mw.config.get('wgUserName') || Geo.IP,
	doRequest, api, currentDate, pendingQueries = 0, queryQueue = [];

if (!tokens.exists('deleteToken')) tokens.set('deleteToken', tokens.get('csrfToken'));

function firstItem(o) { for (var i in o) if (o.hasOwnProperty(i)) return o[i]; }

var msgs = {
	'api-captcha-text': 'Because you are either unregistered or your account is too new, you must enter a CAPTCHA for each page you edit when adding a URL. ' +
		'To avoid this, create an account (if you do not have one) and wait 4 days.',
	'api-captcha-title': 'Please enter the letters into the textbox and submit.',
	'api-captcha-ok': 'OK',
	'api-ratelimit-text': 'Some edits exceeded your rate limit of $1 edits per $2 seconds.' +
' Please let this tab open until this dialog disappeared or you got a positive response from the tool you are using.' +
' It will take approx. $3 seconds to complete this task.',
	'api-ratelimit-title': 'Ratelimit exceeded: Don\'t close this tab',
	'api-assertion-title': 'Logged out',
	'api-assertion-text': 'While you were apparently logged in when starting ' +
'to contribute, you are now logged out. ' +
'To protect your privacy, no further action has been run ' +
'anonymously (which would reveal your IP address).\n\n' +
'[[Special:UserLogin|Log in]] in a new tab in order to proceed!\n\n' +
'Reload this page if you wish to abort the ongoing process, instead.\n\n',
	'api-notice-proceed-button': 'Proceed',
	'api-notice-self-reference': 'This message is brought to you by ' +
'[[MediaWiki:Gadget-libAPI.js|Gadget-libAPI.js]].'
};
mw.messages.set(msgs);
var getMessage = function (/* params*/) {
	var args = slice.call(arguments, 0);
	args[0] = 'api-' + args[0];
	args[args.length] = api.version;
	return mw.message.apply(this, args).parse();
};

// Counters, Timeouts & Statistics
var pendingRequests = 0,
	totalEdits = 0,
	successfulEdits = 0,
// failedEdits = 0,
	totalMoves = 0,
	successfulMoves = 0,
// failedMoves = 0,
	totalDeletions = 0,
	successfulDeletions = 0,
// failedDeletions = 0,
	currentRequestId = 0,
// Ratelimit
	editRls = null,
	editRlExceeded = 0,
	editRlExceededTimeout = 0,
	editRlDlgInterval = 0,
	$editRlDlg = null,
	editRlRemaining = 0,
	apiRequestQueue = [];

var getRatelimits = function (cb) {
	var doCb = function () {
		if ($.isFunction(cb)) cb(editRls);
	};
	if (editRls)
		return doCb();

	var defEditRatelimits = {
		hits: 8,
		seconds: 60
	};

	var gotResult = function (result) {
		try {
			var ui = result.query.userinfo;
// Update user name (since we get this info for free)
			username = ui.name;
// TODO: there are different types of limit, edit/move to specify!?
			if (ui.ratelimits) {
				if (ui.ratelimits.edit)
					editRls = firstItem(ui.ratelimits.edit);
				else if (ui.ratelimits.move) // hacky fallback
					editRls = firstItem(ui.ratelimits.move);
				else // No limit?
					editRls = {
						hits: 0,
						seconds: 0
					};
			} else
				editRls = defEditRatelimits;
		} catch (ex) {
			editRls = defEditRatelimits;
		}
		return doCb();
	};

	$.getJSON(apiURL, {
		format: 'json',
		action: 'query',
		meta: 'userinfo',
		uiprop: 'ratelimits'
	}, gotResult).fail(function () {
// guess them
		editRls = defEditRatelimits;
		return doCb();
	});
};

var editedPage = function (title, comment, count, cb) {
	var foundIt = false;
	count = Math.min(count, 500);
	var gotResult = function (result) {
		if (!result || !result.query)
			return cb(-1, title);

		$.each(result.query.usercontribs, function (i, contrib) {
			if (contrib.comment === comment && contrib.title === title) {
				cb(1, title);
				foundIt = true;
				return false;
			}
		});
		if (!foundIt) cb(0, title);
	};
	$.getJSON(apiURL, {
		format: 'json',
		action: 'query',
		list: 'usercontribs',
		ucuser: username,
		ucprop: 'title|comment',
		uclimit: count
	}, gotResult).fail(function () {
		cb(-1, title);
	});
};

var movedPage = function (from, summary, to, cb) {
	var foundIt = false;
	var gotResult = function (result) {
		if (!result || !result.query)
			return cb(-1, from);

		$.each(result.query.logevents, function (i, le) {
			if (le.comment === summary && le.move && le.move.new_title === to) {
				cb(1, from);
				foundIt = true;
				return false;
			}
		});
		if (!foundIt) cb(0, from);
	};
	$.getJSON(apiURL, {
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'move',
		letitle: from,
		leuser: username,
		lelimit: 10
	}, gotResult).fail(function () {
		cb(-1, from);
	});
};

var deletedPage = function (title, summary, cb) {
	var foundIt = false;
	var gotResult = function (result) {
		if (!result || !result.query)
			return cb(-1, title);

		$.each(result.query.logevents, function (i, le) {
			if (le.comment === summary && le.action === 'delete') {
				cb(1, title);
				foundIt = true;
				return false;
			}
		});
		if (!foundIt) cb(0, title);
	};
	$.getJSON(apiURL, {
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'delete',
		letitle: title,
		leuser: username,
		lelimit: 10
	}, gotResult).fail(function () {
		cb(-1, title);
	});
};

var refreshToken = function (which, cb) {
	var gotResult = function (result) {
		if (!result || !result.query) return cb();
		return cb(result.query.tokens.csrftoken);
	};
	$.getJSON(apiURL, {
		format: 'json',
		action: 'query',
		meta: 'tokens',
		type: 'csrf'
	}, gotResult).fail(function () {
		cb();
	});
};

/**
* Does a mediaWiki-API call for action=edit|move|delete
* Sophisticated method for a maximum of stability, convenience and reliability
* Features include very smart error handling and even dialogs
* asking the user for captchas or to wait if an edit-ratelimit was exceeded
* are created
*
* @example see calls to this method
* @param {Object} hash this will be passed to the data-member
*        of the object that is passed to $.ajax;
*        something like { action: edit, title: "FAQ", appendtext: "\n--- Vandalism!!!" }
* @param {Function} cb Success-callback. The first argument supplied depends on the action.
* @param {Function} errCb Error-callback.
*        Arg 1 supplied is informational text; Arg 2 the result, if available;
*        Arg 3 the hash you passed in
* @param {number} retryCount For internal use only.
* @private
*/

doRequest = function (hash, cb, errCb, retryCount) {
	var requestArgs = slice.call(arguments, 0),
		tokenType,
		isEdit,
		isMove,
// isUndelete,
		isDelete;
// Just an internal requestId handler/ counter
	var reqId = currentRequestId;
	currentRequestId++;

	switch (hash.action) {
		case 'edit':
			isEdit = true;
			tokenType = 'csrfToken';
			break;
		case 'move':
			isMove = true;
			tokenType = 'csrfToken';
			break;
		case 'delete':
			isDelete = true;
			tokenType = 'deleteToken';
			break;
		default:
			throw new Error('Commons edit API is for changing content only. You did not set an appropriate action.');
	}

	hash.token = tokens.get(tokenType);

	if (!retryCount) {
		retryCount = 0;
		requestArgs[3] = retryCount;
		if (isEdit) totalEdits++;
		if (isMove) totalMoves++;
		if (isDelete) totalDeletions++;
	}

	if (api.config.maxSimultaneousReq > 0 && (pendingRequests >= api.config.maxSimultaneousReq)) {
		apiRequestQueue.push(requestArgs);
		return;
	}

	pendingRequests++;
	retryCount++;
	requestArgs[3] = retryCount;

/**
* Updates statistics about pending requests and starts
* new requests from the queue when appropriate
*
* Should be always called immediately after a request failed or succeeded
* We can't use jQuery's always handler because it is called after the
* success/error callback returned
*/
	var always = function () {
		pendingRequests--;
		var i = Math.min(api.config.maxSimultaneousReq - pendingRequests, apiRequestQueue.length);
		for (;i > 0; i--) {
			var args = apiRequestQueue.shift();
			if (args[0].action === 'edit') totalEdits--;
			if (args[0].action === 'move') totalMoves--;
			if (args[0].action === 'delete') totalDeletions--;
			doRequest.apply(window, args);
		}
	};

/**
* Invoke doRequest again
* @param {number} defaultTimeout Milliseconds to wait the first time
* @param {bolean} dontMultiply Set to true to prevent that each time
*        doRequest is re-called, the defaultTimeout is multiplied by the number of calles
*/
	var recallme = function (defaultTimeout, dontMultiply) {
		if (!dontMultiply) defaultTimeout = defaultTimeout * retryCount;
		setTimeout(function () {
			doRequest.apply(window, requestArgs);
		}, defaultTimeout);
	};

/**
* Heuristical test whether the tasks was done;
* if not try it again, if it was, call the success handler
* @param {Function} errHandler Callback in case the heuristic is unable to determine whether the tasks was done
* @param {string} text The text to pass as first parameter to the errHandler
*/
	var smartRetry = function (errHandler, text) {
		if (isEdit) {
			editedPage(hash.title, hash.summary, Math.round((currentRequestId - reqId + 1) * 1.1), function (edited) {
				switch (edited) {
					case 1: successfulEdits++;
						if ($.isFunction(cb)) cb({}, hash);
						return;
					case 0:
						return recallme(500);
					case -1: // Error!
						return errHandler(text);
				}
			});
		} else if (isMove) {
			movedPage(hash.from, hash.reason, hash.to, function (moved) {
				switch (moved) {
					case 1: successfulMoves++;
						if ($.isFunction(cb)) cb({}, hash);
						return;
					case 0:
						return recallme(500);
					case -1: // Error!
						return errHandler(text);
				}
			});
		} else if (isDelete) {
			deletedPage(hash.title, hash.reason, function (deleted) {
				switch (deleted) {
					case 1: successfulDeletions++;
						if ($.isFunction(cb)) cb({}, hash);
						return;
					case 0:
						return recallme(500);
					case -1: // Error!
						return errHandler(text);
				}
			});
		}
	};

/**
* Displays a notice and continues when the notice is dismissed
* @param {string} title Message key for the notice's title
* @param {string} content Message key for the notice's body
* @param {string} type Notice identifier that is broadcasted through a hook
*/
	var displayNoticeAndContinue = function (title, content, type) {
		mw.hook('libapi.notice').fire('open', type);

		mw.loader.using(['jquery.ui'], function () {
			$('<div>')
				.html(getMessage('notice-self-reference'))
				.prepend($('<p>').html(getMessage(content)))
				.dialog({
					title: getMessage(title),
					show: { effect: 'highlight', duration: 600 },
					buttons: [{
						text: getMessage('notice-proceed-button'),
						click: function () {
							$(this).dialog('close');
						}
					}],
					close: function () {
						$(this).remove();
						recallme(5, true);
						mw.hook('libapi.prompt').fire('close', type);
					}
				});
		});
	};

/**
* Displays a notice and continues when the notice is dismissed
*/
	var assertionFailed = function () {
		displayNoticeAndContinue(
			'assertion-title',
			'assertion-text',
			'assertion'
		);
	};

	hash.format = 'json';
	$.ajax({
		url: apiURL,
		cache: false,
		dataType: 'json',
		data: hash,
		type: 'POST',
		headers: api.config.headers,
		success: function (result, status, x) {
// cache the current date and time if not done, yet
			if (!currentDate && x && x.getResponseHeader) setCurrentDate(x);

// In case we have to solve a captcha - re-enqueue and prompt
			if (result && result.edit && result.edit.captcha) {
				var captcha = result.edit.captcha,
					$buttons,
					$cDlg = $('<div>', { id: 'apiCaptchaDialog' });

				$('<p>', {
					text: getMessage('captcha-text')
				})
					.appendTo($cDlg);

				var $img = $('<img>', {
						id: 'apiCaptchaImg',
						alt: 'captcha',
						src: captcha.url
					})
						.appendTo($cDlg),
					dlgW = Math.min($win.width(), Math.max(310, $img.width() + 30)),
					$w = $('<input type="text" size="30"/>').appendTo($cDlg.append(' ')),
					dlgButtons = {};

				$img.on('load', function () {
					$cDlg.dialog({
						width: Math.min($win.width(), Math.max(310, $img.width() + 30))
					});
				});
				$w.keyup(function (e) {
					if (Number(e.which) === 13) $buttons.eq(0).click();
				});
				dlgButtons[getMessage('captcha-ok')] = function () {
					$(this).dialog('close');
				};
				mw.loader.using(['jquery.ui'], function () {
					$cDlg.dialog({
						title: getMessage('captcha-title'),
						buttons: dlgButtons,
						show: { effect: 'highlight', duration: 600 },
						width: dlgW,
						close: function () {
							$cDlg.remove();
							hash.captchaid = captcha.id;
							hash.captchaword = $w.val();
							pendingRequests--;
							recallme(50);
							mw.hook('libapi.prompt').fire('close', 'captcha');
						},
						open: function () {
							var $dlg = $(this).parent();
							$buttons = $dlg.find('.ui-dialog-buttonpane button');
							$buttons.eq(0).button({ icons: { primary: 'ui-icon-circle-check' } });
							$w.focus();
							mw.hook('libapi.prompt').fire('open', 'captcha');
						}
					});
				});
				return;
			}

// In case we hit a rate limit, display a dialog
			if (result.error && result.error.code === 'ratelimited') {
				getRatelimits(function (limits) {
					editRlExceeded++;
					clearTimeout(editRlExceededTimeout);
					editRlExceededTimeout = setTimeout(function () {
			// Reset counter
						editRlExceeded = 0;
					}, (1000 * limits.seconds) + 5000);

		// How many times we hitted the ratelimit
					var secondsToWait = (editRlRemaining = limits.seconds * (Math.floor(editRlExceeded / limits.hits) + 1));

					if (!$editRlDlg) {
						mw.hook('libapi.prompt').fire('open', 'ratelimit');
						mw.loader.using(['jquery.ui'], function () {
							$editRlDlg = $('<div>')
								.append($('<p>').text(
									getMessage('ratelimit-text', limits.hits, limits.seconds, editRlRemaining))
								)
								.dialog({
									title: getMessage('ratelimit-title'),
									close: function () {
										$editRlDlg.remove();
										$editRlDlg = null;
										clearInterval(editRlDlgInterval);
										mw.hook('libapi.prompt').fire('close', 'ratelimit');
									}
								});

				// Set a timeout to keep the dialog up-to-date
							editRlDlgInterval = setInterval(function () {
								$editRlDlg.find('p').text(getMessage('ratelimit-text', limits.hits, limits.seconds, editRlRemaining));
					// If no time is remaining, close this dialog
								if (editRlRemaining < 0)
									$editRlDlg.dialog('close');

								editRlRemaining--;
							}, 999);
						});
					}

					pendingRequests--;
		// recallme takes ms
					recallme(1000 * secondsToWait, true);
				});
				return;
			}

// Call always first; jQuery complete-evt is called after that
			always();

			var doErrCB = function (text) {
				var serverDateTime = '',
					apiServer = '';
				if (x && x.getResponseHeader) serverDateTime = ' <i>at ' + x.getResponseHeader('date') + '</i>';
				if (result && result.servedby) apiServer = ' <u>served by ' + result.servedby + '</u>';
				if ($.isFunction(errCb)) {
					return errCb(text + serverDateTime + apiServer, result, hash);
				}
			// else TODO: ignore error or create a report page ?
			};

			if (!result) return smartRetry(doErrCB, 'API returned empty result.');

			if (result.error) {
	// In case we get the mysterious 231 unknown error, just try again
				if (result.error.info.indexOf('231') !== -1 && retryCount < 20) return recallme(500);

	// In case we get edit conflicts
				if (result.error.code === 'editconflict' && (hash.prependtext || hash.appendtext) && retryCount < 20) return recallme(500);

	// If the edit-conflict is about the full text, we could re-obtain the text and perform the opteration again
	// ...
	// If the edit-token is expired or corrupt
				if (!!({ notoken: 1, badtoken: 1 })[result.error.code] && retryCount < 20) {
					return refreshToken(hash.action, function (token) {
						if (token) {
							tokens.set(tokenType, token);
							recallme(0);
						} else {
							return doErrCB('notoken - API request failed (' + result.error.code + '): ' + result.error.info);
						}
					});
				}
		// If the user is suddenly reported to be logged-out
				if (result.error.code === 'assertuserfailed') return assertionFailed();
				if (isMove && ($.inArray(result.error.code, ['articleexists', 'unknownerror']) > -1) && retryCount < 4)
					return smartRetry(doErrCB, result.error.code + ':' + result.error.info);

				if (isDelete) {
					if (result.error.code === 'cantdelete' && retryCount < 3) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
		// If the title does not exist, we can't do anything but it's possible that we deleted them ourselves
					if (result.error.code === 'missingtitle' && retryCount < 2) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
		// Catch https://bugzilla.wikimedia.org/show_bug.cgi?id=46086
					if (result.error.code === 'internal_api_error_DBQueryError' && retryCount < 5) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);
				}
		// Temporarily to catch errors of https://bugzilla.wikimedia.org/show_bug.cgi?id=37225#c65
				if (isEdit && result.error.code === 'internal_api_error_MWException' && retryCount < 3) return smartRetry(doErrCB, result.error.code + ':' + result.error.info);

				var errText = 'API request failed (' + result.error.code + '): ' + result.error.info;
				if (result.error.code === 'hookaborted')
					errText += '\nHelp: Often, AbuseFilter is responsible for this kind of error. Please try another file name or text, ensure you are not blocked and ask at the Village Pump or your local Community Forum.';

				if (result.error.code === 'protectedpage' && hash.title)
					errText += '\nHelp: You can request an edit to \'' + hash.title + '\' at COM:AN (the Administrators’ noticeboard).';

				if (result.error.code === 'missingtitle' && hash.title)
					errText += '\nHelp: \'' + hash.title + '\' was possibly deleted or moved.';

				return doErrCB(errText);
			}
			if (result.edit && result.edit.spamblacklist)
				return doErrCB('The edit failed because ' + result.edit.spamblacklist + ' is on the Spam Blacklist');

			if (isEdit && retryCount < 10 && !result.edit || (result.edit && (!result.edit.result || result.edit.result !== 'Success')))
				return smartRetry(doErrCB, 'Edit did not succeed.');

			if (isMove && retryCount < 5 && (!result.move || !result.move.to))
				return smartRetry(doErrCB, 'Move did not succeed.');

			if (isDelete && retryCount < 2 && (!result['delete']))
				return smartRetry(doErrCB, 'Deletion did not succeed.');

			if (isEdit)
				successfulEdits++;
			else if (isMove)
				successfulMoves++;
			else if (isDelete)
				successfulDeletions++;

			if ($.isFunction(cb)) cb(result, hash);
		},
		error: function (x, status, error) {
// Call always first; jQuery complete-evt is called after that
			always();

			var doErrCB = function () {
				if ($.isFunction(errCb)) {
					return errCb('Server status: ' + x.status + ' - Error:' + error, null, hash);
				}
				// else TODO: ignore error or create a report page ?
			};

// Catch nasty server errors and retry; 50x are timeouts and similar, 200 is a JSON parser error so the server sent something terribly wrong
// 12152 (ERROR_HTTP_INVALID_SERVER_RESPONSE), 12002 (ERROR_INTERNET_TIMEOUT), 408 (Request timed out) are common IE/WinInet errors
// http://stackoverflow.com/questions/3731420/why-does-ie-issue-random-xhr-408-12152-responses-using-jquery-post
			if (x && x.status && ((x.status > 499 && x.status < 600) || ($.inArray(x.status, [12152, 12002, 408, 200, 0]) > -1)) && retryCount < 20)
				return smartRetry(doErrCB);

			doErrCB();
		}
	});
};

/**
* Stores the (server) date from an XHR into a local variable
* This is useful because sometimes computers
* with wrong date/time settings are used and we have to rely
* on a correct date (e.g. identifying the right sub-page)
* use mw.libs.commons.api.getCurrentDate() for getting
* the stored date.
* @param {jqXHR} x a jqXHR object you obtained from
*        the supplied success/error callbacks to $.ajax
*
*/
function setCurrentDate(x) {
	var shortNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	try {
		var dat = x.getResponseHeader('date').match(/\D+(\d\d) (\D{3}) (\d{4}) (\d\d):(\d\d):(\d\d)/);
		currentDate = new Date(dat[3], $.inArray(dat[2], shortNames), dat[1], dat[4], dat[5], dat[6]);
// The date is initialized/ constructed in local time but the server returned GMT-Time, so remove the offset
// According to w3c under- and overflow (<0, >60) are handled by the date-object itself
		currentDate.setMinutes(currentDate.getMinutes() - currentDate.getTimezoneOffset());
	} catch (ex) {
		currentDate = new Date();
	}
}

/**
 * ALWAYS bump the revision number
 *
 * mw.libs.commons.api.config - you are free to adjust the config according to your needs
 *  - maxSimultaneousReq:   maximum number of requests to send to the API simultaneously
 *                          the API-etiquette asks you only sending one requests at once
 *  - parserDelay:          Default delay in ms to wait before sending a request to the parser
 *  - parserDelayIncrement: Time in ms to add to the parserDelay each time a parse-request is sent
 *                          This is preventing sending a request for each letter for slow-typing people
 *  - parserMaxTimeout:     Maximum delay in ms to wait before sending a request to the parser
 *
 *
 * The methods editPage, movePage and deletePage can be invoked with a single object or with
 * multiple arguments:
 * @example
     mw.libs.commons.api.editPage(mySuccessCallback, myErrorCallback, 'appendtext', "Commons:FAQ", "\n -- Vandalism", "edit summary");
 * is the same as:
 * @example
mw.libs.commons.api.editPage({
	cb: mySuccessCallback,
	errCb: myErrorCallback,
	editType: 'appendtext',
	title: "Commons:FAQ",
	text: "\n -- Vandalism",
	summary: "edit summary"
});
*
 *
 * For a complete list of available arguments, refer accordingly to editArgs, moveArgs, deleteArgs
 * mw.libs.commons.api.editPage - replace page text, prepends or appends text
 * mw.libs.commons.api.movePage - move a page from a source to a destination
 * mw.libs.commons.api.deletePage - delete a page with a given reason
 *
 * mw.libs.commons.api.query - run a query to the MediaWiki API
 * @example
mw.libs.commons.api.query({
	action: 'query',
	prop: 'info',
	titles: 'Commons:FAQ'
}, {
	cb: function (result, paramsPassedIn) {
		// ...
	},
	errCb: function (errText, paramsPassedIn, result) {
		// ...
	}
});
*
 * Auto-Query
 * Ever experienced ['query-continue']? Hard to deal with?
 * Not with libAPI! libAPI's $autoQuery will automatically
 * continue the query until all elements were returned,
 * or a certain number of cycles (quota) is reached.
 *
 * @example
	mw.loader.using('ext.gadget.libAPI', function() {
		mw.libs.commons.api.$autoQuery({ action: 'sitematrix' })
				.progress(function(result, params) {
					console.log('handle result: ', result)
				})
				.done(function(fullResult) {
					console.log('fullResult may be wrong, in case Arrays are involved. Proceed with the application’s logic after all parts of the list were loaded')
				});
	});
 *
*/

api = mw.libs.commons.api = {
	version: '0.3.14.1',
	config: {
		maxSimultaneousReq: 1,
		parserDelay: 900,
		parserDelayIncrement: 70,
		parserMaxTimeout: 3500,
		queryMaxSimultaneousReq: 5,
		headers: { 'Api-User-Agent': 'libAPI' },
		preferencesKey: 'com-libapi-prefs'
	},
	preferences: {
		edit: {
			summary: {
				prepend: ''
			},
			flagAsBotEdit: false
		}
	},
	errors: {
		badInput: { code: 1, description: 'Invalid arguments: Neither a hash nor a string.' },
		badType: { code: 2, description: 'Invalid arguments: Type mismatch for %ARG%. Type is %CT%. Required %RT%.' },
		notSet: { code: 3, description: 'Missing argument: %ARG% Is required!' }
	},
	mergePreferences: function () {
		var opt = mw.user.options.get(api.config.preferencesKey);
		$.extend(true, api.preferences, opt);
	},
	applyPreferences: function (action, hash) {
		switch (action) {
			case 'edit':
				var prefs = api.preferences.edit;
				hash.summary = prefs.summary.prepend + hash.summary;
				if (prefs.flagAsBotEdit) hash.bot = 1;
				break;
			case 'delete':
			case 'move':
				break;
		}
	},
	createHash: function (args, possibleArgs) {
		var query = {
			format: 'json'
		};

		var arg0 = args[0],
			arg0Type = typeof arg0,
			argCurrent,
			argCurrentType;

		var addArg = function (a, def, argCurrent) {
			argCurrentType = typeof argCurrent;

			if (def.required && argCurrentType !== def.type) throw new Error(api.errors.badType.description.replace('%ARG%', a).replace('%CT%', argCurrentType).replace('%RT%', def.type));
			switch (argCurrentType) {
				case 'undefined':
					if (def.required)
						throw new Error(api.errors.notSet.description.replace('%ARG%', a));

					return;
				case 'function':
					return;
				case 'boolean':
		// The API does not really want boolean values
					if (argCurrent) {
						argCurrent = 1;
					} else {
						if (def.ifFalse)
							a = def.ifFalse;
						else
							return;
					}
					break;
			}

			if (def.noadd) return;
			query[a] = argCurrent;
		};

		switch (arg0Type) {
			case 'function':
				$.each(possibleArgs, function (a, def) {
					argCurrent = args[def.id];
					return addArg(a, def, argCurrent);
				});
				break;
			case 'object':
				$.each(possibleArgs, function (a, def) {
					argCurrent = arg0[a];
					return addArg(a, def, argCurrent);
				});
				break;
			default:
				throw new Error(api.errors.badInput.description);
	// break;
		}
		return query;
	},
	getArg: function (args, possibleArgs, argDesired) {
		return args[0][argDesired] || args[possibleArgs[argDesired].id];
	},
	$DeferredFromArgs: function (argsIn, op) {
		var args = slice.call(argsIn, 0),
			arg0 = args[0],
			arg0Type = typeof arg0,
			$def = $.Deferred(),
			$cbs = $.Callbacks().add($.proxy($def.notify, $def)).add($.proxy($def.resolve, $def)),
			__ok = $.proxy($cbs.fire, $cbs),
			__err = $.proxy($def.reject, $def);

		switch (arg0Type) {
			case 'function':
				args[0] = __ok;
				args[1] = __err;
				break;
			case 'string':
				args.unshift(__ok, __err);
				break;
			case 'object':
				args[0].cb = __ok;
				args[0].errCb = __err;
				break;
		}
		api[op].apply(api, args);
		return $def;
	},
	checkAssertions: function (hash, cb) {
		if (hash.assert)
			return cb(hash);

		mw.loader.using(['mediawiki.user'], function () {
			if (!mw.user.isAnon())
				hash.assert = 'user';

			cb(hash);
		}, function () {
			cb(hash);
		});
	},
	abortPendingRequests: function() {
		apiRequestQueue.length = 0; // truncate / empty / clear the queue
	},
	editArgs: {
		cb:             { id: 0,  type: 'function' },
		errCb:          { id: 1,  type: 'function' },
		editType:       { id: 2,  type: 'string', noadd: true },
		title:          { id: 3,  type: 'string', required: true },
		text:           { id: 4,  type: 'string', required: true, noadd: true },
		summary:        { id: 5,  type: 'string' },
		minor:          { id: 6,  type: 'boolean', ifFalse: 'notminor' },
		basetimestamp:  { id: 7,  type: 'string' },
		starttimestamp: { id: 8,  type: 'string' },
		recreate:       { id: 9,  type: 'boolean' },
		createonly:     { id: 10, type: 'boolean' },
		nocreate:       { id: 11, type: 'boolean' },
		redirect:       { id: 12, type: 'boolean' },
		md5:            { id: 13, type: 'string' },
		watchlist:      { id: 14, type: 'string' },
		bot:            { id: 15, type: 'boolean' },
		assert:         { id: 16, type: 'string' },
		tags:           { id: 17, type: 'string' },
		section:        { id: 18, type: 'string' }
	},
	editPage: function (/* paramArray*/) {
		var hash = api.createHash(arguments, api.editArgs),
			args = arguments;
		hash.action = 'edit';

		var editType = api.getArg(args, api.editArgs, 'editType');
		hash[editType] = api.getArg(args, api.editArgs, 'text');
		if (hash.redirect && editType === 'text') {
			delete hash.redirect;
			mw.log.warn('Dropped redirect parameter from action=edit because editing full text.');
		}

		api.mergePreferences();
		api.applyPreferences('edit', hash);

		api.checkAssertions(hash, function () {
			doRequest(hash, api.getArg(args, api.editArgs, 'cb'), api.getArg(args, api.editArgs, 'errCb'));
		});
	},
	$editPage: function (/* args*/) {
		return api.$DeferredFromArgs(arguments, 'editPage');
	},
	moveArgs: {
		cb:             { id: 0,  type: 'function' },
		errCb:          { id: 1,  type: 'function' },
		from:           { id: 2,  type: 'string', required: true },
		to:             { id: 3,  type: 'string', required: true },
		reason:         { id: 4,  type: 'string' },
		movetalk:       { id: 5,  type: 'boolean' },
		movesubpages:   { id: 6,  type: 'boolean' },
		noredirect:     { id: 7,  type: 'boolean' },
		ignorewarnings: { id: 8,  type: 'boolean' },
		watchlist:      { id: 9,  type: 'string' },
		assert:         { id: 10, type: 'string' },
		tags:           { id: 11, type: 'string' }
	},
	movePage: function (/* paramArray*/) {
		var hash = api.createHash(arguments, api.moveArgs),
			args = arguments;
		hash.action = 'move';

		api.checkAssertions(hash, function () {
			doRequest(hash, api.getArg(args, api.moveArgs, 'cb'), api.getArg(args, api.moveArgs, 'errCb'));
		});
	},
	$movePage: function (/* args*/) {
		return api.$DeferredFromArgs(arguments, 'movePage');
	},
	deleteArgs: {
		cb:        { id: 0,  type: 'function' },
		errCb:     { id: 1,  type: 'function' },
		title:     { id: 2,  type: 'string', required: true },
		reason:    { id: 3,  type: 'string', required: true },
		watchlist: { id: 4,  type: 'string' },
		oldimage:  { id: 5,  type: 'string' },
		assert:    { id: 6,  type: 'string' },
		tags:      { id: 7,  type: 'string' }
	},
	deletePage: function (/* paramArray*/) {
		var hash = api.createHash(arguments, api.deleteArgs),
			args = arguments;
		hash.action = 'delete';

		api.checkAssertions(hash, function () {
			doRequest(hash, api.getArg(args, api.deleteArgs, 'cb'), api.getArg(args, api.deleteArgs, 'errCb'));
		});
	},
	$deletePage: function (/* args*/) {
		return api.$DeferredFromArgs(arguments, 'deletePage');
	},
	$changeText: function (titleOrID, textChangeCallback, section) {
		var $def = $.Deferred(),
			t = typeof titleOrID === 'string' ? 'title' : 'pageid',
			q = {
				action: 'query',
				curtimestamp: 1,
				prop: 'revisions|info',
				meta: 'tokens',
				rvprop: 'content|timestamp',
				rvslots: 'main'
			};

		q[t + 's'] = titleOrID;
		if (section) q.rvsection = section;
		api.query(q, undefined, function (r) {
			try {
				var pg = firstItem(r.query.pages),
					rv = pg.revisions[0],
					tns = textChangeCallback(rv.slots.main['*']),
					e = {
						editType: 'text',
						basetimestamp: rv.timestamp,
						starttimestamp: r.curtimestamp,
						cb: $.proxy($def.resolve, $def),
						errCb: $.proxy($def.reject, $def)
					};

				e = $.extend({}, tns, e);
				if (section) e.section = section;
				e[t] = titleOrID;
				if (r.query.tokens)
					mw.user.tokens.set('csrfToken', r.query.tokens.csrftoken);
				api.editPage(e);
			} catch (ex) {
				$def.reject(ex);
			}
		}, function (r) {
			$def.reject(r);
		});

		return $def;
	},
	query: function (params, specs, callback, errCb, retryCount) {
		if (pendingQueries >= api.config.queryMaxSimultaneousReq) {
// see me later
			return queryQueue.push(slice.call(arguments, 0));
		}
		var always = function () {
			pendingQueries--;
			var i = Math.min(api.config.queryMaxSimultaneousReq - pendingQueries, queryQueue.length);
			for (; i > 0; i--) {
				var args = queryQueue.shift();
				api.query.apply(api, args);
			}
		};
		var newParams = {
			format: 'json'
		};

		var url, method, cache, withCredentials;
		if (typeof specs === 'object') {
			url = specs.url;
			method = specs.method;
			cache = specs.cache;
			withCredentials = 'withCredentials' in specs ?
				specs.withCredentials : (url && corsSupport);
			callback = callback || specs.callback || specs.cb;
			errCb = errCb || specs.errCallback || specs.errCb;
		}

		if (!retryCount) retryCount = 0;
		retryCount++;
		if ($.inArray(params.action, ['sitematrix', 'query', 'userdailycontribs', 'titleblacklist', 'parse']) === -1)
			throw new Error('api.query is for queries only. For editing use the stable Commons edit-api.');
// At least let's try to send the format first
// If the POST-request is cut off, we get "invalid token" or other errors
		$.extend(newParams, params);

		var datatype = 'json',
			xhrFields = {};
		if (url) {
			if (corsSupport) {
				$.support.cors = true;
				newParams.origin = document.location.protocol + '//' + document.location.hostname;
				if (withCredentials)
					xhrFields.withCredentials = true;

			} else {
				datatype = 'jsonp';
			}
		}
		url = url || apiURL;
		method = method || 'GET';
		if (typeof cache !== 'boolean') cache = true;

		var retry = function (timeout, errText) {
			if (retryCount > 10) {
				if (!$.isFunction(errCb)) return;
				return errCb(errText, params);
			} else {
				return setTimeout(function () {
					api.query(params, specs, callback, errCb, retryCount);
				}, timeout * retryCount);
			}
		};

		pendingQueries++;
		var jqXHR = $.ajax({
			url: url,
			cache: cache,
			dataType: datatype,
			data: newParams,
			type: method,
			xhrFields: xhrFields,
			success: function (result, status, x) {
				always();
				if (!currentDate && x && x.getResponseHeader)
					setCurrentDate(x);
				if (!result)
					return retry(500, 'Received empty API response:\n' + x.responseText);
	// In case we get the mysterious 231 unknown error, just try again
				if (result.error) {
					if (result.error.info.indexOf('231') !== -1)
						return retry(500, 'mysterious 231 unknown error');
					if (!$.isFunction(errCb))
						return;
					return errCb('API request failed (' + result.error.code + '): ' + result.error.info, params, result);
				}
				callback(result, params);
			},
			error: function (x, status, error) {
				always();
				return retry(1500, 'API request returned code ' + x.status + ' ' + status + '. Error code is ' + error);
			}
		});
		$.support.cors = corsEnabled;
		return jqXHR;
	},
	getRunningQueryCount: function () {
		return pendingQueries;
	},
// Though the query-method returns a $.Deferred, it is not recommended to use it because the operation may have failed despite status 200 OK
// Instead use this wrapper-method or call api.query directly supplying callback arguments
	$query: function (query, specs) {
		var $def = $.Deferred();
		api.query(query, specs, function (/* p*/) {
			$def.resolve.apply($def, slice.call(arguments, 0));
		}, function (/* p*/) {
			$def.reject.apply($def, slice.call(arguments, 0));
		});
		return $def;
	},
	$continueQuery: function (query, result, specs) {
		var qc = result['query-continue'],
			oldProp = query.prop,
			oldList = query.list,
			props = [],
			lists = [];

		if (qc) {
// support old-style continuation
			$.each(qc, function (k, v) {
				if (oldProp && oldProp.indexOf(k) > -1)
					props.push(k);

				if (oldList && oldList.indexOf(k) > -1)
					lists.push(k);

				$.extend(query, v);
			});
			if (props.length)
				query.prop = props.join('|');
			else
				delete query.prop;

			if (lists.length)
				query.list = lists.join('|');
			else
				delete query.list;

		} else if (result['continue']) {
// as well as the new style
			$.extend(query, result['continue']);
		} else {
			return null;
		}

		return api.$query(query, specs);
	},
// Returns a jQuery-Deferred-object
// you can kill the loop by setting the kill property of the returned deferred object to true
	$autoQuery: function (params, specs, maxcycles) {
		if (!maxcycles) maxcycles = 10;

		var $def = $.Deferred(),
			$mergedResult = {},
			_onReady = function () {
				$def.resolve($mergedResult);
			},
			_onFail = function () {
				$def.reject.apply($def, slice.call(arguments, 0));
			},
			_onStep = function (result, query) {
				$def.notify.apply($def, slice.call(arguments, 0));
				$.extend(true, $mergedResult, result);

				maxcycles--;
				if (maxcycles <= 0) return _onReady();
				if ($def.kill) return _onReady();

				var $defStep = api.$continueQuery(query, result, specs);
				if (!$defStep) return _onReady();
				$defStep.done(_onStep).fail(_onFail);
			};

		api.$query(params, specs)
			.done(_onStep)
			.fail(_onFail);

		return $def;
	},

// This should be better an object - or not?
// There is no real need for more than one parser xhr running at one time
// "immediate" allows skipping smartParse
// smartParse only sends requests to the server if required and
// discards obsolete requests
// The ideal choice for direct binding to text inputs for a live-preview
	parse: function (text, lang, title, cb, immediate) {
		var query = {
			format: 'json',
			action: 'parse',
			prop: 'text',
			pst: true,
			text: text
		};
		if (lang) query.uselang = lang;
		if (title) query.title = title;
		var gotJSON = function (r) {
			api.config.parserDelay += api.config.parserDelayIncrement;
			try {
				cb(r.parse.text['*']);
			} catch (ex) {
				cb('');
			}
		};
		var doParse = function () {
			if (api.parserjqXHR && !immediate) api.parserjqXHR.abort();
			if (!text || !/(?:<|\/\/|\[|'|\{|~~)/.test(text))
				return cb('<p>' + (text || '') + '</p>');

			if (immediate) {
				var parserjqXHR = $.getJSON(apiURL, query, gotJSON);
				parserjqXHR.error = gotJSON;
			} else {
				api.parserjqXHR = $.getJSON(apiURL, query, gotJSON);
				api.parserjqXHR.error = gotJSON;
			}
		};
		if (immediate) {
			doParse();
		} else {
			if (this.parserTimeout) clearTimeout(this.parserTimeout);
			this.parserTimeout = setTimeout(doParse, Math.min(this.config.parserDelay, this.config.parserMaxTimeout));
		}

	},
	getCurrentDate: function () {
		return currentDate || new Date();
	}
};
}(jQuery, mediaWiki));