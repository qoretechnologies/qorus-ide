import { useAsyncRetry } from 'react-use';
import { IApp } from '../components/AppCatalogue';
import { TAppsContext } from '../context/apps';
import { fetchData } from '../helpers/functions';
import { useActionSets } from './useActionSets';

export const useApps = (): TAppsContext => {
  const apps = useAsyncRetry<IApp[]>(async () => {
    const apps = await fetchData('dataprovider/apps');

    return apps.data;
  }, []);

  const { app, loading, error, retry, ...rest } = useActionSets();

  return {
    apps: apps.value ? [app, ...apps.value] : [],
    loading: apps.loading || loading,
    error: apps.error || error,
    ...rest,
    retry: () => {
      apps.retry();
      retry();
    },
  };
};
