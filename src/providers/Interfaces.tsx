import { useReqoreProperty } from '@qoretechnologies/reqore';
import { cloneDeep, get, set } from 'lodash';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncRetry } from 'react-use';
import Loader from '../components/Loader';
import { interfaceToPlural } from '../constants/interfaces';
import { Messages } from '../constants/messages';
import {
  IQorusInterface,
  TQorusInterfaceCount,
} from '../containers/InterfacesView';
import { InterfacesContext } from '../context/interfaces';
import { NotificationsHandler } from '../handlers/Notifications';
import { callBackendBasic, fetchData } from '../helpers/functions';
import { transformTypeForFetch } from '../hooks/useFetchInterfaces';

export type TQorusStorage = Record<string, any>;

export interface IInterfacesProviderProps {
  _injectedStorage?: TQorusStorage;
  children: React.ReactNode;
}

export const InterfacesProvider = ({
  children,
  _injectedStorage = {},
}: IInterfacesProviderProps) => {
  const [categories, setCategories] = useState<TQorusInterfaceCount>(undefined);
  const [interfaces, setInterfaces] = useState<
    Record<string, IQorusInterface[]>
  >({});
  const [storage, setStorage] = useState<TQorusStorage>({});

  const addNotification = useReqoreProperty('addNotification');
  const addModal = useReqoreProperty('addModal');
  const removeModal = useReqoreProperty('removeModal');
  const navigate = useNavigate();

  const { value, loading, error, retry } = useAsyncRetry(async () => {
    if (process.env.NODE_ENV === 'storybook') {
      return _injectedStorage;
    }

    const data = await fetchData(
      `/users/_current_/storage/ide`,
      undefined,
      undefined,
      false
    );

    if (data.code === 404) {
      return {};
    }

    return data.data;
  }, []);

  useEffect(() => {
    if (value) {
      setStorage(value);
    }
  }, [JSON.stringify(value)]);

  useEffect(() => {
    (async () => {
      const data = await callBackendBasic(
        Messages.GET_ALL_INTERFACES_COUNT,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      const interfacesData = await callBackendBasic(
        Messages.GET_ALL_INTERFACES,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      setInterfaces(interfacesData.data);
      setCategories(data.data);
    })();
  }, []);

  const toggleEnabled = async (
    type: string,
    id: string | number,
    enable?: boolean
  ) => {
    const fetchType = transformTypeForFetch(interfaceToPlural[type]);

    await fetchData(
      `${fetchType}/${id}/${enable ? 'enable' : 'disable'}`,
      'PUT',
      undefined,
      false
    );
  };

  const clone = async (type: string, id: string | number) => {
    addModal(
      {
        children: <Loader text='Cloning...' />,
        flat: true,
        opacity: 0.8,
        blur: 5,
        onClose: undefined,
        width: '500px',
      },
      'clone-modal',
      { closable: false }
    );

    const data = await fetchData(
      `/${categories[type].url_root}/${id}/clone`,
      'POST'
    );

    if (data.ok) {
      navigate(`/CreateInterface/${type}/${data.data.id}`);
      removeModal('clone-modal');
    } else {
      addModal(
        {
          width: '500px',
          children:
            data.error?.desc || 'An error occurred while cloning the interface',
          label: 'Error cloning interface',
          intent: 'danger',
        },
        'clone-modal'
      );
    }
  };

  const getStorage = function <T>(path: string, defaultValue: T) {
    return get(storage, path) ?? defaultValue;
  };

  const updateStorage = function <T>(path: string, value: T) {
    const updatedStorage = set(cloneDeep(storage), path, value);

    setStorage(updatedStorage);

    if (process.env.NODE_ENV === 'storybook') return;

    fetchData(
      '/users/_current_/',
      'PUT',
      { storage_path: 'ide', value: updatedStorage },
      false
    );
  };

  if (!categories || loading) {
    return <Loader />;
  }

  return (
    <InterfacesContext.Provider
      value={{
        categories,
        interfaces,
        clone,
        storage,
        getStorage,
        updateStorage,
        toggleEnabled,
      }}
    >
      <NotificationsHandler>{children}</NotificationsHandler>
    </InterfacesContext.Provider>
  );
};
