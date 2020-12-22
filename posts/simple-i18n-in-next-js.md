---
title: 'How to build a multilingual website in Next.js'
date: '2019-09-03'
author: 'Filip Wojciechowski'
twitterProfile: 'https://twitter.com/filipcodes'
excerpt: "It used to be challenging to build multilingual websites in Next.js, but things have greatly improved with introduction of Next 9. In this blog post I'm sharing my ideas on how to implement multi-language support (with locale subpaths, etc.) in Next.js by taking advantage of the framework's newly introduced APIs, while trying to keep things as simple as possible."
coverImage: 'don-ross-iii-JuKbaozIo0k-unsplash.jpg'
coverImageCreditText: 'Photo by Don Ross III'
coverImageCreditUrl: 'https://unsplash.com/photos/JuKbaozIo0k'
tags: ['next.js', 'i18n', 'typescript']
---

## Introduction

The websites I build typically support more than one language. This affects how I think about building websites in general, from data modeling to implementing multiple language support on the frontend. Because full-blown internationalization solutions (like [react-intl](https://github.com/formatjs/react-intl) and others) tend to be way too much for my needs, I prefer to roll my own. While this is relatively easy to do in vanilla client-rendered React, it used to be somewhat difficult in Next.js because of SSR and the way Next used to implemented routing. Version 9 of Next.js, however, features a brand new implementation of [dynamic routing](https://nextjs.org/blog/next-9#dynamic-route-segments). This change makes it much easier to build multi-language websites and web apps in Next.

This post might be of interest to you if you are implementing support for multiple languages in a Next.js website or app. I'm going to discuss building the following features:

- locale subpaths
- server side rendering with no need for custom server
- simple automatic language detection
- ability to save/restore user language preferences
- translations

I'll be only using generic React and Next.js APIs, and in general I'll make an effort to keep things as idiomatic and simple as possible. If this sounds good to you -- read on!

## High-level overview

Your requirements might be different, but in my case the minimal set of features I need to build a multi-language website looks something like this:

1. URLs should be parameterized with a language code (i.e. locale subpaths).
2. The app needs to be able to read the locale from the URL (during SSR and client-side navigation).
3. The URL language parameter must be kept in sync with the app's internal state.
4. It must be possible to change the language.
5. The app should be able to set a language when it is accessed for the first time at a root (url-agnostic) URL (preferably by performing some sort of auto-detection with a fallback to the default setting).
6. The language selected by a user should be saved as their preference for future sessions.
7. The contents of the website/app should be translated/localized based on the current language setting.
8. The app's metadata should respect the selected language setting (for SEO purposes).

## Example application

I this blog post I'll walk through the code of the example website that implements the above-mentioned set of features. It [is deployed here](https://simple-i18n-example.fwojciec.now.sh/) if you'd like to take a look. It's a basic Next.js app, written in TypeScript, that comes in three language versions: English (default), Polish and French (I don't speak French, so please blame Google Translate for any errors). The repository with the source code [is here](https://github.com/fwojciec/simple-i18n-example) - it might be handy to reference it as context for the code snippets below.

When you access the root URL (`/`) of the example site for the first time the app will attempt to determine your browser's language setting, and if it matches one of the available locales, you will be redirected to the root locale subpath of the corresponding translation (for example `/fr`). On consecutive runs, the root URL will redirect to the translation used during your previous session. The website defaults to the English language (i.e. it redirects to `/en`) in case it finds no stored preference or a valid browser language setting.

You can switch language using the `<select>` input in the left top corner of the page. The contents of the website, including the `<title>` tag in the header, the URL, the server-side generated code, and the Wikipedia URL on the `/[lang]/artist` page will change based on the selected locale.

It's a straight-forward example, but it encompasses the basic functionality described in the prior section.

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

In my view locale subpaths are an **essential feature** of any multi-lingual website. The term is just a fancy way of saying that the current locale of the website is encoded in the URL of each page. For example, an English language version of the `/about-us` page might be available at `/en/about-us` while the Polish language variant of this page at `/pl/about-us`. The URL, therefore, becomes the app's **source of truth** about the current language setting. Furthermore, since the language setting of the website is it is publicly readable as a segment of the URL, locale subpaths are beneficial from the perspective of SEO. Thanks to locale subpaths we can inform search engines that our website supports multiple languages, making it possible for the language-specific pages to appear in the searches by users who prefer a particular language.

Next v9 introduced a new API which makes it possible to use dynamic parameters (slugs, ids or language iso codes) in file and directory names inside the app's `pages` directory. See [Next's documentation](https://nextjs.org/docs#dynamic-routing) for a detailed discussion of how this API works. This is what the `pages` directory looks like in our example website:

```
pages
├── [lang]					<- the dynamic route parameter is defined here
│   ├── artist.tsx
│   └── index.tsx
└── index.tsx				<- this page only redirects to a language-specific subpage
```

All pages inside the `[lang]` directory will receive the value of the URL segment corresponding to the position of the `[lang]` directory in the structure of the `pages` directory as a prop. The only page which does not receive the `lang` prop is the root `index.tsx` page. This is the only language-indifferent page of the example website. Let's have a closer look at what it does.

## Automatic language detection

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

Since the `useEffect` hook only runs on the client, the redirect will only happen on the client-side. This is by design, since the `getInitialLocale` function needs the `window` object to determine which language subpath to redirect to. Incidentally, since the `router` is only needed on the client, instead of wrapping the entire component with the `withRouter` HOC we can take advantage of the new `useRouter` hook provided by the framework -- the hook does nothing on the server, which is fine. The additional advantage of only using client-side logic on this page is that the page can be pre-rendered and served as a static HTML in production so the redirect will be virtually instantaneous. The redirect page returns no content except for a head `<meta>` tag instructing search engines not to index this page.

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
  return locales.some((locale) => locale === tested)
}
```

In the above implementation of the `getInitialLocale` function the `localSetting` or the `browserSetting` will only be respected if they match one of the locales defined in the app's configuration. Otherwise the function simply returns the default locale. This is a minimal implementation of automatic language detection, but it works just fine.

## withLocale higher order component

A higher order component (HOC) is a function that takes a component as its argument, enhances that component in some way (for example by injecting additional props or wrapping it in another component) before returning it. It's a popular pattern of code reuse in the Next.js community. All language-aware pages of the example application are wrapped with the `withLang` higher order component, like so:

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
  const WithLocale: NextPage<any, LangProps> = ({ locale, ...pageProps }) => {
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

  WithLocale.getInitialProps = async (ctx) => {
    // retrieve initial props of the wrapped component
    let pageProps = {}
    if (WrappedPage.getInitialProps) {
      pageProps = await WrappedPage.getInitialProps(ctx)
    }

    if (typeof ctx.query.lang !== 'string' || !isLocale(ctx.query.lang)) {
      // in case the value of 'lang' is not a valid locale return it as undefined
      return { ...pageProps, locale: undefined }
    }

    // the locale is valid
    return { ...pageProps, locale: ctx.query.lang }
  }

  // pretty display name for the debugger
  WithLocale.displayName = `withLang(${getDisplayName(WrappedPage)})`

  return WithLocale
}
```

The HOC takes the page it wraps (`WrappedPage`) as an argument and returns a new component, called `WithLocale` in the example. This new component defines the `getInitialProps` static method in order to retrieve the language setting during the server rendering phase. We need to know about the language setting already on the server because we want the server-generated HTML to use the correct translations, and to set the `<head>` of the page with the correct metadata (page title, description, or anything else you might need for SEO purposes). First, however, we attempt to run the `getInitialProps` method of the `WrappedPage` component, in case it defines one, and we pass any retrieved values (`pageProps`) to the `WithLocale` component so that they can be eventually passed back to the `WrappedPage`.

The context passed to the `getInitialProps` method of a Next page includes a `query` prop: an object that stores any query or dynamic route parameters container in the URL of the page. The `pages` directory of our example app defines a `lang` dynamic route parameter, so this is the parameter we need to retrieve from the context (`ctx.query.lang`).

Next.js defines the type of the router's `query` parameter as either a string or an array of strings (`string | string[]`). The array of strings would be returned if the parameter corresponds to a URL query parameter that holds multiple values; a dynamic route parameter, if defined, should always be a string. This is why we need to confirm that the `lang` parameter is, first of all, a `string` and secondly a valid locale (using the `isLocale` type guard, as discussed previously). If either of these two conditions is not met the locale is incorrectly defined we return it as `undefined`. If both conditions are met, we know that we have a correctly defined locale, and we can return it (as `locale`) to the `WithLocale` component for further processing.

The `WithLocale` component will render an error page in case the locale it receives from the `getInitialProps` method is `undefined`. Should this occur, it will likely mean that the url was something invalid like `/something-invalid/about-us`, so the app should respond with a 404 error. If the `locale` is defined and valid, the `WithLocale` component will render the `WrappedPage` (along with its original props) wrapped in a locale context provider set to the correct locale.

The `displayName` static method of the `WithLocale` component simply gives it a more useful name for debugging purposes (see [React Docs](https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging) for more information.)

## LocaleContext

React's context API is a way of storing and managing global state for a tree of React components. It therefore makes a lot of sense to use context to store and distribute the language setting once it has been read from the URL. You could also use something like Redux or Mobx if you prefer a different approach to global state management. The example app defines the `LocaleContext` in the following way:

```tsx
// context/LocaleContext.tsx

import React from 'react'
import { useRouter } from 'next/dist/client/router'
import { Locale, isLocale } from '../translations/types'

interface ContextProps {
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
}

export const LocaleContext = React.createContext<ContextProps>({
  locale: 'en',
  setLocale: () => null,
})

export const LocaleProvider: React.FC<{ lang: Locale }> = ({
  lang,
  children,
}) => {
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
    if (
      typeof query.lang === 'string' &&
      isLocale(query.lang) &&
      locale !== query.lang
    ) {
      setLocale(query.lang)
    }
  }, [query.lang, locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
```

The context makes use of the `useState` hook to store and expose the value of the currently selected locale along with the `setLocale` function that changes it. The context will generally be initialized in the `LocaleProvider` component, but React expects the context to be created with default values, so we use the English language as the default locale and a no-op function as the locale setter.

The `LocaleProvider` is a functional React component that has two side-effects defined in the two respective `useEffect` hooks. The first one stores the user's language preference in `localStorage` when locale is first defined and on each subsequent change. The second one checks the value of the locale URL parameter on every client-side route change and synchronizes the context state with the locale embedded in the URL. The `withLocale` HOC, discussed in the previous section, takes care of setting the initial state of the context during the server-rendering phase, but we also need to account for the possible locale changes that that happened during client-side navigation. The `LocaleProvider` component therefore checks the URL locale on every route change and updates its state accordingly.

## useTranslation hook

A multi-language website needs to store multiple translations of a given string - this can be done in many ways. The example application stores all translations in the `strings` file located in the `translations` folder as an object:

```typescript
// translations/strings.ts (excerpt)

const strings: Strings = {
  en: {
    about: 'About René Magritte',
    painting: 'The Painting',
    // (...)
  },
  fr: {
    about: 'Sur René Magritte',
    painting: 'La peinture',
    // (...)
  },
  pl: {
    about: 'O René Magritte',
    painting: 'Obraz',
    // (...)
  },
}
```

If your website is built on top of a CMS or just stores content in a database you'll likely have some sort of solution for storing translations in the database in addition to the locally stored translations of the interface.

To access the translations conveniently the example app defines the `useTranslation` custom hook:

```typescript
// hooks/useTranslation.ts

import { useContext } from 'react'
import { LocaleContext } from '../context/LocaleContext'
import strings from '../translations/strings'
import { defaultLocale } from '../translations/config'

export default function useTranslation() {
  const { locale } = useContext(LocaleContext)

  function t(key: string) {
    if (!strings[locale][key]) {
      console.warn(`Translation '${key}' for locale '${locale}' not found.`)
    }
    return strings[locale][key] || strings[defaultLocale][key] || ''
  }

  return {
    t,
    locale,
  }
}
```

The hook accesses the `LocaleContext` to retrieve the value of the currently set locale. It also defines a function `t` (for "translate") which returns the translation for a given `key` and the currently set `locale`. The hook returns the `t` function along with the current version of the `locale` - it sometimes happens that we need to access the value of the locale in the presentation components so we include it in the values the hook returns as a convenience.

## Using translations in components

Here's an example of a presentation component with translations and localized content:

```tsx
// components/Artist.tsx

import React from 'react'
import useTranslation from '../hooks/useTranslation'

const Artist: React.FC = () => {
  const { locale, t } = useTranslation()
  return (
    <div>
      <h1>René Magritte</h1>
      <img src="/static/img/magritte.jpg" alt="Rene Magritte" />
      <p>{t('bio')}</p>
      <a href={`http://${locale}.wikipedia.org/wiki/René_Magritte`}>
        {t('readMore')}
      </a>
    </div>
  )
}

