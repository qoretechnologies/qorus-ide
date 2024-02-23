import { IReqoreIconName } from '@qoretechnologies/reqore/dist/types/icons';
import { useAsyncRetry } from 'react-use';
import { IQorusType } from '../components/Field/systemOptions';
import { fetchData } from '../helpers/functions';

export interface IQorusTypeObject {
  display_name?: string;
  name: IQorusType;
  desc?: string;
  short_desc?: string;
  icon?: IReqoreIconName;
}
export interface IUseTypes {
  loading: boolean;
  error?: Error;
  retry: () => void;
  value?: IQorusTypeObject[];
}

let typesCache;

export const useQorusTypes = (): IUseTypes => {
  const types = useAsyncRetry(async () => {
    if (!typesCache) {
      const serverTemplates = await fetchData(`/system/qorus-type-info`);

      if (serverTemplates.ok) {
        typesCache = serverTemplates.data;
      }
    }

    return typesCache;
  }, []);

  return types;
};
