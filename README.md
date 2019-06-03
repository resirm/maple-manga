# maple-manga

Manga subscriptions management.

**安装依赖**

    npm install express ejs cheerio express-session

**启动服务**

    node server.js

测试地址：http://localhost:3000/?usr=zyf
搜索完成后，点击订阅即可添加

## TODO

1. 登录用户名不存在时的异常处理，避免崩溃
2. 订阅界面，漫画标题的超链接更正
3. 添加浏览器标签页小图标
4. 重定向所有非法访问，只允许从根目录访问并带有usr参数
5. 检验用户名写sql关键字能否实现sql注入？
6. 插入订阅时，插入真实seen_time （好像不用？刚订阅还没看）
7. https的get增加error处理，重爬。