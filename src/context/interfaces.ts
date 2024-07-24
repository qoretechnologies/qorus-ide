import { createContext } from 'use-context-selector';
import {
  IQorusInterface,
  TQorusInterfaceCount,
} from '../containers/InterfacesView';

export interface IInterfacesContext {
  categories?: TQorusInterfaceCount;
  interfaces?: Record<string, IQorusInterface[]>;
  clone?: (type: string, id: string | number) => void;
  storage?: Record<string, any>;
  getStorage?: <T>(path: string, defaultValue?: T) => T;
  updateStorage?: <T>(path: string, value: T) => void;
  toggleEnabled?: (type: string, id: string | number, enable?: boolean) => void;
}

export const InterfacesContext = createContext<IInterfacesContext>({
  categories: {},
  interfaces: {},
  storage: {},
});
