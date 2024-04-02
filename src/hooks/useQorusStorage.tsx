import { useContextSelector } from 'use-context-selector';
import { InterfacesContext } from '../context/interfaces';

export type TQorusStorageHook<T> = [T, (newStorage: T) => void];

export function useQorusStorage<T>(
  path: string,
  defaultValue?: T
): TQorusStorageHook<T> {
  const { getStorage, updateStorage } = useContextSelector(
    InterfacesContext,
    ({ getStorage, updateStorage }) => ({ getStorage, updateStorage })
  );

  return [
    getStorage(path, defaultValue),
    (newStorage: T) => updateStorage(path, newStorage),
  ];
}
