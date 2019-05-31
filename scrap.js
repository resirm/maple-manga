var cheerio = require('cheerio');
var http = require('https');
var url = 'https://www.manhuafen.com/comic/2237/';
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
        var manga = [];
        console.log($("span.zj_list_head_dat").html());
        // $("li.list-comic").each(function(){
        //     var name;
        //     name = $(this).find("a.image-link").attr("href");
        //     console.log(name);

        // });
    });
});