export default Artist
```

We take advantage of the functionality provided by the `useTranslation` hook described in the previous section. If there are strings that need to be translated according to the currently set locale we use the `t` function along with the keys defined in the strings object that holds our translations.

We can also use the value of the `locale`, also returned by the `useTranslation` hook, to "localize" the content for the particular language. In the example above we just customize the `href` value of the Wikipedia link to point to a language specific page there but you could just as easily include or exclude content based on the value of the locale variable, etc.

## Translating page metadata

The same strategy described above in the context of translating presentational components can be applied to translating page metadata for SEO purposes. The example application doesn't go into great detail regarding this, but it does translate the `title` of each page. This is implemented in the `Layout` component:

```tsx
// components/Layout.tsx

import React from 'react'
import Head from 'next/head'
import useTranslation from '../hooks/useTranslation'
import Navigation from './Navigation'

interface Props {
  titleKey: string
}

const Layout: React.FC<Props> = ({ titleKey, children }) => {
  const { t } = useTranslation()
  return (
    <>
      <Head>
        <title>{t(titleKey)}</title>
      </Head>
      <Navigation />
      <>{children}</>
    </>
  )
}

export default Layout
```

The `Layout` component requires the `titleKey` prop, a reference to the correct value from the translation strings object. It wraps each page, so the metadata is page-specific:

```tsx
// pages/[lang]/artist.tsx

