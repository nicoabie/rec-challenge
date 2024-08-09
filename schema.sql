-- intentionally encode restrictions into diners table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying with bitwise operations than other string representations and using LIKE
DROP TABLE IF EXISTS diners;
CREATE TABLE diners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  restrictions INTEGER
);

CREATE UNIQUE INDEX idx_diners_id ON diners(id);

-- intentionally encode restrictions into restaurants table
-- I know it is not normalized BUT I save joins
-- restrictions are encoded into integers for faster querying with bitwise operations than other string representations and using LIKE
DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  restrictions INTEGER
);

CREATE UNIQUE INDEX idx_restaurants_id ON restaurants(id);

DROP TABLE IF EXISTS tables;
CREATE TABLE tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  capacity INTEGER,
  CONSTRAINT fk_restaurant_id FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

CREATE UNIQUE INDEX idx_tables_id ON tables(id);

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

CREATE UNIQUE INDEX idx_reservations_id ON reservations(id);
-- for createReservation and findTables methods we need this index (no unique) to join faster
CREATE INDEX idx_reservations_table_id_and_datetime ON reservations(table_id, datetime);

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
  CONSTRAINT fk_reservation_id FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE
);

-- for createReservationDiners method we need this index (no unique) to join faster
CREATE INDEX idx_diners_reservations_diner_id_and_datetime ON diners_reservations(diner_id, datetime);
-- that index will also work for deleteReservation method, I made sure using "EXPLAIN QUERY PLAN"

-- we don't need a unique index on diners_reservations(id), we will never query using that id
-- we could even get rid of the column, here I'm following the pattern that all db tables have a primary key, even junction tables


DROP TABLE IF EXISTS restrictions;
CREATE TABLE restrictions (
  -- the id of the restriction is the bit it turns on
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255)
);

CREATE UNIQUE INDEX idx_restrictions_id ON restrictions(id);
