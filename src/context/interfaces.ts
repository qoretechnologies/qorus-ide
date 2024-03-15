import { createContext } from 'react';
import { TQorusInterfaceCount } from '../containers/InterfacesView';

export interface IInterfacesContext {
  categories?: TQorusInterfaceCount;
}

export const InterfacesContext = createContext<IInterfacesContext>({
  categories: {},
});
