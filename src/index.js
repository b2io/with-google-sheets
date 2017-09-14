// @flow
import { Component } from 'react';
import { createEagerFactory, setDisplayName, wrapDisplayName } from 'recompose';

const signIn = () => global.gapi.auth2.getAuthInstance().signIn();
const defaultMapValuesToProps = values => ({ values });

const defaultConfig = {
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
};

type Params = {
  sheetId: ?string,
};

type State = {
  authorizing: boolean,
  initializing: boolean,
  loading: boolean,
  mappedProps: Object,
};

const withGoogleSheets = (
  { sheetId, ...config }: Params,
  ranges: Array<string>,
  mapValuesToProps: Function = defaultMapValuesToProps,
) => (BaseComponent: Function) => {
  const factory = createEagerFactory(BaseComponent);

  class WithGoogleSheets extends Component<{}, State> {
    state = {
      authorizing: false,
      initializing: true,
      loading: false,
      mappedProps: {},
    };

    componentDidMount() {
      global.gapi.load('client:auth2', this.handleLoad);
    }

    handleLoad = () => {
      global.gapi.client.init({ ...defaultConfig, ...config }).then(() => {
        const GoogleAuth = global.gapi.auth2.getAuthInstance();

        GoogleAuth.isSignedIn.listen(this.handleAuth);
        this.handleAuth(GoogleAuth.isSignedIn.get());
      });
    };

    handleAuth = (isAuthorized: boolean) => {
      if (isAuthorized) {
        global.gapi.client.sheets.spreadsheets.values
          .batchGet({ ranges, spreadsheetId: sheetId })
          .then(response => {
            const values = response.result.valueRanges.map(r => r.values);
            const mappedProps = mapValuesToProps(values, ranges, this.props);

            this.setState({ mappedProps, loading: false });
          });
      }

      this.setState({
        authorizing: !isAuthorized,
        initializing: false,
        loading: isAuthorized,
      });
    };

    render() {
      const { mappedProps, ...otherState } = this.state;

      return factory({
        ...this.props,
        ...otherState,
        ...mappedProps,
        onSignIn: signIn,
      });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return setDisplayName(wrapDisplayName(BaseComponent, 'withGoogleSheets'))(
      WithGoogleSheets,
    );
  }

  return WithGoogleSheets;
};

export default withGoogleSheets;
