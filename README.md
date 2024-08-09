# rec-challenge

## Setup

To install dependencies:

```bash
bun install
```

To create a sqlite db file:
```shell
cat schema.sql | sqlite3 db.sqlite
cat seed.sql | sqlite3 db.sqlite
```

To run:

```bash
bun start 
```

This project was created using `bun init` in bun v1.1.22. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
