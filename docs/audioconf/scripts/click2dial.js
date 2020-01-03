/*!
 * @license click2vox v2.5.0
 * Copyright 2017 Voxbone. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License")
 *//** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.3.2 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, https://github.com/requirejs/requirejs/blob/master/LICENSE
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global, setTimeout) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.3.2',
        commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    //Could match something like ')//comment', do not lose the prefix to comment.
    function commentReplace(match, singlePrefix) {
        return singlePrefix || '';
    }

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                baseParts = (baseName && baseName.split('/')),
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name);
                name = name.join('/');
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                                         normalize(name, parentName, applyMap) :
                                         name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                each(globalDefQueue, function(queueItem) {
                    var id = queueItem[0];
                    if (typeof id === 'string') {
                        context.defQueueMap[id] = true;
                    }
                    defQueue.push(queueItem);
                });
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    // Only fetch if not already in the defQueue.
                    if (!hasProp(context.defQueueMap, id)) {
                        this.fetch();
                    }
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                var resLoadMaps = [];
                                each(this.depMaps, function (depMap) {
                                    resLoadMaps.push(depMap.normalizedMap || depMap);
                                });
                                req.onResourceLoad(context, this.map, resLoadMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.map.normalizedMap = normalizedMap;
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            if (this.undefed) {
                                return;
                            }
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        } else if (this.events.error) {
                            // No direct errback on this module, but something
                            // else is listening for errors, so be sure to
                            // propagate the error correctly.
                            on(depMap, 'error', bind(this, function(err) {
                                this.emit('error', err);
                            }));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' +
                        args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
            context.defQueueMap = {};
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            defQueueMap: {},
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                // Convert old style urlArgs string to a function.
                if (typeof cfg.urlArgs === 'string') {
                    var urlArgs = cfg.urlArgs;
                    cfg.urlArgs = function(id, url) {
                        return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
                    };
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths: true,
                        bundles: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? {name: pkgObj} : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                     .replace(currDirRegExp, '')
                                     .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id, null, true);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        mod.undefed = true;
                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });
                        delete context.defQueueMap[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }
                context.defQueueMap = {};

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs && !/^blob\:/.test(url) ?
                       url + config.urlArgs(moduleName, url) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    var parents = [];
                    eachProp(registry, function(value, key) {
                        if (key.indexOf('_@r') !== 0) {
                            each(value.depMaps, function(depMap) {
                                if (depMap.id === data.id) {
                                    parents.push(key);
                                    return true;
                                }
                            });
                        }
                    });
                    return onError(makeError('scripterror', 'Script error for "' + data.id +
                                             (parents.length ?
                                             '", needed by: ' + parents.join(', ') :
                                             '"'), evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/requirejs/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/requirejs/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //Calling onNodeCreated after all properties on the node have been
            //set, but before it is placed in the DOM.
            if (config.onNodeCreated) {
                config.onNodeCreated(node, config, moduleName, url);
            }

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation is that a build has been done so
                //that only one script needs to be loaded anyway. This may need
                //to be reevaluated if other use cases become common.

                // Post a task to the event loop to work around a bug in WebKit
                // where the worker gets garbage-collected after calling
                // importScripts(): https://webkit.org/b/153317
                setTimeout(function() {}, 0);
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one,
                //but only do so if the data-main value is not a loader plugin
                //module ID.
                if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, commentReplace)
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        if (context) {
            context.defQueue.push([name, deps, callback]);
            context.defQueueMap[name] = true;
        } else {
            globalDefQueue.push([name, deps, callback]);
        }
    };

    define.amd = {
        jQuery: true
    };

    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this, (typeof setTimeout === 'undefined' ? undefined : setTimeout)));

// Voxbone Click2Vox Widget library
// Version - v2.4.0

/* jshint ignore:start */

/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.3.2 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, https://github.com/requirejs/requirejs/blob/master/LICENSE
 */
