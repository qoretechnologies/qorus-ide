import { IReqoreMenuProps } from '@qoretechnologies/reqore/dist/components/Menu';
import { ReqraftMenu } from '@qoretechnologies/reqraft';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { InterfacesContext } from '../../context/interfaces';
import { TMenu, buildMenu } from './menu';
import { QorusPurpleIntent } from '../../constants/util';

export interface ISidebar extends Partial<IReqoreMenuProps> {
  isOpen?: boolean;
  onHideClick?: () => void;
  _location?: Partial<Location<any>>;
}

export const Sidebar = (props: ISidebar) => {
  const location = props._location || useLocation();
  const navigate = useNavigate();
  const categories = useContextSelector(
    InterfacesContext,
    (value) => value.categories
  );
  const menu: TMenu = buildMenu(categories, navigate);

  return (
    <ReqraftMenu
      menu={menu}
      path={location.pathname}
      activeItemIntent={QorusPurpleIntent}
    />
  );
};
