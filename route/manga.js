var cheerio = require('cheerio');
var express = require("express");
var db = require('../db');
var CryptoJS = require('../res/js/crypto-js');
var router = express.Router();
var svc = require('../service');

var http = require('https');

decrypto = function(chapterImages){

	let key = CryptoJS.enc.Utf8.parse("123456781234567G");  //十六位字符作为密钥
	let iv = CryptoJS.enc.Utf8.parse('ABCDEF1G34123412');
	let decrypt = CryptoJS.AES.decrypt(chapterImages,key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
	
	return decrypt.toString(CryptoJS.enc.Utf8);	
}


router.manga = function(req, ress, next) {
    // 
    let username = req.session.userName;
    let bookmark = "未观看"
    let toChapter = "#"
    let mangaId = req.query.id;
    if(username != undefined){
        db.queryBookmark(req.session.userName, mangaId, (bookres) => {
            if (bookres.length != 0) {
                bookmark = "续看" + bookres[0].seen_chapter;
                toChapter = bookres[0].chapter_url;
            }
        });
    }
    
    let url = req.query.url.replace("www","m");
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
            let lis = $("div.comic-chapters");
            let i = 1;
            lis.each((i,t) => {
                if($(t).find("span.Title").html() != null)
                {
                    let chapter = {};
                    chapter.name = $(t).find("span.Title").text();
                    chapter.num = i;
                    let cpt = [];
                    console.log("###################网络延迟#######################")
                    $(t).find("li").each((j ,k) => {
                        let hua = {};
                        hua.name = $(k).find("span").text();
                        hua.link = "https://www.manhuafen.com"+ $(k).find("a").attr("href");
                        cpt.push(hua);
                    });
                    chapter.list = cpt.reverse();
                    chapters.push(chapter);
                    i++;
                    
                }
            });
            
            ress.render('manga',{chapters, cover, title, bookmark, toChapter, mangaId});
           
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
    let m_url = '/page?url=' + url;
    let mangaId = req.query.id;
    let chapters = [];
    let prefix = "https://mhimg.eshanyao.com/"
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
            let lis = $('html').find('script');
            lis.each((i, elm)=> {

            	let text = $(elm).html();
            	if (text.match('chapterImages'))
            	{
                    eval(text);
                    let preu = "page?url=" + pageUrl + prevChapterData.id + ".html";
                    let nextu;
                    if(nextChapterData.id != null)
                        nextu = "page?url=" + pageUrl + nextChapterData.id + ".html";
                    else nextu = "#";
                    let murls = decrypto(chapterImages);
                    let title = pageTitle;
                    let ul;
                    eval("ul = " + murls);
                    ul.forEach(element => {
                        if( chapterPath == "" || element.indexOf('http') != -1) {
                            if (element.indexOf('dmzj') != -1)
                                chapters.push(encodeURI("https://mhimg.eshanyao.com/showImage.php?url="+element));
                            else
                            chapters.push(encodeURI(element));
                        }
                        else
                        chapters.push(encodeURI(prefix + chapterPath + element));
                    });

                    // console.log(chapters);
                    ress.render('test', {chapters, preu, nextu, title, m_url, mangaId});
            		
            	}
            });
        });   
        });
	rq.on("error", function(e){
              console.log(e);
              console.log("###########################req gg#######################");
              router.page(req,ress);
          });

}

router.bmk = function(req, ress){
    let userName = req.session.userName;
    if(userName != undefined){
        let reg = /\d+/
        let num = reg.exec(req.body.m_cpt);
        let cpt;
        if (num.length != 0){
        cpt = reg.exec(req.body.m_cpt)[0];
        }
        else {
        cpt = req.body.m_cpt;
        }
        let mangaId = req.body.mangaId;
        let cptlink = req.body.m_url;
        svc.updateBookmark(mangaId, userName, cpt, cptlink);
    }
};
    
router.subcancel = function(req, ress){
    let userName = req.session.userName;
    if (userName == undefined){
        ress.send("未登录");
    } else {
        let mangaId = req.body.mangaId;
        svc.subscribeCancel(mangaId, userName, ()=>{
        ress.send("取消成功");
        });
    }

}
module.exports = router;

