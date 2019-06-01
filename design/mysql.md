# Database Design
***
##Tables
* **user**

|用户id|用户名|电子邮箱|
|--------|---|---|
| user_id SMALLINT | user_name VARCHAR(255) | email VARCHAR(255) |

* **manga**

|漫画id|漫画名|url|封面url|更新时间|
|--------|---|---|--|--|
| manga_id SMALLINT | manga_name VARCHAR(255) | url VARCHAR(255) | cover_url VARCHAR(255) | update_time VARCHAR(255) |

* **subscription**

|用户id|漫画id|查看时间|
|--------|---|---|
| user_id SMALLINT | manga_id SMALLINT | seen_time VARCHAR(255) |
