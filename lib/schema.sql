CREATE DATABASE muse;
\c muse

CREATE TABLE users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  created timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  song text NOT NULL,
  artist text NOT NULL,
  created timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  post_id integer NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  comment text NOT NULL,
  created timestamp NOT NULL DEFAULT NOW()
);