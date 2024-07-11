import {
  ReqoreMessage,
  ReqoreP,
  ReqoreSpinner,
  ReqoreVerticalSpacer,
} from '@qoretechnologies/reqore';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import { FunctionComponent, useContext } from 'react';
import { useAsyncRetry } from 'react-use';
import { TTranslator } from '../../App';
import { interfaceToPlural } from '../../constants/interfaces';
import { InitialContext } from '../../context/init';
import { TextContext } from '../../context/text';
import { fetchData } from '../../helpers/functions';
import { IField, IFieldChange } from '../FieldWrapper';
import { ILongStringField } from './longString';
import SelectField from './select';

export interface IInterfaceSelector {
  t?: TTranslator;
  type:
    | 'workflows'
    | 'services'
    | 'jobs'
    | 'connections'
    | 'mappers'
    | 'value-maps';
  itemsActions?: (item: string) => IReqorePanelProps['actions'];
}

export const InterfaceSelector: FunctionComponent<
  ILongStringField & IField & IFieldChange & IInterfaceSelector
> = ({ name, onChange, value, default_value, type, itemsActions, ...rest }) => {
  // Get the qorus instance
  const { qorus_instance } = useContext<{ qorus_instance?: string }>(
    InitialContext
  );
  const t = useContext(TextContext);
  // Fetch data on mount
  const {
    value: interfaces,
    loading,
    retry,
    error,
  } = useAsyncRetry(async () => {
    // Fetch the interfaces based on the type
    if (qorus_instance) {
      return fetchData(`/${interfaceToPlural[type]}?list=true`);
    }

    return null;
  }, [qorus_instance, type]);

  if (!qorus_instance) {
    return (
      <div>
        <ReqoreMessage intent='warning'>
          {t('InterfacesQorusInstanceRequired')}
        </ReqoreMessage>
        <ReqoreVerticalSpacer height={10} />
        <ReqoreP>{value || default_value}</ReqoreP>
      </div>
    );
  }

  if (error) {
    return (
      <ReqoreMessage intent='danger' title={t('ErrorLoadingInterfaces')}>
        {t(error)}
      </ReqoreMessage>
    );
  }

  // If interfaces are not loaded yet, return a loading indicator
  if (loading) {
    return (
      <ReqoreSpinner type={5} size={rest.size}>
        Loading...
      </ReqoreSpinner>
    );
  }

  return (
    <SelectField
      {...rest}
      defaultItems={interfaces.data.map((i) => ({
        name: i,
        actions: itemsActions?.(i),
      }))}
      value={value || default_value}
      name={name}
      onChange={onChange}
    />
  );
};
