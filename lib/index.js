// Generated by CoffeeScript 2.0.2
  // # Module `exec`

  // `exec(sshOrNull, command, [options], [callback])`
  // `exec(options..., [callback])`
var EventEmitter, exec, is_object, is_ssh_connection, local, remote, spawn, stream,
  indexOf = [].indexOf;

({EventEmitter} = require('events'));

stream = require('stream');

({exec, spawn} = require('child_process'));

// ## Options

// * `ssh`   SSH connection if the command must run remotely   
// * `cmd`   Command to run unless provided as first argument   
// * `cwd`   Current working directory   
// * `end`   Close the SSH connection on exit, default to true if an ssh connection instance is provided.   
// * `env`   An environment to use for the execution of the command.   
// * `pty`   Set to true to allocate a pseudo-tty with defaults, or an object containing specific pseudo-tty settings. Apply only to SSH remote commands.   
// * `cwd`   Apply only to local commands.   
// * `uid`   Apply only to local commands.   
// * `gid`   Apply only to local commands.  

// ## Source Code
module.exports = function() {
  var arg, args, callback, i, j, k, len, options, v;
  args = [].slice.call(arguments);
  options = {};
  for (i = j = 0, len = args.length; j < len; i = ++j) {
    arg = args[i];
    if (arg === null || arg === void 0) {
      if (indexOf.call(options, 'ssh') >= 0) {
        throw Error(`Invalid Argument: argument ${i} cannot be null, the connection is already set`);
      }
      options.ssh = arg;
    } else if (is_ssh_connection(arg)) {
      if (indexOf.call(options, 'ssh') >= 0) {
        throw Error(`Invalid Argument: argument ${i} cannot be an SSH connection, the connection is already set`);
      }
      options.ssh = arg;
    } else if (is_object(arg)) {
      for (k in arg) {
        v = arg[k];
        options[k] = v;
      }
    } else if (typeof arg === 'string') {
      if (indexOf.call(options, 'cmd') >= 0) {
        throw Error(`Invalid Argument: argument ${i} cannot be a string, a command already exists`);
      }
      options.cmd = arg;
    } else if (typeof arg === 'function') {
      if (callback) {
        throw Error(`Invalid Argument: argument ${i} cannot be a function, a callback already exists`);
      }
      callback = arg;
    } else {
      throw Error(`Invalid arguments: argument ${i} is invalid, got ${JSON.stringify(arg)}`);
    }
  }
  if (options.ssh) {
    return remote(options, callback);
  } else {
    return local(options, callback);
  }
};

remote = module.exports.remote = function(options, callback) {
  var child, cmdOptions, stderr, stdout;
  child = new EventEmitter;
  child.stdout = new stream.Readable;
  child.stdout._read = function(_size) {};
  child.stderr = new stream.Readable;
  child.stderr._read = function() {};
  child.kill = function(signal = 'KILL') {
    if (child.stream) {
      // IMPORTANT: doesnt seem to work, test is skipped
      // child.stream.write '\x03'
      // child.stream.end '\x03'
      return child.stream.signal(signal);
    }
  };
  stdout = stderr = '';
  if (options.cwd) {
    options.cmd = `cd ${options.cwd}; ${options.cmd}`;
  }
  cmdOptions = {};
  if (options.env) {
    cmdOptions.env = options.env;
  }
  if (options.pty) {
    cmdOptions.pty = options.pty;
  }
  if (options.x11) {
    cmdOptions.x11 = options.x11;
  }
  options.ssh.exec(options.cmd, cmdOptions, function(err, stream) {
    var code, exit, exitCalled, signal, stderrCalled, stdoutCalled;
    if (err && callback) {
      return callback(err);
    }
    if (err) {
      return child.emit('error', err);
    }
    child.stream = stream;
    stream.stderr.on('data', function(data) {
      child.stderr.push(data);
      if (callback) {
        return stderr += data;
      }
    });
    stream.on('data', function(data) {
      child.stdout.push(data);
      if (callback) {
        return stdout += data;
      }
    });
    code = signal = null;
    exitCalled = stdoutCalled = stderrCalled = false;
    exit = function() {
      if (!(exitCalled && stdoutCalled && stderrCalled)) {
        return;
      }
      child.stdout.push(null);
      child.stderr.push(null);
      child.emit('close', code, signal);
      child.emit('exit', code, signal);
      if (code !== 0) {
        err = `Child process exited unexpectedly: code ${JSON.stringify(code)}`;
        err += signal ? `, signal ${JSON.stringify(signal)}` : ", no signal";
        if (stderr.trim().length) {
          stderr = stderr.trim().split(/\r\n|[\n\r\u0085\u2028\u2029]/g)[0];
          err += `, got ${JSON.stringify(stderr)}`;
        }
        err = Error(err);
        err.code = code;
        err.signal = signal;
      }
      if (options.end) {
        connection.end();
        connection.on('error', function(err) {
          return callback(err);
        });
        return connection.on('close', function() {
          if (callback) {
            return callback(err, stdout, stderr);
          }
        });
      } else {
        if (callback) {
          return callback(err, stdout, stderr);
        }
      }
    };
    stream.on('error', function(err) {
      return console.log('error', err);
    });
    stream.on('exit', function() {
      exitCalled = true;
      [code, signal] = arguments;
      return exit();
    });
    stream.on('end', function() {
      stdoutCalled = true;
      return exit();
    });
    return stream.stderr.on('end', function() {
      stderrCalled = true;
      return exit();
    });
  });
  return child;
};

local = module.exports.local = function(options, callback) {
  var cmdOptions;
  cmdOptions = {};
  cmdOptions.env = options.env || process.env;
  cmdOptions.cwd = options.cwd || null;
  if (options.uid) {
    cmdOptions.uid = options.uid;
  }
  if (options.gid) {
    cmdOptions.gid = options.gid;
  }
  if (callback) {
    return exec(options.cmd, cmdOptions, function(err, stdout, stderr, ...args) {
      if (err) {
        err = `Child process exited unexpectedly: code ${JSON.stringify(err.code)}`;
        err += err.signal ? `, signal ${JSON.stringify(err.signal)}` : ", no signal";
        if (stderr.trim().length) {
          stderr = stderr.trim().split(/\r\n|[\n\r\u0085\u2028\u2029]/g)[0];
          err += `, got ${JSON.stringify(stderr)}`;
        }
        err = Error(err);
        err.code = err.code;
        err.signal = err.signal;
      }
      return callback(err, stdout, stderr, ...args);
    });
  } else {
    return spawn(options.cmd, [], Object.assign(cmdOptions, {
      shell: options.shell || true
    }));
  }
};

// ## Utilities
is_ssh_connection = function(obj) {
  var ref;
  return !!(obj != null ? (ref = obj.config) != null ? ref.host : void 0 : void 0);
};

is_object = function(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
};
