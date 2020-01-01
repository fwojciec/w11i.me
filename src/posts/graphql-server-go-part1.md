---
title: 'How to Build a GraphQL Server in Go (Part 1)'
path: '/graphql-server-go-part1'
date: '2019-12-31'
author: 'Filip'
excerpt: 'The first part of a series of tutorials on building GraphQL servers in Go using gqlgen and sqlc. In this part we go from nothing to a working GraphQL server which we will be improving in the upcoming parts of the series.'
coverImage: '../images/joel-filipe-jU9VAZDGMzs-unsplash.jpg'
tags: ['go', 'golang', 'graphql', 'sqlc', 'gqlgen', 'postgresql']
---

## Introduction

This is going to be a longer tutorial so I will have to split it into multiple parts. My aim is to cover the entire process of building a simple yet full-featured (dataloaders, authentication, testing, etc.) GraphQL server in Go. When I was first learning Go I could find plenty of shorter tutorials and blog posts dealing with specific issues, but I was finding it difficult to find resources explaining how to put together an complete Go application. The goal of this tutorial is therefore two-fold:

1. to provide an opinionated guide on how to write a GraphQL server in Go, and
2. to provide an example of a process of building a complete piece of software in Go.

In the first part of the tutorial we will work our way up from scratch to an operational GraphQL server backed by a PostgreSQL database capable of performing basic CRUD operations. In the follow up posts I will be making improvements to the server, adding features, and discussing some strategies for testing the server. This multi-step process will also hopefully demonstrate how organizing a project in a particular way makes it relatively painless to make changes and add features later on.

