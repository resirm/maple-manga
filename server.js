'use strict';
var express = require('express')
var bodyParser = require("body-parser"); 
var app = express();
var path = require('path')
var session = require('express-session');
var mrt = require("./route/mainpage");
var mangapage = require("./route/manga");



app.use(bodyParser.urlencoded({ extended: false }));  
app.use(express.static(path.join(__dirname, 'res')));
app.use(session({
  secret :  'secret', // 对session id 相关的cookie 进行签名
  resave : true,
  saveUninitialized: false, // 是否保存未初始化的会话
  cookie : {
      maxAge : 1000 * 60 * 60 * 24 * 7, // 设置 session 的有效时间，单位毫秒
  },
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Main Page
app.get('/', mrt.home);
app.post('/result' , mrt.subscribe);
app.get('/img', mrt.img);
app.post('/search', mrt.search);
app.post('/seen', mrt.seen);
app.get('/regist', mrt.regist);
app.post('registHandle', mrt.registHandle);

// Manga Page
app.get('/manga', mangapage.manga);
app.get('/page',mangapage.page);
app.post('/bmk',mangapage.bmk);

var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`应用实例，访问地址为 http://${ host==='::'?'localhost':host}:${port}`);
    //console.log(`Current path: ${__dirname}`);
});


// node server.js 2>>log 1>&2 &
