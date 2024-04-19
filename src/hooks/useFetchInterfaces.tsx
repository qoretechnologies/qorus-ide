import { useReqoreProperty } from '@qoretechnologies/reqore';
import { useAsyncRetry } from 'react-use';
import { useContextSelector } from 'use-context-selector';
import { interfaceToPlural } from '../constants/interfaces';
import { Messages } from '../constants/messages';
import { IQorusListInterface } from '../containers/InterfacesView';
import { InterfacesContext } from '../context/interfaces';
import { callBackendBasic, fetchData } from '../helpers/functions';

export const transformTypeForFetch = (type: string) => {
  switch (type) {
    case 'queues':
      return 'async-queues';
    case 'types':
      return '/dataprovider/types?action=listAll';
    case 'mapper-codes':
    case 'schema-modules':
    case 'scripts':
    case 'tests':
      return undefined;
    default:
      return type;
  }
};

export const useFetchInterfaces = (type?: string) => {
  const addNotification = useReqoreProperty('addNotification');
  const { toggleEnabled } = useContextSelector(
    InterfacesContext,
    ({ toggleEnabled }) => ({ toggleEnabled })
  );

  const {
    value = [],
    loading,
    retry,
    error,
  } = useAsyncRetry<
    IQorusListInterface[] | Record<string, IQorusListInterface[]>
  >(async () => {
    const data = await callBackendBasic(
      Messages.GET_ALL_INTERFACES,
      undefined,
      { type },
      undefined,
      undefined,
      true
    );
    return data.data;
  }, [type]);

  const handleDeleteClick = async (id: string | number) => {
    const fetchType = transformTypeForFetch(interfaceToPlural[type]);

    addNotification({
      intent: 'pending',
      content: `Deleting from server...`,
      duration: 10000,
      id: 'delete-interface',
    });

    await fetchData(`${fetchType}/${id}`, 'DELETE');

    addNotification({
      intent: 'success',
      content: `Successfully deleted...`,
      duration: 3000,
      id: 'delete-interface',
    });

    retry();
  };

  const handleToggleEnabledClick = async (
    id: string | number,
    enable?: boolean
  ) => {
    toggleEnabled(type, id, enable);

    retry();
  };

  return {
    loading,
    onDeleteRemoteClick: handleDeleteClick,
    onToggleEnabledClick: handleToggleEnabledClick,
    retry,
    value,
  };
};
