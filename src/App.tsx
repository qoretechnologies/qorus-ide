import {
  ReqoreBreadcrumbs,
  ReqoreControlGroup,
  ReqoreIcon,
  ReqoreMessage,
  ReqoreModal,
  useReqore,
} from '@qoretechnologies/reqore';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import last from 'lodash/last';
import size from 'lodash/size';
import {
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { connect } from 'react-redux';
import { useEffectOnce, useMount, useUnmount } from 'react-use';
import compose from 'recompose/compose';
import ContextMenu from './components/ContextMenu';
import Loader from './components/Loader';
import { Sidebar } from './components/Sidebar';
import { viewsIcons, viewsNames } from './constants/interfaces';
import { Messages } from './constants/messages';
import InterfaceCreator from './containers/InterfaceCreator';
import { InterfacesView } from './containers/InterfacesView';
import { ContextMenuContext, IContextMenu } from './context/contextMenu';
import { DialogsContext } from './context/dialogs';
import { InitialContext } from './context/init';
import { TextContext } from './context/text';
import withErrors from './hocomponents/withErrors';
import withFields from './hocomponents/withFields';
import withFunctions from './hocomponents/withFunctions';
import withGlobalOptions from './hocomponents/withGlobalOptions';
import withInitialData from './hocomponents/withInitialData';
import withMapper from './hocomponents/withMapper';
import {
  TMessageListener,
  TPostMessage,
  WS_RECONNECT_MAX_TRIES,
  addMessageListener,
  createOrGetWebSocket,
  disconnectWebSocket,
  isWebSocketSupported,
  postMessage,
} from './hocomponents/withMessageHandler';
import withMethods from './hocomponents/withMethods';
import withSteps from './hocomponents/withSteps';

import { LoginContainer } from './login/Login';
import ProjectConfig from './project_config/ProjectConfig';
import SourceDirectories from './project_config/sourceDirs';
import { DraftsProvider } from './providers/Drafts';
import { InterfacesProvider } from './providers/Interfaces';
import { URLHandler } from './providers/URLHandler';
import { ReleasePackageContainer as ReleasePackage } from './release_package/ReleasePackage';
import { Topbar } from './Topbar';
import { Dashboard } from './views/dashboard';

export interface IApp {
  addMessageListener: TMessageListener;
  postMessage: TPostMessage;
  tab: string;
  project_folder: string;
  qorus_instance: any;
  login_visible: boolean;
  changeTab: (activeTab: string, subTab?: string) => void;
  openLogin: () => void;
  closeLogin: () => void;
  setActiveInstance: (inst: string) => void;
  setCurrentProjectFolder: (folder: string) => void;
  path: string;
  main_color: string;
}

export type TTranslator = (id: string) => string;

const App: FunctionComponent<IApp> = ({
  closeLogin,
  setActiveInstance,
  setCurrentProjectFolder,
  tab,
  subtab,
  project_folder,
  qorus_instance,
  changeTab,
  main_color,
  path,
  theme,
  setTheme,
  image_path,
  confirmDialog,
  setConfirmDialog,
  setInterfaceId,
  setMethodsFromDraft,
  setFunctionsFromDraft,
  setMapperFromDraft,
  setSelectedFields,
  draftData,
  setDraftData,
  setStepsFromDraft,
  setFieldsFromDraft,
  is_hosted_instance,
  ...rest
}) => {
  const [openedDialogs, setOpenedDialogs] = useState<
    { id: string; onClose: () => void }[]
  >([]);
  const [contextMenu, setContextMenu] = useState<IContextMenu>(null);
  const [isDirsDialogOpen, setIsDirsDialogOpen] = useState<boolean>(false);
  const { addNotification } = useReqore();
  const { t, tabHistory, onHistoryBackClick } = useContext(InitialContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [websocketReconnectTry, setWebsocketReconnectTry] = useState<number>(0);
  const [hasWebsocketFailedToReconnect, setHasWebsocketFailedToReconnect] =
    useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const addDialog: (id: string, onClose: any) => void = (id, onClose) => {
    // Only add dialogs that can be closed
    if (onClose) {
      setOpenedDialogs((current) => [
        ...current,
        {
          id,
          onClose,
        },
      ]);
    }
  };

  const removeDialog: (id: string) => void = (id) => {
    setOpenedDialogs((current) => {
      const newDialogs = [...current];

      return newDialogs.filter((dialog) => dialog.id !== id);
    });
  };

  useEffect(() => {
    // Check if there are any opened dialogs
    if (size(openedDialogs)) {
      // Add the event on `ESC` key that will close the last opened dialog
      document.addEventListener('keyup', handleEscapeKeyEvent);
    } else {
      document.removeEventListener('keyup', handleEscapeKeyEvent);
    }

    return () => {
      document.removeEventListener('keyup', handleEscapeKeyEvent);
    };
  }, [openedDialogs]);

  const handleEscapeKeyEvent = (event: KeyboardEvent) => {
    // If the escape was pressed
    if (event.key === 'Escape') {
      // Get the last opened dialog
      const dialogData = last(openedDialogs);
      // Run the close function
      dialogData?.onClose();
    }
  };

  useEffectOnce(() => {
    const listeners: any = [];
    // Close login
    listeners.push(
      addMessageListener(Messages.CLOSE_LOGIN, (data: any): void => {
        if (data.qorus_instance) {
          setActiveInstance(data.qorus_instance);
        }
      })
    );
    // Set project folder
    listeners.push(
      addMessageListener(Messages.SET_PROJECT_FOLDER, (data: any): void => {
        setCurrentProjectFolder(data.folder);
      })
    );
    // Set instance
    listeners.push(
      addMessageListener(
        Messages.SET_QORUS_INSTANCE,
        ({ qorus_instance }): void => {
          setActiveInstance(qorus_instance);
        }
      )
    );
    listeners.push(
      addMessageListener('display-notifications', ({ data }) => {
        if (data.length) {
          data.forEach(({ message, intent, timeout }) => {
            addNotification({
              content: message,
              intent,
              duration: timeout,
            });
          });
        }
      })
    );
    // Get the current project folder
    postMessage(Messages.GET_PROJECT_FOLDER);

    return () => {
      // remove all listeners
      listeners.forEach((l) => l());
    };
  });

  const changeTheme = (theme: string) => {
    setTheme(theme);
    postMessage(Messages.CONFIG_UPDATE_CUSTOM_DATA, {
      data: {
        theme,
      },
    });
  };

  const badges: IReqorePanelProps['badge'] = useMemo(() => {
    let badge: IReqorePanelProps['badge'] = [];

    return badge;
  }, []);

  useMount(() => {
    if (isWebSocketSupported && is_hosted_instance) {
      createOrGetWebSocket(qorus_instance, 'creator', {
        onOpen: () => {
          setWebsocketReconnectTry(0);
          setHasWebsocketFailedToReconnect(false);

          postMessage(
            'subscribe',
            { args: { matchEvents: ['FSM_EXEC_START', 'FSM_EXEC_RESULT'] } },
            true
          );

          setIsLoading(false);
        },
        onClose: () => {
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
        onReconnecting: (reconnectNumber) => {
          setWebsocketReconnectTry(reconnectNumber);
        },
        onReconnectFailed: () => {
          setWebsocketReconnectTry(0);
          setHasWebsocketFailedToReconnect(true);
        },
      });
    } else {
      console.error('Websockets Not Supported');
      setIsLoading(false);
    }
  });

  useUnmount(() => {
    disconnectWebSocket('creator');
  });

  if (!t || isLoading) {
    return (
      <>
        <Loader text='Loading app...' centered />
      </>
    );
  }

  return (
    <>
      <InterfacesProvider>
        <DraftsProvider>
          <URLHandler />
          <ContextMenuContext.Provider
            value={{
              addMenu: setContextMenu,
              removeMenu: (onClose?: () => any) => {
                setContextMenu(null);
                if (onClose) {
                  onClose();
                }
              },
            }}
          >
            <DialogsContext.Provider value={{ addDialog, removeDialog }}>
              {contextMenu && (
                <ContextMenu
                  {...contextMenu}
                  onClick={() => setContextMenu(null)}
                />
              )}
              <TextContext.Provider value={t}>
                <div
                  style={{
                    margin: '0',
                    overflow: 'hidden',
                    display: 'flex',
                    flex: 1,
                    flexFlow: 'column',
                    height: '100%',
                  }}
                >
                  <Topbar />
                  <div
                    style={{
                      display: 'flex',
                      flex: '1 1 auto',
                      overflow: 'auto',
                    }}
                  >
                    <Sidebar />
                    <div
                      style={{
                        margin: '0',
                        overflow: 'hidden',
                        display: 'flex',
                        flex: 1,
                        flexFlow: 'column',
                        height: '100%',
                      }}
                    >
                      {tab !== 'CreateInterface' &&
                      tab !== 'Dashboard' &&
                      tab !== 'Login' &&
                      tab !== 'ProjectConfig' &&
                      tab !== 'Loading' ? (
                        <ReqoreBreadcrumbs
                          size='normal'
                          flat
                          style={{
                            border: 'none',
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            margin: 0,
                          }}
                          items={[
                            {
                              icon: 'Home4Fill',
                              onClick: () => {
                                changeTab(
                                  is_hosted_instance
                                    ? 'Dashboard'
                                    : 'ProjectConfig'
                                );
                              },
                            },
                            {
                              icon: viewsIcons[tab],
                              label: viewsNames[tab],
                              onClick: () => {
                                changeTab(
                                  'Interfaces',
                                  tab !== 'Interfaces' ? tab : undefined
                                );
                              },
                            },
                          ]}
                        />
                      ) : null}
                      <>
                        {websocketReconnectTry > 0 ? (
                          <ReqoreModal
                            transparent
                            blur={10}
                            position='top'
                            isOpen
                            flat
                            width='500px'
                            padded={false}
                            style={{ top: '15%' }}
                          >
                            <ReqoreMessage
                              opaque={false}
                              intent='warning'
                              duration={5000}
                              key={websocketReconnectTry}
                            >
                              <ReqoreControlGroup>
                                Lost connection to server. Trying to
                                reconnect...{' '}
                                <ReqoreIcon
                                  icon='Loader3Line'
                                  animation='spin'
                                  size='small'
                                  margin='both'
                                />
                                {websocketReconnectTry} /{' '}
                                {WS_RECONNECT_MAX_TRIES}
                              </ReqoreControlGroup>
                            </ReqoreMessage>
                          </ReqoreModal>
                        ) : null}
                        {hasWebsocketFailedToReconnect && (
                          <ReqoreModal
                            transparent
                            blur={10}
                            position='top'
                            isOpen
                            flat
                            width='500px'
                            padded={false}
                            style={{ top: '15%' }}
                          >
                            <ReqoreMessage
                              opaque={false}
                              intent='danger'
                              duration={5000}
                              key={websocketReconnectTry}
                            >
                              <ReqoreControlGroup>
                                Unable to establish a connection to the server,
                                please try to reload the page.
                              </ReqoreControlGroup>
                            </ReqoreMessage>
                          </ReqoreModal>
                        )}
                        {tab == 'Dashboard' && <Dashboard />}
                        {tab == 'Login' && <LoginContainer />}
                        {tab == 'Loading' || tab === 'proxy' ? (
                          <Loader text={t('Loading')} />
                        ) : null}
                        {tab == 'ProjectConfig' && <ProjectConfig />}
                        {tab == 'SourceDirs' && <SourceDirectories flat />}
                        {tab == 'ReleasePackage' && <ReleasePackage />}
                        {tab === 'Interfaces' && (
                          <InterfacesView type={subtab} />
                        )}
                        {!tab ||
                          (tab == 'CreateInterface' && <InterfaceCreator />)}
                      </>
                    </div>
                  </div>
                </div>
              </TextContext.Provider>
            </DialogsContext.Provider>
          </ContextMenuContext.Provider>
        </DraftsProvider>
      </InterfacesProvider>
    </>
  );
};

const mapStateToProps = (state) => ({
  project_folder: state.current_project_folder,
  login_visible: state.login_visible,
});

const mapDispatchToProps = (dispatch) => ({
  setCurrentProjectFolder: (folder) => {
    dispatch({
      type: 'current_project_folder',
      current_project_folder: folder,
    });
  },
  openLogin: () => {
    dispatch({ type: 'login_visible', login_visible: true });
  },
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withFields(),
  withInitialData(),
  withMethods(),
  withErrors(),
  withFunctions(),
  withSteps(),
  withMapper(),
  withGlobalOptions()
)(App);
