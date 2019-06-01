# maple-manga

Manga subscriptions management.

**安装依赖**

    npm install express ejs cheerio

**启动服务**

    node server.js


[测试链接](http://localhost:3000)

**数据库**
    
    user:
		user_id:smallint
		user_name:varchar(255)
		email:varchar(255)

    subscription:
		user_id:smallint
		manga_id:smallint
		seen_time:varchar(255)

    manga:
		manga_id:smallint
		manga_name:varchar(255)
		url:varchar(255)
		cover_url:varchar(255)
		update_time:varchar(255)