import React from 'react'
import Layout from '../../components/Layout'
import Artist from '../../components/Artist'
import withLocale from '../../hocs/withLocale'

const ArtistPage: React.FC = () => {
  return (
    <Layout titleKey="about">
      <Artist />
    </Layout>
  )
}

export default withLocale(ArtistPage)
```

In addition to `<title>` you can of course define translated `<description>` and any other meta tags your website requires for SEO purposes (keywords, alternate links, og properties, etc.)

## Locale-aware navigation

The implementation of the example website relies on Next's dynamic routing to manage language-related state of the website. This needs to be respected when we navigate from page to page, or in other words, whenever we use Next's `Link`component. The implementation of the `Navigation` component from the example website provides a useful illustration:

```tsx
// components/Navigation.tsx

import React from 'react'
import Link from 'next/link'
import useTranslation from '../hooks/useTranslation'
import LocaleSwitcher from './LocaleSwitcher'

const Navigation = () => {
  const { locale, t } = useTranslation()
  return (
    <ul className="root">
      <li>
        <LocaleSwitcher />
      </li>
      <li>
        <Link href="/[lang]" as={`/${locale}`}>
          <a>{t('painting')}</a>
        </Link>
      </li>
      <li>
        <Link href="/[lang]/artist" as={`/${locale}/artist`}>
          <a>{t('artist')}</a>
        </Link>
      </li>
    </ul>
  )
}

