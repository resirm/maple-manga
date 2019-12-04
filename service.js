'use strict';
var cheerio = require('cheerio');
var http = require('http')
var https = require('https');
var db = require("./db");

exports.subscribe = function (mangaName, userName){
  db.queryManga(mangaName, (res) => {
    let manga_id = res[0].manga_id;
    db.queryUser(userName, (res)=>{
      let usr_id = res[0].user_id;
      db.newSub(usr_id, manga_id);
    });
  });
};

exports.updateBookmark = function(mangaId, userName, chapter, chapterLink){
  db.queryBookmark(userName, mangaId, (res) => {
    if (res.length == 0) {
      db.queryUser(userName, (res)=>{
        let usr_id = res[0].user_id;
        db.newBookmark(usr_id, mangaId, chapter, chapterLink);
      });
    } else {
      db.updateBookmark(userName, mangaId, chapter, chapterLink);
    }
  });
};

exports.showHome = function (req, res, usr){
  req.session.userName = usr;
  db.querySub(usr, (ress) => {
    let mangas;
    db.queryUpdateSub(usr, (resss) => {
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
    });
      
  });
}


exports.steal = function(h, host, p, cb){
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
  let chunks = [];
  let img;
  res.on('data',function(chunk){
    chunks.push(chunk);
  });
  res.on('end',function(){
    img = Buffer.concat(chunks);
    cb(img);
  });
  });
  else 
  rq = http.get(option,function(res){
    let chunks = [];
    let img;
    res.on('data',function(chunk){
      chunks.push(chunk);
    });
    res.on('end',function(){
      img = Buffer.concat(chunks);
      cb(img);
    });
    });
  rq.on("error", function(e){
  console.log(e);
	console.log("###########################req gg#######################");
	rq.end();	
});
	rq.on("timeout",() => { 
		console.log("###############time out###############");
		rq.end();
	});
  rq.end();
};

// ############################## update #############################
let check_update_interval = 3600000;
let update_checker = setInterval(check, check_update_interval);

function check() {
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