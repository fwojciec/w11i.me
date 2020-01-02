---
title: 'Next.js, useRouter hook, and testing'
path: '/next-js-userouter-testing'
date: '2019-09-02'
author: 'Filip'
excerpt: 'A quick tip on how to test Next.js components which utilize the useRouter hook.'
tags: ['next.js', 'useRouter', 'testing']
---

## Introduction

If you have tried testing a component which relies on the `useRouter` hook in Next.js, you have likely come across an error that might look like this:

```
TypeError: Cannot destructure property `query` of 'undefined' or 'null'.

      25 |   (...)
    > 26 |   const { query } = useRouter()
         |         ^
(...)
```

During a test the value returned by the `useRouter` hook appears to be either `null` or `undefined`. How to work around this?

Different approaches are possible, and some are discussed in an issue in the Next.js GitHub repo [here](https://github.com/zeit/next.js/issues/7479). The approach I'm about to describe is inspired by [ijjk's comment in that thread](https://github.com/zeit/next.js/issues/7479#issuecomment-498031927).

## withTestRouter HOC

Why does the error occur in the first place? The `useRouter` hook is basically a shortcut for accessing values from Next's `RouterContext`. Therefore, in order to be able to test a component which relies on the `useRouter` hook we need to wrap the tested component with a `RouterContext.Provider`.

My solution to this problem is using a simple higher order function which takes two arguments - a component (or a component tree) and an optional object with optional router prop values - and returns the component passed in as the first argument wrapped in a configured `RouterContext.Provider`. Here's the (TypeScript) code:

```tsx
import React from 'react'
import { NextRouter } from 'next/router'
import { RouterContext } from 'next-server/dist/lib/router-context'

export function withTestRouter(tree: React.ReactElement, router: Partial<NextRouter> = {}) {
  const {
    route = '',
    pathname = '',
    query = {},
    asPath = '',
    push = async () => true,
    replace = async () => true,
    reload = () => null,
    back = () => null,
    prefetch = async () => undefined,
    beforePopState = () => null,
    events = {
      on: () => null,
      off: () => null,
      emit: () => null
    }
  } = router

  return (
    <RouterContext.Provider
      value={{
        route,
        pathname,
        query,
        asPath,
        push,
        replace,
        reload,
        back,
        prefetch,
        beforePopState,
        events
      }}
    >
      {tree}
    </RouterContext.Provider>
  )
}
```

The nice thing about this approach is that it is possible to optionally set specific values for the various properties of the router object. By default the function sets the router's props to empty values, and already this silences the previously mentioned error in many cases, but the individual prop values can be also overridden as needed. If the component under test needs specific values to be stored in the router's `asPath` or `pathname` properties, to give an example, you can just set these values for a given test. You can also set `jest.fn()` mocks as values for the various router methods (`push`, `replace`, etc.) and then check if the mocked methods were called correctly. It's a very flexible approach.

## Example

Here is a simplified example from one of my apps which demonstrates how it all works in practice:

```tsx
(...)

// the mock which will be used instead of the router's push method
const push = jest.fn()

// the component tree being tested
const tree = withTestRouter(
    <LanguageProvider lang='en'>
      <LanguageSwitcher />
    </LanguageProvider>,
    {
  		push,
  		pathname: '/[lang]',
  		asPath: '/en'
  	}
  )

// an example test
describe('<LanguageSwitcher />', () => {
	it('switches language en => pl', () => {
    const { getByText } = render(tree('en'))
    const pl = getByText('polski')
    act(() => {
      fireEvent.click(pl)
    })
    expect(push).toHaveBeenCalledWith('/[lang]', '/pl')
  })
})
```

### Additional Resources

1. [The issue discussing the problem in Next's GitHub repo](https://github.com/zeit/next.js/issues/7479)
2. [React Testing Library docs on testing React Context](https://testing-library.com/docs/example-react-context)
