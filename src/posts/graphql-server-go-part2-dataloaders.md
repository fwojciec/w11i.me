---
title: "Let's Build a GraphQL Server in Go, Part 2: Dataloaders"
path: '/graphql-server-go-part2-dataloaders'
date: '2020-01-20'
author: 'Filip'
excerpt: 'This is the second in a series of posts covering the process of building a simple yet full featured GraphQL server in Go. In this post we will focus on implementing dataloaders to improve the performance of the server.'
coverImage: '../images/eugene-triguba-jwAkA8JUpZY-unsplash.jpg'
coverImageCreditText: 'Photo by Eugene Triguba'
coverImageCreditUrl: 'https://unsplash.com/photos/jwAkA8JUpZY'
tags: ['go', 'golang', 'graphql', 'sqlc', 'gqlgen', 'postgresql', 'dataloaders', 'dataloaden']
---

## Introduction

In [the previous part of this series](https://w11i.me/graphql-server-go-part1) we have built a basic PostgreSQL-backed GraphQL server in Go. While the server works, the original implementation was susceptible to the so-called [N+1 problem](https://itnext.io/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a). Suppose we wanted to retrieve the list of authors, and for each author, the name of their agent:

```graphql
query {
  authors {
    # one db query sent here (1 query)
    name
    agent {
      # one query sent here for each author on the list (n queries)
      name
    }
  }
}
```

How would the original implementation of our server process a query like this one? It would first fetch a list of all authors - that's one query. Each author object stores the id of the corresponding agent, so it would seem like it's just a matter of fetching the agent object the id... Problem solved? Well, not quite, because a query to fetch an agent would be sent for each author on the list. If our agency represents a hundred authors, a whopping hundred queries would be sent to prepare the response! A hundred plus one queries, to be precise, because we have to include the original query to fetch the authors in the total count. Thankfully this problem can be solved using dataloaders.

A dataloader is defined as a **request-scoped method of caching and batching data-fetching queries**. In the world of dataloaders the above-described query would result in the following sequence of events:

- a dataloader instance would be created at the beginning of the request,
- instead of calling the database directly, the individual invocations of the `authorResolver.Agent` method (one for each author) would instead call the `Load` method of the dataloader instance with the id of the required agent,
- the dataloader instance, meanwhile, would first wait for a few milliseconds to collect the agent ids for its database query, and then would make the query and fetch all required agents at once,
- having retrieved the data, the dataloader instance would distribute it back to the respective resolver methods, and
- finally, upon the completion of the request, the dataloader instance would fall out of scope to be garbage-collected.

I highly recommend watching [this video by Lee Byron](https://www.youtube.com/watch?v=OQTnXNCDywA), where he explains the origin of the idea behind dataloaders and walks through the code of the default JavaScript implementation. It's a great story, and a beautiful piece of code. If my brief description of how dataloaders work leaves you with more questions, the best discussion of this topic I have found is [this video by James Moore aka knowthen on YouTube](https://www.youtube.com/watch?v=ld2_AS4l19g).

Enough theory, let's write some code!

## The dataloaders package

Let's create a new package to hold the code of our dataloaders:

```
> mkdir dataloaders
> touch dataloaders/dataloaders.go
```

Dataloaders are **request-scoped**, which means they only exist for the duration of a request. Given this property, it makes sense to store them in the request context. Dataloaders, furthermore, are specific to the types of values they process, which means we will need to implement different dataloaders for different resolvers.

In order to be able to use dataloaders in our application we first have to figure out how to:

1. initialize the dataloaders and store them as a context value for each incoming request,
2. make the request-scoped dataloader instances available to the resolvers.

### Storing a new instance of dataloaders in the request context

Here's the initial code for the `dataloaders.go` file:

```go
package dataloaders

import (
	"context"

	"github.com/[username]/gqlgen-sqlc-example/pg" // update the username
)

type contextKey string

const key = contextKey("dataloaders")

// Loaders holds references to the individual dataloaders.
type Loaders struct {
	// individual loaders will be defined here
}

func newLoaders(ctx context.Context, repo pg.Repository) *Loaders {
	return &Loaders{
		// individual loaders will be initialized here
	}
}
```

In our implementation of the context value storage/retrieval functionality we will follow [the relevant example from the standard library docs](https://golang.org/pkg/context/#example_WithValue). To avoid possible collisions with values that other packages might be storing in the context we define a custom, unexported `contextKey` type along with the constant `key` of that type, to sign our value.

The exported `Loaders` type is an empty struct to begin with, but it will soon hold the various dataloader implementations used by our application.

Finally, the `newLoaders` function will be used to instantiate the dataloaders. The function takes the context of the current request (`ctx` ) and the repository (`pg.Repository`) as arguments, the latter because the dataloaders will need to query the database. We will be completing the implementation of this function gradually as we introduce new dataloaders to our application.

The dataloaders must be initialized at the beginning of each request. For this reason it makes sense to put the initialization logic, as well as the logic for storing the instance of our dataloaders in the context, in a HTTP middleware that will wrap the handler that processes the GraphQL requests.

Let's put the middleware it in a separate file in the `dataloaden` package:

```text
> touch dataloaders/middleware.go
```

And here's the code inside this file:

```go
package dataloaders

import (
	"context"
	"net/http"

	"github.com/[username]/gqlgen-sqlc-example/pg" // update the username
)

// Middleware stores Loaders as a request-scoped context value.
func Middleware(repo pg.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			loaders := newLoaders(ctx, repo)
			augmentedCtx := context.WithValue(ctx, key, loaders)
			r = r.WithContext(augmentedCtx)
			next.ServeHTTP(w, r)
		})
	}
}
```

A "middleware" is just some shared functionality that's added to the HTTP request-handing code of the server. It is typically implemented as a function with the following signature:

```go
func(http.Handler) http.Handler
```

The implementation above is just slightly more complicated - it is a function which takes the `pg.Repository` as an argument and returns a middleware with the signature as described above. This difference means that we will need to call the `Middleware` function with an instance of `pg.Repository` to initialize the middleware before we can use it.

The body of our middleware is an anonymous function, wrapped in the `http.HandlerFunc` adapter, so that it implements the `http.Handler` interface. The function closes-over the `repo` variable and uses it, along with the request context, to initialize the dataloaders and store them as a value on the request context, before handing the control over to the next `http.Handler`. If you'd like to learn more about HTTP middleware there are many resources available online, for example [this excellent post by Alex Edwards](https://www.alexedwards.net/blog/making-and-using-middleware).

### Retrieving the dataloaders instance from the request context

Now that the dataloaders instance is added to every request we need to figure out how to make this instance available to our resolvers. Let's add the following code to the `dataloaders/dataloaders.go` file:

```go
// Retriever retrieves dataloaders from the request context.
type Retriever interface {
	Retrieve(context.Context) *Loaders
}

type retriever struct {
	key contextKey
}

func (r *retriever) Retrieve(ctx context.Context) *Loaders {
	return ctx.Value(r.key).(*Loaders)
}

// NewRetriever instantiates a new implementation of Retriever.
func NewRetriever() Retriever {
	return &retriever{key: key}
}
```

We follow the pattern that should be familiar if you've read [the previous post in this series](https://w11i.me/graphql-server-go-part1). We create an interface (`Retriever`) describing a functionality, we build an implementation of this functionality in the form of an unexported type (`retriever`), and finally providing a constructor function (`NewRetriever`) to allow code from other packages to initialize the implementation.

In order for our resolvers to be able to use the `DataLoader` functionality we need to add the `DataLoader` interface to our `Resolver` struct in the `gqlgen/resolvers.go` file:

```go
// Resolver connects individual resolvers with the datalayer.
type Resolver struct {
	Repository  pg.Repository
	DataLoaders dataloaders.Retriever
}
```

We will also need to make a change to the `gqlgen.NewHandler` function where the `gqlgen.Resolvers` struct is initialized. Let's update the code in the `gqlgen/gqlgen.go` file:

```go
// NewHandler returns a new graphql endpoint handler.
func NewHandler(repo pg.Repository, dl dataloaders.Retriever) http.Handler {
	return handler.GraphQL(NewExecutableSchema(Config{
		Resolvers: &Resolver{
			Repository:  repo,
			DataLoaders: dl,
		},
	}))
}
```

### Updating the main function with the new functionality

Here's the recap of what we have accomplished in this section:

1. We have created a `dataloaders.Middleware` to initialize dataloaders on each request and to store them in the request context. This middleware can be used to enhance the functionality of any `http.Handler`.
2. We have created a `dataloaders.Retriever` interface which knows how to retrieve an instance of `*dataloaders.Loaders` from the request context. This interface will be added to the `gqlgen.Resolvers` struct so that the individual resolvers can use it.

We have the individual elements, what remains is to wire them up in our server's main function. Here's the revised version of the `cmd/gqlgen-sqlc-example/main.go` file:

```go
package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/[username]/gqlgen-sqlc-example/dataloaders" // update the username
	"github.com/[username]/gqlgen-sqlc-example/gqlgen"      // update the username
	"github.com/[username]/gqlgen-sqlc-example/pg"          // update the username
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

	// initialize the dataloaders
	dl := dataloaders.NewRetriever() // <- here we initialize the dataloader.Retriever

	// configure the server
	mux := http.NewServeMux()
	mux.Handle("/", gqlgen.NewPlaygroundHandler("/query"))
	dlMiddleware := dataloaders.Middleware(repo)     // <- here we initialize the middleware
	queryHandler := gqlgen.NewHandler(repo, dl)      // <- use dataloader.Retriever here
	mux.Handle("/query", dlMiddleware(queryHandler)) // <- use dataloader.Middleware here

	// run the server
	port := ":8080"
	fmt.Fprintf(os.Stdout, "🚀 Server ready at http://localhost%s\n", port)
	fmt.Fprintln(os.Stderr, http.ListenAndServe(port, mux))
}
```

With this scaffolding in place we can start working on the first dataloader.

## AgentByAuthorID Dataloader

Let's tackle the issue discussed in the introduction to this post: if a GraphQL query asks for a list of authors along with their agents, a database query requesting data from the `agents` table is sent for every author included in the response. This is highly inefficient, especially when we're dealing with a longer list of authors, and would be a serious performance bottleneck for the server. Let's investigate how the problem can be solved using a dataloader.

### Generating the AgentLoader

We will be using [dataloaden](https://github.com/vektah/dataloaden) to generate dataloaders for our server. `dataloaden` is a command line tool, written by [Adam Scarr](https://github.com/vektah), the author of `gqlgen`, that generates type-safe boilerplate dataloader code for given combinations of input and output types. Have a look at the repo of the project, especially [the example directory](https://github.com/vektah/dataloaden/tree/master/example) that features a reference implementation of a dataloader using this tool. The official `gqlgen` documentation also has[ a good article on implementing dataloaders using dataloaden](https://gqlgen.com/reference/dataloaders/).

For the `authorResolver.Agent` method we will need a dataloader which takes `int64` input values and returns values of `*pg.Agent` type. In other words, for every `agent_id` value the dataloader will need to return a pointer to an `Agent` struct. Let's add the command required to generate a dataloader for this combination of types as a comment to the `dataloaders/dataloaders.go` file, so that we can easily re-use it in the future:

```go
package dataloaders

//go:generate go run github.com/vektah/dataloaden AgentLoader int64 *github.com/[username]/gqlgen-sqlc-example/pg.Agent
```

This comment tells the `go generate` tool the command that should be run when it is executed in the same directory as the file with the comment. We want `dataloaden` to generate a loader of type `AgentLoader` that takes `int64` values as input and outputs `*pg.Agent` values. **Please remember to change the `[username]` and use the reference to your own project's `pg.Agent` type in the comment above.**

To generate the dataloader run the following command from the project's root directory:

```
> go generate ./dataloaders/...
```

This will generate a new file called `agentloader_gen.go` in the `dataloaders` directory. Take a look inside the generated file. The generated `AgentLoader` struct is the dataloader we will configure and use in our resolver. A new instance of the dataloader can be initialized by calling the `NewAgentLoader` function which takes a config value of `AgentLoaderConfig` type:

```go
// AgentLoaderConfig captures the config to create a new AgentLoader
type AgentLoaderConfig struct {
	// Fetch is a method that provides the data for the loader
	Fetch func(keys []int64) ([]*pg.Agent, []error)

	// Wait is how long wait before sending a batch
	Wait time.Duration

	// MaxBatch will limit the maximum number of keys to send in one batch, 0 = not limit
	MaxBatch int
}
```

The `Wait` option allows us to specify the duration the dataloader should wait to receive the `keys` for its data-fetch query in a given batch. The `MaxBatch` option allows us to set the maximum number of keys that can be sent in a single batch. These two parameters can be used to optimize and fine-tune the performance of the dataloader for a particular query and load characteristics.

From our perspective, however, the most interesting option is the `Fetch` function, since this is where we tell the dataloader how it should use the `keys` it receives as arguments to retrieve the data our server needs to prepare the response.

### Creating the AgentByAuthorID loader

We will call the dataloader that takes author `ID` values as keys and returns an agent for each key the `AgentByAuthorID` loader. This loader will be an instance of the `AgentLoader` type, configured in a particular way. Let's start by adding the `AgentByAuthorID` definition to the `Loaders` struct in the `dataloader/dataloader.go` file:

```go
// Loaders holds references to the individual dataloaders.
type Loaders struct {
	AgentByAuthorID *AgentLoader
}
```

We will need a way to instantiate the `AgentByAuthorID` loader on each request, so let's add the following function to the bottom of the `dataloaders/dataloaders.go` file:

```go
func newAgentByAuthorID(ctx context.Context, repo pg.Repository) *AgentLoader {
	return NewAgentLoader(AgentLoaderConfig{
		MaxBatch: 100,
		Wait:     5 * time.Millisecond,
		Fetch: func(authorIDs []int64) ([]*pg.Agent, []error) {
			// db query
			res, err := repo.ListAgentsByAuthorIDs(ctx, authorIDs)
			if err != nil {
				return nil, []error{err}
			}
			// map
			groupByAuthorID := make(map[int64]*pg.Agent, len(authorIDs))
			for _, r := range res {
				groupByAuthorID[r.AuthorID] = &pg.Agent{
					ID:    r.ID,
					Name:  r.Name,
					Email: r.Email,
				}
			}
			// order
			result := make([]*pg.Agent, len(authorIDs))
			for i, authorID := range authorIDs {
				result[i] = groupByAuthorID[authorID]
			}
			return result, nil
		},
	})
}
```

The `MaxBatch` and `Wait` values above are somewhat arbitrary - they are just safe values that should work on most systems, based on my experiments. The tricky part is the implementation of the `Fetch` function so let's spend a little bit of time breaking it down and discussing the `db query`, `group` and `map` parts of the implementation.

#### `// db query`

The `db query` section of the implementation is responsible for making the database query and retrieving the complete set of data for a given set of keys (or author ids in the above example):

```go
// db query
res, err := repo.ListAgentsByAuthorIDs(ctx, authorIDs)
if err != nil {
	return nil, []error{err}
}
```

The `ListAgentsByAuthorIDs` method of the repository service doesn't exist yet, so we'll have to create it first.

Let's consider the problem from the perspective of our database schema (as defined and discussed in the [first post in this series](https://w11i.me/graphql-server-go-part1)): our query needs to take an array of author id values and return the corresponding rows from the `agents` table. Is the data from the `agents` table by itself sufficient for our purposes? As it turns out, it's not! The `agents` table only holds data specific to agent objects, while the association between agents and authors is defined by means of the `agent_id` field from the `authors` table. With just the data from the `agents` table at our disposal we wouldn't be able to to match the agent instances with the respective author ids. For this reason the query will need to return an `authors.id` value along with each row from the `agents` table.

Without further ado, let's add the following query to the `queries.sql` file:

```sql
-- name: ListAgentsByAuthorIDs :many
SELECT agents.*, authors.id AS author_id FROM agents, authors
WHERE agents.id = authors.agent_id AND authors.id  = ANY($1::bigint[]);
```

This query will return multiple rows combining the columns from the `agents` table with the corresponding `id` column from the `authors` table. We are renaming the `authors.id` column as `author_id` so that `sqlc` generates a nicer field name for that value. Finally, we use the `ANY` operator to match against an array of author ids ([you can read more about using `ANY` expressions in `sqlc` in the docs](https://github.com/kyleconroy/sqlc/blob/master/docs/any.md)).

Let's regenerate the database code using the `sqlc generate` command and add the newly-generated `ListAgentsByAuthorIDs` method of the `*pg.Queries` type to the `pg.Repository` interface (see the previous post in this series for a more detailed explanation of this workflow):

```go
type Repository interface {
	// agent queries
	// ...
	ListAgentsByAuthorIDs(ctx context.Context, authorIDs []int64) ([]ListAgentsByAuthorIDsRow, error)
}
```

One last thing to mention in the context of the `db query` section of the `Fetch` function is the slightly unusual error value (`[]error{err}`) returned in case the query returns an error. The code generated by `dataloaden` will interpret a slice containing a single `error` value to mean that this `error` value should be associated with every key in the input slice. By design, `dataloaden` supports returning distinct error values for every key in the input slice, this is why the `Fetch` function returns a slice of `error` values rather than a single `error` value. While this possibility might come useful in some scenarios, given the constrains of our database schema it isn't necessary to return different error values for each row of the result set: our query will either succeed or fail in the same way for all input keys.

#### `// group`

The `group` section of the `Fetch` function implementation reads as follows:

```go
// group
groupByAuthorID := make(map[int64]*pg.Agent, len(authorIDs))
for _, r := range res {
	groupByAuthorID[r.AuthorID] = &pg.Agent{
		ID:    r.ID,
		Name:  r.Name,
		Email: r.Email,
	}
}
```

In this section we are basically organizing the data retrieved by the database query into a map from author id values to agent objects. In other words, we're creating a map from the input type of the dataloader to its output type. In this case the map serves primarily as a lookup map, to efficiently retrieve the correct `*pg.Agent` value for each author id in the next step. In the process of populating the map we are also converting the `ListAgentsByAuthorIDsRow` values returned from the database query to the `*pg.Agent` values, since the latter type is what our `Fetch` function will return.

#### `// order`

Our dataloader uses the ordering of the three slices the `Fetch` function operates on to determine which agent instance and error value correspond to each author id. In the two slices the `Fetch` function returns the values at index `n`, correspond to the author id value at index `n` in the input slice. The final section of the `Fetch` function is therefore responsible for transforming the map created in the previous step into a correctly ordered slice of result values:

```go
// order
result := make([]*pg.Agent, len(authorIDs))
for i, authorID := range authorIDs {
	result[i] = groupByAuthorID[authorID]
}
return result, nil
```

The theory of the dataloader `Fetch` function implementation can be therefore generalized as follows:

1. fetch the required set of data from the database,
2. transform the query result into a map from the input type to the return type of the dataloader, and
3. transform the map into a properly ordered slice of result values and return it.

We will see this pattern repeated in the next two dataloader implementations discussed in this tutorial. For the time being, however, we can use the `newAgentByAuthorID` function to initialize the `AgentByAuthorID` dataloader in the `newLoaders` function from the `dataloader/dataloader.go` file:

```go
func newLoaders(ctx context.Context, repo pg.Repository) *Loaders {
	return &Loaders{
		// individual loaders will be initialized here
		AgentByAuthorID: newAgentByAuthorID(ctx, repo),
	}
}
```

### Updating the implementation of the authorResolver.Agent method

Our new dataloader is complete and will be initialized on every request processed by our server. The last remaining task is to actually use it in the `Agent` method of the `authorResolver` in the `gqlgen/resolver.go` file:

```go
func (r *authorResolver) Agent(ctx context.Context, obj *pg.Author) (*pg.Agent, error) {
	return r.DataLoaders.Retrieve(ctx).AgentByAuthorID.Load(obj.ID)
}
```

Using the `authorResolver` instance we can now access the `Dataloader.Retrieve` function which retrieves the request-scoped `*dataloader.Loaders` instance. This, in turn gives us access to the `AgentByAuthorID` dataloader instance along with its methods. We use the `Load` method to add the id of the current author object to the list of keys that will be used in the dataloader's data request. The `Load` method will return an instance of `*pg.Agent` corresponding to the author id value we've supplied as the argument.

## AuthorsByAgentID Dataloader

Implementing the remaining dataloaders for our server is going to be analogous to the procedure outlined above, with some variations to account for the specific requirements of each implementation. Let's focus next on creating the dataloader for the `agentResolver.Authors` method. We are working with the same one-to-many relationship between authors and agents as previously, but this time we're resolving the relationships in the direction from "one" to "many". The new dataloader will receive agent ids as its input values and will return slices of author objects (since there are multiple authors associated with each agent).

Let's add a new comment to the `dataloaders/dataloaders.go` file so that the `go generate` command knows how to generate the code for the new dataloader type:

```go
package dataloader

// ...
//go:generate dataloaden AuthorSliceLoader int64 []github.com/[username]/gqlgen-sqlc-example/pg.Author

```

The input type of the new dataloader is `int64` since this is the type of the agent id values. The output value is a slice of author objects, or `[]pg.Author`. The fact that the new dataloader returns a slice of values for each input key it receives is, by convention, reflected in the name of the new dataloader type.

Let's generate the code for the new dataloader:

```
> go generate ./dataloaders/...
```

This command will create a new file called `authorsliceloader_gen.go` in the `dataloaders` directory. We need to add the new dataloader type to the `Loaders` struct:

```go
type Loaders struct {
	AgentByAuthorID  *AgentLoader
	AuthorsByAgentID *AuthorSliceLoader
}
```

Before we create a function to initialize the new dataloader let's create the database query for its `Fetch` function. The query will take an array of `agents.id` values as an argument and will return multiple rows from the `authors` table. Since each author object includes an `agent_id` value, we will be able to match the individual rows to the agent id values without any additional data. Here's the query:

```sql
-- name: ListAuthorsByAgentIDs :many
SELECT authors.* FROM authors, agents
WHERE authors.agent_id = agents.id AND agents.id = ANY($1::bigint[]);
```

At this point in time you can go ahead and remove the `ListAuthorsByAgentID` (singular ID) query from the `queries.sql` file since we will no longer need it. Once you run the `sqlc generate` file go ahead and make the necessary updates to the `pg.Repository` interface by removing the old `ListAuthorsByAgentID` method and adding the newly created `ListAuthorsByAgentIDs` method:

```go
type Repository interface {
	// ...

	// author queries
	// ...
	ListAuthorsByAgentIDs(ctx context.Context, agentIDs []int64) ([]Author, error)
}
```

Now we have everything we need to create the constructor function for our new dataloader. Let's add the following code to the end of the `dataloaders/dataloaders.go` file:

```go
func newAuthorsByAgentID(ctx context.Context, repo pg.Repository) *AuthorSliceLoader {
	return NewAuthorSliceLoader(AuthorSliceLoaderConfig{
		MaxBatch: 100,
		Wait:     5 * time.Millisecond,
		Fetch: func(agentIDs []int64) ([][]pg.Author, []error) {
			// db query
			res, err := repo.ListAuthorsByAgentIDs(ctx, agentIDs)
			if err != nil {
				return nil, []error{err}
			}
			// group
			groupByAgentID := make(map[int64][]pg.Author, len(agentIDs))
			for _, r := range res {
				groupByAgentID[r.AgentID] = append(groupByAgentID[r.AgentID], r)
			}
			// order
			result := make([][]pg.Author, len(agentIDs))
			for i, agentID := range agentIDs {
				result[i] = groupByAgentID[agentID]
			}
			return result, nil
		},
	})
}
```

The return value of the `AuthorsByAgentID` dataloader's `Fetch` function is a slice of slices of author objects (`[][]pg.Author`) - this is because multiple authors correspond to every agent id and the `Fetch` function returns a result for many agent ids. This characteristic affects what needs to be done in the `group` section: this time we need to create a mapping from every id value to a slice of `pg.Author` values. In the `order` section we're just ordering the slices of authors according to the order of the agent ids from the input slice.

As before, we need to initialize our new dataloader in the `newLoaders` function:

```go
func newLoaders(ctx context.Context, repo pg.Repository) *Loaders {
	return &Loaders{
		AgentByAuthorID:  newAgentByAuthorID(ctx, repo),
		AuthorsByAgentID: newAuthorsByAgentID(ctx, repo),
	}
}
```

Finally, we can update the implementation of the `agentResolver.Authors` method in the `gqlgen/resolvers.go` file:

```go
func (r *agentResolver) Authors(ctx context.Context, obj *pg.Agent) ([]pg.Author, error) {
	return r.DataLoaders.Retrieve(ctx).AuthorsByAgentID.Load(obj.ID)
}
```

With this the implementation of the `AuthorsByAgentID` is complete.

## AuthorsByBookID Dataloader

Let's tackle the implementation of the dataloader for the `bookResolver.Authors` method next. This dataloader will take the form of an alternative implementation of the `AuthorSliceLoader` dataloader type we have created previously, since the input (`int64`) and output (`[]pg.Author`) types are the same as in the previous implementation. The only meaningful difference compared to the dataloader implementation from the previous section will be the contents of the `Fetch` function.

First things first, however, let's add the new dataloader to the `Loaders` struct in the `dataloaders/dataloaders.go` file:

```go
type Loaders struct {
	AgentByAuthorID  *AgentLoader
	AuthorsByAgentID *AuthorSliceLoader
	AuthorsByBookID  *AuthorSliceLoader
}
```

To create the `Fetch` function for this dataloader we will need a database query that returns rows from the `authors` table along with the corresponding book id values given an array of book ids. Let's add the following query to the `queries.sql` file:

```sql
-- name: ListAuthorsByBookIDs :many
SELECT authors.*, book_authors.book_id FROM authors, book_authors
WHERE book_authors.author_id = authors.id AND book_authors.book_id = ANY($1::bigint[]);
```

In the case of this query and this dataloader we are working across a many-to-many relationship between books and authors, and as such we need information from the `authors` and the `book_authors` tables. The new query will replace the `ListAuthorsByBookID` (singular ID) query created in the previous post in this series, so go ahead and delete it from the `queries.sql` file before re-generating the database code using the `sqlc generate` command. Finally, remove the old `ListAuthorsByBookID` from the `pg.Repository` interface, and add the newly created `ListAuthorsByBookIDs` method in its place:

```go
type Repository interface {
	// ...

	// author queries
	// ...
	ListAuthorsByBookIDs(ctx context.Context, bookIDs []int64) ([]ListAuthorsByBookIDsRow, error)
}
```

We now how everything that's required to create the constructor function:

```go
func newAuthorsByBookID(ctx context.Context, repo pg.Repository) *AuthorSliceLoader {
	return NewAuthorSliceLoader(AuthorSliceLoaderConfig{
		MaxBatch: 100,
		Wait:     5 * time.Millisecond,
		Fetch: func(bookIDs []int64) ([][]pg.Author, []error) {
			// db query
			res, err := repo.ListAuthorsByBookIDs(ctx, bookIDs)
			if err != nil {
				return nil, []error{err}
			}
			// group
			groupByBookID := make(map[int64][]pg.Author, len(bookIDs))
			for _, r := range res {
				groupByBookID[r.BookID] = append(groupByBookID[r.BookID], pg.Author{
					ID:      r.ID,
					Name:    r.Name,
					Website: r.Website,
					AgentID: r.AgentID,
				})
			}
			// order
			result := make([][]pg.Author, len(bookIDs))
			for i, bookID := range bookIDs {
				result[i] = groupByBookID[bookID]
			}
			return result, nil
		},
	})
}
```

The only real difference in the above implementation of the `Fetch` function, compared to the implementations discussed previously, is the `group` section. We are transforming the data returned from the query into slices of `pg.Author` structs grouped by the book ids they're associated with.

The last task is to update the `bookResolver.Authors` method in the `gqlegen/resolvers.go` file:

```go
func (r *bookResolver) Authors(ctx context.Context, obj *pg.Book) ([]pg.Author, error) {
	return r.DataLoaders.Retrieve(ctx).AuthorsByBookID.Load(obj.ID)
}
```

With this the implementation of the `AuthorsByBookID` dataloader is complete.

## BooksByAuthorID Dataloader

With the three example dataloader implementations above I'll leave it up to you to create the `BooksByAuthorID` dataloader. The implementation will follow the same pattern as before:

1. Generate a new dataloader type (`BookSliceLoader`) which takes `int64` and returns `[]pg.Book` values;
2. Create a new query which takes an array of `author_id` values and returns multiple rows from the `books` table along with the `author_id` value that corresponds to each row;
3. Update the `pg.Repository` definition to include the newly-created query (it can replace the `ListBooksByAuthorID` method created in the previous part of this tutorial as it will be no longer needed).
4. Wire things up in the `dataloaders/dataloaders.go` file and create the `newBooksByAuthorID` constructor function modeled on the constructors created earlier. The biggest challenge is going to be creating the `Fetch` function implementation for the dataloader. Good luck and have fun!

Please see [the GitHub repository for this tutorial](https://github.com/fwojciec/gqlgen-sqlc-example/tree/part2) for the implementation of this dataloader against my version.

## Wrapping up

Thanks for your time and for making it all the way to the end of the tutorial. In this part we've improved on the major shortcomings of the previous implementation of the server. If you have been following from the first part of the series you should be able to build a performant GraphQL server based on your specification. Are we done? Not yet! In the upcoming parts of this series I will discuss authentication and authorization as well as discussing possible strategies for testing the server -- stay tuned!

## Useful resources

1. [The GitHub repository with the code of this tutorial](https://github.com/fwojciec/gqlgen-sqlc-example/tree/part2)
2. [What is the N+1 Problem in GraphQL? by Mike Cronin](https://itnext.io/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a)
3. [DataLoader - source code walkthrough by Lee Byron](https://www.youtube.com/watch?v=OQTnXNCDywA)
4. [DataLoader and the Problem it solves in GraphQL by James Moore/knowthen](https://www.youtube.com/watch?v=ld2_AS4l19g)
5. [Making and Using HTTP Middleware by Alex Edwards](https://www.alexedwards.net/blog/making-and-using-middleware)
6. [The official gqlgen tutorial page about dataloaders](https://gqlgen.com/reference/dataloaders/)
7. [Dataloaden project repository](https://github.com/vektah/dataloaden)
