import { ReqoreUIProvider } from '@qoretechnologies/reqore';
import { IReqoreUIProviderProps } from '@qoretechnologies/reqore/dist/containers/UIProvider';
import { darken, lighten } from 'polished';
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

export const ReqoreWrapper = ({
  reqoreOptions,
}: {
  reqoreOptions?: IReqoreUIProviderProps['options'];
}) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'vscode'>('vscode');

  return (
    <ReqoreUIProvider
      theme={{
        main: theme === 'light' ? '#ffffff' : '#222222',
        intents: { success: '#4a7110' },
        breadcrumbs: {
          main:
            theme === 'light'
              ? darken(0.1, '#ffffff')
              : lighten(0.1, '#222222'),
        },
        sidebar: theme === 'light' ? { main: '#333333' } : undefined,
        header: theme === 'light' ? { main: '#333333' } : undefined,
      }}
      options={{
        animations: { buttons: false },
        withSidebar: true,
        closePopoversOnEscPress: true,
        ...reqoreOptions,
      }}
    >
      <AppContainer theme={theme} setTheme={setTheme} />
    </ReqoreUIProvider>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/:tab?/:subtab?/:id?' element={<ReqoreWrapper />} />
  )
);

root.render(
  <DndProvider backend={HTML5Backend}>
    <GlobalStyle />
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </DndProvider>
);