This tutorial assumes basic familiarity with [GraphQL](https://graphql.org/learn/), [PostgreSQL](http://www.postgresqltutorial.com/) and [Go](https://tour.golang.org), but it's not necessarily a tutorial aimed at advanced users. I'm writing for someone like myself, a few months ago - someone who knows how to code but is relatively new to Go, its ecosystem and its idioms. I'm still learning, and I feel like there is still a lot I have to learn about Go, but I hope someone will find this tutorial helpful.

I will link to external resources explaining topic under discussion in greater detail when appropriate. I will not explain the syntax, but I will talk through the logic of a particular piece of code and I will explain the reasons behind my design decisions. As of today the tutorial can only be followed on OS X or Linux systems, since `sqlc`, the tool we will be using to manage our PostgreSQL database, currently ships only Linux and OS X compatible binaries, but if you're on a Windows 10 machine you should be able to use the Windows Subsystem for Linux to follow along.

> I've created a GitHub repository [***ADD LINK HERE] with the code of the tutorial. If you'd rather just look at the code, or if you need to reference my version of the project code at any stage, the releases in the repository correspond to the parts of this series, while the individual commits correspond to the `<h2>` sections of each post in the series.

We will be building a GraphQL backend service for an imagined literary agency website. Here's a quick overview of the data model of our server:

1. `Agent` objects, representing agents working at the agency:

   ```graphql
   type Agent {
     id: ID!
     name: String!
     email: String!
     authors: [Author!]!
   }
   ```

   Agents have a `name` and an `email` (both required). One Agent represents many `authors`.

2. `Author` objects, representing authors represented by the agency:

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

3. `Book` objects, representing books written by the agency's authors:

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

In other words, we are dealing with a one-to-many relationship between agents and authors (each author is represented by a single agent, but an agent represents many authors) and a many-to-many relationship between authors and books (a book can have multiple authors and an author can have multiple books). The schema also implies an indirect many-to-many relationship between agents and books, because a book written by multiple authors can, in principle, have more than one agent responsible for it, and an agent is typically responsible for many books. The schema is simple, but it should suffice as a playground for exploring possible representations of relational data in the form of a GraphQL server backed by a relational database.

## PostgreSQL and sqlc configuration

Let's initialize a new Go project:

```text
> mkdir gqlgen-sqlc-example
> cd gqlgen-sqlc-example
> go mod init github.com/[username]/gqlgen-sqlc-example
```

Let's also install the two primary dependencies of the project:

```text
> go get github.com/lib/pq
> go get github.com/99designs/gqlgen
```

The `pq` library is required by the Go `sql` package to use the package with PostgreSQL databases. `gqlgen` will be used both as a tool, for generating the code of our GraphQL server and as a library supporting the generated code. We also have to install `sqlc`, a tool we will use to generate the database code for our server. Right now the installation of the tool involves downloading the binary using [one of the links on the poject's GitHub page](4150a80634970db1eb35346cb508d4cf48b323a9).

For example, to install the macOS binary you could do:

```text
> wget https://bin.equinox.io/c/[version]/sqlc-devel-darwin-amd64.zip
> unzip sqlc-devel-darwin-amd64.zip
> mv sqlc $GOPATH/bin
> rm sqlc-devel-darwin-amd64.zip
```

And for a Linux binary:

```text
> wget https://bin.equinox.io/c/[version]/sqlc-devel-linux-amd64.tgz
> tar zxvf sqlc-devel-linux-amd64.tgz
> mv sqlc $GOPATH/bin
> rm sqlc-devel-linux-amd64.tgz
```

However you choose to install the tool, you should be able to run the `sqlc` command:

```text
> sqlc version
v0.0.1
```

`sqlc` is a relatively new project, but I'm already a huge fan. In fact discovering this project is what inspired me to start working on this tutorial since a tutorial like this became feasible in the first place because of how `sqlc` simplifies working with PostgreSQL in Go. We will use `sqlc` as a tool to automatically generate type-safe Go code for interacting with our PostgreSQL database directly from SQL files containing the database schema and queries.

We configure `sqlc` by adding a file named `sqlc.json` to our project's root directory.

```text
> touch sqlc.json
```

And here is the configuration we will be using for our project:

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

This configuration instructs `sqlc` to place the generated code in the `pg` folder, to read information about the SQL queries from the `./queries.sql` file and information about the database schema from the `./schema.sql` file. In this project I mostly follow the pattern described by [Ben Johnson in his Standard Package Layer article](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1). The main idea is to create a sub-package for each dependency of our project and to name that sub-package after the dependency. In this case we're creating a `pg` package to hold all our PostgreSQL-related code. Much of that code will be generated for us by `sqlc` but we will also add some code written by hand.

Let's create files for our database schema and queries:

```text
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

- `agents` table contains non-nullable columns for storing `name` and `email` values for each agent.
- `authors` table has a nullable column for `website` information and non-nullable columns for `name` and `agent_id` values. `agent_id` is a foreign key reference to the `id` column in the `agents` table (and as such we define a one-to-many relationship between agents and authors).
- `books` table has non-nullable columns for `title`, `description` and `cover` value.
- `book_authors` is a join table between books and authors tables. It will store relationships between books and authors in the form of unique author and book `id` combinations.

I assume that you have PostgreSQL installed and running on your system. With the schema defined we can create the database and initialize it:

```text
> createdb gqlgen_sqlc_example_db
> psql -d gqlgen_sqlc_example_db -a -f schema.sql
```

We need queries to perform the basic CRUD operations We will keep them in the `queries.sql` file, which should look as follows:

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

For each type of objects we will be working with we are creating a query to fetch a single item by its `ID`, a query to list all items of the given type, and queries to create, modify and delete an item. In case of the `book_authors` table we also have a query to set an author for a book, and a query to delete all author associations for a book.

The comments above each query are required by `sqlc`; they inform the generator about the type of each query (whether it returns a single row, multiple rows or returns no values) and about the desired names for methods corresponding to each query.

## Generate all the things!

Run the `sqlc generate` command in the root of the project and observe the magic happen!

```text
> sqlc generate
```

Well, that was probably underwhelming, because the command works almost instantaneously and produces no output. Still, you should now find a newly created `pg` directory and three new files inside it:

- `db.go` contains the `DBTX` interface which defines a functionality shared by `*sql.DB` and `*sql.Tx` types. The generated queries require an implementation of this interface to work, which in turn means that you can run the queries as single queries or bundled into transactions. This file also includes a couple of simple initializer functions for the `*Queries` type.
- `models.go` contains automatically created structs derived from our database schema that will be used in our interactions with the database. We will also instruct `gqlgen` to use these structs to represent the GraphQL types from our schema, where possible -- more about that later.
- `queries.sql.go` holds the generated methods corresponding to the queries defined in the `queries.sql` file.

Take a moment to familiarize yourself with the files. The simplicity and the quality of code generated by `sqlc` is what sold me on the project initially - it just looks like something written by hand:

```go
const getAgent = `-- name: GetAgent :one
SELECT id, name, email FROM agents
WHERE id = $1
`

func (q *Queries) GetAgent(ctx context.Context, id int64) (Agent, error) {
	row := q.db.QueryRowContext(ctx, getAgent, id)
	var i Agent
	err := row.Scan(&i.ID, &i.Name, &i.Email)
	return i, err
}
```

Or:

```go
const createAgent = `-- name: CreateAgent :one
INSERT INTO agents (name, email)
VALUES ($1, $2)
RETURNING id, name, email
`

type CreateAgentParams struct {
	Name  string
	Email string
}

func (q *Queries) CreateAgent(ctx context.Context, arg CreateAgentParams) (Agent, error) {
	row := q.db.QueryRowContext(ctx, createAgent, arg.Name, arg.Email)
	var i Agent
	err := row.Scan(&i.ID, &i.Name, &i.Email)
	return i, err
}
```

The advantage of generating this kind of boilerplate code is that you prevent silly mistakes like changing the order of arguments when running the query or scanning results to a struct, etc. These sorts of mistakes absolutely do happen, even if you're careful, and they can be annoying to track down. If you want to change the query you just change the SQL code and rerun the generator to create the correct code for the change. It's awesome!

## The pg package

While it would be possible to embed the `*Queries` directly in our GraphQL resolvers, taking this approach would make testing our resolvers difficult down the road. The resolvers would end up tightly coupled with the database code and we would most likely have to resort to integration tests in order to test them. Depending on the complexity of the project, that might be a viable strategy, but for the purposes of this tutorial we will use a different pattern.

I generally find it useful to have a layer of indirection between the code that touches the database and the code that depends on it, and I usually implemented it as an interface of as multiple interfaces in Go. With the functionality provided by the `sqlc`-generated code hidden behind an interface, we will be able to easily replace the code that touches the database with mocks for the purpose of unit-testing our resolvers.

Enough theory, let's see how this works in practice, it's time to actually write some Go!

### Querent and TxQuerent interfaces

Let's create a new file for our code:

```text
> touch pg/pg.go
```

And here are the initial contents of the file:

```go
package pg

import (
	"context"

	_ "github.com/lib/pq" // required
)

// Querent represents database query methods.
type Querent interface {
	// agent queries
	CreateAgent(ctx context.Context, args CreateAgentParams) (Agent, error)
	DeleteAgent(ctx context.Context, id int64) (Agent, error)
	GetAgent(ctx context.Context, id int64) (Agent, error)
	ListAgents(ctx context.Context) ([]Agent, error)
	UpdateAgent(ctx context.Context, args UpdateAgentParams) (Agent, error)

	// author queries
	CreateAuthor(ctx context.Context, args CreateAuthorParams) (Author, error)
	DeleteAuthor(ctx context.Context, id int64) (Author, error)
	GetAuthor(ctx context.Context, id int64) (Author, error)
	ListAuthors(ctx context.Context) ([]Author, error)
	UpdateAuthor(ctx context.Context, args UpdateAuthorParams) (Author, error)

	// book queries
	DeleteBook(ctx context.Context, id int64) (Book, error)
	GetBook(ctx context.Context, id int64) (Book, error)
	ListBooks(ctx context.Context) ([]Book, error)
}

// TxQuerent represents database query methods performed using a transaction.
type TxQuerent interface {
	CreateBook(ctx context.Context, args CreateBookParams, authorIDs []int64) (*Book, error)
	UpdateBook(ctx context.Context, args UpdateBookParams, authorIDs []int64) (*Book, error)
}
```

The code above introduces two interfaces to represent the two categories od database-related functionality our application will use:

- The `Querent` interface represents the `sqlc`-generated query methods we will be accessing directly as single operations. The `*Queries` struct generated by `sqlc` will automatically implement this interface, though the interface represents only a subset of the available `*Queries` methods. I've excluded `CreateBook`, `UpdateBook`, `SetBookAuthor` and `UnsetBookAuthors` methods from the interface since these methods will only be used as parts of more complex transactions, never as stand-alone operations so they shouldn't be accessible directly elsewhere in our code.
- The `TxQuerent` interface represents multi-stage database operations wrapped in transactions. As we will see, creating and updating a book involves a sequence of database operations wrapped in a transaction. We will need to create our own implementation of this interace.

### Implementation of the TxQuerent interface

Let's start working on the implementation of the `TxQuerent` interface by adding the following to the bottom of the `pg.go` file:

```go
type txQuerentSvc struct {
	db *sql.DB
}

func (s *txQuerentSvc) withTx(ctx context.Context, f func(*Queries) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	var exErr error
	defer func() {
		if exErr != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				exErr = fmt.Errorf("tx failed: %v, unable to rollback: %v", exErr, rbErr)
			}
		} else {
			exErr = tx.Commit()
		}
	}()
	q := &Queries{db: tx}
	exErr = f(q)
	return exErr
}
```

Our implementation of the `TxQuerent` interface takes the form of an unexported struct which holds a reference to the `*sql.DB` instance: it will be required to to initiate transactions. We begin by creating `withTx`, an unexported method to help with transaction-related logic that would otherwise have to be repeated in every other method of the implementation.

The `withTx` method takes the current context and a callback function as arguments. It initiates a transaction, implements the commit/rollback logic for the transaction as a deferred self-executing function that will rollback the transaction in case of an error and commit otherwise, it instantiates the `*Queries` struct using the transaction (`*sql.Tx`) and executes the callback function with the transaction-specific instance of the `*Queries` as an argument. The effect is that all queries performed by the callback function are pefrormed as a single database transaction which either succeeds or fails as a whole.

Let's see how this works in practice by implementing the `CreateBook` method:

```go
func (s *txQuerentSvc) CreateBook(ctx context.Context, bookArgs CreateBookParams, authorIDs []int64) (*Book, error) {
  book := new(Book)
	err := s.withTx(ctx, func(q *Queries) error {
		res, err := q.CreateBook(ctx, bookArgs)
		if err != nil {
			return err
		}
		for _, authorID := range authorIDs {
			err = q.SetBookAuthor(ctx, SetBookAuthorParams{
				BookID:   res.ID,
				AuthorID: authorID,
			})
			if err != nil {
				return err
			}
		}
		book = &res
		return nil
	})
	return book, err
}
```

We start by initializing a new variable of `*Book` type as a placeholder for the eventual return value of the main function. Next we run the `withTx` method, defining the callback function inline JavaScript-style. The callback function will be able to access the `book` variable as a closure, which is how we are able to use the callback function which only returns an `error` to peform operations which return other values as well. This is one way you can work around the fact that Go doesn't have generics.

The callback function is very straight-forward because we don't have to worry about the minutia of performing a database transaction. In essence, we just run a sequence of queries and return in case of an error. First we run the `CreateBook` query which creates a new row in the `books` table of our database and returns the newly-created book. Next, we we loop over the `agentIDs` slice to create the referencess between the newly created book and all its authors using the `SetBookAuthor` query and the `ID` of the book created in the previous step. Should an error occur at any point during the sequence of these operations the `defer` block of the `withTx` method will take over and attempt to roll the transaction back. If all operations complete without errors we store the pointer to `res` in the `book` variable created at the very beginning and return, which will cause the `defer` block of the `withTx` method to commit the transaction. The parent method can now return as well.

The `UpdateBook` method is just very slightly more complicated:

```go
func (s *txQuerentSvc) UpdateBook(ctx context.Context, bookArgs UpdateBookParams, authorIDs []int64) (*Book, error) {
	book := new(Book)
	err := s.withTx(ctx, func(q *Queries) error {
		res, err := q.UpdateBook(ctx, bookArgs)
		if err != nil {
			return err
		}
		if err = q.UnsetBookAuthors(ctx, res.ID); err != nil {
			return err
		}
		for _, authorID := range authorIDs {
			err = q.SetBookAuthor(ctx, SetBookAuthorParams{
				BookID:   res.ID,
				AuthorID: authorID,
			})
			if err != nil {
				return err
			}
		}
		book = &res
		return nil
	})
	return book, err
}
```

The pattern is very similar to the `CreateBook` implementation. We follow the same procedure, except here before we start adding the book-author associations we first remove the prior associations by running the `UnsetBookAuthors`.

### Finishing touches

We will expose the data-layer functionality to the rest of the sever code as a `Repository` struct which combines the functionality of the `Querent` and the `TxQuerent` interfaces:

```go
// Repository is the data layer of the application.
type Repository struct {
	Querent
	TxQuerent
}

