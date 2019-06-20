'use strict';

const mysql = require('mysql')
var con = mysql.createConnection({
    host: 'localhost',
    user: 'ta78na',
    password: 'Ch1Ch2ch#',
    database: 'maple',
});

exports.queryUser = function(usr, cb) {
  let sql = `SELECT user_id FROM user WHERE user_name = '${ usr }';`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to get user information from database: ${err.message}`);
      return;
    }
    cb(res);
  });
}

exports.querySub = function(usr, cb) {
  let sql = `SELECT * FROM manga AS m WHERE m.manga_id IN (SELECT sub.manga_id FROM subscription AS sub JOIN user AS u WHERE sub.user_id = u.user_id AND u.user_name = '${ usr }');`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to get subscription information from database: ${err.message}`);
      return;
    }
    cb(res);
  });
}

exports.queryUpdateSub = function(usr,cb) {
  let sql = `SELECT sub.manga_id FROM subscription as sub JOIN manga AS m WHERE sub.user_id = (SELECT u.user_id FROM user AS u WHERE u.user_name = '${ usr }') AND m.manga_id = sub.manga_id and m.update_time <> sub.seen_time;`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to get subscription information from database: ${err.message}`);
      return;
    }
    cb(res);
  });
}

exports.queryManga = function(mangaName, cb){
  let sql = 'select manga_id from manga where manga_name="' + mangaName +'"';
  con.query(sql, (err, res) => {
    if(err){
      console.log('[QUERY ERROR] - ',err.message);
      return;
    }
    cb(res);
  });
}


exports.newManga = function(mangaName, link, cover){
  let sql = 'insert into manga(manga_id, manga_name, url, cover_url, update_time) values(null,?,?,?,?)';
  let para = [mangaName, link, cover, "time"];
  con.query(sql, para, (err, res) => {
    if(err){
      console.log('[INSERT ERROR] - ',err.message);
      return;
    }
  });
}

exports.newSub = function(usrId, mangaId){
  let sql = 'insert into subscription (user_id, manga_id, seen_time) values(?,?,?)';
  let para = [usrId, mangaId, "time"];
  con.query(sql, para, (err, res) => {
    if(err){
      console.log('[INSERT ERROR] - ',err.message);
      return;
    }
  });
}

exports.newUser = function(uname, uemail, ress){
  let sql = `insert into user values(null,"${uname}","${uemail}")`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to insert new user: ${err.message}`);
      ress.send("失败，用户名重复");
      return;
    }
    ress.send("注册成功，baby");
    console.log(`new user: "${uname}"`);
  });
}

exports.checkSeen = function(usrname, mangaId, cb){
  let sql = `SELECT m.update_time, sub.seen_time FROM subscription as sub JOIN manga AS m WHERE sub.user_id = (SELECT u.user_id FROM user AS u WHERE u.user_name = '${ usrname }') AND m.manga_id = sub.manga_id AND m.manga_id = ${ mangaId };`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to get seen_time information from database: ${err.message}`);
      return;
    }
    cb(res);
  });
}

exports.updateSeen = function(usrname, mangaId, time, cb){
  let sql = `UPDATE subscription SET seen_time = '${ time }' WHERE manga_id = ${ mangaId } AND user_id = (SELECT u.user_id FROM user AS u WHERE u.user_name = '${ usrname }');`;
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to update seen_time information from database: ${err.message}`);
      return;
    }
    console.log(`updated seen_time for manga_id: ${ mangaId }.`);
    cb(res);
  });
}

exports.allManga = function(cb){
  let sql = 'SELECT * FROM manga;';
  con.query(sql, (err, res) => {
    if(err){
      console.log(`Error occurred when trying to get manga information from database: ${err.message}`);
      return;
    }
    cb(res);
  });
}

exports.mangaUpdate = function(mangaId, time, cb){
  let sql = `UPDATE manga set update_time = "${time}" WHERE manga_id = ${mangaId};`;
  con.query(sql, (err, res) =>{
    if(err){
      console.log(`Error occurred when trying to get manga information from database: ${err.message}`);
      return;
    }
    cb(res);

  });
}
