import {extend} from './util';

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for detecting MSIE.
var isExplorer = /msie [\w.]+/;

// Cached regex for removing a trailing slash.
var trailingSlash = /\/$/;

// Update the hash location, either replacing the current entry, or adding
// a new one to the browser history.
function updateHash(location, fragment, replace) {
    if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
    } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
    }
};

var history = {
    interval: 50,
    active: false
};

// Ensure that `History` can be used outside of the browser.
if (typeof window !== 'undefined') {
    history.location = window.location;
    history.history = window.history;
}

history.getHash = function (window) {
    var match = (window || history).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
};

history.getFragment = function (fragment, forcePushState) {
    if (fragment == null) {
        if (history._hasPushState || !history._wantsHashChange || forcePushState) {
            fragment = history.location.pathname + history.location.search;
            var root = history.root.replace(trailingSlash, '');
            if (!fragment.indexOf(root)) {
                fragment = fragment.substr(root.length);
            }
        } else {
            fragment = history.getHash();
        }
    }

    return fragment.replace(routeStripper, '');
};

history.activate = function (options) {
    if (history.active) {
        throw new Error("History has already been activated.");
    }

    history.active = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    history.options = extend({}, { root: '/' }, history.options, options);
    history.root = history.options.root;
    history._wantsHashChange = history.options.hashChange !== false;
    history._wantsPushState = !!history.options.pushState;
    history._hasPushState = !!(history.options.pushState && history.history && history.history.pushState);

    var fragment = history.getFragment();

    // Normalize root to always include a leading and trailing slash.
    history.root = ('/' + history.root + '/').replace(rootStripper, '/');

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (history._hasPushState) {
        window.onpopstate = history.checkUrl;
    } else if (history._wantsHashChange && ('onhashchange' in window)) {
        window.addEventListener('hashchange', history.checkUrl);
    } else if (history._wantsHashChange) {
        history._checkUrlInterval = setInterval(history.checkUrl, history.interval);
    }

    // Determine if we need to change the base url, for a pushState link
    // opened by a non-pushState browser.
    history.fragment = fragment;
    var loc = history.location;
    var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === history.root;

    // Transition from hashChange to pushState or vice versa if both are requested.
    if (history._wantsHashChange && history._wantsPushState) {
        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!history._hasPushState && !atRoot) {
            history.fragment = history.getFragment(null, true);
            history.location.replace(history.root + history.location.search + '#' + history.fragment);
            // Return immediately as browser will do redirect to new url
            return true;

            // Or if we've started out with a hash-based route, but we're currently
            // in a browser where it could be `pushState`-based instead...
        } else if (history._hasPushState && atRoot && loc.hash) {
            this.fragment = history.getHash().replace(routeStripper, '');
            this.history.replaceState({}, document.title, history.root + history.fragment + loc.search);
        }
    }

    if (!history.options.silent) {
        return history.loadUrl();
    }
};

history.deactivate = function () {
    window.onpopstate = null;
    window.removeEventListener('hashchange', history.checkUrl);
    clearInterval(history._checkUrlInterval);
    history.active = false;
};

history.checkUrl = function () {
    var current = history.getFragment();
    if (current === history.fragment && history.iframe) {
        current = history.getFragment(history.getHash(history.iframe));
    }

    if (current === history.fragment) {
        return false;
    }

    if (history.iframe) {
        history.navigate(current, false);
    }

    history.loadUrl();
};

history.loadUrl = function (fragmentOverride) {
    var fragment = history.fragment = history.getFragment(fragmentOverride);

    return history.options.routeHandler ?
        history.options.routeHandler(fragment) :
        false;
};

history.navigate = function (fragment, options) {
    if (!history.active) {
        return false;
    }

    if (options === undefined) {
        options = {
            trigger: true
        };
    } else if (typeof options === "boolean") {
        options = {
            trigger: options
        };
    }

    fragment = history.getFragment(fragment || '');

    if (history.fragment === fragment) {
        return;
    }

    history.fragment = fragment;

    var url = history.root + fragment;

    // Don't include a trailing slash on the root.
    if (fragment === '' && url !== '/') {
        url = url.slice(0, -1);
    }

    // If pushState is available, we use it to set the fragment as a real URL.
    if (history._hasPushState) {
        history.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

        // If hash changes haven't been explicitly disabled, update the hash
        // fragment to store history.
    } else if (history._wantsHashChange) {
        updateHash(history.location, fragment, options.replace);

        if (history.iframe && (fragment !== history.getFragment(history.getHash(history.iframe)))) {
            // Opening and closing the iframe tricks IE7 and earlier to push a
            // history entry on hash-tag change.  When replace is true, we don't
            // want history.
            if (!options.replace) {
                history.iframe.document.open().close();
            }

            updateHash(history.iframe.location, fragment, options.replace);
        }

        // If you've told us that you explicitly don't want fallback hashchange-
        // based history, then `navigate` becomes a page refresh.
    } else {
        return history.location.assign(url);
    }

    if (options.trigger) {
        return history.loadUrl(fragment);
    }
};

history.navigateBack = function () {
    history.history.back();
};

export { history }