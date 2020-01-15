window.converse_settings = {
  storage: {
    sync: {
      get: function(keys, callback) {
        var store = {};
        keys.forEach(function(key) {
          try {
            store[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            store[key] = null;
          }
        });
        setTimeout(function() { callback(store); });
      },
      set: function(values) {
        for (var key in values) {
          localStorage.setItem(key, JSON.stringify(values[key]));
        }
      },
    },
  },
  runtime: {
    getManifest: function() { return {}; },
  },
};