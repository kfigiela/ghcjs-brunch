var glob           = require('glob')
  , spawn          = require('child_process').spawn
  , fs             = require('fs')
  , exec           = require('shelljs').exec
  , logger         = require('loggy')
  , spawn          = require('child_process').spawn
  , StreamSplitter = require('stream-splitter')
  , ansi_up        = require('ansi_up')
  , kill           = require('tree-kill');

function GhcCompiler(config) {
  if (config === null) config = {};
  var options = config.plugins && config.plugins.ghcjs;

  if(options.buildCommand === undefined) options.buildCommand = 'cabal install';
  if(options.clearScreen  === undefined) options.clearScreen  = false;
  if(options.placeholder  === undefined) options.placeholder  = "env.ghcjs";
  if(options.interactive  === undefined) options.interactive  = false;
  if(options.ghciCommand  === undefined) options.ghciCommand  = "/usr/bin/false";

  this.options = options;
  this.globPattern = "app/**/*.hs";
  if(this.options.interactive) {
    this.setupServer();
    this.startInteractive();
  }
}

GhcCompiler.prototype.brunchPlugin = true;
GhcCompiler.prototype.type = 'javascript';
GhcCompiler.prototype.extension = 'ghcjs';

GhcCompiler.prototype.setupServer = function() {
  var _this = this;
  this.io = require('socket.io').listen(9886);

  this.io.on('connection', function(socket){
    logger.info("ghcjs-brunch: browser-connected");
    socket.on('reload', function(msg) {
      _this.requestReload();
      socket.emit("stdout", "Please wait...\n\n");
    });
    socket.on('disconnect', function(){
      logger.info("ghcjs-brunch: browser-disconnected");
    });
  });
}

GhcCompiler.prototype.startInteractive = function() {
  var _this = this;

  this.ghci = spawn(this.options.ghciCommand);

  this.ghci.stdin.write(':set prompt ""');

  this.ghci.stdout.pipe(StreamSplitter("\n")).on('token', function (data) {
    var d = data.toString('utf8');
     // _this.io.emit('stdout', ansi_up.ansi_to_html(d) + "\n");
     logger.info("GHCI: " + d);
  });

  this.ghci.stderr.pipe(StreamSplitter("\n")).on('token', function (data) {
    var d = data.toString('utf8');
      // _this.io.emit('stdout', ansi_up.ansi_to_html(d) + "\n");
     logger.warn("GHCI: " + d);
  });

  process.on('exit', function() {
    _this.teardown();
  });
}

GhcCompiler.prototype.requestReload = function() {
  logger.info("Requesting code reload");
  this.ghci.stdin.write("\n\n:reload\n:main\n\n");
}

GhcCompiler.prototype.teardown = function() {
  if(this.ghci) {
    this.ghci.stdin.write("\n\n\n:quit\n");

    logger.info("Closing GHCI");
    kill(this.ghci.pid, 'SIGKILL')
  }
}

GhcCompiler.prototype.compile = function(data, path, callback) {
  var _this = this;
  if(path == this.options.placeholder) {
    if(this.options.interactive)  {
      logger.info("GHCJS-Brunch: Injecting loader code, the code will load dynamically from GHCI.")
      _this.assembly(data, callback);
    } else {
      if(this.options.clearScreen) console.log("\x1b[2J\x1b[1;1H");

      this.recompileIfChanged(function(shouldRebuild) {
        if(shouldRebuild) {
          _this.rebuild(data, callback);
        } else {
          _this.assembly(data, callback);
          logger.info("GHCJS-Brunch: Cabal sources not changed, skipping.");
        }
      });
    }
  } else {
    callback(null, "");
  }
};

GhcCompiler.prototype.assembly = function(data, callback) {
  var outfile = this.getFile();
  fs.readFile(outfile, 'utf-8', function(err, compiled) {
    var allsource = "/* from: " + outfile + " */\n\nmodule.exports = (function(){\n " + data + "; \n\n" + compiled + "\n});";
    callback(null, {data: allsource});
  });
};

GhcCompiler.prototype.rebuild = function(data, callback) {
  var _this = this;
  logger.info("Running " + this.options.buildCommand + "...");
  exec(this.options.buildCommand, function(code, output){
    if(code === 0) {
      logger.info("GHCJS-Brunch: Cabal finished successfully");
      _this.assembly(data, callback);
    } else {
      callback("Cabal failed (code: " + code + ")", null);
    }
  });
};

GhcCompiler.prototype.sourceFiles = function(callback) {
  var _this = this;
  glob(this.globPattern, {}, function (err, files) {
    if(files) files.push(_this.options.projectName + ".cabal");
    callback(err, files);
  });
};

GhcCompiler.prototype.getFile = function() {
  if(this.options.interactive) {
    return __dirname + "/loader.js";
  }

  var outfiles = glob.sync('dist/dist-sandbox-*/build/'+this.options.projectName+'/'+this.options.projectName+'.jsexe/all.js');
  outfiles.push('dist/build/'+this.options.projectName+'/'+this.options.projectName+'.jsexe/all.js');

  if (outfiles.length != 1) {
    logger.info("GHCJS-Brunch: More than one all.js file: " + outfiles.join() + ", using first.");
  }
  return outfiles[0];
};


function mtimeOrEmpty(name) {
  try {
    return fs.statSync(name).mtime;
  } catch(err) {
    return "";
  }
}

GhcCompiler.prototype.recompileIfChanged = function(callback) {
  var _this = this;
  this.sourceFiles(function (err, files) { // TODO: add error handling
    var max_mtime = Math.max.apply(null, files.map(mtimeOrEmpty).sort());
    var outfile = glob.sync(_this.getFile());
    var last_compiled = mtimeOrEmpty(outfile);
    callback(process.env.RECOMPILE || max_mtime > last_compiled);
  });
};

GhcCompiler.prototype.getDependencies = function(data, path, callback) {
  if(path == this.options.placeholder) {
    this.sourceFiles(function (er, files) {
      callback(null, files);
    });
  } else {
    callback(null, []);
  }
};

module.exports = GhcCompiler;