// NewRepository returns a new instance of repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		Querent:   &Queries{db: db},
		TxQuerent: &txQuerentSvc{db: db},
	}
}
```

This should be fairly self-explanatory - the `Repository` type just combines the functionality of the `Querent` and `TxQuerent` so that our resolvers will be able to reference a single type to represent the data-layer. the `NewRepository` function is used to initialize the data-layer functionality. One last addition to the `pg.go` file is a simple wrapper around the `sql.Open` function to initialize the database connection:

```go
// Open opens a database specified by the data source name.
// Format: host=foo port=5432 user=bar password=baz dbname=qux sslmode=disable"
func Open(dataSourceName string) (*sql.DB, error) {
	return sql.Open("postgres", dataSourceName)
}
```

We can now proceed to configuring `gqlgen` and generating the resolvers for our server.

## GraphQL schema and gqlgen configuration

It's finally time to create the schema for our GraphQL server:

```text
> touch schema.graphql
```

And here are the contents of this file:

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

The GraphQL schema mirrors our database setup - we have agents, authors and books with the relationships between them as described previously. As part of the GraphQL schema we also define queries (ways to access the data stored on our server) and mutations (methods for modifying the stored data), along with the inputs, as required by the mutations.

`gqlgen` is a schema-first GraphQL library/toolkit for Go. Like `sqlc`, it works by automatically generating the bulk of code required to build a server for a given GraphQL schema. I recommend you read the [introductory post about `gqlgen` by Adam Scarr](https://99designs.com.au/blog/engineering/gqlgen-a-graphql-server-generator-for-go/) outlining different approaches to building GraphQL servers in any language, and explaining where the schema-first approach used by `gqlgen` sits in the matrix of possible approaches. For an alternative take you could also read a post [outlining possible shortcomings of the schema-first approach by Nikolas Burk](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3). For what it's worth, what initially lead me to experimenting with `gqlgen` was my frustration with the code-first JavaScript/TypeScript GraphQL libraries and I'm personally a fan on the approach used by `gqlgen`.

Like `sqlc`, `gqlgen` needs to be configured by means of configuration file (`gqlgen.yml`) located in the root of the project directory. The `gqlgen` cli tool (which we've installed earlier) can generate the example configuration file for you, but I prefer to write it by hand as I don't really like the default project layout and workflow assumed by the tool.

```text
> touch gqlgen.yml
```

Here's the configuration we will use for our project:

```yaml
# gqlgen.yml
# Refer to https://gqlgen.com/config/ for detailed documentation.

