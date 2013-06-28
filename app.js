

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , useragent = require('express-useragent');

// template engine
var hbs = require('hbs');

// mongodb
var mongo = require('mongodb');
//var Server = require('mongodb').Server;

var mongodbhost = 'yourid.mongolab.com'
  , mongodbport = 'yourport'
  , mongodbuser = 'user'
  , mongodbpassword = 'password'
  , mongodbname = 'dbname';

//var rs = require('./record_model.js');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  /*
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  */

  // Apply basic authentication to server
  app.use(express.basicAuth('admin', 'password'));

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  app.engine('html', require('hbs').__express);
  app.set('views', __dirname + '/views/html');
  app.set('view engine', 'html');


});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// invoke useragent sniffing module
app.use(useragent.express());



/*  google webmaster and sitemap.xml  */
function generate_xml_sitemap() {
    // this is the source of the URLs on your site, in this case we use a simple array, actually it could come from the database
    var urls = ['/'];
    // the root of your website - the protocol and the domain name with a trailing slash
    var root_path = 'http://www.yourdomain.com/';
    // XML sitemap generation starts here
    var priority = 0.5;
    var freq = 'monthly';
    var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for (var i in urls) {
        xml += '<url>';
        xml += '<loc>'+ root_path + urls[i] + '</loc>';
        xml += '<changefreq>'+ freq +'</changefreq>';
        xml += '<priority>'+ priority +'</priority>';
        xml += '</url>';
        i++;
    }
    xml += '</urlset>';
    return xml;
}

app.get('/sitemap.xml', function(req, res) {
    var sitemap = generate_xml_sitemap(); // get the dynamically generated XML sitemap
    res.header('Content-Type', 'text/xml');
    res.send(sitemap);     
})


// UTILITY ROUTE HANDLING

// loader.io
app.get('/loaderio-12345.html', function(req, res){
  res.send('loaderio-12345');
});

// for testing mobile
app.get('/mobile', function(req, res){ 
  //res.render("m.html");
  res.send("There is no mobile site ...yet.");
});


/*
  Mongolab example test query:
  https://api.mongolab.com/api/1/databases/databasename/collections/content?q={'locale':{$exists:true}}&s=&f=&apiKey=12345
*/


// ROUTE HANDLING


// User of an age gate (should you choose to use one)
/*
app.get('/', function(req, res){

  // To Get a Cookie
  var cookies = {};
  req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
    //console.log(cookies.userAge);

    if (cookies.userAge != undefined && cookies.userAge > 17) {
      //console.log('jeeeyuh');
      res.redirect('/site');
    }

  });

  res.render('index.html', { layout : false , 'title' : 'demo'});
});
*/



// LIST VIEW
app.get('/cms', function(req, res){

  var listData = function(err, collection) {
      collection.find({ 'locale': {$exists: true}}).toArray(function(err, results) {
          res.render('index.html', { layout : false , 'title' : 'demo', 'results' : results });
      });
  }

  var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});

  db.open(function(err, client) {
    client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
      client.collection('content', listData);
      //client.close();
    });
  });

})


// SPECIFY VIEW LOCALE
// Uncomment this if you want to go localized
/* 
app.get('/:locale', function(req, res){     // en_US 
  var ObjectID = require('mongodb').ObjectID;

  var listData = function(err, collection) {
      var chosenLocale = req.params.locale;

        collection.findOne({'locale' : chosenLocale} , function(err, results) {
          res.render('home.html', { layout : false , 'title' : 'demo', 'results' : results });
      });
  }
  */
app.get('/', function(req, res){     
  var ObjectID = require('mongodb').ObjectID;

  var listData = function(err, collection) {

        collection.findOne({'locale' : 'en_US'} , function(err, results) {
          res.render('home.html', { layout : false , 'title' : 'demo', 'results' : results });
      });
  }

  var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});

  db.open(function(err, client) {
  client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
    client.collection('content', listData);
      //client.close();
      });
    });
});


