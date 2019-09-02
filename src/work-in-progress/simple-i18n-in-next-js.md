---
title: 'How to build a mutlilingual website in Next.js'
path: '/simple-i18n-in-next-js'
date: '2019-08-24'
author: 'Filip'
excerpt: "It used to be challenging to build multilingual websites in Next.js, but things have greatly improved with introduction of Next 9. In this blog post I'm sharing my ideas on how to implement multi-language support (with locale subpaths, etc.) in Next.js by taking advantage of the framework's newly introduced APIs, while trying to keep things as simple as possible."
coverImage: '../images/don-ross-iii-JuKbaozIo0k-unsplash.jpg'
tags: ['next.js', 'react', 'i18n', 'internationalization', 'multi-lingual', 'typescript']
---

# Introduction

The websites I build typically support more than one language. This affects how I think about building websites in general, from data modeling to implementing multiple language support on the frontend. Because full-blown internationalization solutions (like [react-intl](https://github.com/formatjs/react-intl) and others) tend to be too much for my needs, I prefer to roll my own. While this is relatively easy to do in vanilla client-rendered React, it used to be somewhat difficult in Next.js because of SSR and the way Next used to implemented routing. Version 9 of Next.js, however, features a brand new implementation of [dynamic routing](https://nextjs.org/blog/next-9#dynamic-route-segments), one this change makes it much easier to build multi-lingual websites and webapps in Next.

This post might be of interest to you if you are implementing support for multiple languages in a Next.js website or app. I'm going to discuss building the following features:

- locale subpaths
- server side rendering with no need for custom server
- simple automatic language detection
- ability to save/restore user language preferences
- translations

I'll be only using generic React and Next.js APIs, and in general I'll make an effort to keep things as idiomatic and simple as possible. If this sounds good to you -- read on!

## Example application

I this blog post I'll walk through the code of the example website, which [is deployed here](https://simple-i18n-example.fwojciec.now.sh/). It's a basic Next.js app that comes in three language versions: English (default), Polish and French (I don't speak French, so please blame Google Translate for any errors). The repository with the source code [is here](https://github.com/fwojciec/simple-i18n-example) - it might be handy to reference it as context for the code snippets below.

When you access the root URL (`/`) of the example site for the first time the app will attempt to determine your browser's language setting, and if it matches one of the available locales, you will be redirected to the root URL of the corresponding translation (for example `/fr`). On consecutive runs, the root URL will redirect to the translation used during your previous session. The website defaults to the English language (i.e. it redirects to `/en`) in case it finds no stored preference or a valid browser language setting.

You can switch language using the `<select>` input in the left top corner of the page. The contents of the website, including the `<title>` tag in the header, the URL, the server-side generated code, and the Wikipedia URL on the `/[lang]/artist` page will change based on the selected locale.

It's a straight-forward example, but it encompases the basic functionality I would require when building a website which supports multiple languages.

## Configuration and types

Configuration and TypeScript types are located in the `translations` directory:

```
translations
├── config.ts
├── getInitialLocale.ts
├── strings.ts
└── types.ts
```

The definitions of available locales, the default locale, and the names of the languages supported by the website are located inside `config.ts` file. Translations used by the applications can be found in the `strings.ts` file. TypeScript types are in, you've guessed it, the `types.ts` file. Finally, the `getInitialLocale.ts` file contains a function which determines which language should be selected when the website is accessed for the first time. I will discuss the workings of this function (as well as a few other interesting tidbits from that folder) in more detail below.

## Locale subpaths

In my view locale subpaths are an **essential feature** of any multi-lingual website. The term is just a fancy way of saying that the current locale of the website is encoded in the URL of each page. For example, an English language version of the `/about-us` page might be available at `/en/about-us` while the Polish language variant of this page at `/pl/about-us`. The URL, therefore, becomes the app's **source of truth** about the current language setting. Furthermore, since the language setting of the website is it is publically readable as a segment of the URL, locale subpaths are beneficial from the perspective of SEO. Thanks to locale subpaths we can inform search engines that our website supports multiple languages, making it possible for the language-specific pages to appear in the searches by users who prefer a particular language.

Next v9 introduced a new API which makes it possible to use dynamic parameters (slugs, ids or language iso codes) in file and directory names inside the app's `pages` directory. See [Next's documentation](https://nextjs.org/docs#dynamic-routing) for a detailed discussion of how this API works. This is what the `pages` directory looks like in our example website:

```
pages
├── [lang]					<- the dynamic route parameter is defined here
│   ├── artist.tsx
│   └── index.tsx
└── index.tsx				<- this page only redirects to a language-specific subpage
```

All pages inside the `[lang]` directory will receive the value of the URL segment corresponding to the position of the `[lang]` directory in the structure of the `pages` directory as a prop. The only page which does not receive the `lang` prop is the root `index.tsx` page. This is the only language-indifferent page of the example website. Let's have a closer look at what it does.

## Automatic langauge detection

Out of all the pages inside the `pages` directory only the root `index.tsx` page receives no information about the currently selected language from the URL. In the example implementation, this page has only one purpose: to redirect the user to a language-specific subpage. Here's the code:

```tsx
// pages/index.tsx

import React from 'react'
import Head from 'next/head'
import { getInitialLocale } from '../translations/getInitialLocale'
import { useRouter } from 'next/dist/client/router'

const Index: React.FC = () => {
  const router = useRouter()
  React.useEffect(() => {
    router.replace('/[lang]', `/${getInitialLocale()}`)
  })
  return (
    <Head>
      <meta name="robots" content="noindex, nofollow" />
    </Head>
  )
}

export default Index
```

Since the `useEffect` hook only runs on the client, the redirect will only happen on the client-side. This is by design, since the `getInitialLocale` function needs the `window` object to determine which language subpath to redirect to. Incidentally, since the `router` is only needed on the client, instead of wrapping the entire component with the `withRouter` HOC we can take advantage of the new `useRouter` hook provided by the framework -- the hook does nothing on the server, which is fine. The additional advantage of only using client-side logic on this page is that the page can be prerendered and served as a static HTML in production so the redirect will be virtually instantaneous. The redirect page returns no content except for a head `<meta>` tag instructing search engines not to index this page.

We need the browser-specific APIs, `localStorage` and `navigator`, in order to determine first the stored user preference and, if that doesn't work, the language setting of user's browser to choose the initial language of the website. If no stored preference is found and if browser settings are inaccessible (or not relevant), the app falls back to the default language as defined in the app's configuration. Here's the implementation of the `getInitialLocale` function:

```tsx
// translations/getInitialLocale.ts

import { defaultLocale } from './config'
import { Locale, isLocale } from './types'

export function getInitialLocale(): Locale {
  // preference from the previous session
  const localSetting = localStorage.getItem('locale')
  if (localSetting && isLocale(localSetting)) {
    return localSetting
  }

  // the language setting of the browser
  const [browserSetting] = navigator.language.split('-')
  if (isLocale(browserSetting)) {
    return browserSetting
  }

  return defaultLocale
}
```

One aspect of the above code that might not be obvious is the `isLocale` function. It is actually a [user defined typeguard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards), using TypeScript terminology. It returns `true` if a tested value is a valid locale, and `false` otherwise. What makes it a "typeguard" is the fact that in addition to the boolean return value, it also sets the type of the tested variable as `Locale` in case the function returns `true`:

```typescript
// translations/types.ts (excerpt)

export function isLocale(tested: string): tested is Locale {
  return locales.some(locale => locale === tested)
}
```

In the above implementation of the `getInitialLocale` function the `localSetting` or the `browserSetting` will only be respected if they match one of the locales defined in the app's configuration. Otherwise the function simply returns the default locale. This is a minimal implementation of automatic language detection, but it works just fine.

## withLocale HOC

A higher order component (HOC) is a function that takes a component as it's argument, enhances that component in some way (for example by injecting additional props or wrapping it in another component) before returning it. It's a pattern that's popular in the Next.js community. All language-aware pages of the example application are wrapped with the `withLang` higher order component, for example:

```tsx
import React from 'react'

const Page: React.FC = () => {
  // (...)
}

export default withLocale(Page) // <- component is wrapped with a HOC
```

The `withLocale` HOC is responsible for detecting the current language on the server, making sure the value passed as the locale is valid, and finally for wrapping all child nodes of the page in a correctly configured locale context provider. Let's look at the implementation of `withLocale` in more detail:

```tsx
// hocs/withLocale.tsx

import React from 'react'
import { NextPage } from 'next'
import Error from 'next/error'
import { getDisplayName } from 'next-server/dist/lib/utils'
import { isLocale, Locale } from '../translations/types'
import { LocaleProvider } from '../context/LocaleContext'

interface LangProps {
  locale?: Locale
}

export default (WrappedPage: NextPage<any>) => {
  const WithLocale: NextPage<LangProps> = ({ locale, ...pageProps }) => {
    if (!locale) {
      // no valid locale detected
      return <Error statusCode={404} />
    }
    return (
      <LocaleProvider lang={locale}>
        <WrappedPage {...pageProps} />
      </LocaleProvider>
    )
  }

  WithLocale.getInitialProps = async ctx => {
    // retrieve initial props of the wrapped component
    let pageProps = {}
    if (WrappedPage.getInitialProps) {
      pageProps = await WrappedPage.getInitialProps(ctx)
    }

    if (typeof ctx.query.lang !== 'string' || !isLocale(ctx.query.lang)) {
      // in case the value of 'lang' is not a valid locale leave it undefined
      return { ...pageProps }
    }

    // the locale is valid
    return { ...pageProps, locale: ctx.query.lang }
  }

  // pretty display name for the debugger
  WithLocale.displayName = `withLang(${getDisplayName(WrappedPage)})`

  return WithLocale
}
```

The HOC takes the page it wrapps (`WrappedPage`) as an argument and returns a new component, called `WithLocale`. This new component defnies the `getInitialProps` static method in order to retrieve the language setting during the server rendering stage. We need to know about the language setting already on the server because we want the server-generated HTML to use the correct translations, and to set the `<head>` of the page with the correct values (page title, description, or anything else you might need for SEO purposes). First, however, we attempt to run the `getInitialProps` method of the `WrappedPage` component, in case it defines one, and we pass any retrieved values (`pageProps`) to the `WithLocale` component.

The context passed to the `getInitialProps` method of a Next page includes a `query` prop: an object with any query or dynamic route parameters container in the URL of the page. The `pages` directory of our example applications defines a `lang` dynamic route parameter, so this is the parameter (`ctx.query.lang`) we need to retrieve from the context. Next defines the type of a `query` parameter as either a string or an array of strings (`string | string[]`). This is why we need to confirm that the `lang` parameter is, first of all, a `string` and secondly a valid locale (using the `isLocale` type guard, as discussed previously). If either of these two conditions is not met the locale is incorrectly defined we leave it as `undefined`. If both conditions are met, we know that we have a correctly defined locale, our typechecker is happy, and we can return the `locale` to the `WithLocale` component for further processing.

The `WithLocale` component will render an error page in case the locale is `undefined` in the props returned from the `getInitialProps` method. A situation like this will generally mean that the url is something invalid like `/somethingwrong/about-us` so the app should respond with a 404 error. If the locale prop is valid, the `WithLocale` component will render the `WrappedPage` (along with its original props) wrapped in a context provider set to the correct locale.

The `displayName` static method of the `WithLocale` component simply gives it a more useful name for debugging purposes (see [React Docs](https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging) for more information.)

## Locale Context

React's context API is a way of storing and managing global state for a tree of React components. It therefore makes a lot of sense to use context to store and distribute the language setting once it has been read from the URL. The example app defines the `LocaleContext` in the following way:

```tsx
import React from 'react'
import { useRouter } from 'next/dist/client/router'
import { Locale, isLocale } from '../translations/types'

interface ContextProps {
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
}

export const LocaleContext = React.createContext<ContextProps>({
  locale: 'en',
  setLocale: () => null
})

export const LocaleProvider: React.FC<{ lang: Locale }> = ({ lang, children }) => {
  const [locale, setLocale] = React.useState(lang)
  const { query } = useRouter()

  // store the preference
  React.useEffect(() => {
    if (locale !== localStorage.getItem('locale')) {
      localStorage.setItem('locale', locale)
    }
  }, [locale])

  // sync locale value on client-side route changes
  React.useEffect(() => {
    if (typeof query.lang === 'string' && isLocale(query.lang) && locale !== query.lang) {
      setLocale(query.lang)
    }
  }, [query.lang, locale])

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}
```

### Related resources

1. [Live demo of the example website](https://simple-i18n-example.fwojciec.now.sh)
2. [Repository with the code of the example website](https://github.com/fwojciec/simple-i18n-example)
3. [Dynamic Routing in Next Docs](https://nextjs.org/docs#dynamic-routing)

### Cover photo credit

Cover photo by [Don Ross III](https://unsplash.com/photos/JuKbaozIo0k).
