var cheerio = require('cheerio');
var express = require("express");
var router = express.Router();

var http = require('https');


router.manga = function(req, ress, next) {
    let url = req.query.id;
    let cover = req.query.c;
    let title = req.query.t;
    let chapters = [];
    http.get(url, function(res){
        let chunks = [];
        let size = 0;
        res.on('data', function(chunk){
            chunks.push(chunk);
            size += chunk.length;
        });
        
        res.on('end', function(){
            let data = Buffer.concat(chunks, size);
            let html = data.toString();
            let $ = cheerio.load(html);
            let lis = $("div.zj_list");
            let i = 1;
            lis.each((i,t) => {
                if($(t).find("h2").html() != null)
                {
                    let chapter = {};
                    chapter.name = $(t).find("h2").text();
                    chapter.num = i;
                    let cpt = [];
                    console.log("##########################################")
                    $(t).find("li").each((j ,k) => {
                        let hua = {};
                        hua.name = $(k).find("a").attr("title");
                        hua.link = "https://www.manhuafen.com"+ $(k).find("a").attr("href");
                        cpt.push(hua);
                    });
                    chapter.list = cpt.reverse();
                    chapters.push(chapter);
                    i++;
                    
                }
            });
            
            ress.render('manga',{chapters, cover, title});
           
        });   
        });
}
    
module.exports = router;

