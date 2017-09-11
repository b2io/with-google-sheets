import { mount } from 'enzyme';
import { last } from 'lodash/fp';
import React from 'react';
import withGoogleSheets from '../';
import mockGapi, { GAPI_STATES } from './mockGapi';

const NODE_ENV = process.env.NODE_ENV;

describe('withGoogleSheets', () => {
  test('should set the displayName', () => {
    const Sink = () => null;
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);

    expect(WrappedComponent.displayName).toBe('withGoogleSheets(Sink)');
  });

  test('should not wrap in production', () => {
    process.env.NODE_ENV = 'production';

    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(() => null);

    expect(WrappedComponent.displayName).toBe(undefined);

    process.env.NODE_ENV = NODE_ENV;
  });

  test('should send initial props', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);
    const gapiReady = mockGapi();

    mount(<WrappedComponent />);
    await gapiReady;

    const [props] = last(Sink.mock.calls);
    expect(props).toEqual({
      authorizing: false,
      initializing: true,
      loading: false,
      onSignIn: expect.any(Function),
    });
  });

  test('should load the Google API', async () => {
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(() => null);
    const gapiReady = mockGapi();

    const wrapper = mount(<WrappedComponent />);
    await gapiReady;

    expect(global.gapi.load).toHaveBeenCalledWith(
      'client:auth2',
      wrapper.instance().handleLoad,
    );
  });

  test('should init the Google API after LOAD', async () => {
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(() => null);
    const gapiReady = mockGapi(GAPI_STATES.LOAD);

    mount(<WrappedComponent />);
    await gapiReady;

    expect(global.gapi.client.init).toHaveBeenCalledWith({
      apiKey: 'fake-apikey',
      discoveryDocs: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
      ],
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    });
  });

  test('should send updated props after INIT', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);
    const gapiReady = mockGapi(GAPI_STATES.INIT);

    mount(<WrappedComponent />);
    await gapiReady;

    const [props] = last(Sink.mock.calls);
    expect(props).toEqual({
      authorizing: true,
      initializing: false,
      loading: false,
      onSignIn: expect.any(Function),
    });
  });

  test('should provide an onSignIn callback after INIT', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);
    const gapiReady = mockGapi(GAPI_STATES.INIT);

    mount(<WrappedComponent />);
    await gapiReady;
    const [{ onSignIn }] = last(Sink.mock.calls);
    onSignIn();

    expect(global.gapi.auth2.getAuthInstance().signIn).toHaveBeenCalled();
  });

  test('should send updated props after AUTH', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);
    const gapiReady = mockGapi(GAPI_STATES.AUTH);

    mount(<WrappedComponent />);
    await gapiReady;

    const [props] = last(Sink.mock.calls);
    expect(props).toEqual({
      authorizing: false,
      initializing: false,
      loading: true,
      onSignIn: expect.any(Function),
    });
  });

  test('should send updated props after RESPOND', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(Sink);
    const values = [['One', 1], ['Two', 2], ['Three', 3]];
    const gapiReady = mockGapi(GAPI_STATES.RESPOND, values);

    mount(<WrappedComponent />);
    await gapiReady;

    const [props] = last(Sink.mock.calls);
    expect(props).toEqual({
      values,
      authorizing: false,
      initializing: false,
      loading: false,
      onSignIn: expect.any(Function),
    });
  });

  test('should send mapped props after RESPOND', async () => {
    const Sink = jest.fn(() => null);
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
      values => ({ data: values }),
    )(Sink);
    const values = [['One', 1], ['Two', 2], ['Three', 3]];
    const gapiReady = mockGapi(GAPI_STATES.RESPOND, values);

    mount(<WrappedComponent />);
    await gapiReady;

    const [props] = last(Sink.mock.calls);
    expect(props).toEqual({
      authorizing: false,
      data: values,
      initializing: false,
      loading: false,
      onSignIn: expect.any(Function),
    });
  });

  test('should batchGet the Google API', async () => {
    const WrappedComponent = withGoogleSheets(
      { apiKey: 'fake-apikey', sheetId: 'fake-sheetid' },
      ['"Data"!A2:B'],
    )(() => null);
    const gapiReady = mockGapi(GAPI_STATES.RESPOND);

    mount(<WrappedComponent />);
    await gapiReady;

    expect(
      global.gapi.client.sheets.spreadsheets.values.batchGet,
    ).toHaveBeenCalledWith({
      ranges: ['"Data"!A2:B'],
      spreadsheetId: 'fake-sheetid',
    });
  });
});
