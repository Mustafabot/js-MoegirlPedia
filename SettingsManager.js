/**
 * Localization required. [[User:Liangent]] 2013年4月8日 (一) 10:20 (UTC)
 *
 * [[:commons:MediaWiki:Gadget-SettingsManager.js]]
 * Managing user preferences of scripts
 * Managing gadgets and gadget preferences
 *
 * Use it for good, not for evil.
 *
 * @author Rillke, 2012
 * @license GPL v.3
 * <nowiki>
 */
 
// List the global variables for jsHint-Validation.
// Scheme: globalVariable:allowOverwriting[, globalVariable:allowOverwriting][, globalVariable:allowOverwriting]
/*global jQuery:false, mediaWiki:false*/

// Set jsHint-options.
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:false, browser:true*/
mw.loader.load(['//cdnjs.cloudflare.com/ajax/libs/json2/20160511/json2.min.js', 'mediawiki.user']);
( function ( $, mw, undefined ) {
"use strict";

/**
* Refresh edit token
*
* @example
*      refreshToken( function() { doGoodStuff.retry(); } );
*
* @param cb {Function} Callback function. The first argument supplied is whether the operation succeeded.
* @context {closure} private function
* @return {Object} a jQuery deferred-object-queue
*/
var refreshToken = function(cb) {
	var mwa = new mw.Api({ userAgent: 'Gadget-SettingsManager' }),
		apiDef = mwa.get( {
			action: 'query',
			meta: 'tokens',
			type: 'csrf'
		} );
		
	apiDef.done(function(result) {
		if (!result.query || !result.query.tokens) return cb( false, 'wrong-response' );
		mw.user.tokens.set( 'csrfToken', result.query.tokens.csrftoken );
		cb( true );
	});
	apiDef.fail(function(code, result) {
		if (!result.query || !result.query.tokens) return cb( false, code );
	});
	return apiDef;
};

var firstItem = function(o) { 
	for (var i in o) {
		if (o.hasOwnProperty( i )) { 
			return o[i]; 
		} 
	} 
};

var valByString = function(identifier) {
	var arr = identifier.split( '.' ),
		lenArr = arr.length,
		i,
		elemArr,
		objCurrent = window;
		
	for (i = 0; i < lenArr; i++) {
		elemArr = arr[i];
		objCurrent = objCurrent[elemArr];
	}
	return objCurrent;
};

var sm = {
	version: '0.1.0.1',
	errorPrefix: "SettingsWizard encountered a problem. We regret the inconvenience. ",
	/**
	* Constructor-method. Returns an option-object you should perform the actions on.
	*
	* @example
	*      var opt = mw.libs.settingsManager.option( { optionName: 'CatALotOptions', value: { watchCopy: false, watchRemove: false } } );
	*      // Save the options we've set before and make the script triggering events on the document, you can listen to
	*      opt.save( $(document), 'CatALotSaveProgress' );
	*      // or, use the deferred-object returned:
	*      opt.save().done(function(msg, status, jsFile) { 
	*          alert( msg );
	*      }).status(function(msg, status, jsFile) { 
	*          console.log( 'settings progress>' + msg );
	*      });
	*
	* @param specsIn {Object} specifications passed in. List of defaults (cf. specs) follows.
	* @context {mw.libs.settingsManager}
	* @return {Object} option-object you can use for performing actions on.
	*/
	option: function(specsIn) {
		// List of defaults:
		var specs = {
			// The global name the option will be saved under
			// This can be also something like "mw.settingsOfToolX"
			optionName: '',
			// The position where to save them. By default options are
			// saved at the user's common.js or <skin>.js (e.g. vector.js)
			// specify other locations like "settingsOfToolX" --> "User:Example/prefs/settingsOfToolX.js"
			saveAt: false,
			// By default the option is not enclosed in a comment-block
			// Comment-blocks are recommended for larger configurations
			// specifies the signature that will be used for the enclosing comments
			// blockSettingsOfToolX --> //blockSettingsOfToolX///////////////////////
			// (ignored when saveAt is set)
			encloseSignature: false,
			// Specify additional block comments added below the signature
			// Should be something that explains what the following JSON does or is good for
			// Recommended line-length for consistent alignment: 48 chars
			encloseBlock: false,
			// If no own location for saving the option is used (options that must be
			// available while loading the script should not be saved to a separate file while 
			// complex options should), if the RegExp will have a match on either the common.js
			// or the <skin>.js, and this option is not saved yet to another .js, the option
			// will be saved to this js-file. In case the option is not saved yet and there is
			// no RegExp supplied or it did not match, the option will be saved to the larger
			// JavaScript
			triggerSaveAt: false,
			// Should the new content be insered in front of the match by triggerSaveAt
			// If none of the following options is specified, the new content 
			// will be appended to the script
			insertBeforeTrigger: false,
			insertAfterTrigger: false,
			replaceTrigger: false,
			// Finally the option's value. Objects are possible. They will be automatically
			// transformed into a JSON-string
			value: undefined,
			// Edit summary to use while saving the JavaScript
			editSummary: ""
		};
		if (!specsIn) throw new Error(sm.errorPrefix + "Data to save or retrieve was not supplied by the script using SettingsWizard.");
		if (!specsIn.optionName && !specsIn.saveAt) throw new Error(sm.errorPrefix + "The options\'s name was not supplied by the script using SettingsWizard.");
		$.extend( true, specs, specsIn );
		
		// Prepare variables we need later
		var nsUser   = mw.config.get('wgFormattedNamespaces')[2],
			skin     = mw.config.get('skin'),
			user     = mw.config.get('wgUserName'),
			skinJS   = [nsUser, ':', user, '/', skin, '.js'].join(''),
			commonJS = [nsUser, ':', user, '/','common', '.js'].join('');
		
		// Event-handler system
		var $el, evt, jsFiles, process, $progress = new $.Deferred(), customJS;
		var triggerEvt = function(any) {
			return (evt && $el && $el instanceof jQuery && $el.triggerHandler( evt, Array.prototype.slice.call( arguments, 0 ) ));
		};
		
		process = {
			updateVars: function() {
				// Reset variables that could be polluted
				jsFiles = [];
				$progress = new $.Deferred();
				customJS = [nsUser, ':', user, '/prefs/', specs.saveAt, '.js'].join('');
			},
			start: function() {
				this.updateVars();
				
				// Subscribe to any event: We want to know everything :-)
				$progress.then( triggerEvt, triggerEvt, triggerEvt );
				
				// Always async
				setTimeout( $.proxy( this.getScripts, this ), 1 );
				
				return $progress;
			},
			getScripts: function() {
				var i, len;
				
				$progress.notify( "Preparing", 1 );
				
				// First, we need something to work on/ edit token, etc. - request the JavaScript(s)
				if (specs.saveAt) {
					jsFiles.push( sm.script( customJS ) );
				} else {
					jsFiles.push( sm.script( skinJS ) );
					jsFiles.push( sm.script( commonJS ) );
				}
				len = jsFiles.length;
				for (i = 0; i < len; i++) {
					var jsFile = jsFiles[i];
					jsFile.fetchText( process.gotJS, process.gotJSErr );
					$progress.notify( "Requesting " + jsFile.getSource(), Math.round( (i+1)*(9/len) ) + 1, jsFile );
				}
				return $progress;
			},
			gotJS: function(jsFile, r){
				jsFile.gotContent = true;
				
				var i, len = jsFiles.length, pendings = 0;
				for (i = 0; i < len; i++) {
					if (!jsFiles[i].gotContent) {
						pendings++;
					}
				}
				$progress.notify( "Got " + jsFile.getSource() + '. File length: ' + jsFile.get().length + ' characters.' , Math.round( (len - pendings)*(9/len) ) + 10, jsFile );
				
				if (pendings) return;
				process.process();
			},
			gotJSErr: function(jsFile) {
				$progress.reject( "Failed. Could not retrieve " + jsFile.getSource(), -1, jsFile );
			},
			getStartBlock: function(sig) {
				// String concat is sloooow
				return '//' + sig + new Array(48 - 2 - sig.length + 1).join('/');
			},
			getEndBlock: function(sig) {
				return new Array(48 - 2 - 3 - sig.length + 1).join('/') + sig + 'End' + '//';
			},
			getBlockRegExp: function(sig) {
				var escSig = process.escapeRE(sig);
				return new RegExp('\\n?\\n?\\/\\/' + escSig + '(?:.|\\n)*' + escSig + 'End\\/\\/', 'g');
			},
			escapeRE: function(string) {
				string = $.escapeRE(string);
				
				var specials = ['t', 'n', 'v', '0', 'f'];
				$.each(specials, function(i, s) {
					var rx = new RegExp('\\'+s, 'g');
					string = string.replace(rx, '\\'+s);
				});
				return string;
			},
			getVariableRegExp: function(varName) {
				var escVar = process.escapeRE(varName);
				return {
					varRE: new RegExp('\\s*(?:var\\s+|window\\.)?' + escVar + '\\s*=.+', 'g'),
					// Throw a warning if the last char of the line is a "+" , "{", "(" or ","
					varWarnRE: new RegExp('\\s*(?:var\\s+|window\\.)?' + escVar + '\\s*=.+(?:\\n?\\s*[\\,\\+\\{\\(])\\s*\\n')
				};
			},
			process: function() {
				var JSONVal = JSON.stringify( specs.value ),
					sig = specs.encloseSignature,
					tsa = specs.triggerSaveAt,
					opn = specs.optionName,
					jsFile, i, len = jsFiles.length,
					plainJSON = !opn && !!jsFile,
					oldText, newText, hadMatch;
				
				if (opn) {
					// No semicolon for valid JSON!
					JSONVal = 'window.' + opn + ' = ' + JSONVal + ';';
				}
				
				if (!plainJSON) JSONVal = ((specs.encloseBlock && ('\n' + specs.encloseBlock)) || '') + JSONVal;
				
				if (sig && !plainJSON) JSONVal = process.getStartBlock( sig ) + JSONVal + '\n' + process.getEndBlock( sig );
				
				JSONVal = '\n\n' + JSONVal;
				
				// Fine, we've constructed everything we'll need. Now look up where to insert.
				// Looking for signature
				if (sig) {
					var reBl = process.getBlockRegExp( sig );
						
					for (i = 0; i < len; i++) {
						jsFile = jsFiles[i];
						oldText = jsFile.get();
						newText = oldText.replace( reBl, JSONVal );
						if (reBl.test( oldText )) {
							$progress.notify( "Replacing text enclosed by signature " + jsFile.getSource(), 25, jsFile );
							process.save( jsFile.set( newText ) );
							hadMatch = true;
						}
					}
				}
				if (hadMatch) return;
				
				// Looking for variable-name
				if (opn) {
					var vre = process.getVariableRegExp( opn ),
						warnFile;
					
					for (i = 0; i < len; i++) {
						jsFile = jsFiles[i];
						oldText = jsFile.get();
						
						if (vre.varWarnRE.test(oldText)) {
							// WARNING!!!
							$progress.notify( "Unable to remove config from " + jsFile.getSource(), -2, jsFile );
							warnFile = jsFile;
						} else {
							newText = oldText.replace( vre.varRE, JSONVal );
							if (vre.varRE.test( oldText )) {
								$progress.notify( "Replacing variable " + jsFile.getSource(), 25, jsFile );
								process.save( jsFile.set( newText ) );
								hadMatch = true;
							}
						}
						// Only append in case of warning if it was not added to another file
						if (warnFile && !hadMatch) {
							$progress.notify( "Appending variable after warning to " + jsFile.getSource(), 25, jsFile );
							process.save( warnFile.set( oldText + JSONVal ) );
							hadMatch = true;
						}
					}
				}
				if (hadMatch) return;
				
				// If it's just JSON, replace the whole thingy
				if (!opn && specs.saveAt) {
					jsFile = jsFiles[0];
					$progress.notify( "Replacing whole content of " + jsFile.getSource(), 25, jsFile );
					process.save( jsFile.set( JSONVal ) );
					hadMatch = true;
				}
				if (hadMatch) return;
				
				// Looking whether supplied RegExp can find something
				if (tsa) {
					var searchMatch,
						triggerLen = 0;
					
					for (i = 0; i < len; i++) {
						jsFile = jsFiles[i];
						oldText = jsFile.get();
						
						searchMatch = oldText.search( tsa );
						if (-1 !== searchMatch) {
							if (specs.insertBeforeTrigger) {
								$progress.notify( "Inserting before pattern in " + jsFile.getSource(), 25, jsFile );
								jsFile.set( oldText.slice( 0, searchMatch ) + JSONVal + oldText.slice( searchMatch ) );
							} else if (specs.insertAfterTrigger) {
								triggerLen = oldText.match( tsa )[0].length;
								$progress.notify( "Inserting after pattern in " + jsFile.getSource(), 25, jsFile );
								jsFile.set( oldText.slice( 0, searchMatch + triggerLen ) + JSONVal + oldText.slice( searchMatch + triggerLen ) );
							} else if (specs.replaceTrigger) {
								$progress.notify( "Replacing pattern with new content in " + jsFile.getSource(), 25, jsFile );
								jsFile.set( oldText.replace( tsa, JSONVal ) );
							} else {
								$progress.notify( "Found pattern, appending to " + jsFile.getSource(), 25, jsFile );
								jsFile.set( oldText + '\n//<nowiki>' + JSONVal + '\n//<\/nowiki>' );
							}
							process.save( jsFile );
							hadMatch = true;
							break;
						}
					}
				}
				if (hadMatch) return;
				
				// Finally compare file size
				var biggest = { size: 0, jsFile: null };
					
				for (i = 0; i < len; i++) {
					jsFile = jsFiles[i];
					oldText = jsFile.get();
					var oldTextLen = oldText.length;
					
					if (oldTextLen >= biggest.size) biggest = {
						size: oldTextLen,
						jsFile: jsFile
					};
				}
				$progress.notify( "Appending to bigger file: " + biggest.jsFile.getSource(), 25, biggest.jsFile );
				biggest.jsFile.set( biggest.jsFile.get() + '\n//<nowiki>' + JSONVal + '\n//<\/nowiki>' );
				process.save( biggest.jsFile );
			},
			save: function(jsFile) {
				jsFile.saving = true;
				$progress.notify( "Saving " + jsFile.getSource(), 30, jsFile );
				jsFile.save( process.saved, process.savedErr, "[[MediaWiki:Gadget-SettingsManager.js|SettingsManager]]: " + specs.editSummary );
			},
			saved: function(jsFile) {
				var i, len = jsFiles.length, jsf, waitingFor = [];
				
				jsFile.saving = false;
				
				for (i = 0; i < len; i++) {
					jsf = jsFiles[i];
					if (jsf.saving) {
						waitingFor.push(jsf.getSource());
					}
				}
				$progress.notify( "Saved " + jsFile.getSource() + ". Waiting for " + (waitingFor.join(', ') || '-'), Math.round( (len - waitingFor.length)*(20/len) ) + 50,  jsFile );
				
				if (waitingFor.length) return;
				$progress.resolve( "Success!", 100, jsFile );
			},
			savedErr: function(jsFile, code, errObj) {
				$progress.reject( "Error saving " + jsFile.getSource() + ". Code is " + code + ".\n", -1, errObj );
			}
		};
		
		return {
			getSpecs: function() {
				return specs;
			},
			setSpecs: function(specsIn) {
				specs = specsIn;
				return this;
			},
			// Warning: If you specified a different save-position ("saveAt")
			// and also an optionName, the script has to be fetched and evaluated
			// We recommend omitting setting "optionName" when using "saveAt"
			fetchValue: function(cb, errCb) {
				process.updateVars();
				
				if (specs.saveAt) {
					var s = sm.script( customJS );
					if (specs.optionName) {
						s.fetchText(function() {
							s.doEval();
							cb( valByString( specs.optionName ) );
						}, errCb);
					} else {
						s.fetchJSON(function(scriptObj, JSON) {
							cb( JSON );
						}, errCb);
					}
					return this;
				}
				cb( valByString( specs.optionName ) );
				return this;
			},
			getValue: function() {
				return specs.value;
			},
			setValue: function(val) {
				specs.value = val;
				return this;
			},
			save: function($elem, event) {
				// We won't check whether the value is undefined. This is your task.
				$el = $elem;
				evt = event;
				return process.start();
			},
			getProgress: function() {
				return $progress;
			}
		};
	},
	/**
	* Constructor-method. Returns a script-object you should perform the actions on.
	*
	* @example
	*      var commonJS = mw.libs.settingsManager.script( 'User:Example/common.js' );
	*      commonJS.set( '// empty!' ).setSummary( 'Removing Content' ).save( function() { console.log( 'Successfully removed content from ' + commonJS.getSource() ) } )
	*
	*      // Enable a gadget and load it:
	*      mw.libs.settingsManager.gadget( 'Slideshow' ).load().enable();
	*
	* @param source {String} The name of the JavaScript file with namespace.
	* @context {mw.libs.settingsManager}
	* @return {Object} script-object you can use for performing actions on.
	*/
	script: function(source) {
		var content,
			page,
			summary = "Changing configuration using [[:commons:MediaWiki:Gadget-SettingsManager.js]]",
			minor = 1,
			exists,
			fetch,
			save;

		fetch = function() {
			var mwa = new mw.Api();
			return mwa.get( {
				prop: 'info|revisions',
				titles: source,
				rvprop: 'timestamp|content',
				intoken: 'edit'
			} );
		};
		
		save = function() {
			var mwa = new mw.Api(),
				edit = {
					action: 'edit',
					title: source,
					text: 'object' === typeof content ? JSON.stringify(content) : content,
					summary: summary,
					watchlist: 'nochange',
					recreate: 1,
					tags: 'Automation tool'
				};
				
			if (minor) edit.minor = 1;
			if (exists) {
				edit.basetimestamp = page.revisions[0].timestamp;
			} else {
				edit.starttimestamp = page.starttimestamp;
			}
			
			edit.token = page.edittoken;
			return mwa.post( edit );
		};
			
		return {
			get: function() {
				return content;
			},
			getSource: function() {
				return source;
			},
			doEval: function() {
				/*jshint evil:true */
				return eval(content);
			},
			parseJSON: function() {
				// jquery.json - plugin required
				return ('string' === typeof content && '' !== content) ? JSON.parse( content ) : '';
			},
			// Supplied callback called with a string as second argument
			fetchText: function(cb, errCb) {
				var pgs, pg, scriptObj = this;
				
				fetch().done( function(result) {
					pgs = result.query.pages;
					page = firstItem( pgs );
					exists = !!(page.revisions && page.revisions[0]);
					content = (exists && page.revisions[0]['*']) || '';
					cb( scriptObj, content );
				} ).fail( function( status, errObj ) {
					errCb( scriptObj, status, errObj );
				} );
				return this;
			},
			// Supplied callback called with parsed JSON-data as second argument
			fetchJSON: function(cb, errCb) {
				this.fetchText( function(scriptObj, content) {
					cb( scriptObj, scriptObj.parseJSON() );
				}, function(scriptObj, status, errObj) {
					errCb( scriptObj, status, errObj );
				} );
				return this;
			},
			set: function(newContent) {
				content = newContent;
				return this;
			},
			setMinor: function(newMinor) {
				minor = !!newMinor;
			},
			setSummary: function(newSummary) {
				summary = newSummary;
			},
			save: function(cb, errCb, newSummary, newContent, newMinor) {
				var scriptObj = this;
				if (newContent !== undefined) content = newContent;
				if (newSummary !== undefined) summary = newSummary;
				if (newMinor !== undefined) minor = !!newMinor;
				save().done( function(result) {
					cb( scriptObj, result );
				} ).fail( function(status, errObj) {
					errCb( scriptObj, status, errObj );
				} );
				return this;
			}
		};
	},
	/**
	* Switch a user preference using Ajax!
	*
	* @example
	*      mw.libs.settingsManager.switchPref( 'myOption', 'new value' );
	*
	* @param prefName {String} The name of the preference.
	* @param prefName {String} The new value the preference should set to.
	* @param cb {Function} Callback in case of success.
	* @param cb {Function} Callback in case of an error.
	* @context {mw.libs.settingsManager}
	* @return {Object} a jQuery deferred-object-queue. Don't use it for error-handling - Done by this method.
	*/
	switchPref: function(prefName, prefVal, cb, errCb) {
		var mwa = new mw.Api(),
			args = arguments,
			apiDef = mwa.post( {
				action: 'options',
				token: mw.user.tokens.get('csrfToken'),
				optionname: prefName,
				optionvalue: prefVal || 0
			} );

		// If we changed a preference successfully, update user.options reflecting the change
		apiDef.done( function() {
			mw.user.options.set( prefName, prefVal );
		} );
		if (cb) apiDef.done( cb );
		// Catch badtoken and some other common errors
		apiDef.fail( function(code, result) {
			switch (code) {
				case 'badtoken':
					refreshToken(function (gotANewToken) {
						if (gotANewToken) return sm.switchPref.apply( sm, Array.prototype.slice.call( args, 0 ) );
					} );
					// Stop the propagation of 
					return false;
				case 'http':
				case 'ok-but-empty':
					setTimeout( function() {
						return sm.switchPref.apply( sm, Array.prototype.slice.call(args, 0) );
					}, 1000 );
					return false;
				default:
					return (errCb && errCb(code, result) && false);
			}
		} );
		return apiDef;
	},
	/**
	* Constructor-method. Returns an option-object you should perform the actions on.
	*
	* @example
	*      var slideshowGadget = mw.libs.settingsManager.gadget( 'Slideshow' );
	*      if (slideshowGadget.isEnabled()) { slideshowGadget.disable( myCallback ) }
	*
	*      // Enable a gadget and load it:
	*      mw.libs.settingsManager.gadget( 'Slideshow' ).load().enable();
	*
	* @param gadgetName {Object} The name of the gadget. (Not the script file; without Gadget- prefix or other decoration)
	* @context {mw.libs.settingsManager}
	* @return {Object} gadget-object you can use for performing actions on.
	*/
	gadget: function(gadgetName) {
		var optGadget = 'gadget-' + gadgetName,
			rlGadget = 'ext.gadget.' + gadgetName;
			
		return {
			getName: function() {
				return gadgetName;
			},
			isDefault: function() {
				var opt = mw.user.options.get( optGadget );
				return ('number' === typeof opt || '' === opt);
			},
			isEnabled: function() {
				var opt = mw.user.options.get( optGadget );
				return !!opt;
			},
			getState: function() {
				return mw.loader.getState( rlGadget );
			},
			isLoaded: function() {
				return ('ready' === this.getState());
			},
			load: function(cb, errCb) {
				// Always async
				if (this.isLoaded && cb) return setTimeout( function() {
					cb( gadgetName, true );
				}, 1 );
				mw.loader.using( rlGadget, 
					cb ? function() { 
						cb( gadgetName ); 
					} : undefined, 
					errCb ? function() { 
						errCb( gadgetName ); 
					} : undefined 
				);
				return this;
			},
			enable: function(cb, errCb) {
				// Type wouldn't matter due to URL-encoding but we also want to update
				// the user.options object
				sm.switchPref( optGadget, this.isDefault() ? 1 : '1', cb, errCb );
				return this;
			},
			disable: function(cb, errCb) {
				sm.switchPref( optGadget, this.isDefault() ? '' : null, cb, errCb );
				return this;
			}
		};
	}
};


mw.libs.settingsManager = sm;

// TODO add to gadget-def
}( jQuery, mediaWiki ));
// </nowiki>
