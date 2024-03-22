import { useReqoreProperty } from '@qoretechnologies/reqore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { interfaceToPlural } from '../constants/interfaces';
import { Messages } from '../constants/messages';
import { TQorusInterfaceCount } from '../containers/InterfacesView';
import { InterfacesContext } from '../context/interfaces';
import { callBackendBasic, fetchData } from '../helpers/functions';

export const InterfacesProvider = ({ children }) => {
  const [categories, setCategories] = useState<TQorusInterfaceCount>(undefined);
  const addModal = useReqoreProperty('addModal');
  const removeModal = useReqoreProperty('removeModal');
  const navigate = useNavigate();

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

      setCategories(data.data);
    })();
  }, []);

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
      `/${interfaceToPlural[type]}/${id}/clone`,
      'POST'
    );

    console.log(data);

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

  if (!categories) {
    return <Loader />;
  }

  return (
    <InterfacesContext.Provider value={{ categories, clone }}>
      {children}
    </InterfacesContext.Provider>
  );
};
