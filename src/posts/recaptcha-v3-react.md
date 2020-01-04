---
title: 'Google ReCaptcha V3 in React, using TypeScript'
path: '/recaptcha-v3-react'
date: '2018-11-18'
author: 'Filip'
excerpt: "Google has recently released a new version of ReCaptcha. It no longer requires any end-user interaction, so it's arguably an improvement over the frequently annoying V2 version. This is a quick tutorial on how to use it in a React app."
coverImage: '../images/florian-klauer-147-unsplash.jpg'
coverImageCreditText: 'Photo by Florian Klauer'
coverImageCreditUrl: 'https://unsplash.com/photos/GG0jOrmwqtw'
tags: ['react', 'recaptcha', 'typescript']
---

Google has recently [released](https://webmasters.googleblog.com/2018/10/introducing-recaptcha-v3-new-way-to.html) a new version of ReCaptcha. It no longer requires any end-user interaction, so it's arguably an improvement over the frequently annoying V2 version. The world will be a better place with fewer blurry storefronts to identify and click on. Here's one way to implement ReCaptcha V3 in React.

Code examples in this post are written in TypeScript. The equivalent JavaScript code would have been shorter and simpler, but I prefer writing and thinking in TypeScript. I find TypeScript implementations to be more comprehensive, they are more explicit about how the code is supposed to work. Simply remove the typings and the `private` keyword if you're using JavaScript -- it all should work just as well.

This is just the client-side implementation, concerned with loading the script, rendering the widget and obtaining the token that can be sent to Google servers for validation.

## Types

Let's start by defining some types. The ReCaptcha script adds a `grecaptcha` property to the `window` object. We need to add its type to the global `Window` interface so that we can use it in our code.

We will be rendering the ReCaptcha widget explicitly, using an on-load callback function, which is expected to exist as a method defined on the `window` object before we begin loading the ReCaptcha script. We must therefore add the callback function's type to the `Window` interface as well, so that the TypeScript compiler is aware of it.

```typescript
declare global {
  interface Window {
    grecaptcha: ReCaptchaInstance
    captchaOnLoad: () => void
  }
}

interface ReCaptchaInstance {
  ready: (cb: () => any) => void
  execute: (options: ReCaptchaExecuteOptions) => Promise<string>
  render: (id: string, options: ReCaptchaRenderOptions) => any
}

interface ReCaptchaExecuteOptions {
  action: string
}

interface ReCaptchaRenderOptions {
  sitekey: string
  size: 'invisible'
}
```

The `ReCaptchaInstance` interface doesn't represent the full API of ReCaptcha V3 -- there's only limited documentation on the V3 API from Google at this stage -- but this approximation will serve as a sufficient starting point for our purposes.

One thing to note is the type of `size` property on the `ReCaptchaRenderOptions` interface: it's defined as 'invisible', a string literal. This is undocumented, but it appears that `size` has to be defined as 'invisible' when rendering the widget explicitly. This is one of the gotchas I've come across when figuring this out.

## Create the Grecaptcha component

This implementation uses the [render prop](https://reactjs.org/docs/render-props.html) or more specifically the [function as children](https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9) pattern. This is just one way of approaching the problem, of course. My goal was to end up with a reusable component that makes ReCaptcha functionality available for its descendants in the React component hierarchy and I prefer the render prop pattern to higher-order components. The component will provide the following two props to its children:

1. **`isReady`**: a boolean value indicating whether ReCaptcha has finished loading and is ready for use;
2. **`execute`**: a function which returns a Promise which resolves into a ReCaptcha token; the token, in turn, can be used to validate (or reject) an interaction on a website.

Here's skeleton of the component:

```typescript
interface Props {
  action: string
  children: (props: CaptchaProps) => React.ReactNode
}

interface CaptchaProps {
  isReady: boolean
  execute: () => Promise<string>
}

interface State {
  readonly isReady: boolean
}

class ReCaptcha extends React.PureComponent<Props, State> {
  state: State = {
    isReady: false
  }

  private script: HTMLScriptElement
  private widget: HTMLDivElement

  componentDidMount(): void {
    this.loadScript()
  }

  componentWillUnmount(): void {
    document.body.removeChild(this.widget)
    document.body.removeChild(this.script)
  }

  render(): React.ReactNode {
    return this.props.children({
      isReady: this.state.isReady,
      execute: this.executeCaptcha
    })
  }

  private loadScript = (): void => {}

  private onLoad = () => {}

  private executeCaptcha = (): Promise<string> => {}
}
```

When the component mounts it will first load the Google-provided script and then render the captcha widget. While the V3 ReCaptcha doesn't require any interaction from the user, it still renders a widget which indicates that that ReCaptcha is enabled and holds reference to its terms of use. Once the script is loaded and the widget is rendered, we set the value of `isReady` to `true` in the component's local state.

In addition to the methods, the component also defines two properties: `script` and `widget`. These properties will hold references to the script tag with the URL of the ReCaptcha code and the div into which the widget is rendered. When the component unmounts, we remove the widget from the DOM and then finish cleaning up by removing the script itself. This makes it possible to use ReCaptcha only in specified parts of our app, as we're able to load and unload it at will.

The `render` method is a straight-forward example of children as function pattern: it calls the children prop with an object holding references to the `isReady` variable and the `executeCaptcha` method, thus enabling their use by other components.

I will fill out the details of the currently empty methods in the upcoming sections.

## Loading the script on the page

Here are the details of our `loadScript` method, which is called when the component mounts:

```typescript
private loadScript = (): void => {
  // #1 define the onLoad callback
  window.captchaOnLoad = this.onLoad

  // #2 create the script element and...
  const url = 'https://www.google.com/recaptcha/api.js'
  const queryString = '?onload=captchaOnLoad&render=explicit'
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = url + queryString
  script.async = true
  script.defer = true

  // #3 add it to the DOM
  this.script = document.body.appendChild(script)
}
```

The loading process consists of three steps. Before we load the script we first define the function that will be called when the script is loaded (step #1). The callback function is defined as a method `captchaOnLoad` on the `window` object. The details of this method's implementation are discussed below.

In step #2 we define the script element. The `url` variable holds the base URL of the ReCaptcha resource while the `queryString` holds the options that enable us to control the rendering of the widget. The remaining code in this section should be self-explanatory.

Finally, in step #3, we add the script to the DOM. One thing to note is that in step #3 we also save the reference to the DOM node containing the script, in the class property `script`, so that we are able to easily remove it, when we're unmounting the component.

## The onLoad callback function

Rather than loading ReCaptcha on every page of our app (by including it in the base index.html template, for example) we want to be able to enable it only when required. The captcha script can be loaded with reference to an on-load callback that will give us control over the rendering of the widget. Here's what our callback function looks like:

```typescript
private onLoad = (): void => {
  // #1 create a wrapper div and add it to the DOM
  const widget = document.createElement('div')
  widget.id = 'g-recaptcha'
  this.widget = document.body.appendChild(widget)

  // #2 render the widget into the wrapper div
  window.grecaptcha.render('g-recaptcha', {
    sitekey: '** ENTER YOUR SITEKEY HERE **',
    size: 'invisible'
  })

  // #3 set the isReady flag to true when ready
  window.grecaptcha.ready(() => {
    this.setState({ isReady: true })
  })
}
```

In step #1 we create a `div` element, define its id and add it to the DOM. The 'g-recaptcha' is the default id for the widget wrapper div from the ReCaptcha official documentation.

In step #2 we execute the `render` method on the grecaptcha instance. This method takes two arguments, the id of the div into which the widget should be rendered and an object with the `sitekey` obtained from Google for a given domain and `size` defined as 'invisible'. Again, the size of the widget must be defined as 'invisible' for the explicit rendering to work. It seems a bit arbitrary, but it's required.

Finally, in step #3, we make use of the `ready` method on the grecaptcha instance to set our component's `state.isReady` value to `true`.

## Executing the captcha

This is the final method our component defines. Here is the code:

```typescript
private executeCaptcha = (): Promise<string> => {
  if (!this.state.isReady) {
    throw new Error('Captcha is not ready.')
  }

  return window.grecaptcha.execute({
    action: this.props.action
  })
}
```

There's not really a whole lot to discuss here as the implementation is very simple. An error is thrown in case the method is called before the captcha becomes ready. The implementation of the ReCaptcha component in a React app should take care to prevent the possibility of calling this method before the script is loaded and the widget is rendered to the page -- this is why the component also exposes the `isReady` prop.

The `execute` method on the grecaptcha instance, and therefore also the `executeCaptcha` method the component defines, returns a Promise, something we have to remember when using it in other components.

## Putting it all together

I have created a simple example app that implements ReCaptcha V3 using the approach described in this post and that demos the functionality of such an implementation: you'll find it below, thanks to the awesome CodeSandbox:

<iframe src="https://codesandbox.io/embed/0m5omor41n?hidenavigation=1" style="width:100%; height:400px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

Clicking on `Mount` will mount the component, clicking `Unmount` will unmount it, which simulates adding and removing ReCaptcha from the page.

The `Generate Token` button remains disabled until the component becomes ready, an example of how we might use the `isReady` prop to prevent activating the captcha code before the widget is ready.

Functionality of the `Generate Token` button will not come as a surprise. A new token will be generated each time the button is clicked. It is not necessary to reset the widget between the activations.

Again, this is just the basic client-side implementation, an example of how one might go about loading the ReCaptcha script, rendering the widget and executing the captcha to obtain a token in a context of a React app. In real life we'd also need a server-side implementation that makes the API request to the Google captcha verification server and obtains the score for the given action. Discussion of the server-side implementation is beyond the scope of this post, but I'll try to write separate post about it soon.

### Additional Resources

1. [Google ReCaptcha V3 Docs](https://developers.google.com/recaptcha/docs/v3)
2. [ReCaptcha discussion group](https://groups.google.com/forum/#!forum/recaptcha)
3. [Example implementation on CodeSandbox](https://codesandbox.io/s/0m5omor41n)