export default Navigation
```

The principles of using the `Link` component to navigate to pages that use Next's dynamic routing are described in [Next.js Documentation](https://nextjs.org/docs#dynamic-routing). The `href` prop references the page inside the `pages` directory (and corresponds to the `pathname` prop of Next's router) and the `as` prop should be the same as the actual URL in the browser. In the example above the first `Link` navigates to the language-specific root page of the website, and the second link to the language-specific "artist" subpage. We also take advantage of the `t` function to translate the text of the respective links.

## LocaleSwitcher

Last but not least, a multi-language website must provide a way to switch the selected language. Here's the implementation of this functionality from the example website:

```tsx
// components/LocaleSwitcher.tsx

import React from 'react'
import { useRouter } from 'next/dist/client/router'
import { locales, languageNames } from '../translations/config'
import { LocaleContext } from '../context/LocaleContext'

const LocaleSwitcher: React.FC = () => {
  const router = useRouter()
  const { locale } = React.useContext(LocaleContext)

  const handleLocaleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const regex = new RegExp(`^/(${locales.join('|')})`)
      router.push(
        router.pathname,
        router.asPath.replace(regex, `/${e.target.value}`)
      )
    },
    [router]
  )

  return (
    <select value={locale} onChange={handleLocaleChange}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {languageNames[locale]}
        </option>
      ))}
    </select>
  )
}

