var express = require('express')
var bodyParser = require("body-parser"); 
var app = express()
var path = require('path')
var cheerio = require('cheerio');
var http = require('https');
var session = require('express-session');
var mysql = require('mysql')
var con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'wsn',
  database: 'maple',
});

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(express.static(__dirname + '/res'));
app.use(session({
  secret :  'secret', // 对session id 相关的cookie 进行签名
  resave : true,
  saveUninitialized: false, // 是否保存未初始化的会话
  cookie : {
      maxAge : 1000 * 60 * 3, // 设置 session 的有效时间，单位毫秒
  },
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/' , function(req,res){
    var usr = req.query.usr;
    console.log(usr);
    req.session.userName = usr;
    res.render('search',{usr:usr});
});

app.post('/result' , function(req,res){
    var username = req.session.userName;
    var mname = req.body.name;
    var mcover = req.body.pic;
    var mlink = req.body.link;
    let query_manga = 'select * from manga where manga_name="' + mname +'"';
    con.query(query_manga, (err, resss) => {
      if(err){
        console.log('[QUERY ERROR] - ',err.message);
        return;
       } 
       if( resss.length == 0){ //没有则插入
          let mangaaddsql = 'insert into manga(manga_id, manga_name, url, cover_url, update_time) values(null,?,?,?,?)';
          let mangapara = [mname, mlink, mcover,"time"];
          con.query(mangaaddsql,mangapara, function (err, re){
            if(err){
                console.log('[INSERT ERROR] - ',err.message);
              return;
            }     
          });
       }
       //获取漫画id
       console.log(mname);
        let qmanga_id = 'select manga_id from manga where manga_name="' + mname + '"';
        con.query(qmanga_id, (err, ress) => {
      if(err){
        console.log('[QUERY ERROR] - ',err.message);
        return;
       } 
       console.log(ress);
       let mangaid =  ress[0].manga_id;

       //获取用户id
       let quser = 'select user_id from user where user_name="' + username + '"';
       con.query(quser, (err, result) => {
         if(err){
           console.log('[QUERY ERROR] - ',err.message);
           return;
          } 
           let usrid = result[0].user_id;

           //插入订阅
           let subaddsql = 'insert into subscription (user_id, manga_id, seen_time) values(?,?,?)';
           let subpara = [usrid, mangaid, "test"];
           con.query(subaddsql,subpara, (err, res) => {
            if(err){
              console.log('[INSERT ERROR] - ',err.message);
              return;
             } 
           } );
       });
    });
    });

});

app.post('/search', function(req, res) {
  var para = req.body.search;
  console.log(req.session.userName);
  var mangas = [];
  var m = res;
  var url = 'https://www.manhuafen.com/search/?keywords='+encodeURI(para);
  console.log(url);
  
  http.get(url, function(res){
    var chunks = [];
    var size = 0;
    res.on('data', function(chunk){
        chunks.push(chunk);
        size += chunk.length;
    });
    
    res.on('end', function(){
        var data = Buffer.concat(chunks, size);
        var html = data.toString();
        var $ = cheerio.load(html);
        
        $("li.list-comic").each( function(){
            var manga = {};
            manga.pic = $(this).find("img").attr("src");
            manga.name = $(this).find("a.image-link").attr("title");
            manga.link = $(this).find("a.image-link").attr("href");
            mangas.push(manga);
            // console.log(manga);
        });
        m.render('result', {mangas:mangas});
        
    });
    
  });
});
var server = app.listen(3000, function () {
 
    var host = server.address().address;
    var port = server.address().port;
   
    console.log("应用实例，访问地址为 http://%s:%s", host, port);
   
  })