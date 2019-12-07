'use strict';
var express = require('express')
var rt = express.Router();
var cheerio = require('cheerio');
var https = require('https');
var fs = require('fs');
var db = require('../db');
var svc = require('../service');



rt.home = function(req, res) {
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
}

//########################添加订阅##########################
rt.subscribe = function (req,res){
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
}


rt.regist = function(req, res) {
  res.render('regist');
}

rt.registHandle = function(req, res) {
  let uname = req.body.username;
  let uemail = req.body.email;
  let upass = req.body.password;

  if (upass != "daddyplease")
  res.send("SB, GET OUT OF HERE!");
  else{
    db.newUser(uname, uemail, res);
  }
  
}

//盗图
rt.img = function(req, ress) {
  let url = req.query.url;
  let reg = /^http(s)?:\/\/(.*?)\/(.*)/
  let host = reg.exec(url)[2];
  let p = '/'+ reg.exec(url)[3];
  let h = reg.exec(url)[1];
  svc.steal(h, host, p, (img)=>{
    ress.write(img);
    ress.end();
  });
  
}


rt.search =  function(req, res) {
  var para = req.body.search;
  console.log(req.session.userName);
  var usrname = req.session.userName;
  var mangas = [];
  var m = res;
  var url = 'https://www.manhuafen.com/search/?keywords='+encodeURI(para);
  // console.log(url);
  
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
}

rt.seen =  function(req, res) {
  // console.log(req.session.userName);
  var usrname = req.session.userName;
  // console.log(req.session.userName);
  var m_id = req.body.m_id;
  db.checkSeen(usrname, m_id, (qres) => {
    qres.forEach(time_res => {
      if(time_res.update_time !== time_res.seen_time) {
        db.updateSeen(usrname, m_id, time_res.update_time, (upres) => {
          // console.log(`updated seen_time for manga_id: ${ m_id }.`);
        });
    }
    });
  });
}

module.exports = rt;
