_ = require 'underscore'
path = require 'path'
coffeeScript = require 'coffee-script'
vm = require 'vm'
fs = require 'fs'

module.exports.defineModule = (file) ->
  "module = GLOBAL_MODULES['#{file}'] = {id : '#{file}'}\nexports = module.exports = {}\n"
FILTER_FILES = null
module.exports.setFilterFiles = (files) ->
  FILTER_FILES = files


CONTEXT = null
module.exports.setContext = (ctx) ->
  CONTEXT = ctx

getDependencies = module.exports.getDependencies = (staticPath, file, hasCheckedFiles = []) ->
  result = []
  exceptToGetDep = false
  if FILTER_FILES?.length
    exceptToGetDep = true if ~_.indexOf FILTER_FILES, file
  file = path.join '/components', file if file[0] != '.' && file[0] != '/'
  file += '.js' if !path.extname file
  if ~_.indexOf hasCheckedFiles, file
    return result
  else
    hasCheckedFiles.push file
  if staticPath
    readFile = path.join staticPath, file 
  else
    readFile = file
  console.dir file
  requireFiles = []
  if !fs.existsSync readFile
    readFile = readFile.replace path.extname(readFile), '.coffee'
    code = fs.readFileSync readFile, 'utf8'
    try
        code = coffeeScript.compile code
    catch err
      throw err if err
      return
  else
    code = fs.readFileSync readFile, 'utf8'
  if !exceptToGetDep
    ctx = 
      GLOBAL_MODULES : {}
      module :
        exports : {}
      exports : {}
      require : (subFile) ->
        # subFile += '.js' if !path.extname subFile
        requireFiles.push subFile
    _.extend ctx, CONTEXT
    try
      vm.runInNewContext code, ctx
    catch e
      console.error file
      console.error e
    _.each requireFiles, (tmpFile) =>
      tmpFile = path.join path.dirname(file), tmpFile if tmpFile[0] == '.'
      if !~_.indexOf result, tmpFile
        result.push.apply result, getDependencies staticPath, tmpFile, hasCheckedFiles
  result.push file
  _.uniq _.flatten result