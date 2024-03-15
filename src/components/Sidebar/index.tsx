import { ReqoreSidebar } from '@qoretechnologies/reqore';
import { IQorusSidebarProps } from '@qoretechnologies/reqore/dist/components/Sidebar';
import { useContext } from 'react';
import { InterfacesContext } from '../../context/interfaces';
import { buildMenu } from './menu';

export interface ISidebar extends Partial<IQorusSidebarProps> {}

export const Sidebar = (props: ISidebar) => {
  const { categories } = useContext(InterfacesContext);

  return <ReqoreSidebar {...props} path='/ide' items={buildMenu(categories)} />;
};