// CREATE
app.get('/add_record', function(req, res){
    res.render('add.html', { layout : false , 'title' : 'demo'});
})

app.post('/save_record', function(req, res){
  console.log(req.body);

  var data = {'content1' : req.body.content1 , 'content2' : req.body.content2, 'content3' : req.body.content3, 'content4' : req.body.content4, 'content5' : req.body.content5, 'content6' : req.body.content6,
    'locale' : req.body.locale, 'status' : req.body.status };

  var insertData = function(err, collection) {
      collection.insert(data, function() {});
  }

  var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});

  db.open(function(err, client) {
    client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
        client.collection('content', insertData);
        //client.close();
        });   
    });    

    res.redirect('/');
});


// EDIT VIEW
app.get('/edit_record/:id', function(req, res){
  var ObjectID = require('mongodb').ObjectID;

  var listData = function(err, collection) {

      var chosenId = new ObjectID(req.params.id);

      collection.findOne({'_id' : chosenId} , function(err, results) {
          res.render('edit.html', { layout : false , 'title' : 'demo', 'results' : results });
      });
  }

  var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});

  db.open(function(err, client) {
  client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
    client.collection('content', listData);
      //client.close();
      });
    });

});

// EDIT UPDATE
app.post('/update_record', function(req, res){
    console.log(req.body);

    var ObjectID = require('mongodb').ObjectID;

    var data = {'content1' : req.body.content1 , 'content2' : req.body.content2, 'content3' : req.body.content3, 'content4' : req.body.content4, 'content5' : req.body.content5, 'content6' : req.body.content6,
      'locale' : req.body.locale, 'status' : req.body.status };

    var updateData = function(err, collection) {
        var chosenId = new ObjectID(req.body.id);
        collection.update({"_id": chosenId}, {$set: data }, function() {});
    }

    var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});
    db.open(function(err, client) {
    client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
      client.collection('content', updateData);
        //client.close();
        });
      });   

    res.redirect('/');
});


// DELETE
app.get('/delete_record/:id', function(req, res){
    var ObjectID = require('mongodb').ObjectID;

    var removeData = function(err, collection) {
        var chosenId = new ObjectID(req.params.id);
        collection.remove({'_id' : chosenId}, function() {});
    }


    var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});
    db.open(function(err, client) {
    client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
        client.collection('content', removeData);
        //client.close();
        }); 
      });  

    res.redirect('/');
});


// MEDIA - EDIT VIEW
app.get('/edit_media', function(req, res){
  var ObjectID = require('mongodb').ObjectID;

  var listData = function(err, collection) {

      collection.findOne({'type' : 'media'} , function(err, results) {
          //console.log(results);
          res.render('editmedia.html', { layout : false , 'title' : 'demo', 'results' : results });
      });
  }

  var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});

  db.open(function(err, client) {
  client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
    client.collection('content', listData);
      //client.close();
      });
    });

});

// MEDIA - EDIT UPDATE
app.post('/update_media', function(req, res){
    console.log(req.body);

    var ObjectID = require('mongodb').ObjectID;

    var data = {'media1' : req.body.media1
      , 'media2' : req.body.media2
      , 'media3' : req.body.media3
      , 'media4' : req.body.media4
      , 'media5' : req.body.media5
      , 'media6' : req.body.media6
      , 'media7' : req.body.media7
    };

    var updateData = function(err, collection) {
        var chosenId = new ObjectID(req.body.id);
        collection.update({"_id": chosenId}, {$set: data }, function() {});
    }

    var db = new mongo.Db(mongodbname, new mongo.Server(mongodbhost, mongodbport, {}), {w: 1});
    db.open(function(err, client) {
    client.authenticate(mongodbuser, mongodbpassword, function(err, p_client) {
      client.collection('content', updateData);
        //client.close();
        });
      });   

    res.redirect('/');
});


// END ROUTE

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});