schema: schema.graphql
exec:
  filename: gqlgen/exec_gen.go
model:
  filename: gqlgen/model_gen.go
resolver:
  filename: gqlgen/resolver.go
  type: Resolver

# use models generated by sqlc when possible
# REMEMBER TO CUSTOMIZE THE PATH BELOW TO REFERENCE YOUR PROJECT REPOSITORY
autobind:
  - github.com/[username]/gqlgen-sqlc-example/pg

# this will automatically translate between graphql string-based ID type and
# postgres int64-based ids.
models:
  ID:
    model: github.com/99designs/gqlgen/graphql.Int64

# list return values will be slices not slices of pointers
# for better compatibility with sqlc
omit_slice_element_pointers: true
```

Here's the brief explanation of the contents of the configuration file:

- `schema` - the path to the GraphQL schema for our project;
- `exec` - the path to the generated GraphQL execution runtime (we will never make any changes to this file);
- `model` - the path the models generated automatically by `gqlgen` (we will never make any changes to this file);
- `resolver` - automatically generated stubs for resolver methods we will be required to complete by hand. `gqlgen` expects that the user will customize this file so it will never be regenerated on subsequent runs of the tool unless explicitly deleted first.
- `autobind` - this directs `gqlgen` to try and use models from another package rather than generating a new set of models. In this case we are pointing `gqlgen` to models generated by `sqlc` stored in our `pg` package. `gqlgen` will only generate models for structs which are not defined by the `pg` package. **It's important to reference your own project repository here**.
- `models`: `ID`: `model` - GraphQL assumes that the type of `ID` field is `String`. However, we are using a PostgreSQL database as our backend, so it makes more sense to use `Integers` in this context. This configuration instructs `gqlgen` to assume `Int64` as the type of `ID`. The generator will automatically include code to convert between `BIGINT` values used internally by PostgreSQL and the `String` values preferred by GraphQL spec.
- `omit_slice_element_pointers` - resolvers generated by `gqlgen` output slices of pointers as list results (for example `[]*Author`). This setting changes the default behavior to output slices of values instead (for example `[]Author`). We do this for compatibility with `sqlc` which outputs slices of values not pointers as results of queries returning more than row from the database.

## Generate all the things again!

We are finally ready to generate our server. We have previously installed `gqlgen` as the dependency for our project so running the tool is as simple as:

```text
> gqlgen
```

Running this command will result in three new files being created in the `gqlgen` folder. I've described the purpose of each of the files above when discussing the configuration of `gqlgen` but it might be a good idea to spend some time looking at the code generated by the tool. The most interesting file, from our perspective, is `resolver.go` since it contains the stubs of the resolvers we will need to implement by hand. Whenever `gqlgen` can decide by itself how to resolve a field defined in the schema it will create a resolver automatically. What's left for us to do is to create resolvers for fields which are ambiguous, typically because they represent a non-obvious interaction between the resolver and the underlying data layer.

Let's take a closer look at the `resolver.go` code related to the `Agent` type from our schema:

```go
type agentResolver struct{ *Resolver }

