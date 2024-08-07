insert into restrictions (name) values ('Gluten Free');
insert into restrictions (name) values ('Vegetarian');
insert into restrictions (name) values ('Paleo');
insert into restrictions (name) values ('Vegan');

insert into diners (name, restrictions) values ('Michael', 2);
insert into diners (name, restrictions) values ('George Michael', 3);
insert into diners (name, restrictions) values ('Lucile', 1);
insert into diners (name, restrictions) values ('Gob', 4);
insert into diners (name, restrictions) values ('Tobias', 0);
insert into diners (name, restrictions) values ('Maeby', 8);

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


-- george michael and lucile have a reservation with other 4 (incognitos) at lardo
insert into reservations (restaurant_id, table_id, capacity, datetime) values (1, 7, 6, '2024-08-05 20:00:00');
insert into diners_reservations (diner_id, reservation_id, datetime) values (2, 1, '2024-08-05 20:00:00');
insert into diners_reservations (diner_id, reservation_id, datetime) values (3, 1, '2024-08-05 20:00:00');

 -- george michael and lucile reservation to test deleting a reservation into the future
insert into reservations (restaurant_id, table_id, capacity, datetime) values (1, 1, 6, '2130-08-05 20:00:00');
insert into diners_reservations (diner_id, reservation_id, datetime) values (2, 2, '2130-08-05 20:00:00');
insert into diners_reservations (diner_id, reservation_id, datetime) values (3, 2, '2130-08-05 20:00:00');