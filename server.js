var express = require('express')
var app = express()
var path = require('path')

app.use(express.static(__dirname + '/res'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/' , function(req,res){
    res.render('search');
});

app.get('/result' , function(req,res){
  res.render('result');
});
var server = app.listen(3000, function () {
 
    var host = server.address().address
    var port = server.address().port
   
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
   
  })