var requirejs,require,define;!function(global,setTimeout){function commentReplace(e,t){return t||""}function isFunction(e){return"[object Function]"===ostring.call(e)}function isArray(e){return"[object Array]"===ostring.call(e)}function each(e,t){if(e){var i;for(i=0;i<e.length&&(!e[i]||!t(e[i],i,e));i+=1);}}function eachReverse(e,t){if(e){var i;for(i=e.length-1;i>-1&&(!e[i]||!t(e[i],i,e));i-=1);}}function hasProp(e,t){return hasOwn.call(e,t)}function getOwn(e,t){return hasProp(e,t)&&e[t]}function eachProp(e,t){var i;for(i in e)if(hasProp(e,i)&&t(e[i],i))break}function mixin(e,t,i,r){return t&&eachProp(t,function(t,n){!i&&hasProp(e,n)||(!r||"object"!=typeof t||!t||isArray(t)||isFunction(t)||t instanceof RegExp?e[n]=t:(e[n]||(e[n]={}),mixin(e[n],t,i,r)))}),e}function bind(e,t){return function(){return t.apply(e,arguments)}}function scripts(){return document.getElementsByTagName("script")}function defaultOnError(e){throw e}function getGlobal(e){if(!e)return e;var t=global;return each(e.split("."),function(e){t=t[e]}),t}function makeError(e,t,i,r){var n=new Error(t+"\nhttp://requirejs.org/docs/errors.html#"+e);return n.requireType=e,n.requireModules=r,i&&(n.originalError=i),n}function newContext(e){function t(e){var t,i;for(t=0;t<e.length;t++)if(i=e[t],"."===i)e.splice(t,1),t-=1;else if(".."===i){if(0===t||1===t&&".."===e[2]||".."===e[t-1])continue;t>0&&(e.splice(t-1,2),t-=2)}}function i(e,i,r){var n,o,a,s,u,c,d,p,f,l,h,m,g=i&&i.split("/"),v=y.map,x=v&&v["*"];if(e&&(e=e.split("/"),d=e.length-1,y.nodeIdCompat&&jsSuffixRegExp.test(e[d])&&(e[d]=e[d].replace(jsSuffixRegExp,"")),"."===e[0].charAt(0)&&g&&(m=g.slice(0,g.length-1),e=m.concat(e)),t(e),e=e.join("/")),r&&v&&(g||x)){a=e.split("/");e:for(s=a.length;s>0;s-=1){if(c=a.slice(0,s).join("/"),g)for(u=g.length;u>0;u-=1)if(o=getOwn(v,g.slice(0,u).join("/")),o&&(o=getOwn(o,c))){p=o,f=s;break e}!l&&x&&getOwn(x,c)&&(l=getOwn(x,c),h=s)}!p&&l&&(p=l,f=h),p&&(a.splice(0,f,p),e=a.join("/"))}return n=getOwn(y.pkgs,e),n?n:e}function r(e){isBrowser&&each(scripts(),function(t){if(t.getAttribute("data-requiremodule")===e&&t.getAttribute("data-requirecontext")===q.contextName)return t.parentNode.removeChild(t),!0})}function n(e){var t=getOwn(y.paths,e);if(t&&isArray(t)&&t.length>1)return t.shift(),q.require.undef(e),q.makeRequire(null,{skipMap:!0})([e]),!0}function o(e){var t,i=e?e.indexOf("!"):-1;return i>-1&&(t=e.substring(0,i),e=e.substring(i+1,e.length)),[t,e]}function a(e,t,r,n){var a,s,u,c,d=null,p=t?t.name:null,f=e,l=!0,h="";return e||(l=!1,e="_@r"+(T+=1)),c=o(e),d=c[0],e=c[1],d&&(d=i(d,p,n),s=getOwn(j,d)),e&&(d?h=s&&s.normalize?s.normalize(e,function(e){return i(e,p,n)}):e.indexOf("!")===-1?i(e,p,n):e:(h=i(e,p,n),c=o(h),d=c[0],h=c[1],r=!0,a=q.nameToUrl(h))),u=!d||s||r?"":"_unnormalized"+(A+=1),{prefix:d,name:h,parentMap:t,unnormalized:!!u,url:a,originalName:f,isDefine:l,id:(d?d+"!"+h:h)+u}}function s(e){var t=e.id,i=getOwn(S,t);return i||(i=S[t]=new q.Module(e)),i}function u(e,t,i){var r=e.id,n=getOwn(S,r);!hasProp(j,r)||n&&!n.defineEmitComplete?(n=s(e),n.error&&"error"===t?i(n.error):n.on(t,i)):"defined"===t&&i(j[r])}function c(e,t){var i=e.requireModules,r=!1;t?t(e):(each(i,function(t){var i=getOwn(S,t);i&&(i.error=e,i.events.error&&(r=!0,i.emit("error",e)))}),r||req.onError(e))}function d(){globalDefQueue.length&&(each(globalDefQueue,function(e){var t=e[0];"string"==typeof t&&(q.defQueueMap[t]=!0),O.push(e)}),globalDefQueue=[])}function p(e){delete S[e],delete k[e]}function f(e,t,i){var r=e.map.id;e.error?e.emit("error",e.error):(t[r]=!0,each(e.depMaps,function(r,n){var o=r.id,a=getOwn(S,o);!a||e.depMatched[n]||i[o]||(getOwn(t,o)?(e.defineDep(n,j[o]),e.check()):f(a,t,i))}),i[r]=!0)}function l(){var e,t,i=1e3*y.waitSeconds,o=i&&q.startTime+i<(new Date).getTime(),a=[],s=[],u=!1,d=!0;if(!x){if(x=!0,eachProp(k,function(e){var i=e.map,c=i.id;if(e.enabled&&(i.isDefine||s.push(e),!e.error))if(!e.inited&&o)n(c)?(t=!0,u=!0):(a.push(c),r(c));else if(!e.inited&&e.fetched&&i.isDefine&&(u=!0,!i.prefix))return d=!1}),o&&a.length)return e=makeError("timeout","Load timeout for modules: "+a,null,a),e.contextName=q.contextName,c(e);d&&each(s,function(e){f(e,{},{})}),o&&!t||!u||!isBrowser&&!isWebWorker||w||(w=setTimeout(function(){w=0,l()},50)),x=!1}}function h(e){hasProp(j,e[0])||s(a(e[0],null,!0)).init(e[1],e[2])}function m(e,t,i,r){e.detachEvent&&!isOpera?r&&e.detachEvent(r,t):e.removeEventListener(i,t,!1)}function g(e){var t=e.currentTarget||e.srcElement;return m(t,q.onScriptLoad,"load","onreadystatechange"),m(t,q.onScriptError,"error"),{node:t,id:t&&t.getAttribute("data-requiremodule")}}function v(){var e;for(d();O.length;){if(e=O.shift(),null===e[0])return c(makeError("mismatch","Mismatched anonymous define() module: "+e[e.length-1]));h(e)}q.defQueueMap={}}var x,b,q,E,w,y={waitSeconds:7,baseUrl:"./",paths:{},bundles:{},pkgs:{},shim:{},config:{}},S={},k={},M={},O=[],j={},P={},R={},T=1,A=1;return E={require:function(e){return e.require?e.require:e.require=q.makeRequire(e.map)},exports:function(e){if(e.usingExports=!0,e.map.isDefine)return e.exports?j[e.map.id]=e.exports:e.exports=j[e.map.id]={}},module:function(e){return e.module?e.module:e.module={id:e.map.id,uri:e.map.url,config:function(){return getOwn(y.config,e.map.id)||{}},exports:e.exports||(e.exports={})}}},b=function(e){this.events=getOwn(M,e.id)||{},this.map=e,this.shim=getOwn(y.shim,e.id),this.depExports=[],this.depMaps=[],this.depMatched=[],this.pluginMaps={},this.depCount=0},b.prototype={init:function(e,t,i,r){r=r||{},this.inited||(this.factory=t,i?this.on("error",i):this.events.error&&(i=bind(this,function(e){this.emit("error",e)})),this.depMaps=e&&e.slice(0),this.errback=i,this.inited=!0,this.ignore=r.ignore,r.enabled||this.enabled?this.enable():this.check())},defineDep:function(e,t){this.depMatched[e]||(this.depMatched[e]=!0,this.depCount-=1,this.depExports[e]=t)},fetch:function(){if(!this.fetched){this.fetched=!0,q.startTime=(new Date).getTime();var e=this.map;return this.shim?void q.makeRequire(this.map,{enableBuildCallback:!0})(this.shim.deps||[],bind(this,function(){return e.prefix?this.callPlugin():this.load()})):e.prefix?this.callPlugin():this.load()}},load:function(){var e=this.map.url;P[e]||(P[e]=!0,q.load(this.map.id,e))},check:function(){if(this.enabled&&!this.enabling){var e,t,i=this.map.id,r=this.depExports,n=this.exports,o=this.factory;if(this.inited){if(this.error)this.emit("error",this.error);else if(!this.defining){if(this.defining=!0,this.depCount<1&&!this.defined){if(isFunction(o)){if(this.events.error&&this.map.isDefine||req.onError!==defaultOnError)try{n=q.execCb(i,o,r,n)}catch(t){e=t}else n=q.execCb(i,o,r,n);if(this.map.isDefine&&void 0===n&&(t=this.module,t?n=t.exports:this.usingExports&&(n=this.exports)),e)return e.requireMap=this.map,e.requireModules=this.map.isDefine?[this.map.id]:null,e.requireType=this.map.isDefine?"define":"require",c(this.error=e)}else n=o;if(this.exports=n,this.map.isDefine&&!this.ignore&&(j[i]=n,req.onResourceLoad)){var a=[];each(this.depMaps,function(e){a.push(e.normalizedMap||e)}),req.onResourceLoad(q,this.map,a)}p(i),this.defined=!0}this.defining=!1,this.defined&&!this.defineEmitted&&(this.defineEmitted=!0,this.emit("defined",this.exports),this.defineEmitComplete=!0)}}else hasProp(q.defQueueMap,i)||this.fetch()}},callPlugin:function(){var e=this.map,t=e.id,r=a(e.prefix);this.depMaps.push(r),u(r,"defined",bind(this,function(r){var n,o,d,f=getOwn(R,this.map.id),l=this.map.name,h=this.map.parentMap?this.map.parentMap.name:null,m=q.makeRequire(e.parentMap,{enableBuildCallback:!0});return this.map.unnormalized?(r.normalize&&(l=r.normalize(l,function(e){return i(e,h,!0)})||""),o=a(e.prefix+"!"+l,this.map.parentMap),u(o,"defined",bind(this,function(e){this.map.normalizedMap=o,this.init([],function(){return e},null,{enabled:!0,ignore:!0})})),d=getOwn(S,o.id),void(d&&(this.depMaps.push(o),this.events.error&&d.on("error",bind(this,function(e){this.emit("error",e)})),d.enable()))):f?(this.map.url=q.nameToUrl(f),void this.load()):(n=bind(this,function(e){this.init([],function(){return e},null,{enabled:!0})}),n.error=bind(this,function(e){this.inited=!0,this.error=e,e.requireModules=[t],eachProp(S,function(e){0===e.map.id.indexOf(t+"_unnormalized")&&p(e.map.id)}),c(e)}),n.fromText=bind(this,function(i,r){var o=e.name,u=a(o),d=useInteractive;r&&(i=r),d&&(useInteractive=!1),s(u),hasProp(y.config,t)&&(y.config[o]=y.config[t]);try{req.exec(i)}catch(e){return c(makeError("fromtexteval","fromText eval for "+t+" failed: "+e,e,[t]))}d&&(useInteractive=!0),this.depMaps.push(u),q.completeLoad(o),m([o],n)}),void r.load(e.name,m,n,y))})),q.enable(r,this),this.pluginMaps[r.id]=r},enable:function(){k[this.map.id]=this,this.enabled=!0,this.enabling=!0,each(this.depMaps,bind(this,function(e,t){var i,r,n;if("string"==typeof e){if(e=a(e,this.map.isDefine?this.map:this.map.parentMap,!1,!this.skipMap),this.depMaps[t]=e,n=getOwn(E,e.id))return void(this.depExports[t]=n(this));this.depCount+=1,u(e,"defined",bind(this,function(e){this.undefed||(this.defineDep(t,e),this.check())})),this.errback?u(e,"error",bind(this,this.errback)):this.events.error&&u(e,"error",bind(this,function(e){this.emit("error",e)}))}i=e.id,r=S[i],hasProp(E,i)||!r||r.enabled||q.enable(e,this)})),eachProp(this.pluginMaps,bind(this,function(e){var t=getOwn(S,e.id);t&&!t.enabled&&q.enable(e,this)})),this.enabling=!1,this.check()},on:function(e,t){var i=this.events[e];i||(i=this.events[e]=[]),i.push(t)},emit:function(e,t){each(this.events[e],function(e){e(t)}),"error"===e&&delete this.events[e]}},q={config:y,contextName:e,registry:S,defined:j,urlFetched:P,defQueue:O,defQueueMap:{},Module:b,makeModuleMap:a,nextTick:req.nextTick,onError:c,configure:function(e){if(e.baseUrl&&"/"!==e.baseUrl.charAt(e.baseUrl.length-1)&&(e.baseUrl+="/"),"string"==typeof e.urlArgs){var t=e.urlArgs;e.urlArgs=function(e,i){return(i.indexOf("?")===-1?"?":"&")+t}}var i=y.shim,r={paths:!0,bundles:!0,config:!0,map:!0};eachProp(e,function(e,t){r[t]?(y[t]||(y[t]={}),mixin(y[t],e,!0,!0)):y[t]=e}),e.bundles&&eachProp(e.bundles,function(e,t){each(e,function(e){e!==t&&(R[e]=t)})}),e.shim&&(eachProp(e.shim,function(e,t){isArray(e)&&(e={deps:e}),!e.exports&&!e.init||e.exportsFn||(e.exportsFn=q.makeShimExports(e)),i[t]=e}),y.shim=i),e.packages&&each(e.packages,function(e){var t,i;e="string"==typeof e?{name:e}:e,i=e.name,t=e.location,t&&(y.paths[i]=e.location),y.pkgs[i]=e.name+"/"+(e.main||"main").replace(currDirRegExp,"").replace(jsSuffixRegExp,"")}),eachProp(S,function(e,t){e.inited||e.map.unnormalized||(e.map=a(t,null,!0))}),(e.deps||e.callback)&&q.require(e.deps||[],e.callback)},makeShimExports:function(e){function t(){var t;return e.init&&(t=e.init.apply(global,arguments)),t||e.exports&&getGlobal(e.exports)}return t},makeRequire:function(t,n){function o(i,r,u){var d,p,f;return n.enableBuildCallback&&r&&isFunction(r)&&(r.__requireJsBuild=!0),"string"==typeof i?isFunction(r)?c(makeError("requireargs","Invalid require call"),u):t&&hasProp(E,i)?E[i](S[t.id]):req.get?req.get(q,i,t,o):(p=a(i,t,!1,!0),d=p.id,hasProp(j,d)?j[d]:c(makeError("notloaded",'Module name "'+d+'" has not been loaded yet for context: '+e+(t?"":". Use require([])")))):(v(),q.nextTick(function(){v(),f=s(a(null,t)),f.skipMap=n.skipMap,f.init(i,r,u,{enabled:!0}),l()}),o)}return n=n||{},mixin(o,{isBrowser:isBrowser,toUrl:function(e){var r,n=e.lastIndexOf("."),o=e.split("/")[0],a="."===o||".."===o;return n!==-1&&(!a||n>1)&&(r=e.substring(n,e.length),e=e.substring(0,n)),q.nameToUrl(i(e,t&&t.id,!0),r,!0)},defined:function(e){return hasProp(j,a(e,t,!1,!0).id)},specified:function(e){return e=a(e,t,!1,!0).id,hasProp(j,e)||hasProp(S,e)}}),t||(o.undef=function(e){d();var i=a(e,t,!0),n=getOwn(S,e);n.undefed=!0,r(e),delete j[e],delete P[i.url],delete M[e],eachReverse(O,function(t,i){t[0]===e&&O.splice(i,1)}),delete q.defQueueMap[e],n&&(n.events.defined&&(M[e]=n.events),p(e))}),o},enable:function(e){var t=getOwn(S,e.id);t&&s(e).enable()},completeLoad:function(e){var t,i,r,o=getOwn(y.shim,e)||{},a=o.exports;for(d();O.length;){if(i=O.shift(),null===i[0]){if(i[0]=e,t)break;t=!0}else i[0]===e&&(t=!0);h(i)}if(q.defQueueMap={},r=getOwn(S,e),!t&&!hasProp(j,e)&&r&&!r.inited){if(!(!y.enforceDefine||a&&getGlobal(a)))return n(e)?void 0:c(makeError("nodefine","No define call for "+e,null,[e]));h([e,o.deps||[],o.exportsFn])}l()},nameToUrl:function(e,t,i){var r,n,o,a,s,u,c,d=getOwn(y.pkgs,e);if(d&&(e=d),c=getOwn(R,e))return q.nameToUrl(c,t,i);if(req.jsExtRegExp.test(e))s=e+(t||"");else{for(r=y.paths,n=e.split("/"),o=n.length;o>0;o-=1)if(a=n.slice(0,o).join("/"),u=getOwn(r,a)){isArray(u)&&(u=u[0]),n.splice(0,o,u);break}s=n.join("/"),s+=t||(/^data\:|^blob\:|\?/.test(s)||i?"":".js"),s=("/"===s.charAt(0)||s.match(/^[\w\+\.\-]+:/)?"":y.baseUrl)+s}return y.urlArgs&&!/^blob\:/.test(s)?s+y.urlArgs(e,s):s},load:function(e,t){req.load(q,e,t)},execCb:function(e,t,i,r){return t.apply(r,i)},onScriptLoad:function(e){if("load"===e.type||readyRegExp.test((e.currentTarget||e.srcElement).readyState)){interactiveScript=null;var t=g(e);q.completeLoad(t.id)}},onScriptError:function(e){var t=g(e);if(!n(t.id)){var i=[];return eachProp(S,function(e,r){0!==r.indexOf("_@r")&&each(e.depMaps,function(e){if(e.id===t.id)return i.push(r),!0})}),c(makeError("scripterror",'Script error for "'+t.id+(i.length?'", needed by: '+i.join(", "):'"'),e,[t.id]))}}},q.require=q.makeRequire(),q}function getInteractiveScript(){return interactiveScript&&"interactive"===interactiveScript.readyState?interactiveScript:(eachReverse(scripts(),function(e){if("interactive"===e.readyState)return interactiveScript=e}),interactiveScript)}var req,s,head,baseElement,dataMain,src,interactiveScript,currentlyAddingScript,mainScript,subPath,version="2.3.2",commentRegExp=/\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/gm,cjsRequireRegExp=/[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,jsSuffixRegExp=/\.js$/,currDirRegExp=/^\.\//,op=Object.prototype,ostring=op.toString,hasOwn=op.hasOwnProperty,isBrowser=!("undefined"==typeof window||"undefined"==typeof navigator||!window.document),isWebWorker=!isBrowser&&"undefined"!=typeof importScripts,readyRegExp=isBrowser&&"PLAYSTATION 3"===navigator.platform?/^complete$/:/^(complete|loaded)$/,defContextName="_",isOpera="undefined"!=typeof opera&&"[object Opera]"===opera.toString(),contexts={},cfg={},globalDefQueue=[],useInteractive=!1;if("undefined"==typeof define){if("undefined"!=typeof requirejs){if(isFunction(requirejs))return;cfg=requirejs,requirejs=void 0}"undefined"==typeof require||isFunction(require)||(cfg=require,require=void 0),req=requirejs=function(e,t,i,r){var n,o,a=defContextName;return isArray(e)||"string"==typeof e||(o=e,isArray(t)?(e=t,t=i,i=r):e=[]),o&&o.context&&(a=o.context),n=getOwn(contexts,a),n||(n=contexts[a]=req.s.newContext(a)),o&&n.configure(o),n.require(e,t,i)},req.config=function(e){return req(e)},req.nextTick="undefined"!=typeof setTimeout?function(e){setTimeout(e,4)}:function(e){e()},require||(require=req),req.version=version,req.jsExtRegExp=/^\/|:|\?|\.js$/,req.isBrowser=isBrowser,s=req.s={contexts:contexts,newContext:newContext},req({}),each(["toUrl","undef","defined","specified"],function(e){req[e]=function(){var t=contexts[defContextName];return t.require[e].apply(t,arguments)}}),isBrowser&&(head=s.head=document.getElementsByTagName("head")[0],baseElement=document.getElementsByTagName("base")[0],baseElement&&(head=s.head=baseElement.parentNode)),req.onError=defaultOnError,req.createNode=function(e,t,i){var r=e.xhtml?document.createElementNS("http://www.w3.org/1999/xhtml","html:script"):document.createElement("script");return r.type=e.scriptType||"text/javascript",r.charset="utf-8",r.async=!0,r},req.load=function(e,t,i){var r,n=e&&e.config||{};if(isBrowser)return r=req.createNode(n,t,i),r.setAttribute("data-requirecontext",e.contextName),r.setAttribute("data-requiremodule",t),!r.attachEvent||r.attachEvent.toString&&r.attachEvent.toString().indexOf("[native code")<0||isOpera?(r.addEventListener("load",e.onScriptLoad,!1),r.addEventListener("error",e.onScriptError,!1)):(useInteractive=!0,r.attachEvent("onreadystatechange",e.onScriptLoad)),r.src=i,n.onNodeCreated&&n.onNodeCreated(r,n,t,i),currentlyAddingScript=r,baseElement?head.insertBefore(r,baseElement):head.appendChild(r),currentlyAddingScript=null,r;if(isWebWorker)try{setTimeout(function(){},0),importScripts(i),e.completeLoad(t)}catch(r){e.onError(makeError("importscripts","importScripts failed for "+t+" at "+i,r,[t]))}},isBrowser&&!cfg.skipDataMain&&eachReverse(scripts(),function(e){if(head||(head=e.parentNode),dataMain=e.getAttribute("data-main"))return mainScript=dataMain,cfg.baseUrl||mainScript.indexOf("!")!==-1||(src=mainScript.split("/"),mainScript=src.pop(),subPath=src.length?src.join("/")+"/":"./",cfg.baseUrl=subPath),mainScript=mainScript.replace(jsSuffixRegExp,""),req.jsExtRegExp.test(mainScript)&&(mainScript=dataMain),cfg.deps=cfg.deps?cfg.deps.concat(mainScript):[mainScript],!0}),define=function(e,t,i){var r,n;"string"!=typeof e&&(i=t,t=e,e=null),isArray(t)||(i=t,t=null),!t&&isFunction(i)&&(t=[],i.length&&(i.toString().replace(commentRegExp,commentReplace).replace(cjsRequireRegExp,function(e,i){t.push(i)}),t=(1===i.length?["require"]:["require","exports","module"]).concat(t))),useInteractive&&(r=currentlyAddingScript||getInteractiveScript(),r&&(e||(e=r.getAttribute("data-requiremodule")),n=contexts[r.getAttribute("data-requirecontext")])),n?(n.defQueue.push([e,t,i]),n.defQueueMap[e]=!0):globalDefQueue.push([e,t,i])},define.amd={jQuery:!0},req.exec=function(text){return eval(text)},req(cfg)}}(this,"undefined"==typeof setTimeout?void 0:setTimeout);

/* jshint ignore:end */
var requirejs, require, define, infoVoxbone;
(function(click2vox) {
  var voxButtonElement, voxButtonElements, audioContext, predefinedHtmlButton, click2vox_ready;
  var button_id = document.currentScript.dataset.button_id;
  var customText = '';

  requirejs.config({
    paths: {
      draggabilly: [
        click2Dial.server_url + "/scripts/draggabilly.pkgd.min",
      ],
      voxbone: click2Dial.server_url + "/scripts/voxbone-2.2.min",
      libjitsi: click2Dial.server_url + "/scripts/lib-jitsi-meet.min",
      jquery: click2Dial.server_url + "/scripts/jquery-2.1.1.min"
    }
  });

  if (click2Dial.protocol == "sip")
  {
      /* Begin loading voxbone and assets only if this script didnt execute before*/
      if (!voxButtonElements) {
        requirejs(['voxbone'],
          function() {
            loadAssets();
          }
        );
      }
  }
  else {
      /* Begin loading libjitsi and assets only if this script didnt execute before*/
      if (!window.JitsiMeetJS) {
        requirejs(['jquery'],
          function() {
            console.log("jquery loaded");
            requirejs(['libjitsi'],
              function(jitsi) {
                window.JitsiMeetJS = jitsi;
                loadJitsi();
                console.log("libjitsi loaded", JitsiMeetJS);
              }
            );
          }
        );
      }
  }

  try {
    if (audioContext === undefined)
      audioContext = new AudioContext();
  } catch (e) {
    console.error("Web Audio API not supported " + e);
  }

  voxButtonElements = document.getElementsByClassName('voxButton');
  if (voxButtonElements === undefined || voxButtonElements.length === 0) {
    predefinedHtmlButton = false;
    voxButtonElements = [];
    voxButtonElements[0] = document.createElement("div");
    voxButtonElements[0].className = "voxButton";
    voxButtonElements[0].dataset.use_default_button_css = false;
    //Append button if DID is defined
    if (click2vox.did) document.body.appendChild(voxButtonElements[0]);
  } else {
    predefinedHtmlButton = true;
  }

  // extend.js
  // Written by Andrew Dupont, optimized by Addy Osmani
  function extend(destination, source) {

    var toString = Object.prototype.toString,
      objTest = toString.call({});

    for (var property in source) {
      if (source[property] && objTest === toString.call(source[property])) {
        destination[property] = destination[property] || {};
        extend(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }
    return destination;
  }

  //exposed methods through click2vox global variable
  if (predefinedHtmlButton === false) {
    extend(click2vox, {

      makeCall: function(displayWidget) {
        var startCall = function () {
          if (!displayWidget) {
            voxbone.WebRTC.call(infoVoxbone.did);
          } else {
            makeCall();
          }
        };
        if (click2vox_ready) {
          startCall();
        } else {
          document.addEventListener("click2vox-ready", function() {
            startCall();
          }, false);
        }
      },

      onCall: function() {
        return voxbone.WebRTC.onCall;
      },

      hangUp: function() {
        voxbone.WebRTC.hangup();
      },

      destroyWidget: function() {
        try {
          var parent = voxButtonElement.querySelector('.vox-widget-wrapper');
          var child = parent.children;
          parent.removeChild(child[0]);
        } catch (e) {
          console.warn(e);
        }
      }
    });

  }

  var head = document.getElementsByTagName('head')[0];

  function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  var loadJitsi = function() {
    console.debug("loadJitsi");

    var connection = null;
    var conference = null;
    var remoteTracks = {};
    var media = {};
    var localTracks = [];


    voxbone = {WebRTC: {
        configuration: {},
        customEventHandler: {},
        rtcSession: {
            isEstablished: function(){ return connection && connection.xmpp.connection.connected},
            isEnded: function(){ return !connection || !connection.xmpp.connection.connected},
        },
        unloadHandler: function() {
            this.hangup();
        },

        sendDTMF: function(digit) {
            console.debug("loadJitsi sendDTMF", digit);
            conference.sendTextMessage(digit);
        },

        hangup: function() {

            if (connection && connection.xmpp.connection.connected)
            {
                try {
                    conference.leave();
                    connection.disconnect();
                } catch (e) {}
            }
            tidyConference();
        },

        mute: function() {
            localTracks.forEach(function(flow)
            {
                if (flow.getType() === 'audio')
                {
                    flow.mute();
                    voxbone.WebRTC.isMuted = true;
                }
            });

            console.debug("loadJitsi mute", voxbone.WebRTC.isMuted);
        },

        unmute: function() {
            localTracks.forEach(function(flow)
            {
                if (flow.getType() === 'audio')
                {
                    flow.unmute();
                    voxbone.WebRTC.isMuted = false;
                }
            });
            console.debug("loadJitsi unmute", voxbone.WebRTC.isMuted);
        },

        call: function(room) {
            JitsiMeetJS.createLocalTracks({devices: ["audio"]}).then(function(tracks)
            {
                console.debug("loadJitsi call", room, tracks);

                var localId = "local-audio-" + room;
                var localAudio = document.getElementById(localId);

                if (!localAudio)
                {
                    localAudio = new Audio();
                    localAudio.id = localId;
                    localAudio.controls = false;
                    localAudio.autoplay = true;
                    localAudio.muted = true;
                    localAudio.volume = 1;
                    document.body.appendChild(localAudio);
                }

                var remoteId = "remote-audio-" + room;
                var remoteAudio = document.getElementById(remoteId);

                if (!remoteAudio)
                {
                    remoteAudio = new Audio();
                    remoteAudio.id = remoteId;
                    remoteAudio.controls = false;
                    remoteAudio.autoplay = true;
                    remoteAudio.muted = false;
                    remoteAudio.volume = 1;
                    document.body.appendChild(remoteAudio);
                }

                media = {local: {audio: localAudio}, remote: {audio: remoteAudio}};
                setupConference(room, tracks);

            }).catch(function (error)
            {
                console.error("loadJitsi call error", error)
            });
        }
    }};

    const config = {
        hosts: {
            domain: click2Dial.xmpp.domain,
            muc: "conference." + click2Dial.xmpp.domain,
        },
        p2p: {
            enabled: true,
            preferH264: true,
            disableH264: true,
            useStunTurn: true,
            stunServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        },
        bosh: click2Dial.xmpp.server,
        clientNode: 'click2dial'
    };

    var tidyConference = function()
    {
        var cleanupTracks = function(trackName)
        {
            remoteTracks[trackName].forEach(function(track)
            {
                track.track.stop();

                if (media && media.remote)
                {
                    if (track.getType() === 'audio' && media.remote.audio)
                    {
                       track.detach(media.remote.audio);
                       if (media.remote.audio.parentNode) media.remote.audio.parentNode.removeChild(media.remote.audio);
                    }
                }
            });

            delete remoteTracks[trackName];
        }


        Object.getOwnPropertyNames(remoteTracks).forEach(function(trackName)
        {
            cleanupTracks(trackName);
        });

        localTracks.forEach(function(track)
        {
            if (track.getType() === 'audio' && media.local.audio)
            {
               track.detach(media.local.audio);
               if (media.local.audio.parentNode) media.local.audio.parentNode.removeChild(media.local.audio);

                try {
                    conference.removeTrack(track);
                    track.dispose();
                } catch (e) {}
            }

            console.debug("tidyConference localtrack", track);
        });
    };

    var setupConference = function(room, tracks)
    {
        connection = new JitsiMeetJS.JitsiConnection(null, null, config);

        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, function(id)
        {
            console.debug("loadJitsi connected!", id);

            tracks.forEach(function(track)
            {
                if (track.getType() === 'audio')  track.attach(media.local.audio);
            });

            localTracks = tracks;
            conference = connection.initJitsiConference(room, {openBridgeChannel: true});

            conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, function (track)
            {
                const participant = track.getParticipantId();
                console.debug("loadJitsi first track addedd!!!", participant, track);

                if(track.isLocal())
                {
                    voxbone.WebRTC.customEventHandler.accepted();
                    return;
                }

                if (!remoteTracks[participant]) remoteTracks[participant] = [];

                if (remoteTracks[participant].length == 0)
                {
                    if (track.getType() === 'audio')
                    {
                        remoteTracks[participant].push(track);
                        track.attach(media.remote.audio);
                    }
                }
            });

            conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, function (track)
            {
                const participant = track.getParticipantId();
                console.debug("loadJitsi track removed!!!", participant, track);

                if(track.isLocal())
                {
                    voxbone.WebRTC.customEventHandler.ended();
                    return;
                }
            });

            conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function ()
            {
                console.debug("loadJitsi conference joined!", room, tracks, media);

                localTracks.forEach(function(track)
                {
                    if (track.getType() === 'audio') conference.addTrack(track);
                });
            });

            conference.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function ()
            {
                console.debug("loadJitsi conference left!");
            });

            conference.on(JitsiMeetJS.events.conference.USER_JOINED, function (id)
            {
                console.debug("loadJitsi user join", id);
            });

            conference.on(JitsiMeetJS.events.conference.USER_LEFT, function (id)
            {
                console.debug("loadJitsi user left", id);
            });

            conference.on(JitsiMeetJS.events.conference.MESSAGE_RECEIVED , function(id, text, ts)
            {
                var participant = conference.getParticipantById(id);
                var displayName = participant ? participant._displayName || id.split("-")[0] : "Me";

                console.debug("loadJitsi message", id, text, ts, displayName);
            });

            conference.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, function (id)
            {
                console.debug("loadJitsi dominant speaker changed", id);
            });

            conference.join();
        });

        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, function()
        {
            console.error("loadJitsi connection failed!")
        });

        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.debug("loadJitsi disconnected!");
        });

        connection.connect();
    }

    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    JitsiMeetJS.init({disableAudioLevels: true});

    loadAssets();
  };


  var loadAssets = (function() {
    Array.prototype.forEach.call(voxButtonElements, function(voxButtonElement) {
      //do not continue if DID is undefined
      //we have to do this because now click2vox website loads a click2vox button without did defined
      if (click2vox.did === undefined && !predefinedHtmlButton) {
        console.error('Voxbone DID number is not defined.');
        return;
      }

      if (click2vox.did !== undefined) {
        infoVoxbone = click2vox;
        loadCss(click2Dial.server_url + '/stylesheets/font-awesome.css');
      } else {
        infoVoxbone = voxButtonElement.dataset;
      }

      infoVoxbone.server_url = (infoVoxbone.server_url === undefined) ? 'https://click2vox.com' : infoVoxbone.server_url;

      if (infoVoxbone.use_default_button_css !== 'false')
        loadCss(click2Dial.server_url + '/stylesheets/vxb-button.css');

      if (infoVoxbone.display_button !== 'false')
        renderButton(voxButtonElement);
    });

    voxButtonElement = voxButtonElements[0];
    if (click2vox.did !== undefined) {
      infoVoxbone = click2vox;
    } else {
      infoVoxbone = voxButtonElement.dataset;
    }
    loadCss(click2Dial.server_url + '/stylesheets/vxb-widget.css');
    loadCss(click2Dial.server_url + '/stylesheets/custom.css');

    //Bind click event to rendered buttons
    handleEvent('click', '.vxb-widget-box #launch_call', function(e) {
      voxButtonElement = this.parentElement.parentElement;
      e.preventDefault();
      if (click2vox.did !== undefined) {
        infoVoxbone = click2vox;
      } else {
        infoVoxbone = voxButtonElement.dataset;
      }
      customText = '';

      if (infoVoxbone.widget_texts) {
        try {
          customText = JSON.parse(infoVoxbone.widget_texts).custom;
        } catch (error) {}
      }

      if (!isChromeOnHttp()) {
        makeCall();
      } else if (!isPopUp() && infoVoxbone.https_popup !== 'false') {
        openPopup();
        return false;
      }

    });

    initVoxbone();
  });

  var renderButton = (function(voxButtonElement) {
    if (click2vox.did !== undefined) {
      infoVoxbone = click2vox;
    } else {
      infoVoxbone = voxButtonElement.dataset;
    }

    //get button_id if it is passed as data-button_id=58a1ce63ea9a984006ae68c6 first, this is only for the ratings
    if (button_id) infoVoxbone.button_id = button_id;
    var links = '';
    var show_frame = infoVoxbone.show_frame !== 'false';
    var customText = '';

    /*Keep the button hidden until all assets and the call is ready
     to be made. This avoids glitches and prohibits the user to
     click on a non ready button. If the browser doesnt support webrtc
     we don't want to hide the button, since the readyToCall event will
     never fire*/
    if (isWebRTCSupported() && !isChromeOnHttp())
      voxButtonElement.style.display = 'none';

    if (infoVoxbone.widget_texts) {
      try {
        customText = JSON.parse(infoVoxbone.widget_texts).custom;
      } catch (error) {
        console.error(error);
      }
    }

    if (!show_frame || !predefinedHtmlButton) {
      infoVoxbone.div_css_class_name += ' no-frame';
      infoVoxbone.div_css_class_name += ' no-branding';
      infoVoxbone.test_setup = 'false';
      infoVoxbone.show_branding = 'false';
    }

    if (infoVoxbone.test_setup !== 'false') {
      if (customText.test_your_setup) {
        links = '\
        <div class="widget-footer-left">\
          <a class="widget-footer-left-text" href="https://test.webrtc.org/" target="_blank">' + customText.test_your_setup + '</a>\
        </div>\
        ';
      } else {
        links = '\
        <div class="widget-footer-left">\
          <a class="widget-footer-left-text" href="https://test.webrtc.org/" target="_blank">Test your setup</a>\
        </div>\
        ';
      }
    }

    if (infoVoxbone.show_branding !== 'false') {
      if (customText.powered_by) {
        links += '\
        <div class="widget-footer-right">\
          <a class="widget-footer-right-text" href="https://freeswitch.org" target="_blank">' + customText.powered_by + '</a>\
        </div> \
        ';
      } else {
        links += '\
        <div class="widget-footer-right">\
          <a class="widget-footer-right-text" href="https://freeswitch.org" target="_blank">powered by:</a>\
        </div> \
        ';
      }
    }

    var custom_button_color = '';
    if (infoVoxbone.custom_button_color) {
      custom_button_color = 'style="border: ' + infoVoxbone.custom_button_color + '; background: ' + infoVoxbone.custom_button_color + '"';
    }

    var custom_frame_color = '';
    if (infoVoxbone.custom_frame_color) {
      custom_frame_color = "background:" + infoVoxbone.custom_frame_color;
    }

    if (!isWebRTCSupported() && infoVoxbone.incompatible_browser_configuration === 'hide_widget') {
      custom_frame_color += (isWebRTCSupported() ? '' : '; display: none; ');
    } else if (!isWebRTCSupported() && infoVoxbone.incompatible_browser_configuration === 'show_text_html') {
      voxButtonElement.innerHTML += ' \
      <div style="' + custom_frame_color + '" id="launch_call_div" class="vxb-widget-box ' + (infoVoxbone.div_css_class_name || "style-b") + '">\
        <span>' + unescape(infoVoxbone.text_html) + '</span>\
      </div>\
      ';
    } else if (predefinedHtmlButton) {
      voxButtonElement.innerHTML += ' \
      <div style="' + custom_frame_color + '" id="launch_call_div" class="vxb-widget-box ' + (infoVoxbone.div_css_class_name || "style-b") + '">\
        <button id="launch_call" ' + custom_button_color + ' class="vxb-btn-style ' + (infoVoxbone.button_css_class_name) + '"><span>' + unescape(customText.button || infoVoxbone.text) + '</span></button>\
        ' + links + '\
      </div>\
      ';
    } else {
      voxButtonElement.innerHTML += ' \
      <div style="' + custom_frame_color + '" id="launch_call_div" class="vxb-widget-box no-frame no-branding wdgt-float ' + (infoVoxbone.placement) + ' ' + (infoVoxbone.div_css_class_name || 'btn-style-round-a') + '">\
        <button id="launch_call" ' + custom_button_color + ' class="vxb-btn-style ' + (infoVoxbone.button_css_class_name || 'btn-style-round-a') + '"><i class="fa fa-phone"></i></button>\
        ' + links + '\
      </div>\
      ';
    }
  });

  var renderWidget = (function() {
    //If the widget was already rendered, remove it
    var oldAudioTag = document.getElementById("audio-ringback-tone");
    if (oldAudioTag)
      oldAudioTag.parentNode.removeChild(oldAudioTag);
    var oldWrapper = document.getElementsByClassName("vox-widget-wrapper")[0];
    if (oldWrapper)
      oldWrapper.parentNode.removeChild(oldWrapper);

    // Don't load anything if we're not going to show anything
    if (!isWebRTCSupported() && (!infoVoxbone.incompatible_browser_configuration || infoVoxbone.incompatible_browser_configuration === 'hide_widget')) {
      console.error('Not showing the Voxbone Button/Widget');
      return;
    }

    var voxBranding = '\
      <div id="vw-footer" class="vw-footer"> \
        <a class="vw-footer-text" href="https://freeswitch.org" target="_blank">powered by:FreeSWITCH</a> \
      </div>\
    ';

    var voxPopup = ' \
      <audio id="audio-ringback-tone" preload="auto" loop> \
        <source src="' + click2Dial.server_url + '/audio/ringback-uk.mp3" type="audio/mp3"> \
      </audio> \
      <div style="display: none;" class="vox-widget-wrapper hidden"> \
        <div class="vw-main"> \
          <div class="vw-header"> \
            <div class="vw-title-bar"> \
              <span class="vw-title" id="vw-title">Starting Call</span> \
              <span class="vw-animated-dots">.</span> \
              <span class="vw-animated-dots">.</span> \
              <span class="vw-animated-dots">.</span> \
            </div> \
            <div class="vw-actions"> \
              <a href="#" class="vxb-widget-mic"> \
                <i class="vw-icon vx-icon-mic-dark"></i> \
                <div class="vox-mic-vumeter int-sensor-dark"> \
                  <em id="mic5"></em> \
                  <em id="mic4"></em> \
                  <em id="mic3"></em> \
                  <em id="mic2"></em> \
                  <em id="mic1"></em> \
                </div> \
              </a> \
              <a href="#" id="full-screen"><i class="vw-icon vx-icon-full-screen-off"></i></a> \
              <a href="#" id="close-screen"><i class="vw-icon vx-icon-close"></i></a> \
            </div> \
          </div> \
          <div id="vw-body" class="vw-body"> \
            <div id="vw-unable-to-acces-mic" class="vw-unable-to-acces-mic hidden"> \
              <p class="vw-unable-to-acces-mic-text" style="color: red;">Oops. It looks like we are unable to use your microphone.</p> \
              <p class="vw-unable-to-acces-mic-text-2" >Please enable microphone access in your browser to allow this call</p> \
            </div> \
            <div id="vw-in-call"> \
              <div id="vw-btn-group" class="vw-btn-group"> \
                <a href="#" class="vxb-widget-mic minimized"> \
                  <i class="vw-icon vx-icon-mic"></i> \
                  <div class="vox-mic-vumeter int-sensor"> \
                    <em id="mic5"></em> \
                    <em id="mic4"></em> \
                    <em id="mic3"></em> \
                    <em id="mic2"></em> \
                    <em id="mic1"></em> \
                  </div> \
                </a> \
                <a href="#" class="hidden"> \
                  <i class="vw-icon vx-icon-vol"></i> \
                  <div class="vox-audio-vumeter"> \
                    <em id="vol5"></em> \
                    <em id="vol4"></em> \
                    <em id="vol3"></em> \
                    <em id="vol2"></em> \
                    <em id="vol1"></em> \
                  </div> \
                </a> \
                <a href="#" id="dialpad"><i class="vw-icon vx-icon-pad"></i></a> \
              </div> \
              <a href="#" id="vw-end-call" class="vw-end-call"><i class="vw-icon vx-icon-phone"></i>End Call</a> \
              <div id="vw-dialpad" class="vw-dialpad"> \
                <ul> \
                  <li class="vw-dialpadkey-1 vw-tl">1</li> \
                  <li class="vw-dialpadkey-2">2</li> \
                  <li class="vw-dialpadkey-3 vw-tr">3</li> \
                  <li class="vw-dialpadkey-4">4</li> \
                  <li class="vw-dialpadkey-5">5</li> \
                  <li class="vw-dialpadkey-6">6</li> \
                  <li class="vw-dialpadkey-7">7</li> \
                  <li class="vw-dialpadkey-8">8</li> \
                  <li class="vw-dialpadkey-9">9</li> \
                  <li class="vw-dialpadkey-* vw-bl">*</li> \
                  <li class="vw-dialpadkey-0">0</li> \
                  <li class="vw-dialpadkey-# vw-br">#</li> \
                </ul> \
              </div> \
            </div> \
            <div id="vw-rating" class="vw-rating hidden"> \
              <form name="rating"> \
                <div id="vw-rating-question" class="vw-question">How was the quality of your call?</div> \
                <div id="vw-rating-stars" class="vw-stars"> \
                  <input type="radio" id="vxb-star5" name="vxb-rate" value="5"> \
                  <label for="vxb-star5" title="Excellent">5 stars</label> \
                  <input type="radio" id="vxb-star4" name="vxb-rate" value="4"> \
                  <label for="vxb-star4" title="Very Good">4 stars</label> \
                  <input type="radio" id="vxb-star3" name="vxb-rate" value="3"> \
                  <label for="vxb-star3" title="Good">3 stars</label> \
                  <input type="radio" id="vxb-star2" name="vxb-rate" value="2"> \
                  <label for="vxb-star2" title="Poor">2 stars</label> \
                  <input type="radio" id="vxb-star1" name="vxb-rate" value="1"> \
                  <label for="vxb-star1" title="Unacceptable">1 star</label> \
                </div> \
                <div id="vw-rating-message" class="vw-message">\
                  <p id="vw-rating-comment-question" class="vw-rating-question">Any additional feedback?</p> \
                  <input type="text" name="rating-message" id="rating-message" placeholder="Optional"" class="form-control"> \
                </div> \
                <div id="vw-rating-button" class="vw-button"> \
                  <button class="vxb-btn-style vxb-btn-style-disabled" id="send-rating"> \
                    <span class="send-rating-text">Send</span> \
                  </button> \
                </div> \
              </form> \
            </div> \
            <div id="vw-rating-after-message" class="vw-rating hidden"> \
              <p class="vw-rating-after-message-text">Thank you for using our service</p> \
            </div>\
    ';

    // showing voxbone branding
    if (infoVoxbone.show_branding !== 'false')
      voxPopup += voxBranding;

    // let's close the popup markup
    voxPopup += '\
          </div> \
        </div> \
      </div> \
    ';

    if (voxButtonElement) {
      voxButtonElement.insertAdjacentHTML('beforeend', voxPopup);
      editText(customText);
    }

    // Start of Widget Events
    //
    // Click on Send Rating button event
    handleEvent('click', '.vox-widget-wrapper #send-rating', function(e) {
      e.preventDefault();

      var rate = document.querySelector('.vox-widget-wrapper input[name=vxb-rate]:checked');
      if (!rate) return;

      var comment = document.querySelector('.vox-widget-wrapper #rating-message');
      var commentValue = comment ? comment.value : "";

      var data = { rate: rate.value, comment: commentValue, url: document.URL, token: infoVoxbone.button_id };
      var message = { action: 'rate', data: data };

      sendRate(message.data);

      hideElement(".vox-widget-wrapper #vw-rating");
      showElement(".vox-widget-wrapper #vw-rating-after-message");

      if (isPopUp())
        closePopUp();
    });

    // Click Rating star buttons event
    var starRatingButtons = document.querySelectorAll(".vox-widget-wrapper input[name=vxb-rate]");
    Array.prototype.forEach.call(starRatingButtons, function(el, i) {
      el.addEventListener('click', function(e) {
        var element = document.querySelector(".vox-widget-wrapper #send-rating");
        element.classList.add('vxb-btn-style');
        element.classList.remove('vxb-btn-style-disabled');
      });
    });

    // Click on Pad buttons event
    var padButtons = document.querySelectorAll(".vox-widget-wrapper .vw-dialpad li");
    Array.prototype.forEach.call(padButtons, function(el, i) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        callAction(this.textContent);
      });
    });

    // Get dialpad values from keyboard
    document.body.addEventListener('keydown', function(event) {

      // Avoid capturing keys if the focus is in an element which captures keys
      if (['input', 'select'].indexOf(event.target.nodeName.toLowerCase()) > -1)
        return;

      // Only catch 0,1,2,3,4,5,6,7,8,9,*,# keys
      if (!event.key.match(/[0-9\*#]/))
        return;

      // Only catch keys if there is a call on going
      if (!isInCall())
        return;

      var el = document.getElementsByClassName(`vw-dialpadkey-${event.key}`)[0];
      if (el) {
        el.classList.add('active');
      }

      callAction(event.key);
    });

    document.body.addEventListener('keyup', function(event) {
      if (!event.key) return;
      if (!event.key.match(/[0-9\*#]/)) return;

      var el = document.getElementsByClassName(`vw-dialpadkey-${event.key}`)[0];
      if (el)
        el.classList.remove('active');
    });

    // End call button event
    handleEvent('click', '.vox-widget-wrapper .vw-end-call', function(e) {
      e.preventDefault();
      resetWidget(voxButtonElement);
      callAction('hang_up');
    });

    // Close Widget button event
    handleEvent('click', '.vox-widget-wrapper #close-screen i', function(e) {
      e.preventDefault();
      hideElement(".vox-widget-wrapper");

      callAction('hang_up');

      // send "no rating"
      var data = { rate: 0, comment: 'Closed Without Rating', url: document.URL };
      var message = { action: 'rate', data: data };
      callAction(message);
    });

    // Open Widget button event
    handleEvent('click', '.vox-widget-wrapper #full-screen i', function(e) {
      e.preventDefault();

      var widget_body_selector = ".vox-widget-wrapper #vw-body";
      document.querySelector(widget_body_selector).classList.toggle('hidden');

      var widget_mic_header_selector = ".vox-widget-wrapper .vw-header";

      if (document.querySelector(widget_body_selector + " #vw-in-call").classList.contains('hidden'))
        document.querySelector(widget_mic_header_selector).classList.remove('minimized');
      else
        document.querySelector(widget_mic_header_selector).classList.toggle('minimized');

      this.classList.toggle('vx-icon-full-screen-on');
      this.classList.toggle('vx-icon-full-screen-off');
    });

    // Pad button event
    handleEvent('click', '.vox-widget-wrapper i.vx-icon-pad', function(e) {
      e.preventDefault();
      var element = document.querySelector(".vox-widget-wrapper .vw-dialpad");
      element.classList.toggle('active');
    });

    // Mic button event
    handleEvent('click', '.vox-widget-wrapper .vxb-widget-mic', function(e) {
      e.preventDefault();

      callAction('microphone_mute');
    });

    if (!isPopUp() && infoVoxbone.draggable === 'true') {
      requirejs(['draggabilly'],
        function(Draggabilly) {
          draggableWidget(Draggabilly);
        }
      );
    }

    var draggableWidget = function(Draggabilly) {
      //Just let the whole widget drag when tapping on Title Bar
      var draggable = new Draggabilly('.vox-widget-wrapper .vw-main', {
        handle: '.vw-title-bar',
        containment: 'html'
      });
      var draggableFixed = false;

      draggable.on('dragEnd', function() {
        //modifying the widget position to fixed for containing it inside the screen when expanded
        if (!document.querySelector('.vox-widget-wrapper[class*="vw-top"]') && !draggableFixed) {
          var screen_h = window.innerHeight;
          var widget = document.querySelector(".vox-widget-wrapper .vw-main");
          var measures = widget.getBoundingClientRect();
          widget.style.position = "fixed";
          var measures_after = widget.getBoundingClientRect();
          widget.style.transform = 'translate3D(' + (measures.left - measures_after.left) + 'px, ' + (screen_h - measures.height) + 'px, 0)';
          draggableFixed = true;
        }

      });
    };
    //
    // End of Widget Events
  });

  var initVoxbone = (function() {
    var autoDialFired = false;

    function sendPostMessage(action, value) {
      if (typeof value === 'undefined')
        value = '';

      postMessage({ action: action, value: value }, "*");
    }

    var eventHandlers = {
      'localMediaVolume': function(e) {
        if (voxbone.WebRTC.isMuted) return;
        sendPostMessage('setMicVolume', e.localVolume);
      },

      'remoteMediaVolume': function(e) {
        // sendPostMessage('setRemoteVolume', e.remoteVolume);
      },

      'progress': function(e) {
        console.debug('Calling...');
        //- sendPostMessage('setCallCalling');
      },

      'failed': function(e) {
        console.error('Failed to connect: ' + e.cause);
        sendPostMessage('setCallFailed', e.cause.substr(0, 11));

        if (isPopUp())
          closePopUp();

      },

      'accepted': function(e) {
        console.debug('Call started');
        sendPostMessage('setInCall');
      },

      'ended': function(e) {
        console.debug('Call ended');
        sendPostMessage('setCallEnded');

        if (isPopUp() && infoVoxbone.rating === "false")
          closePopUp();

      },

      'getUserMediaFailed': function(e) {
        console.error('Cannot get User Media');
        sendPostMessage('setCallFailedUserMedia');
      },

      'getUserMediaAccepted': function(e) {
        sendPostMessage('setCallCalling');
        console.debug('local media accepted');
        voxbone.Logger.loginfo("local media accepted");
      },

      'readyToCall': function(e) {
        notifyLoaded();

        // When the call is ready to be made, display all the buttons
        var voxButtonElements = document.getElementsByClassName('voxButton');
        Array.prototype.forEach.call(voxButtonElements, function(voxButtonElement) {
          voxButtonElement.style.display = 'block';
        });

        if (infoVoxbone.auto_dial === 'true' && !autoDialFired) {
          autoDialFired = true;
          makeCall();
        }

      }
    };

    function notifyLoaded() {
      // NOTE: if we plan to support IE -someday- we need to make sure to
      // implement this in a way that works for IE.
      // check this out for reference: http://caniuse.com/#feat=customevent
      var event = new CustomEvent("click2vox-ready", {
        "detail": {
          "infoVoxbone": infoVoxbone,
          "webrtcSupported": isWebRTCSupported()
        }
      });
      click2vox_ready = true;
      // Dispatch/Trigger the event on top of the document
      document.dispatchEvent(event);
    }

    function init() {
      if (isWebRTCSupported() && !isChromeOnHttp()) {
        voxbone.WebRTC.configuration.post_logs = false;
        voxbone.WebRTC.customEventHandler = Object.assign(voxbone.WebRTC.customEventHandler, eventHandlers);
        //notifyLoaded(); // BAO
        voxbone.WebRTC.customEventHandler.readyToCall();

        // When the call is ready to be made, display all the buttons
        var voxButtonElements = document.getElementsByClassName('voxButton');
        Array.prototype.forEach.call(voxButtonElements, function(voxButtonElement) {
          voxButtonElement.style.display = 'block';
        });

        if (infoVoxbone.auto_dial === 'true' && !autoDialFired) {
          autoDialFired = true;
          makeCall();
        }

      } else if (isChromeOnHttp()) {
        console.warn("The call will take place in an https popup. WebRTC doesn't work in Chrome on HTTP -> https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins");
      }
    }

    window.addEventListener('message', function(event) {
      var message = event.data;
      switch (message.action) {

        case 'setMicVolume':
          clearMicDots();
          if (message.value > 0.01) setMicDot('1');
          if (message.value > 0.05) setMicDot('2');
          if (message.value > 0.10) setMicDot('3');
          if (message.value > 0.20) setMicDot('4');
          if (message.value > 0.30) setMicDot('5');
          break;

        case 'setCallCalling':
          if (infoVoxbone.ringback !== 'false')
            playRingbackTone();

          if (customText.calling)
            setWidgetTitle(customText.calling);
          else
            setWidgetTitle("Calling");
          break;

        case 'setCallFailed':
          pauseRingbackTone();
          if (customText.failed) {
            setWidgetTitle(customText.failed + ': ' + editErrorMessage(message.value, customText));
          } else {
            setWidgetTitle("Call Failed: " + message.value);
          }
          hideAnimatedDots();
          hideElement('.vox-widget-wrapper #vw-in-call');
          showElement(".vox-widget-wrapper #vw-rating-after-message");
          break;

        case 'setInCall':
          pauseRingbackTone();
          if (customText.in_call)
            setWidgetTitle(customText.in_call);
          else
            setWidgetTitle("In Call");
          showAnimatedDots();
          break;

        case 'setCallEnded':
          resetWidget(voxButtonElement);
          if (customText.ended)
            setWidgetTitle(customText.ended);
          else
            setWidgetTitle("Call Ended");
          hideAnimatedDots();
          hideElement('.vox-widget-wrapper #vw-in-call');

          if (infoVoxbone.rating !== "false")
            showElement(".vox-widget-wrapper #vw-rating");
          else
            showElement(".vox-widget-wrapper #vw-rating-after-message");

          //callAction('hang_up');
          break;

        case 'setCallFailedUserMedia':
          pauseRingbackTone();
          if (customText.failed)
            setWidgetTitle(customText.failed);
          else
            setWidgetTitle("Call Failed");
          hideAnimatedDots();
          hideElement('.vox-widget-wrapper #vw-in-call');
          showElement(".vox-widget-wrapper #vw-unable-to-acces-mic");
          break;
      }
    });
    init();
  });

  openPopup = function() {
    var w = 280;
    var h = 220;
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);

    var buttonData = document.querySelector('.voxButton').dataset;
    var params = Object.keys(buttonData).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(buttonData[k])}`).join('&');
    var url = infoVoxbone.server_url;

    if (url === 'https://voxbone.com/click2vox')
      url = 'https://www.voxbone.com/click2vox';

    window.open(url + '/widget/portal-widget/get-html?' + params, '_blank', 'width=' + w + ',height=' + h + ',resizable=no,toolbar=no,menubar=no,location=no,status=no,top=' + top + ', left=' + left);

    return false;
  };

  //customize default static text
  var editText = function editText(edited_text) {
    var widgetElement = voxButtonElement.querySelector('.vox-widget-wrapper');
    var widgetLaunchCallElement = voxButtonElement.querySelector('#launch_call_div');

    if (edited_text.test_your_setup && infoVoxbone.test_setup !== 'false') widgetLaunchCallElement.querySelector('.widget-footer-left-text').innerHTML = edited_text.test_your_setup;

    if (edited_text.powered_by && infoVoxbone.show_branding !== 'false') {
      widgetLaunchCallElement.querySelector('.widget-footer-right-text').innerHTML = edited_text.powered_by;
      widgetElement.querySelector('.vw-footer-text').innerHTML = edited_text.powered_by;
    }

    if (edited_text.hang_up) widgetElement.querySelector('.vw-end-call').innerHTML = '<i class="vw-icon vx-icon-phone"></i>' + edited_text.hang_up;

    if (edited_text.rating_question) widgetElement.querySelector('#vw-rating-question').innerHTML = edited_text.rating_question;

    if (edited_text.rating_comment) widgetElement.querySelector('#vw-rating-comment-question').innerHTML = edited_text.rating_comment;

    if (edited_text.rating_send_button) widgetElement.querySelector('.send-rating-text').innerHTML = edited_text.rating_send_button;

    if (edited_text.rating_placeholder) widgetElement.querySelector('#rating-message').placeholder = edited_text.rating_placeholder;

    if (edited_text.unable_to_access_mic) widgetElement.querySelector('.vw-unable-to-acces-mic-text').innerHTML = edited_text.unable_to_access_mic;

    if (edited_text.unable_to_access_mic_instructions) widgetElement.querySelector('.vw-unable-to-acces-mic-text-2').innerHTML = edited_text.unable_to_access_mic_instructions;

    if (edited_text.thank_you_after_call) widgetElement.querySelector('.vw-rating-after-message-text').innerHTML = edited_text.thank_you_after_call;

  };

  function handleEvent(eventName, selector, callback) {
    var elements = document.querySelectorAll(selector);
    Array.prototype.forEach.call(elements, function(element, i) {
      element.addEventListener(eventName, callback);
    });
  }

  function isChromeOnHttp() {

    if (window.location.protocol !== "http:")
      return false;

    // Get if browser is Chrome/Chromium flavour
    // Based on http://stackoverflow.com/a/13348618/197376
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor.toLowerCase(),
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1;

    return false; //(!!isChromium && vendorName === "google inc." && !isOpera && !isIEedge);
  }

  function setWidgetTitle(title) {
    var el = document.querySelector('.vox-widget-wrapper #vw-title');
    if (el) el.innerText = title;
  }

  function makeCall() {
    if (isInCall() || !infoVoxbone.did) return;

    if (!isWebRTCSupported() && (infoVoxbone.incompatible_browser_configuration === 'link_button_to_a_page')) {
      var redirect_url = infoVoxbone.redirect_url || 'https://voxbone.com';
      window.open(redirect_url);
      return;
    }

    if (isWebRTCSupported() && !isChromeOnHttp()) {
      renderWidget();
      resetWidget();

      // BAO

      voxbone.WebRTC.configuration.uri = click2Dial.sip.caller_uri;
      voxbone.WebRTC.configuration.ws_servers = click2Dial.sip.server;
      voxbone.WebRTC.configuration.authorization_user = click2Dial.sip.authorization_user;
      voxbone.WebRTC.configuration.password = click2Dial.sip.password;
      voxbone.WebRTC.configuration.register = click2Dial.sip.register;

      if (infoVoxbone.context)
        voxbone.WebRTC.context = infoVoxbone.context;

      if (infoVoxbone.send_digits) {
        var sanitizedDigits = infoVoxbone.send_digits.toString().replace(/ /g, '');

        console.debug('Digits to be send: ' + sanitizedDigits);
        voxbone.WebRTC.configuration.dialer_string = sanitizedDigits;
      } else {
        voxbone.WebRTC.configuration.dialer_string = '';
      }

      voxbone.WebRTC.call(infoVoxbone.did);

      window.addEventListener("beforeunload", function() {
        voxbone.WebRTC.unloadHandler();
      });

      if (isPopUp()) {
        var dialPad = document.querySelector(".vox-widget-wrapper .vw-dialpad");
        dialPad.classList.toggle('active');
        var wrapper = document.querySelector(".vox-widget-wrapper .vw-main");
        wrapper.style.margin = 0;
        var header = document.querySelector(".vox-widget-wrapper .vw-main .vw-header");
        header.style.borderRadius = 0;
        hideElement('.voxButton .vxb-widget-box');
        hideElement('.vox-widget-wrapper .vw-main .vw-header .vw-actions');
        window.resizeTo(330, 425);
      }
    }
  }

  function resetWidget() {

    if (customText.waiting_user_media)
      setWidgetTitle(customText.waiting_user_media);
    else
      setWidgetTitle("Waiting for User Media");

    clearMicDots();

    hideElement(".vox-widget-wrapper #vw-unable-to-acces-mic");
    hideElement(".vox-widget-wrapper #vw-rating-after-message");
    hideElement(".vox-widget-wrapper .vw-rating");

    //Widget placement
    var vox_widget_wrapper = document.querySelector('.vox-widget-wrapper');

    if (vox_widget_wrapper)
    {
        vox_widget_wrapper.classList.remove("vw-top-left", "vw-top-right", "vw-bottom-right", "vw-bottom-left");
        vox_widget_wrapper.classList.add('vw-' + infoVoxbone.placement);

        var widget_mic_header_selector = ".vox-widget-wrapper .vw-header";
        vox_widget_wrapper.querySelector(widget_mic_header_selector).classList.remove('minimized');
    }

    showAnimatedDots();
    showElement(".vox-widget-wrapper #vw-in-call");
    showElement(".vox-widget-wrapper #vw-body");
    showElement(".vox-widget-wrapper");
    document.querySelector(".vox-widget-wrapper").style.display = "block";

    if (infoVoxbone.dial_pad !== "false")
      showElement(".vox-widget-wrapper #dialpad");
    else
      hideElement(".vox-widget-wrapper #dialpad");

    // Reset Rating
    document.querySelector('.vox-widget-wrapper #send-rating').classList.add("vxb-btn-style-disabled");
    document.querySelector('.vox-widget-wrapper #rating-message').value = "";

    var full_screen_icon = document.querySelector('.vox-widget-wrapper #full-screen i');
    full_screen_icon.classList.remove('vx-icon-full-screen-on');
    full_screen_icon.classList.add('vx-icon-full-screen-off');

    var starRatingButtons = document.querySelectorAll(".vox-widget-wrapper input[name=vxb-rate]");
    Array.prototype.forEach.call(starRatingButtons, function(el, i) {
      el.checked = false;
    });
  }

  function isInCall() {
    return (typeof voxbone.WebRTC.rtcSession.isEstablished === "function") && !voxbone.WebRTC.rtcSession.isEnded();
  }

  function muteMicDots() {
    setMicDots('off');
  }

  function clearMicDots() {
    setMicDots('');
  }

  function setMicDots(className) {
    var micDots = document.querySelectorAll('.vox-widget-wrapper .vox-mic-vumeter em');
    Array.prototype.forEach.call(micDots, function(el, i) {
      el.classList = className || "";
    });
  }

  function setMicDot(dot) {
    var className = 'on';
    if (dot === '5')
      className = 'peak';

    var dots = document.querySelectorAll('.vox-widget-wrapper #mic' + dot);
    Array.prototype.forEach.call(dots, function(el, i) {
      el.classList.add(className);
    });
  }

  function do_dtmf() {
    setTimeout(do_dtmf2, 100);
  }

  function do_dtmf2() {
    setTimeout(do_dtmf, 30);
  }

  function createOscillator(context, freq, gain) {
    var osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);

    return osc;
  }

  function showElement(selector) {
    var el = document.querySelector(selector);
    if (el)
      el.classList.remove('hidden');
  }

  function hideElement(selector) {
    var el = document.querySelector(selector);
    if (el)
      el.classList.add('hidden');
  }

  function showAnimatedDots() {
    var dots = document.querySelectorAll('.vox-widget-wrapper .vw-animated-dots');
    Array.prototype.forEach.call(dots, function(el, i) {
      el.classList.remove('hidden');
    });
  }

  function hideAnimatedDots() {
    var dots = document.querySelectorAll('.vox-widget-wrapper .vw-animated-dots');
    Array.prototype.forEach.call(dots, function(el, i) {
      el.classList.add('hidden');
    });
  }

  function getRingbackTone() {
    return document.querySelector('.voxButton #audio-ringback-tone');
  }

  function pauseRingbackTone() {
    getRingbackTone().pause();
  }

  function playRingbackTone() {
    var audioEl = getRingbackTone();
    audioEl.currentTime = 0;
    audioEl.play();
  }

  function callAction(message) {
    if (typeof voxbone.WebRTC.rtcSession.isEstablished !== "function" || voxbone.WebRTC.rtcSession.isEnded())
      return;

    switch (message) {
      case 'hang_up':
        voxbone.WebRTC.hangup();
        break;

      case 'microphone_mute':
        if (voxbone.WebRTC.isMuted) {
          voxbone.WebRTC.unmute();
          clearMicDots();
        } else {
          voxbone.WebRTC.mute();
          muteMicDots();
        }
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0':
      case '*':
      case '#':
        playDTMF(message);
        voxbone.WebRTC.sendDTMF(message);
        break;
    }
  }

  function isPopUp() {
    return infoVoxbone.is_popup === 'true';
  }

  function isWebRTCSupported() {
    return true; //voxbone.WebRTC.isWebRTCSupported();
  }

  function isDidDefined() {
    if (infoVoxbone.did) return true;
    else return false;
  }

  function playDTMF(tone) {
    var sound = {};

    // create a gain node to control output
    sound.gain1 = audioContext.createGain();
    sound.gain1.gain.value = 1.0;
    sound.gain1.connect(audioContext.destination);

    // create both oscillator sources
    var freqs = getFreqs(tone);
    sound.osc1 = createOscillator(audioContext, freqs[0], sound.gain1);
    sound.osc2 = createOscillator(audioContext, freqs[1], sound.gain1);
    sound.osc1.start(0);
    sound.osc2.start(0);

    // just play 200ms long DTMF tones
    do_dtmf();
    setTimeout(function() {
      sound.osc1.stop(0);
      sound.osc2.stop(0);
    }, 200);
  }

  function closePopUp() {
    setTimeout(function() {
      window.close();
    }, 5000);
  }

  function sendRate(data) {
    //post rating to server
    // BAO TODO - replace with REST endpoint
    //voxbone.WebRTC.postCallRating(infoVoxbone.did, data.rate, data.comment, data.url);
  }

  function getFreqs(tone) {
    var freqs;

    switch (tone) {
      case '1':
        freqs = [697, 1209];
        break;
      case '2':
        freqs = [697, 1336];
        break;
      case '3':
        freqs = [697, 1477];
        break;
      case 'A':
        freqs = [697, 1633];
        break;
      case '4':
        freqs = [770, 1209];
        break;
      case '5':
        freqs = [770, 1336];
        break;
      case '6':
        freqs = [770, 1477];
        break;
      case 'B':
        freqs = [770, 1633];
        break;
      case '7':
        freqs = [852, 1209];
        break;
      case '8':
        freqs = [852, 1336];
        break;
      case '9':
        freqs = [852, 1477];
        break;
      case 'C':
        freqs = [852, 1633];
        break;
      case '*':
        freqs = [941, 1209];
        break;
      case '0':
        freqs = [941, 1336];
        break;
      case '#':
        freqs = [941, 1477];
        break;
      case 'D':
        freqs = [941, 1633];
        break;
    }

    return freqs;
  }

  //customize default error messages in widget
  var editErrorMessage = function editErrorMessage(error, mt) {
    switch (error) {
      case 'Canceled':
        return mt.error_canceled ? mt.error_canceled : error;
      case 'Terminated':
        return mt.error_bye ? mt.error_bye : error;
      case 'WebRTC Error':
        return mt.error_webrtc ? mt.error_webrtc : error;
      case 'No Answer':
        return mt.error_no_answer ? mt.error_no_answer : error;
      case 'Expires':
        return mt.error_expires ? mt.error_expires : error;
      case 'No Ack':
        return mt.error_no_ack ? mt.error_no_ack : error;
      case 'Dialog Error':
        return mt.error_dialog_error ? mt.error_dialog_error : error;
      case 'User Denied Media Access':
        return mt.error_user_denied_media ? mt.error_user_denied_media : error;
      case 'User Denied':
        return mt.error_user_denied_media ? mt.error_user_denied_media : error;
      case 'Bad Media Description':
        return mt.error_bad_media_description ? mt.error_bad_media_description : error;
      case 'RTP Timeout':
        return mt.error_rtp_timeout ? mt.error_rtp_timeout : error;
      case 'Connection Error':
        return mt.error_connection_error ? mt.error_connection_error : error;
      case 'Request Timeout':
        return mt.error_request_timeout ? mt.error_request_timeout : error;
      case 'SIP Failure':
        return mt.error_sip_failure ? mt.error_sip_failure : error;
      case 'Internal Error':
        return mt.error_internal_error ? mt.error_internal_error : error;
      case 'Rejected':
        return mt.error_sip_rejected ? mt.error_sip_rejected : error;
      case 'Busy':
        return mt.error_sip_busy ? mt.error_sip_busy : error;
      case 'Redirect':
        return mt.error_sip_redirected ? mt.error_sip_redirected : error;
      case 'Unavailable':
        return mt.error_sip_unavailable ? mt.error_sip_unavailable : error;
      case 'Address Incomplete':
        return mt.error_sip_address_incomplete ? mt.error_sip_address_incomplete : error;
      case 'Incompatible SDP':
        return mt.error_sip_incompatible_sdp ? mt.error_sip_incompatible_sdp : error;
      case 'Missing SDP':
        return mt.error_sip_missing_sdp ? mt.error_sip_missing_sdp : error;
      case 'Not Found':
        return mt.error_sip_not_found ? mt.error_sip_not_found : error;
      case 'Authentication Error':
        return mt.error_sip_authentication ? mt.error_sip_authentication : error;
      default:
        return error;
    }
  };

}(window.click2Dial || {}));