func (r *agentResolver) Authors(ctx context.Context, obj *pg.Agent) ([]pg.Author, error) {
	panic("not implemented")
}
```

`gqlgen` was able to automatically determine how to resolve the `ID`, `name` and `email` fields of the `Agent` type, but it wasn't able to figure out what to do about the `authors` field. This makes sense, because `gqlgen` maps the resolver type onto the model representing the data in the database, which looks like this:

```go
type Agent struct {
	ID    int64
	Name  string
	Email string
}
```

The database representation of `Agent` doesn't have a field for `authors` so `gqlgen` leaves it up to us to decide how to resolve this particular field given the information available to the `agentResolver` struct and/or passed directly to the resolver method as arguments.

Towards the top of the generated `resolver.go` file we find the following comment:

```go
// THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.
```

`gqlgen` will only generate the `resolver.go` file during the initial run of the tool, and that from that point onward we should take over the ownership of the file. I like to do a little bit of clean-up first by adding the missing comments for the exported types. I have also added a reference to the `*pg.Repository` instance as a field on the `Resolver` type. Thanks to this the individual resolver methods will be able to access the data layer of the server:

```go
// Resolver connects individual resolvers with the datalayer.
type Resolver struct {
	Repository *pg.Repository
}
```

Our task now is to implement the missing resolver methods. We'll focus on a few methods first so that we are able to do an initial test-run of our server and see the results of our work so far.

## Running the server for the first time

The next step is to quickly implement the functionality related to creating and listing `Agent` objects - so that we can do something useful when we run our server for the first time. This will involve creating implementations for the following three resolver methods:

1. `agentResolver.Authors` since the `agentResolver` needs to know how to resolve the `Authors` field,
2. `mutationResolver.CreateAgent` so that we can create Agent objects, and
3. `queryResolver.Agents` so that we can list the objects we have created.

### agentResolver.Authors implementation

For the `agentResolver` we need to implement the the method that will resolve the `Authors` field. This field is supposed to return a slice of `Author` objects represented by the given `Agent`. Our database schema defined a relationship between agents and authors as a one-to-many relationship via a foreign key reference in the `authors` table. We will therefore need a new query to select authors based on the `ID` of the agent (we can access this value as `obj.ID` inside the resolver). Let's add the following to the `queries.sql` file:

```sql
-- name: ListAuthorsByAgentID :many
SELECT authors.* FROM authors, agents
WHERE agents.id = authors.agent_id AND authors.agent_id = $1;
```

And re-generate the `sqlc` code:

```text
> sqlc generate
```

One nice thing about using code generation in conjunction with `git` is that we can easily check the changes made to the generated code using `git diff [filename]` command, assuming the previous version of the file is what's currently commited:

```text
> git diff pg/queries.sql.go
```

Here, for example, are the changes made to the file by the `sqlc generate` command:

```diff
diff --git a/pg/queries.sql.go b/pg/queries.sql.go
index 54dea3e..9929e16 100644
--- a/pg/queries.sql.go
+++ b/pg/queries.sql.go
@@ -230,6 +230,39 @@ func (q *Queries) ListAuthors(ctx context.Context) ([]Author, error) {
        return items, nil
 }

+const listAuthorsByAgentID = `-- name: ListAuthorsByAgentID :many
+SELECT authors.id, authors.name, authors.website, authors.agent_id FROM authors, agents
+WHERE agents.id = authors.agent_id AND authors.agent_id = $1
+`
+
+func (q *Queries) ListAuthorsByAgentID(ctx context.Context, agentID int64) ([]Author, error) {
+       rows, err := q.db.QueryContext(ctx, listAuthorsByAgentID, agentID)
+       if err != nil {
+               return nil, err
+       }
+       defer rows.Close()
+       var items []Author
+       for rows.Next() {
+               var i Author
+               if err := rows.Scan(
+                       &i.ID,
+                       &i.Name,
+                       &i.Website,
+                       &i.AgentID,
+               ); err != nil {
+                       return nil, err
+               }
+               items = append(items, i)
+       }
+       if err := rows.Close(); err != nil {
+               return nil, err
+       }
+       if err := rows.Err(); err != nil {
+               return nil, err
+       }
+       return items, nil
+}
+
 const listBooks = `-- name: ListBooks :many
 SELECT id, title, description, cover FROM books
 ORDER BY title
```

Great! We have a new query but in order to make it available to our resolvers we need to add the `ListAuthorsByAgentID` method to the `pg.Querent` interface:

```go
type Querent interface {
	// author queries
	// (...)
	ListAuthorsByAgentID(ctx context.Context, agentID int64) ([]Author, error)
	// (...)
}
```

Now that we have everything we need the actual implementation of the `Authors` method is simple:

```go
func (r *agentResolver) Authors(ctx context.Context, obj *pg.Agent) ([]pg.Author, error) {
	return r.Repository.ListAuthorsByAgentID(ctx, obj.ID)
}
```

Well, there's one important caveat. This is a naïve implementation and in the next post in this series I will discuss in detail the limitations of this naïve approach (hint: it would be better to implement the resolver using [the dataloader pattern](https://github.com/graphql/dataloader)). While this implementation is not optimal, it works, and we will keep it for the time being.

One additional thing to point out in case of this resolver is that the return values of the query generated by `sqlc` and the resolver generated by `gqlgen` line up so that we are able to return the result of the query directly as the result of the resolver. This is the effect of setting the `omit_slice_element_pointers` option in the `gqlgen.yml` file to true, as discussed above. Without this configuration the return value of the resolver expected by `gqlgen` would have been `([]*pg.Author, error)`, and we would have needed to manually convert the slice of values returned from the query to a slice of pointers to these values before being able to return it.

### mutationResolver.CreateAgent implementation

We have previously defined a query for creating `Agent` objects so in order to be able to implement the `CreateAgent` method we just have to map up the database code to the resolver:

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

The argument to the `CreateAgent` resolver method is one of the structs (or 'models') `gqlgen` has created for us automatically and it corresponds to the `AgentInput` input in our GraphQL schema. It would have been possible to direct `gqlgen` to reuse the `CreateAgentParams` struct generated by `sqlc` in the resolver method signature, but this approach would lead to problems down the road, since `sqlc` uses `sql.Null*` types to represent nullable values while `gqlgen` represents them using pointers, for one thing, so I recommend letting `gqlgen` create its own parameter structs even if it means that the resolver methods become a bit longer.

### queryResolver.Agents implementation

Again, we already have the query to list `Agent` objects so the implementation of the `Agents` method of the `queryResolver` is a one-liner:

```go
func (r *queryResolver) Agents(ctx context.Context) ([]pg.Agent, error) {
	return r.Repository.ListAgents(ctx)
}
```

