-- intentionally encode restrictions into diners table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying with bitwise operations than other string representations and using LIKE
DROP TABLE IF EXISTS diners;
CREATE TABLE diners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  restrictions INTEGER
);

-- intentionally encode restrictions into restaurants table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying with bitwise operations than other string representations and using LIKE
DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  restrictions INTEGER
);

DROP TABLE IF EXISTS tables;
CREATE TABLE tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  capacity INTEGER,
  CONSTRAINT fk_restaurant_id FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

-- reservations and diners_reservations will get huge over time, we can use datetime column in both tables to archive past records. daily or weekly process

DROP TABLE IF EXISTS reservations;
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- this could be here or not, we can get the restaurant_id from the table but for reporting processes avoiding JOINs could be beneficial
  restaurant_id INTEGER NOT NULL,
  table_id INTEGER NOT NULL,
  -- it may be the case that we gave a bigger table, it is nice to store the actual capacity in case a smaller table gets freed and we can move the reservation to not waste places
  -- that process is OOS but we leave the door open for its implementation
  capacity INTEGER,
  datetime DATETIME,
  CONSTRAINT fk_restaurant_id FOREIGN KEY (restaurant_id) REFERENCES restaurants (id), 
  CONSTRAINT fk_table_id FOREIGN KEY (table_id) REFERENCES tables (id) 
);

DROP TABLE IF EXISTS diners_reservations;
CREATE TABLE diners_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diner_id INTEGER NOT NULL,
  reservation_id INTEGER NOT NULL,
  -- this is the same datetime as in reservations
  -- we include it here to fastly check if any user has already a reservation at a given datetime
  -- and for archiving past records too
  datetime DATETIME,
  CONSTRAINT fk_diner_id FOREIGN KEY (diner_id) REFERENCES diners (id), 
  CONSTRAINT fk_reservation_id FOREIGN KEY (reservation_id) REFERENCES reservations (id)
);

DROP TABLE IF EXISTS restrictions;
CREATE TABLE restrictions (
  -- the id of the restriction is the bit it turns on
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255)
);