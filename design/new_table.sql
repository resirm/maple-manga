create table bookmark(
    user_id smallint unsigned not null,
    manga_id smallint unsigned not null,
    seen_chapter varchar(255) not null,
    chapter_url VARCHAR(255) not null,
    primary key(user_id, manga_id),
    foreign key (user_id) references user(user_id),
    foreign key (manga_id) references manga(manga_id)
);