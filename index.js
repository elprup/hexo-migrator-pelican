var fs = require('fs'),
  readline = require('readline'),
  stream = require('stream'),
  path = require('path');

hexo.extend.migrator.register('pelican', function(args, callback){
  var source = args._.shift();

  if (!source){
    var help = [
      'Usage: hexo migrate pelican <pelican content directory path>',
      '',
      'For more help, you can check the docs: http://hexo.io/docs/migration.html'
    ];

    console.log(help.join('\n'));
    return callback();
  }

  function migrateFile (filepath) {
    var instream = fs.createReadStream(filepath);
    var outstream = new stream;
    outstream.readable = true;
    outstream.writable = true;

    hexo.log.i('Analyzing %s...', filepath);

    var rl = readline.createInterface({
        input: instream,
        output: outstream,
        terminal:false
    });

    var post = {title:'', date:'', content:''};
    var detectEmptyLine = false;
    var translation = {'Title': 'title',
                       'Date': 'date',
                       'Modified': 'updated',
                       'Category': 'categories',
                       'Tags': 'tags',
                       'Slug': 'permalink'}

    rl.on('line', function(line) {
      if (detectEmptyLine) {
        post.content += line + '\n';
        return;
      }
      if ( line == '' ) {
        detectEmptyLine = true;
        return;
      }
      var cmd = line.split(':')[0].trim();
      var argstring = line.substring(cmd.length+1, line.length).trim();
      var hexocmd = translation[cmd];
      if ( hexocmd == undefined ) {
        return;
      }
      if ( ['Category', 'Tags'].indexOf(cmd) != -1) {
        var arglist = [];
        var sourcelist = argstring.split(',');
        for (var i=0; i< sourcelist.length; i++) {
          arglist.push(sourcelist[i].trim());
        }
        post[hexocmd] = arglist;
        return;
      }
      post[hexocmd] = argstring;
    });

    rl.on('close', function() {
      hexo.post.create(post);
      hexo.log.i('Post migration finished: %s', post.title);
    });
  }

  fs.readdir(source, function(err, list) {
    if ( err ) {
      hexo.log.e(err);
      return callback();
    }
    list.forEach(function(file) {
      var filepath = source + "/" + file;
      fs.stat(filepath, function(err, stat) {
        if ( stat && stat.isFile() && (path.extname(filepath) == '.md') ){
          migrateFile(filepath);
        }
      });
    });
  });
  return callback();
});