Here again the return values of the `sqlc`-generated query and the resolver generated by `gqlgen` are identical so we can simply return the result of the database query as the result of the resolver.

### Creating the GraphQL endpoint handlers

Let's create a new file in the `gqlgen` sub-package directory:

```text
> touch gqlgen/gqlgen.go
```

We follow a pattern similar to our approach in the `pg` package. This new file will hold our custom code related to the `gqlgen` dependency:

```go
package gqlgen

import (
	"net/http"

	"github.com/99designs/gqlgen/handler"
	"github.com/[username]/gqlgen-sqlc-example/pg" // update the username
)

// NewHandler returns a new graphql endpoint handler.
func NewHandler(repo *pg.Repository) http.Handler {
	return handler.GraphQL(NewExecutableSchema(Config{
		Resolvers: &Resolver{
			Repository: repo,
		},
	}))
}

// NewPlaygroundHandler returns a new GraphQL Playground handler.
func NewPlaygroundHandler(title string, endpoint string) http.Handler {
	return handler.Playground(title, endpoint)
}
```

[*** Should this be updated for 0.11 version already???]

In order to run our server we will need to build a simple Go server which will expose two endponts. The code above defines the handlers for those endpoints. The `NewHandler` function returns the main GraphQL server handler which will receive the GraphQL queries and send the responses to these queries.

The `NewPlaygroundHandler` will serve the [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/) application on a selected endpoint as an admin/debuging interface for our server.

### Creating the executable to run our server

Now we have all the pieces required to run our server, we just need to wire them together in an executable. I follow a convention of placing all executable files in a separate subdirectory of the `cmd` package:

```text
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
	mux.Handle("/", gqlgen.NewPlaygroundHandler("GraphQL Playground", "/query"))
	mux.Handle("/query", gqlgen.NewHandler(repo))

	// run the server
	port := ":8080"
	fmt.Fprintf(os.Stdout, "🚀 Server ready at http://localhost%s\n", port)
	fmt.Fprintln(os.Stderr, http.ListenAndServe(port, mux))
}
```

This is a very basic version of the `main` function for our server, and we might refactor it later into something more functional, but a quick-and-dirty solution will be sufficient for now. The logic of the `main` function is easy to follow:

1. We initialize the database connection.
2. We instantiate the `Repository` as `repo` using the database connection.
3. We use Go's standard library to create a simple server with two routes:
   1. The root route (`/`) where we will be able to access GraphQL Playground.
   2. The `/query` route which will actually execute and respond to GraphQL queries.
4. We run the server! 🎉

Let's confirm that everything works:

```text
> go run cmd/gqlgen-sqlc-example/main.go
🚀 Server ready at http://localhost:8080
```

