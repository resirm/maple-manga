create table user(
    user_id smallint unsigned not null auto_increment,
    user_name varchar(255) not null unique,
    email varchar(255) default null,
    primary key(user_id)
);

create table manga(
    manga_id smallint unsigned not null auto_increment,
    manga_name varchar(255) not null unique,
    url varchar(255) not null,
    cover_url varchar(255) not null,
    update_time varchar(255) not null,
    primary key(manga_id)
);

create table subscription(
    user_id smallint unsigned not null,
    manga_id smallint unsigned not null,
    seen_time varchar(255) not null,
    primary key(user_id, manga_id),
    foreign key (user_id) references user(user_id),
    foreign key (manga_id) references manga(manga_id)
);