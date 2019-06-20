'use strict';
var express = require('express')
var bodyParser = require("body-parser"); 
var app = express();
var path = require('path')
var cheerio = require('cheerio');
var https = require('https');
var session = require('express-session');
var http = require('http');
var fs = require('fs');
var db = require('./db');
var svc = require('./service');


let check_update_interval = 3600000;

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

app.get('/', (req, res) => {
  var usr = req.query.usr;
  console.log(usr);
  if(usr == undefined)
  {
    res.send(`<html><body><div style="text-align:center; font-size:404px">404</div></body></html>`)
    res.end();
    return;
  }
  db.queryUser(usr, (qres) => {
    if (qres.length === 0){
      res.render('regist');
      res.end();
    }
    else{
      svc.showHome(req, res, usr);
    }
  });
});

//########################添加订阅##########################
app.post('/result' , function(req,res){
    var username = req.session.userName;
    var mname = req.body.name;
    var mcover = req.body.pic;
    var mlink = req.body.link;
    let re = /(.*)\/(\d+)\//
    let r1 = /^http(s)?:\/\/(.*?)\/(.*)/
    
    let ms = 'img/' + re.exec(mlink)[2] + ".jpg";
    db.queryManga(mname, (mqres) => {
      //没有则插入
      if (mqres.length == 0) {
        if(mcover.search(r1) == -1)
        {
          ms = mcover;
        } else {
        console.log(mcover);
        let host = r1.exec(mcover)[2];
        let p  = '/'+ r1.exec(mcover)[3];
        let h = r1.exec(mcover)[1];
       
        svc.steal(h, host, p, (img) => {
            fs.open('res/' + ms,'w',(err, fd) => {
              fs.write(fd, img,(err)=>{
                  if(err)
                  {
                    console.log('download err');
                  }
                  console.log('save success');
                  fs.close(fd,()=>{});
              });
            });
          });
          }
        db.newManga(mname, mlink, ms);
        svc.subscribe(mname, username);
      }
      else{
        svc.subscribe(mname, username);
      } 
    });
    res.send("nice");
});


app.get('/regist', function(req, res) {
  res.render('regist');
});

app.post('/registHandle', function(req, res) {
  let uname = req.body.username;
  let uemail = req.body.email;
  let upass = req.body.password;

  if (upass != "daddyplease")
  res.send("SB, GET OUT OF HERE!");
  else{
    db.newUser(uname, uemail, res);
  }
  
});

//盗图
app.get('/img', function(req, ress) {
  let url = req.query.url;
  let reg = /^http(s)?:\/\/(.*?)\/(.*)/
  let host = reg.exec(url)[2];
  let p = '/'+ reg.exec(url)[3];
  let h = reg.exec(url)[1];
  svc.steal(h, host, p, (img)=>{
    ress.write(img);
    ress.end();
  });
  
});


app.post('/search', function(req, res) {
  var para = req.body.search;
  console.log(req.session.userName);
  var usrname = req.session.userName;
  var mangas = [];
  var m = res;
  var url = 'https://www.manhuafen.com/search/?keywords='+encodeURI(para);
  console.log(url);
  
  https.get(url, function(res){
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
          let reg = /^http(s)?:\/\/(.*?)\/(.*)/
          let link;
          link = $(this).find("img").attr("src");
          manga.name = $(this).find("a.image-link").attr("title");
          manga.link = $(this).find("a.image-link").attr("href");
          manga.ori = link;
          
          if (link.search(reg) == -1)
          {manga.pic = link;}
          else
          {manga.pic = "img?url=" + link}
          
          mangas.push(manga);
            // console.log(manga);
        });
        m.render('result', {mangas:mangas, usrname});
    });
  });
});

app.post('/seen', function(req, res) {
  console.log(req.session.userName);
  var usrname = req.session.userName;
  console.log(req.session.userName);
  var m_id = req.body.m_id;
  db.checkSeen(usrname, m_id, (qres) => {
    qres.forEach(time_res => {
      if(time_res.update_time !== time_res.seen_time) {
        db.updateSeen(usrname, m_id, time_res.update_time, (upres) => {
          console.log(`updated seen_time for manga_id: ${ m_id }.`);
        });
    }
    });
  });
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`应用实例，访问地址为 http://${ host==='::'?'localhost':host}:${port}`);
    //console.log(`Current path: ${__dirname}`);
})

let update_checker = setInterval(check, check_update_interval);

function check() {
  if(con.state !== 'authenticated'){
    con.connect();
  }
  console.log(con.state);
  let mangas;
  db.allManga((gres) => {
    mangas = gres;
    mangas.forEach(manga => {
      let rqq = https.get(manga.url, function(res){
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
            let update_time = $("span.zj_list_head_dat").text();
            console.log(`update_time: ${update_time}`);
            if (update_time !== manga.update_time){
              console.log(UPDATE);
              console.log(`${manga.manga_name} updated at: ${update_time}.`)
              console.log(update_time);
              db.mangaUpdate(manga.manga_id, update_time,()=>{});
            }
          });
        });

      rqq.on('error', (e) => {
          // 处理error
          console.log(`get update error: ${e.message}`);
          check_update_interval = 60000;
          console.log(`reset check_update_interval: ${check_update_interval}`);
          clearInterval(update_checker)
          update_checker = setInterval(check, check_update_interval);
        });
    });
    check_update_interval = 3600000;
    console.log(`reset check_update_interval: ${check_update_interval}`);
    clearInterval(update_checker)
    update_checker = setInterval(check, check_update_interval);
  });
};

// node server.js 2>>log 1>&2 &
