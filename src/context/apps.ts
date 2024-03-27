import { createContext } from 'react';
import { IApp } from '../components/AppCatalogue';
import { IActionSet } from '../containers/InterfaceCreator/fsm/ActionSetDialog';
import { IActionsSetsHookFunctions } from '../hooks/useActionSets';

export type TAppsContext = {
  apps?: IApp[];
  actionSets?: IActionSet[];
  loading?: boolean;
  error?: any;
  retry?: () => void;
} & IActionsSetsHookFunctions;

export const AppsContext = createContext<TAppsContext>({
  apps: [],
  actionSets: [],
});
