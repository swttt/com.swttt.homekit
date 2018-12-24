if (! window.Homey) {
  window.Homey = new (class Homey {
    constructor() {
      this.isMock     = true;
      this.settings   = {};
      this.listeners  = {};
      this.onHandlers = {};
      this.routes     = [];
      window.addEventListener('load', function() {
        window.onHomeyReady && window.onHomeyReady(this);
      }.bind(this));
    }

    // Mock API
    setSettings(settings) {
      this.settings = Object.assign({}, settings);
    }

    addRoutes(routes) {
      this.routes = Object.assign([], routes);
      for (const route of this.routes) {
        route.pathRegex = new RegExp('^' + route.path.replace(/(:)(\w+)/gi, '(?<$2>\\w+)') + '$');
      }
    }

    registerOnHandler(event, fn) {
      this.onHandlers[event] = fn;
    }

    _emit(event, ...args) {
      (this.listeners[event] || []).forEach(listener => listener(...args));
    }

    // Regular API.
    ready() {
    }

    get(name, cb) {
      if (typeof name === 'function') cb = name, name = null;
      cb && cb(null, name !== null ? this.settings[name] : Object.assign({}, this.settings));
    }

    set(name, value, cb) {
      this.settings[name] = value;
      this._emit('settings.set', name, value);
      cb && cb();
    }

    unset(name, cb) {
      delete this.settings[name];
      this._emit('settings.unset', name);
      cb && cb();
    }

    on(event, cb) {
      if (this.onHandlers[event]) {
        return this.onHandlers[event](event, cb);
      }
      if (! this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(cb);
    }

    api(method, path, body, cb) {
      const url = new URL('https://example.com' + path);
      if (typeof body === 'function') cb = body, body = null;

      // Find first matching route.
      const route = this.routes.find(route => {
        return route.method === method && route.pathRegex.test(url.pathname);
      });
      if (! route) {
        return cb(new Error('NOT_FOUND'));
      }

      // Setup args.
      const args = {};
      if (body != null) {
        args.body = body;
      }

      // Parse query string.
      if (url.search) {
        args.query = {};
        for (const key of url.searchParams.keys()) {
          args.query[key] = url.searchParams.get(key);
        }
      }

      // Parse params.
      args.params = url.pathname.match(route.pathRegex).groups;

      // Call handler.
      route.fn(args, cb);
    }

    alert(msg, icon, cb) {
      if (typeof icon === 'function') cb = icon, icon = null;
      alert(msg);
      cb && cb();
    }

    confirm(msg, icon, cb) {
      if (typeof icon === 'function') cb = icon, icon = null;
      let ret = confirm(msg);
      cb && cb(null, ret);
    }

    popup(url, { width = 400, height = 400 } = {}) {
      window.open(url, '', `width=${ width },height=${ height }`);
    }

    openURL(url) {
      return this.popup(url);
    }

    __(key, tokens) {
      return key;
    }
  })();
}
