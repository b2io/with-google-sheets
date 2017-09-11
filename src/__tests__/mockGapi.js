const GAPI_STATES = {
  AUTH: 0b0111,
  INIT: 0b0011,
  LOAD: 0b0001,
  RESPOND: 0b1111,
  VOID: 0b0000,
};

const mockGapi = (state = GAPI_STATES.VOID, values = []) => {
  /* eslint-disable no-bitwise */
  const willLoad = Boolean(state & 0b0001);
  const willInit = Boolean(state & 0b0010);
  const willAuth = Boolean(state & 0b0100);
  const willRespond = Boolean(state & 0b1000);
  /* eslint-enable no-bitwise */

  const batchGetPromise = willRespond
    ? Promise.resolve({
        result: { valueRanges: values.map(v => ({ values: v })) },
      })
    : new Promise(() => {});
  const initPromise = willInit ? Promise.resolve() : new Promise(() => {});

  const authInstance = {
    isSignedIn: {
      get: jest.fn(() => willAuth),
      listen: jest.fn(cb => cb(willAuth)),
    },
    signIn: jest.fn(() => {}),
  };

  const gapi = {
    auth2: {
      getAuthInstance: jest.fn(() => authInstance),
    },
    client: {
      init: jest.fn(() => initPromise),
      sheets: {
        spreadsheets: {
          values: {
            batchGet: jest.fn(() => batchGetPromise),
          },
        },
      },
    },
    load: jest.fn(willLoad ? (modules, cb) => cb() : () => {}),
  };

  global.gapi = gapi;

  if (willRespond) {
    return Promise.all([initPromise, batchGetPromise]);
  } else if (willInit) {
    return initPromise;
  }

  return Promise.resolve();
};

export { mockGapi as default, GAPI_STATES };
