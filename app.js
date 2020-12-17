var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require("express-handlebars")

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var fileupload= require('express-fileupload')
var db =require('./config/connection')
var mongoClient=require('mongodb').mongoClient
var session=require('express-session')
const passport=require('passport')
var cookieSession=require('cookie-session')


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))

app.use(logger('dev'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())
app.use(passport.initialize())
app.use(passport.session())



app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
db.connect((err)=>{
  if (err)
  console.log("Connection error"+err)
  else
 console.log("Database connected");
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);


app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
