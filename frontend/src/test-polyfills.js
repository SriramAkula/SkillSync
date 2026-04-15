/**
 * Pure JavaScript polyfills for Karma test environment.
 * These are loaded as scripts BEFORE the main application bundle.
 */
(function() {
  window.global = window;
  window.process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: function(cb) { setTimeout(cb, 0); }
  };

  /**
   * Robust matchMedia polyfill for Angular CDK.
   * We force overwrite because headless browsers might have a partial implementation.
   */
  var mockMql = {
    matches: false,
    media: '',
    onchange: null,
    addListener: function() {}, // deprecated
    removeListener: function() {}, // deprecated
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return false; }
  };

  window.matchMedia = function() {
    return mockMql;
  };
})();
