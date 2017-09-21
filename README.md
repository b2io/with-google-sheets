# with-google-sheets

> A higher-order component to retrieve data from Google Sheets.

[![build status](https://img.shields.io/travis/b2io/with-google-sheets.svg?style=flat-square)](https://travis-ci.org/b2io/with-google-sheets)
[![coverage](https://img.shields.io/codecov/c/github/b2io/with-google-sheets.svg?style=flat-square)](https://codecov.io/github/b2io/with-google-sheets)
[![code climate](https://img.shields.io/codeclimate/github/b2io/with-google-sheets.svg?style=flat-square)](https://codeclimate.com/github/b2io/with-google-sheets)
[![npm version](https://img.shields.io/npm/v/with-google-sheets.svg?style=flat-square)](https://www.npmjs.com/package/with-google-sheets)
[![npm downloads](https://img.shields.io/npm/dm/with-google-sheets.svg?style=flat-square)](https://www.npmjs.com/package/with-google-sheets)

## Usage

### `withGoogleSheets()`

```js
withGoogleSheets(
  config: {
    apiKey: string,
    sheetId: string,
    clientId: ?string,
    discoveryDocs: ?Array<string>,
    scope: ?string
  },
  ranges: Array<string>,
  mapValuesToProps: ?(values: Array<Array<string>>) => Object,
): HigherOrderComponent
```

Given the `config` and `ranges` (and optional `mapValuesToProps`), the returned higher-order component will fetch the requested ranges from the configured Google Sheet.

With the exception of `sheetId`, all properties in the `config` parameter are sent to [`gapi.client.init(args)`](https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiclientinitargs). The default values for the `config` parameter are:

```js
{
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
}
```

The resulting higher-order component will use the [`batchGet()`](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchGet) method to request all the `ranges` at once.

Once the values in the given `ranges` are retrieved, they will be passed into the `mapValuesToProps`. By default the higher-order component will store the retrieved values under the `values` prop.

In addition to the props created by the `mapValuesToProps` parameter, the resulting higher-order component will pass along several other props:

```js
{
  authorizing: boolean,
  initializing: boolean,
  loading: boolean,
}
```

The `authorizing`, `initializing`, and `loading` props represent the state of the underlying Google Sheets API request.

Usage example:

```js
import React from 'react';
import { branch, compose, renderComponent } from 'recompose';
import withGoogleSheets from 'with-google-sheets';

const withAnimals = withGoogleSheets(
  {
    apiKey: 'my-api-key',
    clientId: 'my-client-id',
    sheetId: 'my-sheet-id',
  },
  ["'Animals'!A2:B"],
  ([animals]) => ({
    items: animals.map(([name, description], index) => ({
      description,
      name,
      id: index,
    })),
  }),
);

const withLoadingIndicator = branch(
  props => props.initializing || props.loading,
  renderComponent(() => <span>Loading...</span>),
);

const withSignInButton = branch(
  props => props.authorizing,
  renderComponent(({ onSignIn }) => (
    <button onClick={onSignIn}>Sign In</button>
  )),
);

const List = ({ items }) => (
  <ul>
    {items.map(({ description, id, name }) => (
      <li key={id}>
        <h3>{name}</h3>
        <p>{description}</p>
      </li>
    ))}
  </ul>
);

export default compose(
  withAnimals,
  withLoadingIndicator,
  withSignInButton,
)(List);
```

## Installation

The `with-google-sheets` package is available on [npm](https://www.npmjs.com/):

```
npm install with-google-sheets --save
```

Ensure that the Google API client is available in the `global` namespace. For example, via a script tag:

```html
<script src="https://apis.google.com/js/api.js"></script>
```

## See Also

- [Google Sheets API](https://developers.google.com/sheets/api/quickstart/js)
- [React](https://github.com/facebook/react)
- [recompose](https://github.com/acdlite/recompose)

## License

MIT
