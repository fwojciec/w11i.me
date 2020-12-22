import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="dark-theme">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
