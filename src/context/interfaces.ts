import { createContext } from 'react';
import { TQorusInterfaceCount } from '../containers/InterfacesView';

export interface IInterfacesContext {
  categories?: TQorusInterfaceCount;
  clone?: (type: string, id: string | number) => void;
}

export const InterfacesContext = createContext<IInterfacesContext>({
  categories: {},
});
