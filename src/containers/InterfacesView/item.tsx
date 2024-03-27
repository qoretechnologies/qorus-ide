import { IQorusListInterface } from '.';
import { Description } from '../../components/Description';

export interface IInterfacesViewItemProps {
  data: IQorusListInterface['data'];
}

export const InterfacesViewItem = ({ data }: IInterfacesViewItemProps) => {
  return (
    <Description
      longDescription={data?.desc}
      shortDescription={data?.short_desc || 'No description'}
    />
  );
};
