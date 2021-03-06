var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var twitterAPI = require('node-twitter-api');
var conf = require('config');
var methodOverride  = require("method-override");
var ECT = require('ect');
var multer = require('multer');
var fs = require("fs");

var routes = require('./routes/index');
var users = require('./routes/users');
var apiTwitter = require('./routes/twitter'); //routes are defined here

var createEnjo = require('./controller/createEnjo');

var app = express();

var addr;
var twitter;

// view engine setup
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
app.engine('ect', ectRenderer.render);
app.set('view engine', 'ect');
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({ dest: __dirname+'/public/imgs'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);
app.use('/users', users);
app.use('/api', apiTwitter); //This is our route middleware

app.post("/test/twitter",function(req,res){
    console.dir(req.files);
    var old_path = req.files.image.path;
    var new_path = req.files.image.path + ".png";
    fs.rename(old_path, new_path, function(err){
        if(err){return err}
        var twitter = require.main.children[1].exports.twitterAPI;
        twitter.statuses("update_with_media", {
                media: [
                    new_path
                ],
                status: ""
            },
            conf.twitter.accessToken,
            conf.twitter.accessTokenSecret,
            function(error, data, response) {
                if (data.errors) {
                    console.log("error:",data.errors);
                    res.json(data.errors);
                    // something went wrong
                } else {
                    console.log(data);
                    res.json({ imgURL: data.text});
                    // data contains the data sent by twitter
                }
                fs.unlink(new_path,function(err){
                    if(err){return err}
                });
            }
        );
    });
});

app.get("/api/create-enjo",function(req,res){
    console.log("炎上画像作成を開始します");
    createEnjo.init(req, res, fs);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    addr = add;
    module.exports.twitterAPI= new twitterAPI({
        consumerKey: conf.twitter.consumerKey,
        consumerSecret: conf.twitter.consumerSecret,
        callback: 'http://' + addr
    });
});

module.exports = app;
