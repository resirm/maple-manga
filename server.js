var express = require('express')
var bodyParser = require("body-parser"); 
var app = express()
var path = require('path')
var cheerio = require('cheerio');
var https = require('https');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'res')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/' , (req,res) => res.render('search') );

app.get('/result' , (req,res) => { 
  res.status(404).send(`<html><head><meta http-equiv="refresh" content="5;url=http://localhost:3000"></head><body><h1>请从搜索框进行搜索！</h1><p>5秒钟后跳转...</p></body></html>`);
});

app.post('/search', function(req, res) {
  var para = req.body.search;
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
    console.log(`应用实例，访问地址为 http://${ host==='::'?'localhost':host}:${port}`);
    //console.log(`Current path: ${__dirname}`);
})