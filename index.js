var argv = require('optimist').argv;

function execShellCommand (command, args, stdinData, done) {
  var spawn = require('child_process').spawn,
    child = spawn(command, args), stdoutContent = '', stderrContent = '';
  child.stdout.on('data', function (data) {
    stdoutContent += data;
  });

  child.stderr.on('data', function (err) {
    stderrContent += err;
  });

  child.on('exit', function (code) {
    done(code, stderrContent, stdoutContent);
  });
  if(stdinData) {
    child.stdin.write(stdinData);
  }
  return child;
}

function readP12Certificate (path, password, done) {
  execShellCommand(
    'openssl',
    ['pkcs12', '-info', '-in', path, '-nodes', '-passin', 'pass:' + password],
    null,
    function (code, err, data) {
      if(code) {
        done(err);
      } else {
        done(null, data);
      }
    }
  );
}

function parseP12Certificate (path, password, done) {
  readP12Certificate(path, password, function (err, content) {
    if(err) {
      return done(err);
    }
    var start = content.indexOf('-----BEGIN CERTIFICATE-----'), endTag = '-----END CERTIFICATE-----', end = content.indexOf(endTag),
      cert = content.substring(start, end + endTag.length) + '\n';

    execShellCommand('openssl', ['x509', '-noout', '-startdate', '-enddate'], cert, function (code, err, data) {
      if(code) {
        return done(err);
      }
      var lines = data.split('\n'),
        startDate = (lines[0] || '').substring((lines[0] || '').indexOf('=') + 1),
        endDate = (lines[1] || '').substring((lines[1] || '').indexOf('=') + 1);
      startDate = new Date(startDate);
      endDate = new Date(endDate);
      done(null, cert, content, startDate, endDate);
    });
  });
}

parseP12Certificate(argv._[0], argv.password, function (err, cert, content, startDate, endDate) {
  if(err) {
    return console.error(err);
  }
  console.log('////////////////// copy cert below /////////////');
  console.log(cert);

  console.log('////////////////// copy content below /////////////');
  console.log(content);

  console.log('///////////////// startDate /////////////////////');
  console.log(startDate);
  console.log('///////////////// endDate /////////////////////');
  console.log(endDate);
});

