import {
  ReqoreContent,
  ReqoreLayoutContent,
  ReqoreUIProvider,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import { IReqoreOptions } from '@qoretechnologies/reqore/dist/containers/UIProvider';
import { initializeReqraft } from '@qoretechnologies/reqraft';
import { Preview } from '@storybook/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  createMemoryRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { InitialContext } from '../src/context/init';
import {
  defaultReqoreOptions,
  defaultReqoreTheme,
} from '../src/constants/util';

const StorybookWrapper = ({ context, Story }: any) => {
  const confirmAction = useReqoreProperty('confirmAction');

  // @ts-ignore
  React.useEffect(() => {
    if (context.args.isFullIDE) {
      // @ts-ignore
      window._useWebsocketsInStorybook = true;
    } else {
      // @ts-ignore
      window._useWebsocketsInStorybook = false;
    }
  }, [context.args.isFullIDE]);

  return (
    <ReqoreLayoutContent>
      <ReqoreContent
        style={{ padding: '20px', display: 'flex', flexFlow: 'column' }}
      >
        <DndProvider backend={HTML5Backend}>
          <InitialContext.Provider
            value={{
              qorus_instance: context.args.qorus_instance,
              is_hosted_instance: true,
              confirmAction,
              saveDraft: () => {},
              maybeApplyDraft: () => {},
              changeTab: () => {},
              ...context?.args?.initialData,
            }}
          >
            <Story />
          </InitialContext.Provider>
        </DndProvider>
      </ReqoreContent>
    </ReqoreLayoutContent>
  );
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    chromatic: {
      viewports: [1440],
      pauseAnimationAtEnd: true,
    },
  },
  args: {
    qorus_instance: {
      url: 'https://hq.qoretechnologies.com:8092/',
    },
    reqoreOptions: {
      animations: {
        dialogs: false,
      },
    } as IReqoreOptions,
  },
  decorators: [
    (Story, context) => {
      const router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path='/:tab?/:subtab?/:id?'
            element={<StorybookWrapper context={context} Story={Story} />}
          />
        )
      );

      const Reqraft = initializeReqraft({
        instance: 'https://hq.qoretechnologies.com:8092/',
        instanceToken: process.env.REACT_APP_QORUS_TOKEN,
      });

      return (
        <ReqoreUIProvider
          options={{ ...defaultReqoreOptions, ...context.args.reqoreOptions }}
          theme={defaultReqoreTheme}
        >
          <Reqraft appName='ide' waitForStorage={false}>
            <RouterProvider router={router} />
          </Reqraft>
        </ReqoreUIProvider>
      );
    },
  ],
};

export default preview;
