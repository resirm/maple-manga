'use strict';
var express = require('express')
var bodyParser = require("body-parser"); 
var app = express()
var path = require('path')
var cheerio = require('cheerio');
var https = require('https');
var session = require('express-session');
var http = require('http')
const mysql = require('mysql')
var con = mysql.createConnection({
    host: 'localhost',
    user: 'ta78na',
    password: 'ta78na',
    database: 'maple',
});

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

app.get('/' , function(req,res){
  var usr = req.query.usr;
  console.log(usr);
  if(usr == undefined)
  {
    res.send("sb,gun.");
    res.end();
  }
  req.session.userName = usr;
  // sql1: select m.* from subscription as sub join user as u join manga as m where sub.user_id = u.user_id and u.user_name          = 'ta78na' and sub.manga_id = m.manga_id;
  // sql2: select * from manga as m where m.manga_id in (select sub.manga_id from subscription as sub join user as u where           sub.user_id = u.user_id and u.user_name = 'ta78na');
  // use sql2;
  const query_subscription = `SELECT * FROM manga AS m WHERE m.manga_id IN (SELECT sub.manga_id FROM subscription AS sub JOIN user AS u WHERE sub.user_id = u.user_id AND u.user_name = '${ usr }');`;
  
  let mangas;
  con.query(query_subscription, (err, ress, fields) => {
    if(err){
      console.log(`Error occurred when trying to get subscription information from database: ${err.message}`);
      return;
    }
    const QUERY_SUB_NEW = `SELECT sub.manga_id FROM subscription as sub JOIN manga AS m WHERE sub.user_id = (SELECT u.user_id FROM user AS u WHERE u.user_name = '${ usr }') AND m.manga_id = sub.manga_id and m.update_time <> sub.seen_time;`
    con.query(QUERY_SUB_NEW, (err, resss, fields) => {
      if(err){
        console.log(`Error occurred when trying to get subscription information from database: ${err.message}`);
        return;
      }
      let updated = [];
      resss.forEach(manga => {
        console.log(manga);
        updated.push(manga.manga_id);
      });
      console.log(updated);
      ress.forEach(manga => {
        if(updated.indexOf(manga.manga_id) != -1){
          manga.update = true;
        }else{
          manga.update = false;
        }
        console.log(manga.manga_id, manga.update);
      });
      ress.sort((a, b) => b.update - a.update);
      console.log(ress, typeof ress);
      mangas = ress;
      res.render('index',{usr, mangas});
    })
  });
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
              // debug
              //console.table(result);
              let usrid = result[0].user_id;
            
              //插入订阅
              let subaddsql = 'insert into subscription (user_id, manga_id, seen_time) values(?,?,?)';
              let subpara = [usrid, mangaid, "test"];
              con.query(subaddsql,subpara, (err, res) => {
                if(err){
                  console.log('[INSERT ERROR] - ',err.message);
                  return;
                } 
              });
            });
        });
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
    let newuser = `insert into user values(null,"${uname}","${uemail}")`;
    con.query(newuser, (err, ress) => {
      if(err){
        console.log(`Error occurred when trying to insert new user: ${err.message}`);
        res.send("失败，用户名重复");
        return;
      }
        res.send("注册成功，baby");
      console.log(`new user: "${uname}"`);
    });
  }
  
});

//盗图
app.get('/img', function(req, ress) {
  let url = req.query.url;
  let reg = /^http(s)?:\/\/(.*?)\/(.*)/
  let host = reg.exec(url)[2];
  let p = '/'+ reg.exec(url)[3];
  let h = reg.exec(url)[1];
  let rq;
    var option={
    hostname:host,
    path:p,
    headers:{
      'Referer':'https://www.manhuafen.com'
      
    }
  };
  if(h == 's')
 rq = https.get(option,function(res){
  var chunks = [];
  var img;
  res.on('data',function(chunk){
    chunks.push(chunk);
  });
  res.on('end',function(){
    img = Buffer.concat(chunks);
    ress.write(img);
    ress.end();
  });
  });
  else 
  rq = http.get(option,function(res){
    var chunks = [];
    var img;
    res.on('data',function(chunk){
      chunks.push(chunk);
    });
    res.on('end',function(){
      img = Buffer.concat(chunks);
      ress.write(img);
      ress.end();
    });
    });
  rq.on("error", function(e){
	console.log(JSON.stringify(e));	
});
  rq.end();
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
  const CHECK_UPDATE_TIME = `SELECT m.update_time, sub.seen_time FROM subscription as sub JOIN manga AS m WHERE sub.user_id = (SELECT u.user_id FROM user AS u WHERE u.user_name = '${ usrname }') AND m.manga_id = sub.manga_id AND m.manga_id = ${ m_id };`;
  con.query(CHECK_UPDATE_TIME, (err, ress, fields) => {
    if(err){
      console.log(`Error occurred when trying to get seen_time information from database: ${err.message}`);
      return;
    }
    ress.forEach(time_res => {
     // console.table(time_res);
      if(time_res.update_time !== time_res.seen_time){
        const UPDATE_SEEN_TIME = `UPDATE subscription SET seen_time = '${ time_res.update_time }' WHERE manga_id = ${ m_id };`;
        con.query(UPDATE_SEEN_TIME, (err, upres, fields) => {
          if(err){
            console.log(`Error occurred when trying to update seen_time information from database: ${err.message}`);
            return;
          }
          console.log(`updated seen_time for manga_id: ${ m_id }.`);
        });
      }
    })
  });
});

var server = app.listen(80, function () {
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
  const QUERY = 'SELECT * FROM manga;';
  let mangas;
  con.query(QUERY, (err, res, fields) => {
    if(err){
      console.log(`Error occurred when trying to get manga information from database: ${err.message}`);
      return;
    }
    mangas = res;
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
              const UPDATE = `UPDATE manga set update_time = "${update_time}" WHERE manga_id = ${manga.manga_id};`;
              console.log(UPDATE);
              console.log(`${manga.manga_name} updated at: ${update_time}.`)
              console.log(update_time);
              con.query(UPDATE, (err, res, fields) => {
                if(err){
                  console.log(`Error occurred when trying to get manga information from database: ${err.message}`);
                  return;
                }
              //  console.table(res);
              })
            }
          });
        }).on('error', (e) => {
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
  rqq.end();
};

// node server.js 2>>log 1>&2 &