export default LocaleSwitcher
```

The `LanguageSwitcher` is a `<select>` input which lists the possible locales as `options`. To display the name of the language we use the `languageNames` object from the configuration, which is defined there for the sole reason of displaying the language name in this component.

The component uses three hooks: the `useRouter` hooks provided by Next.js so that we are able to navigate programmatically to a new URL on language change, the `useContext` hooks to access the current `locale` value, and the `useCallback` hook to define the callback function which will be used by the `onChange` prop of the `<select>` input.

The `useCallback` hook is just a slight optimization compared to defining the callback function inline, directly in the component: the inline function would have been re-initialized every time the component is rendered, which the `useCallback` hook only re-initializes the callback when the value of the `router` changes. I also find defining callbacks using the `useCallback` hook somewhat cleaner and easier to read in the context of the complete component.

The `push` method of Next's router acts very much like the `<Link />` component described in the previous section (in fact the `<Link />` uses this method under the hood to navigate between pages). The two arguments we pass to `push`, therefore, correspond to the `href` and `as` props of the `<Link />` component. When navigating to a different language version of the same page, the `href` (or `pathname`) value doesn't change, since we're still referencing the same file in the `pages` directory. What changes is the actual URL, so we need to transform the `as` (or `asPath`) value of the current route - we use a regular expression for this. The RegExp is dynamically generated based on how the locales are configured in the configuration. In the case of the example website the RegExp will end up defined like this: `/^\/(en|fr|pl)/`. We match a section of the `asPath` value that defines the current locale (for example `/en`) and replace it wit the value of the newly selected locale (for example `/pl`). The router does the rest.

## Conclusion

At the beginning of this post I have described a minimal list of features required to build a multi-language website. The subsequent sections described how these features are implemented in the example application. I hope this explanation can serve as basis (or reference) for your own implementations of similar functionality in your projects.

The above-described implementation is missing many features that can be found in the various internationalization frameworks/libraries available for the React ecosystem:

- string interpolation in translations;
- automatic localization of time/date format;
- dynamic loading of translations for a specific language (i.e. smaller bundle in case of websites with a lot of content and many translations);
- separation of translation files from the code of the application so that the team of translators can work independently of developers

You might need this functionality in your application, in which case the various frameworks are likely a better solution to custom code. In small to medium-sized projects, however, a custom implementation of internationalization-related functionality is a viable option. In my experience a custom implementation is often more performant, easier to understand and significantly less troublesome to test. YMMV.

If you have any questions about this (or suggestions for improvements/bug fixes) please DM me on Twitter or open an issue in the repo of the example application.

### Related resources

1. [Live demo of the example website](https://simple-i18n-example.fwojciec.now.sh)
2. [Repository with the code of the example website](https://github.com/fwojciec/simple-i18n-example)
3. [Dynamic Routing in Next Docs](https://nextjs.org/docs#dynamic-routing)
4. [Example of a more complex production website that uses a version of the above-described approach](https://graalagency.com/)
