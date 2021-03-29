---
title: 'Paging DynamoDB queries with TypeScript generators'
date: '2021-03-28'
author: 'Filip Wojciechowski'
twitterProfile: 'https://twitter.com/filipcodes'
excerpt: "When working with DynamoDB's query API we have to consider that the results might be paged. Here's one approach to page through the results - using JavaScript/TypeScript generators."
coverImage: 'oskar-yildiz-cOkpTiJMGzA-unsplash.jpg'
coverImageCreditText: 'Photo by Oskar Yildiz'
coverImageCreditUrl: 'https://unsplash.com/photos/cOkpTiJMGzA'
tags: ['typescript', 'javascript', 'generators', 'aws', 'dynamodb']
---

I'm spending a fair amount of time working with AWS and DynamoDB these days and I'm trying to decide on my favorite ways of doing things. Here's one pattern I came up with yesterday that seemed like something worth sharing.

A query in DynamoDB will return an optional `LastEvaluatedKey` as part of the result object in case a single `query` call did not return all available items. This can happen either because a query was parametrized with a `Limit` and the number of available results exceeded that limit, or because query results reached the maximum payload size of 1MB. In either case, when using the DynamoDB query API you have to account for the possibility that you won't be able to get all available results in a single call and that you'll have to page through the results instead.

There are multiple possible implementations of the paging logic: calling the `query` method recursively until all results have been fetched, and using a `while` loop are two approaches that come to mind immediately. The recursive method runs the risk of overflowing the stack as Node doesn't support [tail call optimization](https://en.wikipedia.org/wiki/Tail_call) (granted, a pretty theoretical risk in most cases, but the mere theoretical possibility is the sort of thing that bugs me about this approach). A while loop will often be the optimal solution, but it does make it tricky to cleanly decouple the chore of iterating through pages of results from the business logic, especially if you prefer to avoid allocating memory for the entire set of results before continuing with subsequent transformations. A most elegant solution to this problem, arguably, is to use [JavaScript generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*). Allow me to demonstrate using a practical example.

Let's imagine a DynamoDB table that includes a partition with data about cities, where a city is a DynamoDB object that looks as follows:

```json
{
  "pk": {
    "S": "city"
  },
  "sk": {
    "S": "New York"
  },
  "name": {
    "S": "New York"
  },
  "population": {
    "N": "8490000"
  }
}
```

The `pk` (or the primary key) for objects in this partition is simply a string `city` which enables us to easily query for all cities in the table. The `sk` (or sort key) attribute is used to sort the results alphabetically by name. Even if the cities partition is small enough to fetch in a single query call to begin with, we can't assume that this will always be the case, so we need to be able to handle paging when retrieving the full set of results.

In order to make my programs easier to test and maintain I like to abstract the complexity involved in working with a database by first defining an interface describing the API for accessing the data and only then writing a concrete implementation of that interface. Here are some TypeScript interfaces to get us started:

```typescript
interface City {
  name: string
  population: number
}

interface CityRepo {
  listCities: () => Promise<City[]>
}
```

What we need now is a concrete (i.e. DynamoDB-specific) implementation of the `CityRepo` interface which might look like this at the outset:

```typescript
class DynamoDBCityRepo implements CityRepo {
  private client: DynamoDB.DocumentClient
  private tableName: string

  constructor(client: DynamoDB.DocumentClient, tableName: string) {
    this.client = client
    this.tableName = tableName
  }

  async listCities(): Promise<City[]> {
    // ...
  }
}
```

We will fill out the details of the `listCities` method in the last step, as this method will depend on a private method to handle the possibility that the results coming from DynamoDB will be paginated. This private method, or technically speaking, a private async generator method is as follows:

```typescript
class DynamoDBCityRepo implements CityRepo {
  // ...

  private async *queryItemsGenerator(
    queryInput: DynamoDB.DocumentClient.QueryInput
  ): AsyncGenerator<DynamoDB.DocumentClient.ItemList> {
    let lastEvaluatedKey: DynamoDB.DocumentClient.Key | undefined
    do {
      const { Items, LastEvaluatedKey } = await this.client
        .query({ ...queryInput, ExclusiveStartKey: lastEvaluatedKey })
        .promise()
      lastEvaluatedKey = LastEvaluatedKey
      if (Items !== undefined) {
        yield Items
      }
    } while (lastEvaluatedKey !== undefined)
  }
}
```

The generator method uses a `do...while` construct to call the DynamoDB's JavaScript SDK client's `query` method until all results are returned. The loop will execute the query at least once, and will continue until the value of the `LastEvaluatedKey` prop on the result object becomes `undefined`, or in other words, until there are no further items to retrieve for the query. The value of `LastEvaluatedKey` is passed as the value of `ExclusiveStartKey` property of the `QueryInput` object on each `query` iteration. The `Items` property of the result object can be `undefined` even if the query has not finished retrieving the results, for example if a `FilterExpression` was defined for the query and it filtered out all results in a given page, so we need to make sure it is defined before yielding it back.

With the generator logic in place, how do we take advantage of it in `listCities` method? Here is a simple example:

```typescript
class DynamoDBCityRepo implements CityRepo {
  // ...

  async listCities(): Promise<City[]> {
    const result: City[] = []
    const queryInput: DynamoDB.DocumentClient.QueryInput = {
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': 'city',
      },
      TableName: this.tableName,
    }
    for await (const page of this.queryPageGenerator(queryInput)) {
      result.push(
        ...page.map((item) => ({
          name: item.sk,
          population: item.population,
        }))
      )
    }
    return result
  }

  // ...
}
```

The interesting part of the implementation is the `for await` loop - a special construct for working with async generators. The cool thing about this approach, and the main reason for bothering with generators in lieu of a more simple loop, is the fact that each `page` only exists in the scope of a single iteration of the `for await` loop (hence we are able to define it as a `const`). This is a way to avoid needless memory allocations, especially iterating through large data sets. Obviously inside the `for await` loop we can do more interesting things than just mapping through the page items to collate the list of results (we could filter out results, stream them directly to a json file, etc.), but I wanted to keep things simple for the purposes of this example. The generator method, can also be re-used by any other methods that might need to query the database for different results.

A full working example using this approach is [available on Github](https://github.com/fwojciec/generator-query-example).
