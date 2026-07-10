/* ============================================
   ROUTER — Hash-based SPA router
   ============================================ */

const _routes = {};
let _defaultRoute = '/dashboard';
let _currentRoute = null;

export const Router = {
  /**
   * Register a route handler.
   * @param {string} path — e.g. '/dashboard', '/semana/:id'
   * @param {Function} handler — receives (params) object
   */
  on(path, handler) {
    _routes[path] = handler;
  },

  /**
   * Set the default route.
   */
  setDefault(path) {
    _defaultRoute = path;
  },

  /**
   * Navigate to a route.
   */
  navigate(path) {
    window.location.hash = '#' + path;
  },

  /**
   * Get current route.
   */
  current() {
    return _currentRoute;
  },

  /**
   * Start listening for hash changes.
   */
  start() {
    const handleRoute = () => {
      const hash = window.location.hash.slice(1) || _defaultRoute;
      _currentRoute = hash;
      this._resolve(hash);
    };

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  },

  /**
   * Resolve the current hash against registered routes.
   */
  _resolve(hash) {
    // Try exact match first
    if (_routes[hash]) {
      _routes[hash]({});
      return;
    }

    // Try parameterized routes
    for (const [pattern, handler] of Object.entries(_routes)) {
      const params = this._match(pattern, hash);
      if (params) {
        handler(params);
        return;
      }
    }

    // Default fallback
    if (_routes[_defaultRoute]) {
      _routes[_defaultRoute]({});
    }
  },

  /**
   * Match a pattern like '/semana/:id' against a path like '/semana/3'.
   */
  _match(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  },
};
