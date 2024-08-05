DROP TABLE IF EXISTS diners;
CREATE TABLE diners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  -- we will encode restrictions into an integer to perform fast bitwise operations
  restrictions INTEGER
);

DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  -- we will encode restrictions into an integer to perform fast bitwise operations
  restrictions INTEGER
);

DROP TABLE IF EXISTS tables;
CREATE TABLE tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  capacity INTEGER
);

-- reservations and diners_reservations will get huge over time, we can use datetime column in both tables to archive past records. daily or weekly process

DROP TABLE IF EXISTS reservations;
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  table_id INTEGER NOT NULL,
  -- it may be the case that we gave a bigger table, it is nice to store the actual capacity in case a smaller table gets freed and we can move the reservation to not waste places
  -- that process is OOS but we leave the door open for its implementation
  capacity INTEGER,
  datetime DATETIME 
);

DROP TABLE IF EXISTS diners_reservations;
CREATE TABLE diners_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diner_id INTEGER NOT NULL,
  reservation_id INTEGER NOT NULL,
  -- this is the same datetime as in reservations
  -- we include it here to fastly check if any user has already a reservation at a given datetime
  -- and for archiving past records too
  datetime DATETIME
);

DROP TABLE IF EXISTS restrictions;
CREATE TABLE restrictions (
  -- the id of the restriction is the bit it turns on
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255)
);

insert into restrictions (name) values ('Gluten Free');
insert into restrictions (name) values ('Vegetarian');
insert into restrictions (name) values ('Paleo');
insert into restrictions (name) values ('Vegan');

-- intentionally encode restrictions into diners table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying that other string representations and using LIKE
insert into diners (name, restrictions) values ('Michael', 2);
insert into diners (name, restrictions) values ('George Michael', 3);
insert into diners (name, restrictions) values ('Lucile', 1);
insert into diners (name, restrictions) values ('Gob', 4);
insert into diners (name, restrictions) values ('Tobias', 0);
insert into diners (name, restrictions) values ('Maeby', 8);

-- intentionally encode restrictions into restaurants table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying that other string representations and using LIKE
insert into restaurants (name, restrictions) values ('Lardo', 1);
insert into restaurants (name, restrictions) values ('Panadería Rosetta', 3);
insert into restaurants (name, restrictions) values ('Tetetlán', 5);
insert into restaurants (name, restrictions) values ('Falling Piano Brewing Co', 0);
insert into restaurants (name, restrictions) values ('u.to.pi.a', 10);



insert into tables (restaurant_id, capacity) values (1, 2);
insert into tables (restaurant_id, capacity) values (1, 2);
insert into tables (restaurant_id, capacity) values (1, 2);
insert into tables (restaurant_id, capacity) values (1, 2);
insert into tables (restaurant_id, capacity) values (1, 4);
insert into tables (restaurant_id, capacity) values (1, 4);
insert into tables (restaurant_id, capacity) values (1, 6);

insert into tables (restaurant_id, capacity) values (2, 2);
insert into tables (restaurant_id, capacity) values (2, 2);
insert into tables (restaurant_id, capacity) values (2, 2);
insert into tables (restaurant_id, capacity) values (2, 4);
insert into tables (restaurant_id, capacity) values (2, 4);

insert into tables (restaurant_id, capacity) values (3, 2);
insert into tables (restaurant_id, capacity) values (3, 2);
insert into tables (restaurant_id, capacity) values (3, 2);
insert into tables (restaurant_id, capacity) values (3, 2);
insert into tables (restaurant_id, capacity) values (3, 4);
insert into tables (restaurant_id, capacity) values (3, 4);
insert into tables (restaurant_id, capacity) values (3, 6);

insert into tables (restaurant_id, capacity) values (4, 2);
insert into tables (restaurant_id, capacity) values (4, 2);
insert into tables (restaurant_id, capacity) values (4, 2);
insert into tables (restaurant_id, capacity) values (4, 2);
insert into tables (restaurant_id, capacity) values (4, 2);
insert into tables (restaurant_id, capacity) values (4, 4);
insert into tables (restaurant_id, capacity) values (4, 4);
insert into tables (restaurant_id, capacity) values (4, 4);
insert into tables (restaurant_id, capacity) values (4, 4);
insert into tables (restaurant_id, capacity) values (4, 4);
insert into tables (restaurant_id, capacity) values (4, 6);
insert into tables (restaurant_id, capacity) values (4, 6);
insert into tables (restaurant_id, capacity) values (4, 6);
insert into tables (restaurant_id, capacity) values (4, 6);
insert into tables (restaurant_id, capacity) values (4, 6);

insert into tables (restaurant_id, capacity) values (5, 2);
insert into tables (restaurant_id, capacity) values (5, 2);
