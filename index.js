(function() {
  var coffeeScript, fs, getDependencies, path, vm, _;

  _ = require('underscore');

  path = require('path');

  coffeeScript = require('coffee-script');

  vm = require('vm');

  fs = require('fs');

  module.exports.defineModule = function(file) {
    return "module = GLOBAL_MODULES['" + file + "'] = {id : '" + file + "'}\nexports = module.exports = {}\n";
  };

  getDependencies = module.exports.getDependencies = function(staticPath, file, hasCheckedFiles) {
    var code, ctx, readFile, requireFiles, result,
      _this = this;
    if (hasCheckedFiles == null) {
      hasCheckedFiles = [];
    }
    result = [];
    if (~_.indexOf(hasCheckedFiles, file)) {
      return result;
    } else {
      hasCheckedFiles.push(file);
    }
    if (staticPath) {
      readFile = path.join(staticPath, file);
    } else {
      readFile = file;
    }
    requireFiles = [];
    if (!fs.existsSync(readFile)) {
      readFile = readFile.replace(path.extname(readFile), '.coffee');
      code = fs.readFileSync(readFile, 'utf8');
      try {
        code = coffeeScript.compile(code);
      } catch (err) {
        if (err) {
          throw err;
        }
        return;
      }
    } else {
      code = fs.readFileSync(readFile, 'utf8');
    }
    ctx = {
      GLOBAL_MODULES: {},
      module: {
        exports: {}
      },
      exports: {},
      require: function(subFile) {
        if (!path.extname(subFile)) {
          subFile += '.js';
        }
        return requireFiles.push(subFile);
      }
    };
    try {
      vm.runInNewContext(code, ctx);
    } catch (e) {
      console.error(e);
    }
    _.each(requireFiles, function(tmpFile) {
      if (tmpFile[0] === '.') {
        tmpFile = path.join(path.dirname(file), tmpFile);
      }
      if (!~_.indexOf(result, tmpFile)) {
        return result.push.apply(result, getDependencies(staticPath, tmpFile, hasCheckedFiles));
      }
    });
    result.push(file);
    return _.uniq(_.flatten(result));
  };

}).call(this);
