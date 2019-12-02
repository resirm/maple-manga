var cheerio = require('cheerio');
var http = require('https');
var url = 'https://m.manhuafen.com/comic/1802/155839.html';
var mangas = [];
var m;

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
            let lis = $('html').find('script');
            lis.each((i, elm)=> {

            	let text = $(elm).html();
            	if (text.match('chapterImages'))
            	{
            		let a = eval(text);
            		console.log(a);
			
            	}
            });
            
            
       
           
        });   
        });
    


