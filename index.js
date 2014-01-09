(function() {
  var CONTEXT, FILTER_FILES, coffeeScript, fs, getDependencies, path, vm, _;

  _ = require('underscore');

  path = require('path');

  coffeeScript = require('coffee-script');

  vm = require('vm');

  fs = require('fs');

  module.exports.defineModule = function(file) {
    return "module = GLOBAL_MODULES['" + file + "'] = {id : '" + file + "'}\nexports = module.exports = {}\n";
  };

  FILTER_FILES = null;

  module.exports.setFilterFiles = function(files) {
    return FILTER_FILES = files;
  };

  CONTEXT = null;

  module.exports.setContext = function(ctx) {
    return CONTEXT = ctx;
  };

  getDependencies = module.exports.getDependencies = function(staticPath, file, hasCheckedFiles) {
    var code, ctx, exceptToGetDep, readFile, requireFiles, result,
      _this = this;
    if (hasCheckedFiles == null) {
      hasCheckedFiles = [];
    }
    result = [];
    exceptToGetDep = false;
    if (FILTER_FILES != null ? FILTER_FILES.length : void 0) {
      if (~_.indexOf(FILTER_FILES, file)) {
        exceptToGetDep = true;
      }
    }
    if (file[0] !== '.' && file[0] !== '/') {
      file = path.join('/components', file);
    }
    if (!path.extname(file)) {
      file += '.js';
    }
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
    console.dir(file);
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
    if (!exceptToGetDep) {
      ctx = {
        GLOBAL_MODULES: {},
        module: {
          exports: {}
        },
        exports: {},
        require: function(subFile) {
          return requireFiles.push(subFile);
        }
      };
      _.extend(ctx, CONTEXT);
      try {
        vm.runInNewContext(code, ctx);
      } catch (e) {
        console.error(file);
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
    }
    result.push(file);
    return _.uniq(_.flatten(result));
  };

}).call(this);