Go ahead and open [http://localhost:8080](http://localhost:8080) in your browser. You should see the GraphQL Playground interface where you can run queries and mutations. We can't query anything yet, since our database contains no data so let's create an agent:

```graphql
mutation {
  createAgent(data: { name: "Virginia Kidd", email: "vk@themilfordmethod.com" }) {
    id
    name
    email
  }
}
```

You should see the result of the mutation, a JSON representation of object you have just created, in the right pane of the Playground:

```json
{
  "data": {
    "createAgent": {
      "id": 1,
      "name": "Virginia Kidd",
      "email": "vk@themilfordmethod.com"
    }
  }
}
```

At this stage we can also run a query to list all agents:

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

Our server works, but we have just about exhausted what it can do at the moment. Running any other queries will result in a panic, since many resolver methods still await implementation.

## Remaining resolver method implementations

Now that we know that we're on the right track we can get back to creating resolver method implementation. There's still quite a lot of work to do before our server is fully operational so let's get to it.

### authorResolver.Website implementation

The reason why we need to implement the method for the `Website` field resolver manually has to do with the fact that the `sqlc`-generated `Author` model uses `sql.NullString` to represent nullable values, while `gqlgen` expects `*string` as a representation of a string that can be null. Our job is therefore simply to render the `sql.NullString` value returned by our database query as a `*string`:

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

If we had more resolvers returning `string` pointers I would be a good idea to create a helper function to convert between the two types of nullable string representations. Because in this case we only have to do a conversion like this once we can leave the conversion logic in the body of the resolver method.

### authorResolver.Agent implementation

The relationship between `Agent` and `Author` objects is a one-to-many relationship established by means of a foreign key field (`agent_id`) in our database's `authors` table. In other words, our resolver needs to fetch an `Agent` object by the id, stored in the `agent_id` field of the `Author` object we're resolving. Luckily we already have defined a query to fetch an agent by their id so here's what the code of the resolver method should be:

```go
func (r *authorResolver) Agent(ctx context.Context, obj *pg.Author) (*pg.Agent, error) {
agent, err := r.Repository.GetAgent(ctx, obj.AgentID)
if err != nil {
	return nil, err
}
return &agent, nil
}
```

This solution works, but is not ideal since it will result in the so-called N+1 query problem. In a nutshell, in case we're resolving a list of authors, our server will send one query to retrieve agent data per each author on the list, which has significant performance implications. We will solve this problem with a better implementation of this resolver, one using the dataloader pattern, in the next part of this tutorial, but we'll keep the imperfect implementation for now.

### authorResolver.Books implementation

We will need to do a bit more work to retrieve the list of an author's books. In our database the relationship between authors and books is a many-to-many relationship facilitated by means of the `book_authors` join table. In order to retrieve all books for a given author we need to write a new query. Let's add the following to `queries.sql`:

```sql
-- name: ListBooksByAuthorID :many
SELECT books.* FROM books, book_authors
WHERE books.id = book_authors.book_id AND book_authors.author_id = $1;
```

And re-run the `sqlc generate` command:

```text
> sqlc generate
```

If you need to confirm the changes made to the `pg/queries.sql.go` file you can run `git diff pg/queries.sql.go` command. We also need to add the newly created query method to the `pg.Querent` interface:

```go
type Querent interface {
	// book queries
	// (...)
	ListBooksByAuthorID(ctx context.Context, authorID int64) ([]Book, error)
}
```

Now that we have the ability to query the `books` table by the `ID` of an author, creating an implementation of the `Books` method is very simple:

```go
func (r *authorResolver) Books(ctx context.Context, obj *pg.Author) ([]pg.Book, error) {
	return r.Repository.ListBooksByAuthorID(ctx, obj.ID)
}
```

Again, this is a naïve implementation that suffers from the N+1 queries problem. We will improve on the current approach in the upcoming follow up to this post which will focus on the dataloader pattern implementations for our server.

### bookResolver.Authors implementation

The `Authors` method of the `bookResolver` represents a very similar problem to the previous resolver we have implemented. Previously we were looking up a list of books for a given author, in this case we have to look up authors for a given book. Again, we will need a new query so add the following to the `queries.sql` file:

```sql
-- name: ListAuthorsByBookID :many
SELECT authors.* FROM authors, book_authors
WHERE authors.id = book_authors.author_id AND book_authors.book_id = $1;
```

We run the `sqlc generate` command again:

```text
> sqlc generate
```

If necessary feel free to review the changes made by `sqlc` by running `git diff` on the `pg/queries.sql.go` file. This all should be familiar by now, we need to add the new method to the `pg.Querent` interface so we can access it in our resolvers:

```go
type Querent interface {
	// author queries
	// (...)
	ListAuthorsByBookID(ctx context.Context, bookID int64) ([]Author, error)
}
```

Finally, we create an implenetation for the resolver method:

```go
func (r *bookResolver) Authors(ctx context.Context, obj *pg.Book) ([]pg.Author, error) {
	return r.Repository.ListAuthorsByBookID(ctx, obj.ID)
}
```

Once again, this is a preliminary implementation that will be improved upon in the upcoming follow up to this post discussing the application of the dataloader pattern to our server's resolvers.

### queryResolver methods

Let's tackle the `queryResolver` next because it's just a matter of mapping our database queries to the respective methods of the resolver:

```go
type queryResolver struct{ *Resolver }

func (r *queryResolver) Agent(ctx context.Context, id int64) (*pg.Agent, error) {
	agent, err := r.Repository.GetAgent(ctx, id)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *queryResolver) Agents(ctx context.Context) ([]pg.Agent, error) {
	return r.Repository.ListAgents(ctx)
}

func (r *queryResolver) Author(ctx context.Context, id int64) (*pg.Author, error) {
	author, err := r.Repository.GetAuthor(ctx, id)
	if err != nil {
		return nil, err
	}
	return &author, nil
}

func (r *queryResolver) Authors(ctx context.Context) ([]pg.Author, error) {
	return r.Repository.ListAuthors(ctx)
}

func (r *queryResolver) Book(ctx context.Context, id int64) (*pg.Book, error) {
	book, err := r.Repository.GetBook(ctx, id)
	if err != nil {
		return nil, err
	}
	return &book, nil
}

func (r *queryResolver) Books(ctx context.Context) ([]pg.Book, error) {
	return r.Repository.ListBooks(ctx)
}
```

The code in the `Agent`, `Author` and `Book` method is very similar, the only difference being the particular query called by each method. The same is true of the `Agents`, `Authors` and `Books` methods. At this stage the general pattern of these implementations should feel familiar.

We have previously implemented the `CreateAgent` method so we can continue by working on the `UpdateAgent` method next.

### mutationResolver.UpdateAgent method

There are different approaches we could take to updating objects in the database. For the purposes of this tutorial we'll implement the most straight-forward (and often also the most practical) approach where each update overwrites data in all mutable fields of the object even if our intention is to only change one value. One alternative approach might make it possible, for example, to work only on the fields that have changed, but an implementation of this kind involves quite a bit more work. If you're interested, there's a good [example of using 'changesets' on the `gqlgen` website](https://gqlgen.com/reference/changesets/). In either case, here's the basic implementation of the resolver:

```go
func (r *mutationResolver) UpdateAgent(ctx context.Context, id int64, data AgentInput) (*pg.Agent, error) {
	agent, err := r.Repository.UpdateAgent(ctx, pg.UpdateAgentParams{
		ID:    id,
		Name:  data.Name,
		Email: data.Email,
	})
	if err != nil {
		return nil, err
	}
	return &agent, nil
}
```

The implementation here is similar to the approach used in the `CreateAgent` method, except in this case the `UpdateAgentParams` object expects to receive the `ID` of the updated object in addition to the values for each of the fields so that the database query knows which row in the table to update with the new values.

### mutationResolver.DeleteAgent method

Here's the code for the `DeleteAgent` method implementation:

```go
func (r *mutationResolver) DeleteAgent(ctx context.Context, id int64) (*pg.Agent, error) {
	agent, err := r.Repository.DeleteAgent(ctx, id)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}
```

This should require no detailed explanation at this stage - we're just calling the query, return an error in case of an error or the result in case the query was successful. One thing to mention, perhaps, is that there are different conventions regarding possible return values of `Delete` mutations (return no value? just the id of the deleted object? return the entire object?). I find it's useful to return the entire deleted object in case the interface of the frontend applications needs to be updated using some data from the deleted object (for example to display a notification about the status of the delete operation or to update the caches of the frontend app). If the return value is not needed it can be discarded.

### mutationResolver CreateAuthor, UpdateAuthor and DeleteAuthor methods

The `CreateAuthor`, `UpdateAuthor` and `DeleteAuthor` method implementations are similar to their equivalents for the `Agent` type. The only significant difference is that we have to deal with the fact that the `Website` field on the `Author` type is nullable. This value will be passed to the resolver as a pointer to a string (`*string`) but our database expects it in the form of a `sql.NullString` value. For this reason we need a simple helper function to convert between these two types. I will add it to the bottom of the `resolvers.go` file:

```go
func stringPtrToNullString(s *string) sql.NullString {
	if s != nil {
		return sql.NullString{String: *s, Valid: true}
	}
	return sql.NullString{}
}
```

Keep in mind that you'll need to add `database/sql` to the import statement at the top of the file for this code to compile - your editor will most likely do this automatically when you save the file.

Here are the implementations of the ramaining author mutation resolver methods:

```go
func (r *mutationResolver) CreateAuthor(ctx context.Context, data AuthorInput) (*pg.Author, error) {
	author, err := r.Repository.CreateAuthor(ctx, pg.CreateAuthorParams{
		Name:    data.Name,
		Website: stringPtrToNullString(data.Website),
		AgentID: data.AgentID,
	})
	if err != nil {
		return nil, err
	}
	return &author, nil
}

func (r *mutationResolver) UpdateAuthor(ctx context.Context, id int64, data AuthorInput) (*pg.Author, error) {
	author, err := r.Repository.UpdateAuthor(ctx, pg.UpdateAuthorParams{
		ID:      id,
		Name:    data.Name,
		Website: stringPtrToNullString(data.Website),
		AgentID: data.AgentID,
	})
	if err != nil {
		return nil, err
	}
	return &author, nil
}

func (r *mutationResolver) DeleteAuthor(ctx context.Context, id int64) (*pg.Author, error) {
	author, err := r.Repository.DeleteAuthor(ctx, id)
	if err != nil {
		return nil, err
	}
	return &author, nil
}
```

All this code should make sense at this stage.

> ASIDE: In general, the resolver method implementations in this post are the most simple implementations possible - the post is very long as it is so I'm trying to keep it simple. They could (and likely should) be improved by adding validation logic to make sure that the data we're saving to the database meets our requirements and perhaps also adding better error checking code. These possible improvements are outside the scope of this tutorial.

We're almost done, just three more resolvers to go! Let's keep coding!

### mutationResolver CreateBook, UpdateBook and DeleteBook methods

We've done the bulk of the work required to create and update books previously in our implementation of the `TxQuerent` interface. We therefore just need to connect the previously created methods to the respective resolvers. Here's the code for the resolvers:

```go
func (r *mutationResolver) CreateBook(ctx context.Context, data BookInput) (*pg.Book, error) {
	return r.Repository.CreateBook(ctx, pg.CreateBookParams{
		Title:       data.Title,
		Description: data.Description,
		Cover:       data.Cover,
	}, data.AuthorIDs)
}

func (r *mutationResolver) UpdateBook(ctx context.Context, id int64, data BookInput) (*pg.Book, error) {
	return r.Repository.UpdateBook(ctx, pg.UpdateBookParams{
		ID:          id,
		Title:       data.Title,
		Description: data.Description,
		Cover:       data.Cover,
	}, data.AuthorIDs)
}

func (r *mutationResolver) DeleteBook(ctx context.Context, id int64) (*pg.Book, error) {
	// BookAuthors associations will cascade automatically.
	book, err := r.Repository.DeleteBook(ctx, id)
	if err != nil {
		return nil, err
	}
	return &book, nil
}
```

One thing to note in the context of the `DeleteBook` method is that we're relying on our database schema to cascade the delete operation in the `books` table to the `book_authors` table which holds the book's associations to its authors. This is possible because of how we have defined the schema for the `book_authors` table:

```sql
CREATE TABLE IF NOT EXISTS book_authors (
    -- (...)
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    -- (...)
);
```

The alternative implementation could for example use a transaction to manually run the `UnsetBookAuthors` query with the ID of the deleted book in addition to removing the book from the `books` table.

We're done with the resolver implementations! 🎉🎉🎉

## Wrapping up and what's next?

We now have an operational GraphQL server. You can run it an play with creating/changing/accessing the data using the GraphQL playground by running:

```text
> go run cmd/gqlgen-sqlc-example/main.go
```

The server runs and works, but it's not production-ready yet. We don't have any tests to make sure that everything is working as it should. Some of our resolvers are implemented naïvely, resulting in suboptimal performance in case of more complex queries. We don't have any way of restricting random users from being able to access and make changes to our database. Our server is also not easy to configure, as parameters such as database name or server port are currently only configurable by changing the code of the `main.go` file. In short, there's still quite a bit of work ahead of us.

With that said, I think we've established a good foundation for our continued work on this project. We have a solid implementation of data persistence layer that's convenient to use. To introduce new queries to our system is as easy as writing some SQL code and running a command. The data layer is plugged into our server by means of an interface, which means it remains orthogonal to our server code and can be easily mocked and even replaced, if need be. Making changes to our GraphQL schema is also easy - we just have to make changes to the schema file, run the `gqlgen` command and add implementations of new resolvers, if required. Because of the way the code is structured and organized, it will be easy to test our code by means of both unit tests and integration tests (we'll explore strategies for testing the server in a separate blog post in the future.) Finally, because we're using Go, our code is extremely portable and easy to deploy.

This has been a long post so we're going to call it a day for now, but I will be publishing follow ups to this posts soon where I will address the abovementioned issues. Thanks for making it all the way to the end of the post! [Follow me on Twitter](https://twitter.com/filipcodes) if you have found this useful and you want to hear from me when I post new content to the blog.

## Useful resources

1. [Official GraphQL documentation](https://graphql.org/)
2. [Official gqlgen documentation](https://gqlgen.com)
3. [gqlgen GitHub repository](https://github.com/99designs/gqlgen)
4. [sqlc GitHub repository](https://github.com/kyleconroy/sqlc)
5. [Introducing gqlgen: a GraphQL Server Generator for Go by Adam Scarr](https://99designs.com.au/blog/engineering/gqlgen-a-graphql-server-generator-for-go/)
6. [The Problems of "Schema-First" GraphQL Server Development by Nikolas Burk](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3)
7. [Standard Package Layout by Ben Johnson](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1)
