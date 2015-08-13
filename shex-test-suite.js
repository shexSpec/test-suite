var ret = {
  getManifest: function () {
    return __dirname + "/tests/manifest.json";
  }
};

if (typeof require !== 'undefined' && typeof exports !== 'undefined')
  module.exports = ret;
else
  shexTest = ret;

