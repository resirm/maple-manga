'use strict';

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
    });
    ress.sort((a, b) => b.update - a.update);
      console.log(ress, typeof ress);
      mangas = ress;
      res.render('index',{usr, mangas});
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