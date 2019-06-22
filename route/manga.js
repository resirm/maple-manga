var cheerio = require('cheerio');
var express = require("express");
var CryptoJS = require('../res/js/crypto-js');
var router = express.Router();

var http = require('https');

decrypto = function(chapterImages){

	let key = CryptoJS.enc.Utf8.parse("123456781234567G");  //十六位字符作为密钥
	let iv = CryptoJS.enc.Utf8.parse('ABCDEF1G34123412');
	let decrypt = CryptoJS.AES.decrypt(chapterImages,key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
	
	return decrypt.toString(CryptoJS.enc.Utf8);	
}


router.manga = function(req, ress, next) {
    let url = req.query.id;
    let cover = req.query.c;
    let title = req.query.t;
    let chapters = [];
    let rq = http.get(url, function(res){
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
        rq.on("error", function(e){
              console.log(e);
              console.log("###########################req gg#######################");
              router.manga(req,ress,next);
          });
}

router.page = function(req, ress){
    let url = req.query.url;
    // var url = 'https://m.manhuafen.com/comic/2237/173474.html';
    let chapters = [];
    let prefix = "https://mhcdn.333dm.com/"
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
            let lis = $('html').find('script');
            lis.each((i, elm)=> {

            	let text = $(elm).html();
            	if (text.match('chapterImages'))
            	{
                    eval(text);
                    let murls = decrypto(chapterImages);
                    
                    let ul;
                    eval("ul = " + murls);
                    ul.forEach(element => {
                        if( chapterPath == "")
                        chapters.push(element);
                        else
                        chapters.push(prefix + chapterPath + element);
                    });

                    // console.log(chapters);
                    ress.render('test', {chapters});
            		
            	}
            });
        });   
        });

}
    
module.exports = router;

