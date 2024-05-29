import { ReqoreUIProvider } from '@qoretechnologies/reqore';
import { IReqoreUIProviderProps } from '@qoretechnologies/reqore/dist/containers/UIProvider';
import { initializeReqraft } from '@qoretechnologies/reqraft';
import * as Sentry from '@sentry/browser';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { createStore } from 'redux';
import { createGlobalStyle } from 'styled-components';
import AppContainer from './App';
import reducer from './reducers';
import { defaultReqoreTheme, defaultReqoreOptions } from './constants/util';

Sentry.init({
  dsn: 'https://1228ced0a5ab4f4a9604bf4aa58f2fb9@app.glitchtip.com/6336',
  _experiments: {
    showReportDialog: true,
  },
});

require('./fonts/NeoLight.ttf');

const store = createStore(reducer);

const root = createRoot(document.getElementById('root'));

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    padding: 0;
    margin: 0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .reqore-tree, .reqore-tree-textarea {
    height: 100%;
  }

  .color-picker {
    background-color: transparent !important;
  }
`;

const Reqraft = initializeReqraft({
  instance: 'https://hq.qoretechnologies.com:8092/',
  instanceToken: process.env.REACT_APP_QORUS_TOKEN,
});

export const ReqoreWrapper = ({
  reqoreOptions,
}: {
  reqoreOptions?: IReqoreUIProviderProps['options'];
}) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'vscode'>('vscode');

  return (
    <ReqoreUIProvider
      theme={defaultReqoreTheme}
      options={{ ...defaultReqoreOptions, ...reqoreOptions }}
    >
      <Reqraft appName='ide'>
        <AppContainer theme={theme} setTheme={setTheme} />
      </Reqraft>
    </ReqoreUIProvider>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/:tab?/:subtab?/:id?' element={<ReqoreWrapper />} />
  ),
  {
    basename: process.env.NODE_ENV === 'production' ? '/ide' : undefined,
  }
);

root.render(
  <DndProvider backend={HTML5Backend}>
    <GlobalStyle />
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </DndProvider>
);
