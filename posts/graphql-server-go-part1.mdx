---
title: "Let's Build a GraphQL Server in Go, Part 1"
date: '2020-01-04'
author: 'Filip Wojciechowski'
twitterProfile: 'https://twitter.com/filipcodes'
excerpt: 'This is the first in a series of posts covering the process of building a simple yet full featured GraphQL server in Go. In this post we will use gqlgen and sqlc to build a working GraphQL server backed by a PostgreSQL database, and capable of performing basic CRUD operations.'
coverImage: 'joel-filipe-jU9VAZDGMzs-unsplash.jpg'
coverImageCreditText: 'Photo by Joel Filipe'
coverImageCreditUrl: 'https://unsplash.com/photos/jU9VAZDGMzs'
tags: ['go', 'golang', 'graphql', 'sqlc', 'gqlgen', 'postgresql']
---

## Introduction

This is the first in a series of posts covering the process of building a simple yet full featured GraphQL server in Go. In this post we will use [gqlgen](https://github.com/99designs/gqlgen) and [sqlc](https://github.com/kyleconroy/sqlc) to build a working GraphQL server backed by a PostgreSQL database, and capable of performing basic CRUD operations. Subsequent posts will discuss:

- dataloaders: [Let's Build a GraphQL Server in Go, Part 2: Dataloaders](https://w11i.me/graphql-server-go-part2-dataloaders),
- authentication and authorization [link to come],
- strategies for testing the server [link to come].

I assume a basic familiarity with [GraphQL](https://graphql.org/learn/), [PostgreSQL](http://www.postgresqltutorial.com/) and [Go](https://tour.golang.org). While I will not explain the syntax, I will talk through the logic of particular pieces of code and my design decisions.

> Before we get started, [here’s the GitHub repository with the code for this series of posts](https://github.com/fwojciec/gqlgen-sqlc-example/tree/part1). You will find the code corresponding to this post under the `part1` tag.

We will be building a GraphQL back-end server for an imaginary literary agency website. Here's an overview of the data types we will be working with:

`Agent` objects, representing the agency's agents:

```graphql
type Agent {
  id: ID!
  name: String!
  email: String!
  authors: [Author!]!
}
```

Agents have a `name` and an `email` (both of which are required). One agent represents many `authors`.

`Author` objects, representing the agency's authors:

```graphql
type Author {
  id: ID!
  name: String!
  website: String
  agent: Agent!
  books: [Book!]!
}
```

Authors have a required `name` and an optional `website`. Each author must have a single `agent` and they can have many `books`.

`Book` objects, representing books written by the agency's authors:

```graphql
type Book {
  id: ID!
  title: String!
  description: String!
  cover: String!
  authors: [Author!]!
}
```

A book has a `title`, a `description` and a `cover` (all required) and it can have multiple `authors`.

We have a one-to-many relationship between agents and authors (each author is represented by a single agent, but an agent represents many authors) and a many-to-many relationship between authors and books (a book can have multiple authors and an author can have multiple books). The schema also implies an indirect many-to-many relationship between agents and books (a book written by multiple authors can, in principle, have more than one agent responsible for it, and an agent is typically responsible for many books).

## PostgreSQL and sqlc configuration

Let's initialize a new Go project:

```
> mkdir gqlgen-sqlc-example
> cd gqlgen-sqlc-example
> go mod init github.com/[username]/gqlgen-sqlc-example
```

Let's also install the two primary dependencies of the project:

```
> go get github.com/lib/pq
> go get github.com/99designs/gqlgen
```

The `pq` dependency is a Go PostgreSQL driver. `gqlgen` is the library/tool we will use to generate our server from the GraphQL schema that we will write in a moment. We also have to install `sqlc`, a utility we will use to generate type-safe database code for our server. Right now the installation of `sqlc` involves downloading the binary using [one of the links on the project's GitHub page](https://github.com/kyleconroy/sqlc#downloads). Download the binary, add it to your `$PATH`, and make sure that you can run it:

```
> sqlc version
v0.0.1
```

We configure `sqlc` by adding a file named `sqlc.json` to the project's root directory.

```
> touch sqlc.json
```

And here the settings we will be using:

```json
{
  "version": "1",
  "packages": [
    {
      "path": "pg",
      "queries": "./queries.sql",
      "schema": "./schema.sql"
    }
  ]
}
```

This configuration instructs `sqlc` to place the generated code in the `pg` folder, to read the information about the SQL queries from the `./queries.sql` file, and the information about the database schema from the `./schema.sql` file. The code organization in this project follows the pattern described by [Ben Johnson in his Standard Package Layout article](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1). The idea is to create a sub-package for each dependency of a project: in this case we're creating a `pg` package to hold all our PostgreSQL-related code. If you've not read Ben Johnson's article yet, I highly recommend it.

Let's create the files for our database schema and queries:

```
> touch schema.sql queries.sql
```

The `schema.sql` file will hold the schema of our database and it should have the following contents:

```sql
CREATE TABLE IF NOT EXISTS agents (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    agent_id BIGINT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_authors (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE (book_id,author_id)
);
```

The definition of the schema matches the definition of the GraphQL types discussed earlier:

- the `agents` table contains non-nullable columns for storing `name` and `email` values for each agent.
- the `authors` table has a nullable column for the `website` and non-nullable columns for the `name` and `agent_id` values for each author. The `agent_id` value is a foreign key reference to the `id` column in the `agents` table (it creates a one-to-many relationship between agents and authors).
- the `books` table has non-nullable columns for the `title`, `description` and `cover` values of each book.
- `book_authors` is an [associative table](https://en.wikipedia.org/wiki/Associative_entity) between the `books` and `authors` tables. It stores relationships between books and authors in the form of unique author and book `id` combinations.

Make sure that you have PostgreSQL installed and running on your system. With the schema defined, we can create the database and initialize it (the commands below will work on an OS X system with PostgreSQL installed using `brew`; no guarantees regarding other configurations):

```
> createdb gqlgen_sqlc_example_db
> psql -d gqlgen_sqlc_example_db -a -f schema.sql
```

We need queries to perform the CRUD operations on the objects defined in the schema. We will keep them in the `queries.sql` file, which should look as follows:

```sql
-- name: GetAgent :one
SELECT * FROM agents
WHERE id = $1;

-- name: ListAgents :many
SELECT * FROM agents
ORDER BY name;

-- name: CreateAgent :one
INSERT INTO agents (name, email)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateAgent :one
UPDATE agents
SET name = $2, email = $3
WHERE id = $1
RETURNING *;

-- name: DeleteAgent :one
DELETE FROM agents
WHERE id = $1
RETURNING *;

-- name: GetAuthor :one
SELECT * FROM authors
WHERE id = $1;

-- name: ListAuthors :many
SELECT * FROM authors
ORDER BY name;

-- name: CreateAuthor :one
INSERT INTO authors (name, website, agent_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateAuthor :one
UPDATE authors
SET name = $2, website = $3, agent_id = $4
WHERE id = $1
RETURNING *;

-- name: DeleteAuthor :one
DELETE FROM authors
WHERE id = $1
RETURNING *;

-- name: GetBook :one
SELECT * FROM books
WHERE id = $1;

-- name: ListBooks :many
SELECT * FROM books
ORDER BY title;

-- name: CreateBook :one
INSERT INTO books (title, description, cover)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateBook :one
UPDATE books
SET title = $2, description = $3, cover = $4
WHERE id = $1
RETURNING *;

-- name: DeleteBook :one
DELETE FROM books
WHERE id = $1
RETURNING *;

-- name: SetBookAuthor :exec
INSERT INTO book_authors (book_id, author_id)
VALUES ($1, $2);

-- name: UnsetBookAuthors :exec
DELETE FROM book_authors
WHERE book_id = $1;
```

For each type of objects we are working with, we are creating: a query to fetch a single item by its `ID`, a query to list all items of the given type, and queries to create, modify and delete an item. In case of the `book_authors` table we also have a query to set an author for a book, and a query to delete all author associations for a book. The comments above each query are required by `sqlc`; they inform the generator what the name of the Go method should be, and whether the query returns a single row, multiple rows or no values.

## The pg package

Run the `sqlc generate` command in the root of the project to see the magic happen! ✨

```
> sqlc generate
```

Well, that might have been underwhelming, because the command works almost instantaneously and produces no output. Still, you should now have a newly created `pg` directory and three new files inside it:

- `db.go` contains the `DBTX` interface which defines the functionality shared by `*sql.DB` and `*sql.Tx` types from `database/sql` and required by the `*Queries` type. In practice this structure makes it possible to run the generated queries as standalone database operations or as operations scoped to a transaction.
- `models.go` contains object structs representing types derived from the database schema. We will instruct `gqlgen` to use these structs as the building blocks for the GraphQL resolvers -- more about that later.
- `queries.sql.go` holds the generated methods of the `*Queries` type, or the queries we have defined earlier in the `queries.sql` file.

While it would be possible to import and use the `*Queries` type directly in our GraphQL resolvers, taking this approach would make testing the resolver code difficult later on. The resolvers would end up coupled with the database code and we would most likely have no choice but rely on integration tests in order to test them. We will opt for a different approach and create a custom `Repository` interface to serve as, well, and interface to the `sqlc`-generated code. The rest of our application will only communicate with the database through that interface, which means we will be able to use the mock version of the `Repository` in our tests.

Let's create a file to hold the new code:

```
> touch pg/pg.go
```

Here's the preliminary definition of the `Repository` interface:

```go
package pg

import (
	"context"

	_ "github.com/lib/pq" // required
)

// Repository is the application's data layer functionality.
type Repository interface {
	// agent queries
	CreateAgent(ctx context.Context, arg CreateAgentParams) (Agent, error)
	DeleteAgent(ctx context.Context, id int64) (Agent, error)
	GetAgent(ctx context.Context, id int64) (Agent, error)
	ListAgents(ctx context.Context) ([]Agent, error)
	UpdateAgent(ctx context.Context, arg UpdateAgentParams) (Agent, error)

	// author queries
	CreateAuthor(ctx context.Context, arg CreateAuthorParams) (Author, error)
	DeleteAuthor(ctx context.Context, id int64) (Author, error)
	GetAuthor(ctx context.Context, id int64) (Author, error)
	ListAuthors(ctx context.Context) ([]Author, error)
	UpdateAuthor(ctx context.Context, arg UpdateAuthorParams) (Author, error)

	// book queries
	CreateBook(ctx context.Context, bookArg CreateBookParams, authorIDs []int64) (*Book, error)
	UpdateBook(ctx context.Context, bookArg UpdateBookParams, authorIDs []int64) (*Book, error)
	DeleteBook(ctx context.Context, id int64) (Book, error)
	GetBook(ctx context.Context, id int64) (Book, error)
	ListBooks(ctx context.Context) ([]Book, error)
}
```

The `Repository` interface combines is a subset of query methods generated for us by `sqlc` along with a couple of custom methods. It only exposes a subset of the queries because some of the queries we have created were never meant to be used as stand-alone operations so the rest of our application neither has to nor should be able to access them directly.

You'll notice that two methods of the `Repository` interface - `CreateBook` and `UpdateBook` - have signatures that differ from those of their namesakes from the `queries.sql.go` file. The generated `CreateBook` and `UpdateBook` methods are only concerned with making changes to the `books` table, which means they don't know anything about the authors of a given book. The complete process of creating or updating a book must include creating or updating the associations between the book and its authors and as such it will have to take the form of a sequence of database operations wrapped in a transaction. We will need to create custom implementations for these methods, in other words.

The implementation of the `Repository` interface will take form of an unexported struct holding an embedded instance of `*Queries` and a pointer to the database connection:

```go
type repoSvc struct {
	*Queries
	db *sql.DB
}
```

Embedding `*Queries` in the `repoSvc` struct means that it automatically implements those methods of the `Repository` interface that were derived from the `*Queries` struct in the first place. This means we only need to create custom implementations of the `CreateBook` and `UpdateBook` methods. Since both of these methods will involve database transactions let's start by creating a method to help with managing them:

```go
func (r *repoSvc) withTx(ctx context.Context, txFn func(*Queries) error) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	q := New(tx)
	err = txFn(q)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			err = fmt.Errorf("tx failed: %v, unable to rollback: %v", err, rbErr)
		}
	} else {
		err = tx.Commit()
	}
	return err
}
```

The `withTx` method takes the current context `ctx` and a transaction function `txFn` as arguments. It first initializes a transaction (`tx`), then instantiates `*Queries` using that transaction, runs the `txFn` function with the transaction-scoped instance of `*Queries` as an argument, and finally performs transaction rollback or commit based on the return value of the `txFn` function.

Now we are ready to create the missing method implementations. Let's start with the `CreateBook` method:

```go
func (r *repoSvc) CreateBook(ctx context.Context, bookArg CreateBookParams, authorIDs []int64) (*Book, error) {
	book := new(Book)
	err := r.withTx(ctx, func(q *Queries) error {
		res, err := q.CreateBook(ctx, bookArg)
		if err != nil {
			return err
		}
		for _, authorID := range authorIDs {
			if err := q.SetBookAuthor(ctx, SetBookAuthorParams{
				BookID:   res.ID,
				AuthorID: authorID,
			}); err != nil {
				return err
			}
		}
		book = &res
		return nil
	})
	return book, err
}
```

We start by initializing a new variable of `*Book` type as a placeholder for the eventual return value of the main function. Next we run the `withTx` method, defining the `txFn` function inline (like a callback function in JavaScript). The transaction function will be able to access the `book` variable as a closure, so we will be able to store the result of the transaction even though the `txFn` function only returns an `error` value. Using closures is one way to get around the fact that Go doesn't have generics.

The `txFn` function performs a sequence of queries and returns early in case of an error. It runs the `CreateBook` query first which creates a new row in the `books` table and returns a struct representing the newly-created book. The function continues by iterating over the `agentIDs` slice to create the book-author associations in the `book_authors` table using the `SetBookAuthor` query and the `ID` of the book created in the previous step. If all succeed the pointer to `res` is stored in the `book` variable we have initialized earlier in the body of the parent `CreateBook` method.

The `UpdateBook` method is only slightly more complicated:

```go
func (r *repoSvc) UpdateBook(ctx context.Context, bookArg UpdateBookParams, authorIDs []int64) (*Book, error) {
	book := new(Book)
	err := r.withTx(ctx, func(q *Queries) error {
		res, err := q.UpdateBook(ctx, bookArg)
		if err != nil {
			return err
		}
		if err = q.UnsetBookAuthors(ctx, res.ID); err != nil {
			return err
		}
		for _, authorID := range authorIDs {
			if err := q.SetBookAuthor(ctx, SetBookAuthorParams{
				BookID:   res.ID,
				AuthorID: authorID,
			}); err != nil {
				return err
			}
		}
		book = &res
		return nil
	})
	return book, err
}
```

The pattern is analogous to the `CreateBook` implementation, except in this case, we update an existing row in the `books` table instead of creating one, and before we start creating the book-author associations we first remove the prior associations using the `UnsetBookAuthors` query.

We're almost done, but we still need a way to initialize our implementation of the `Repository` interface from other packages. Since the `repoSvc` struct is unexported we will need an exported constructor function:

```go
// NewRepository returns an implementation of the Repository interface.
func NewRepository(db *sql.DB) Repository {
	return &repoSvc{
		Queries: New(db),
		db:      db,
	}
}
```

The last addition to the `pg/pg.go` file is a simple function to open a database connection. We will need it later for the `main` function of our server:

```go
// Open opens a database specified by the data source name.
// Format: host=foo port=5432 user=bar password=baz dbname=qux sslmode=disable"
func Open(dataSourceName string) (*sql.DB, error) {
	return sql.Open("postgres", dataSourceName)
}
```

## GraphQL schema and gqlgen configuration

It's finally time to create the schema for our GraphQL server:

```
> touch schema.graphql
```

Here are the contents of this file:

```graphql
type Agent {
  id: ID!
  name: String!
  email: String!
  authors: [Author!]!
}

type Author {
  id: ID!
  name: String!
  website: String
  agent: Agent!
  books: [Book!]!
}

type Book {
  id: ID!
  title: String!
  description: String!
  cover: String!
  authors: [Author!]!
}

type Query {
  agent(id: ID!): Agent
  agents: [Agent!]!
  author(id: ID!): Author
  authors: [Author!]!
  book(id: ID!): Book
  books: [Book!]!
}

type Mutation {
  createAgent(data: AgentInput!): Agent!
  updateAgent(id: ID!, data: AgentInput!): Agent!
  deleteAgent(id: ID!): Agent!
  createAuthor(data: AuthorInput!): Author!
  updateAuthor(id: ID!, data: AuthorInput!): Author!
  deleteAuthor(id: ID!): Author!
  createBook(data: BookInput!): Book!
  updateBook(id: ID!, data: BookInput!): Book!
  deleteBook(id: ID!): Book!
}

input AgentInput {
  name: String!
  email: String!
}

input AuthorInput {
  name: String!
  website: String
  agent_id: ID!
}

input BookInput {
  title: String!
  description: String!
  cover: String!
  authorIDs: [ID!]!
}
```

The GraphQL schema reflects the database schema: we have agents, authors, and books, along with the relationships between them as described previously. The GraphQL schema also defines queries (ways to access the data stored on our server) and mutations (methods for modifying the stored data), and `Input` types used by the mutations.

`gqlgen` is a "schema-first" GraphQL library/toolkit for Go. Similarly to `sqlc`, it works by generating much of the code required to build a server for a given a GraphQL schema. I recommend the [introductory post about gqlgen by Adam Scarr](https://99designs.com.au/blog/engineering/gqlgen-a-graphql-server-generator-for-go/) outlining different approaches to building GraphQL servers, and explaining where the schema-first approach used by `gqlgen` sits in the matrix of possible approaches. For an alternative take you could also read [a post outlining the shortcomings of the schema-first approach by Nikolas Burk](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3), one of the devs working on the Prisma project. For what it's worth, I've tried both approaches and I'm personally a fan on the approach used by `gqlgen`.

Like `sqlc`, `gqlgen` needs to be configured, so let's create the configuration file:

```
> touch gqlgen.yml
```

Here's the configuration we will use for our project:

```yaml
# gqlgen.yml
# Refer to https://gqlgen.com/config/ for detailed documentation.

schema: schema.graphql
exec:
  filename: gqlgen/exec.go
model:
  filename: gqlgen/model.go
resolver:
  filename: gqlgen/resolvers.go
  type: Resolver

# use models generated by sqlc when possible
# REMEMBER TO CUSTOMIZE THE PATH BELOW TO REFERENCE YOUR PROJECT REPOSITORY
autobind:
  - github.com/[username]/gqlgen-sqlc-example/pg

# this will allow us to use int64 IDs.
models:
  ID:
    model: github.com/99designs/gqlgen/graphql.Int64

# list return values will be slices not slices of pointers
# for better compatibility with sqlc
omit_slice_element_pointers: true
```

Here's the brief explanation of the meaning of the various settings:

- `schema` - the path to the GraphQL schema for our project;
- `exec` - the path to the generated GraphQL execution runtime (we will never make any changes to this file);
- `model` - the path the models generated by `gqlgen` (we will never make any changes to this file);
- `resolver` - the path to the file with the generated stubs of the resolver methods we will be required to implement by hand. Since this file will have to be customized it will never be overwritten on subsequent runs of `gqlgen`, though you can always generate a fresh copy by deleting the customized file first.
- `autobind` - this directs `gqlgen` to use models defined by another package instead of generating them. In this case we are telling `gqlgen` to use the models generated by `sqlc` and stored in our `pg` package. This will make the resolvers use the `Agent`, `Author` and `Book` types generated by `sqlc` which will make the interoperation between our server and the database much easier. **Please make sure that the value of this setting references your own project repository**.
- `models`: `ID`: `model` - the GraphQL spec assumes that `IDs` are of `String` type so this is also the default assumption made by `gqlgen`. We are using a PostgreSQL database as our backend, so it makes more sense to use `Int` values instead. This setting instructs `gqlgen` to use `Int64` as the type of the `ID` fields.
- `omit_slice_element_pointers` - resolvers methods generated by `gqlgen` output slices of pointers as list results (for example `[]*Author`) by default. This setting changes the default behavior to output slices of values instead (for example `[]Author`). We do this for compatibility with `sqlc`, which uses slices of values not pointers as result values of the queries it generates.

## Generate all the things!

We are ready to generate our server. We have previously installed `gqlgen` as the dependency for our project so running the tool is as simple as:

```
> gqlgen
```

Running the command will result in three new files being created in the `gqlgen` folder. The most interesting file, from our perspective, is `resolvers.go`, since it contains the stubs of the resolvers we still need to implement. Whenever `gqlgen` can independently decide how to resolve a field defined in the schema, it will create its resolver automatically. We only have to create resolvers for the fields which are somehow ambiguous, typically because they represent a non-obvious interaction between the resolver and the data repository.

Let's take a closer look at the `resolvers.go` code related to the `Agent` type:

```go
type agentResolver struct{ *Resolver }

func (r *agentResolver) Authors(ctx context.Context, obj *pg.Agent) ([]pg.Author, error) {
	panic("not implemented")
}
```

`gqlgen` was able to automatically determine how to resolve the `ID`, `name` and `email` fields of the `Agent` type, but it wasn't able to figure out what to do about the `authors` field and this is why the `Authors` method appears in the `resolvers.go` file. This makes sense, because given our configuration of `gqlgen`, it maps the `Agent` type from the GraphQL schema to the corresponding model from the database, namely:

```go
type Agent struct {
	ID    int64
	Name  string
	Email string
}
```

The database representation of the `Agent` type doesn't have a field for `authors` so `gqlgen` leaves it up to us to decide how to resolve it given the information available to the `agentResolver` struct and passed to the resolver method as arguments. In this case it will involve running a database query that selects `Author` objects based on the `ID` of the `Agent`. We will have a look at the actual implementation in a moment.

I like to start customizing the resolvers file by doing a little bit of clean-up (like adding the missing comments for the exported types/methods, etc.) In this case I have also added the `pg.Repository` interface as a field on the `Resolver` type. This is how the individual resolver methods will be able to access the data stored in our database:

```go
// Resolver connects individual resolvers with the datalayer.
type Resolver struct {
	Repository pg.Repository
}
```

Our task now is to implement the missing resolver methods. We'll focus on a few methods first so that we can do the initial test-run of our server and check our progress so far.

## Running the server for the first time

The next step is to quickly implement the functionality needed to be able to create and list `Agent` objects, so that we can do something useful when we run the server for the first time. We'll beed to implement the following methods:

1. `agentResolver.Authors`, required since the `agentResolver` needs to know how to resolve the `Authors` field,
2. `mutationResolver.CreateAgent` so that we can create Agent objects, and
3. `queryResolver.Agents` so that we can list the objects we have created.

### agentResolver.Authors implementation

This field is supposed to return a slice of `Author` objects for a given `Agent`. Our database schema defines the relationship between agents and authors as a one-to-many relationship via a foreign key reference in the `authors` table. We will therefore need to create a new query to select authors based on the `ID` of the agent (we can access this value as `obj.ID` inside the resolver). Let's add the following to the `queries.sql` file:

```sql
-- name: ListAuthorsByAgentID :many
SELECT authors.* FROM authors, agents
WHERE agents.id = authors.agent_id AND authors.agent_id = $1;
```

And re-generate the `sqlc` code:

```
> sqlc generate
```

We can check the changes made to the generated using the `git diff [filename]` command (assuming the previous version of the file was committed earlier).

We have a new query but in order to make it available to our resolvers we also need to add the new `ListAuthorsByAgentID` method to the `pg.Repository` interface:

```go
type Repository interface {
	// author queries
	// (...)
	ListAuthorsByAgentID(ctx context.Context, agentID int64) ([]Author, error)
}
```

Now we have everything we need to implement the `Authors` method for the `agentResolver`:

```go
func (r *agentResolver) Authors(ctx context.Context, obj *pg.Agent) ([]pg.Author, error) {
	return r.Repository.ListAuthorsByAgentID(ctx, obj.ID)
}
```

Well, there's one important caveat. This is a naïve implementation of the method and in a future post I will discuss the limitations of this approach and how it can be improved. In a nutshell, this implementation suffers from the [N+1 query problem](https://itnext.io/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a) when a query asks for a list of agents and the authors they represent, and it will have to be implemented using a ["dataloader"](https://www.youtube.com/watch?v=OQTnXNCDywA). While this implementation is not optimal, it works, and we will keep it for the time being.

### mutationResolver.CreateAgent implementation

We have previously defined a query for creating `Agent` objects, so in order to be able to implement the `CreateAgent` method we just have to connect the database code with the resolver:

```go
func (r *mutationResolver) CreateAgent(ctx context.Context, data AgentInput) (*pg.Agent, error) {
	agent, err := r.Repository.CreateAgent(ctx, pg.CreateAgentParams{
		Name:  data.Name,
		Email: data.Email,
	})
	if err != nil {
		return nil, err
	}
	return &agent, nil
}
```

### queryResolver.Agents implementation

We already have a query to list `Agent` objects, so the implementation of the `Agents` method is a one-liner:

```go
func (r *queryResolver) Agents(ctx context.Context) ([]pg.Agent, error) {
	return r.Repository.ListAgents(ctx)
}
```

### Creating the GraphQL endpoint handlers

In order to be able to run our server we will need to define a couple of handlers. Let's create a new file in the `gqlgen` sub-package directory:

```
> touch gqlgen/gqlgen.go
```

We follow a pattern similar to our approach in the `pg` package. This new file will hold our custom code related to the `gqlgen` dependency so that we can keep the entire code that depends on `gqlgen` in a single sub-package of our application:

```go
package gqlgen

import (
	"net/http"

	"github.com/99designs/gqlgen/handler"
	"github.com/[username]/gqlgen-sqlc-example/pg" // update the username
)

// NewHandler returns a new graphql endpoint handler.
func NewHandler(repo pg.Repository) http.Handler {
	return handler.GraphQL(NewExecutableSchema(Config{
		Resolvers: &Resolver{
			Repository: repo,
		},
	}))
}

// NewPlaygroundHandler returns a new GraphQL Playground handler.
func NewPlaygroundHandler(endpoint string) http.Handler {
	return handler.Playground("GraphQL Playground", endpoint)
}
```

To run our application we will have to build a simple Go server exposing two endpoints. The code above defines the handlers for these endpoints:

- the `NewHandler` function returns the main GraphQL server handler which will receive the GraphQL queries and send the responses to these queries,
- the `NewPlaygroundHandler` will serve the [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/) application on a selected endpoint as an admin/debugging interface for our server.

### Creating the executable to run our server

We now have all the pieces we need to run the server, we just need to wire them together in our server's `main` function. I follow a convention of placing individual executable files in separate subdirectories of the `cmd` package:

```
> mkdir -p cmd/gqlgen-sqlc-example
> touch cmd/gqlgen-sqlc-example/main.go
```

And here are the contents of the `cmd/gqlgen-sqlc-example/main.go` file:

```go
package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/[username]/gqlgen-sqlc-example/gqlgen" // update the username
	"github.com/[username]/gqlgen-sqlc-example/pg"     // update the username
)

func main() {
	// initialize the db
	db, err := pg.Open("dbname=gqlgen_sqlc_example_db sslmode=disable")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// initialize the repository
	repo := pg.NewRepository(db)

	// configure the server
	mux := http.NewServeMux()
	mux.Handle("/", gqlgen.NewPlaygroundHandler("/query"))
	mux.Handle("/query", gqlgen.NewHandler(repo))

	// run the server
	port := ":8080"
	fmt.Fprintf(os.Stdout, "🚀 Server ready at http://localhost%s\n", port)
	fmt.Fprintln(os.Stderr, http.ListenAndServe(port, mux))
}
```

This is a very basic version of the `main` function for our server, and we might refactor it in a future post into something more customizable, but a quick-and-dirty solution will be sufficient for now. The logic of the `main` function is straight-forward:

1. We initialize the database connection using the database connection string corresponding to the database we have created previously. We use the `Open` function from our `pg` package to establish the connection.
2. We instantiate the `pg.Repository` as `repo` using the database connection.
3. We use Go's standard library to create a simple server with two routes:
   - The root route (`/`) where we will be able to access GraphQL Playground.
   - The `/query` route which will actually execute and respond to GraphQL queries.
4. We run the server! 🎉

Let's confirm that everything works:

```
> go run cmd/gqlgen-sqlc-example/main.go
🚀 Server ready at http://localhost:8080
```

Go ahead and open [http://localhost:8080](http://localhost:8080) in your browser. You should see the GraphQL Playground interface where you can run queries and mutations. We can't query anything yet, since our database contains no data so let's create an agent:

```graphql
mutation {
  createAgent(
    data: { name: "Virginia Kidd", email: "vk@themilfordmethod.com" }
  ) {
    id
    name
    email
  }
}
```

You should see the result of the mutation, a JSON representation of object you have just created, in the right pane of the Playground. We can now also run a query to list all agents:

```graphql
query {
  agents {
    id
    name
    email
    authors {
      id
    }
  }
}
```

This query should produce the following result:

```json
{
  "data": {
    "agents": [
      {
        "id": 1,
        "name": "Virginia Kidd",
        "email": "vk@themilfordmethod.com",
        "authors": []
      }
    ]
  }
}
```

Our server works, but we have just about exhausted what it can do at the moment. Running other queries will make our server panic, since the majority of the resolver methods still await implementation.

## Remaining resolver implementations

Now that we know that we're on the right track we can get back to creating the remaining resolver method implementation. In this post I will only include the code for the methods that warrant additional explanation or showcase a unique problem. The goal is to replace all instances of `panic("not implemented")` in the `gqlgen/resolvers.go` file with working implementations of each method. This will typically involve calling the correct method of the `pg.Repository` interface and returning the values. The complete implementation is available [in the project's GitHub repository](https://github.com/fwojciec/gqlgen-sqlc-example/tree/part1).

### authorResolver.Website implementation

We need to implement the method for the `Website` resolver manually because the `sqlc`-generated `Author` model uses `sql.NullString` to represent an optional string value, while `gqlgen` uses a pointer (`*string`). These are just two different approaches of dealing with nullable values in Go. Our job, in either case, is to render the `sql.NullString` value returned by our database query as a `*string`:

```go
func (r *authorResolver) Website(ctx context.Context, obj *pg.Author) (*string, error) {
	var w string
	if obj.Website.Valid {
		w = obj.Website.String
		return &w, nil
	}
	return nil, nil
}
```

### authorResolver.Agent implementation

The relationship between the `Agent` and the `Author` objects is a one-to-many relationship established by means of a foreign key field (`agent_id`) in our database's `authors` table. In other words, our resolver needs to fetch an `Agent` object using the `ID` value, stored in the `agent_id` field of the `Author` object. We have previously defined a query to fetch an agent by their `ID` so we can use it in our implementation:

```go
func (r *authorResolver) Agent(ctx context.Context, obj *pg.Author) (*pg.Agent, error) {
	agent, err := r.Repository.GetAgent(ctx, obj.AgentID)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}
```

This solution works, but is not ideal since it will result in the N+1 query problem when resolving a query that asks for many authors along with their agents. We will improve on the above implementation in an upcoming part of this series about dataloaders.

### authorResolver.Books implementation

We will need to do a bit more work to retrieve a list of books for a given author. From the perspective of our database the relationship between authors and books is a many-to-many relationship facilitated by means of the `book_authors` join table. In order to fetch books for a given author we need to add a new query to the `queries.sql` file:

```sql
-- name: ListBooksByAuthorID :many
SELECT books.* FROM books, book_authors
WHERE books.id = book_authors.book_id AND book_authors.author_id = $1;
```

And re-run the `sqlc generate` command:

```
> sqlc generate
```

If you need to confirm the changes made to the `pg/queries.sql.go` file you can run `git diff pg/queries.sql.go` command. We also need to add the newly created query method to the `pg.Repository` interface:

```go
type Repository interface {
	// book queries
	// (...)
	ListBooksByAuthorID(ctx context.Context, authorID int64) ([]Book, error)
}
```

Now that we have the ability to query the `books` table by the `ID` of an author, creating a basic implementation of the `Books` method is simple:

```go
func (r *authorResolver) Books(ctx context.Context, obj *pg.Author) ([]pg.Book, error) {
	return r.Repository.ListBooksByAuthorID(ctx, obj.ID)
}
```

Again, this is a naïve implementation that suffers from the N+1 queries problem, but we will improve on it in another post in this series.

### bookResolver.Authors implementation

The `Authors` method of the `bookResolver` represents a very similar challenge to the previous resolver we have implemented. Here's the query you will need to fetch authors using a book's `ID`:

```sql
-- name: ListAuthorsByBookID :many
SELECT authors.* FROM authors, book_authors
WHERE authors.id = book_authors.author_id AND book_authors.book_id = $1;
```

From this point you just follow the procedure described in `authorResolver.Books` method implementation above - add the query to the `queries.sql` file, run `sqlc generate`, update the `pg.Repository` interface to include the newly created query method and finally use the new query in the resolver.

### queryResolver methods

The `queryResolver` methods are just a simple mappings of the database query results to the expected return values of the resolvers. In many cases the resolver method implementations will be one-liners similar to the previously completed implementation of the `Agents` method of this resolver. Things are just slightly more tricky in case of the queries that return a single object, since the `sqlc` generated queries return a value while the `gqlgen` resolvers expects to return a pointer to this value. For example, the `Agent` method can be implemented as follows:

```go
func (r *queryResolver) Agent(ctx context.Context, id int64) (*pg.Agent, error) {
	agent, err := r.Repository.GetAgent(ctx, id)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}
```

I'll leave it up to you to complete the implementations of the remaining methods of the `queryResolver`.

### mutationResolver.UpdateAgent method

The implementation here should be analogous to the approach used for the `CreateAgent` method previously, except in this case the `UpdateAgentParams` object expects to receive the `ID` of the updated object in addition to the values for each of the fields so that the database query knows which row in the table to update with the new values. I'll leave it up to you to complete the implementation of this method.

### mutationResolver.DeleteAgent method

The implementation of this method should be straight-forward as well, it's just a matter of calling the `DeleteAgent` method of the `Repository` interface and returning a pointer to the `Agent` value returned by the query.

### mutationResolver CreateAuthor, UpdateAuthor and DeleteAuthor methods

The `CreateAuthor`, `UpdateAuthor` and `DeleteAuthor` method implementations are similar to their equivalents for the `Agent` type. The only significant difference is that we have to deal with the fact that the `Website` field on the `Author` type is nullable. This value will be passed to the resolver as a pointer to a string (`*string`) but our database expects it in the form of an `sql.NullString` value. For this reason we need a helper function to convert between these two types. Because an implementation of this method requires the `sql` package as the dependency my preference would be to place this helper method in the `pg` package with the rest of the database-related code. Add the following to the bottom of the `pg/pg.go` file:

```go
// StringPtrToNullString converts *string to sql.NullString.
func StringPtrToNullString(s *string) sql.NullString {
	if s != nil {
		return sql.NullString{String: *s, Valid: true}
	}
	return sql.NullString{}
}
```

Once we have this helper method we can implement the `CreateAuthor` resolver method (back in the `gqlgen/resolvers.go` file) as follows:

```go
func (r *mutationResolver) CreateAuthor(ctx context.Context, data AuthorInput) (*pg.Author, error) {
	author, err := r.Repository.CreateAuthor(ctx, pg.CreateAuthorParams{
		Name:    data.Name,
		Website: pg.StringPtrToNullString(data.Website),
		AgentID: data.AgentID,
	})
	if err != nil {
		return nil, err
	}
	return &author, nil
}
```

I'll leave it up to you to complete the implementations of the remaining \*Author `mutationResolver` methods.

### mutationResolver CreateBook, UpdateBook and DeleteBook methods

We've done the bulk of the work required to create and update books previously in our implementation of the `Repository` interface. We therefore just need to connect the previously created methods to the respective resolvers. Here's the code for the `CreateBook` resolver:

```go
func (r *mutationResolver) CreateBook(ctx context.Context, data BookInput) (*pg.Book, error) {
	return r.Repository.CreateBook(ctx, pg.CreateBookParams{
		Title:       data.Title,
		Description: data.Description,
		Cover:       data.Cover,
	}, data.AuthorIDs)
}
```

I'll leave it up to you to create the remaining two methods. One thing to keep in mind in the context of the `DeleteBook` method is that deleting a book will automatically cascade to the relevant rows of the `book_authors` table because of how we've defined the schema for the `book_authors` table:

```sql
CREATE TABLE IF NOT EXISTS book_authors (
    -- (...)
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    -- (...)
);
```

That's it, we're done with the resolver implementations! 🎉🎉🎉

## Wrapping up and what's next?

We now have an operational GraphQL server. You can run it and play with creating, changing, and listing the data using the GraphQL Playground:

```
> go run cmd/gqlgen-sqlc-example/main.go
```

The server runs and works, but it's not production-ready yet. We don't have any tests to make sure that everything works as it should. Some of our resolvers are implemented naïvely, resulting in suboptimal performance in the case of more complex queries. We can't prevent random users from being able to access all the data and make changes to our database. Our server is also difficult to configure, since parameters such as database name or server port are currently only configurable by changing the code of the `main.go` file. In short, there's still quite a bit of work ahead of us.

That said, we've established a good foundation for our continued work on this project. We have a solid implementation of the data persistence layer that's contained in a separate module and easy to make changes to. Altering the GraphQL schema is also simple - we just update the schema file, run the `gqlgen` command, and - if required - add implementations of the new resolvers. Because of the way we have structured the code, it will also be easy to test our code (I'll discuss strategies for testing the server in a future post). Finally, because we're using Go, our code is portable and simple to deploy.

Thanks for your attention. You made it all the way to the end of the tutorial! You can [follow me on Twitter](https://twitter.com/filipcodes) - that is the best way to hear when I post new content to the blog.

## Useful resources

1. [The GitHub repository with the code of this tutorial](https://github.com/fwojciec/gqlgen-sqlc-example/tree/part1)
2. [Official GraphQL docs](https://graphql.org/)
3. [Official gqlgen docs](https://gqlgen.com)
4. [gqlgen GitHub repository](https://github.com/99designs/gqlgen)
5. [sqlc GitHub repository](https://github.com/kyleconroy/sqlc)
6. [Introducing gqlgen: a GraphQL Server Generator for Go by Adam Scarr](https://99designs.com.au/blog/engineering/gqlgen-a-graphql-server-generator-for-go/)
7. [The Problems of "Schema-First" GraphQL Server Development by Nikolas Burk](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3)
8. [Standard Package Layout by Ben Johnson](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1)
9. [Introducing sqlc by Kyle Conroy](https://conroy.org/introducing-sqlc)
