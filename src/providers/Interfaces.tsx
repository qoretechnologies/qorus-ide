import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import { Messages } from '../constants/messages';
import { TQorusInterfaceCount } from '../containers/InterfacesView';
import { InterfacesContext } from '../context/interfaces';
import { callBackendBasic } from '../helpers/functions';

export const InterfacesProvider = ({ children }) => {
  const [categories, setCategories] = useState<TQorusInterfaceCount>(undefined);

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

  if (!categories) {
    return <Loader />;
  }

  return (
    <InterfacesContext.Provider value={{ categories }}>
      {children}
    </InterfacesContext.Provider>
  );
};
