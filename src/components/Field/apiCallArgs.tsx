import { ReqoreMessage } from '@qoretechnologies/reqore';
import { useContext, useEffect } from 'react';
import { useAsyncRetry } from 'react-use';
import styled from 'styled-components';
import { InitialContext } from '../../context/init';
import { TextContext } from '../../context/text';
import { fetchData } from '../../helpers/functions';
import Auto from './auto';
import Options from './systemOptions';

type IApiCallArgsField = {
  value: string | number | { [key: string]: any };
  onChange: (
    name: string,
    value: string | number | { [key: string]: any },
    type: string
  ) => void;
  url: string;
};

export const StyledPairField = styled.div`
  margin-bottom: 10px;
`;

export const ApiCallArgs = ({ url, onChange, value }: IApiCallArgsField) => {
  const t = useContext(TextContext);
  const { qorus_instance }: any = useContext(InitialContext);

  const {
    value: schema,
    loading,
    error,
  } = useAsyncRetry(async () => {
    if (qorus_instance) {
      const data = await fetchData(`${url}/request?context=ui`);

      if (data.error) {
        throw new Error(data.error.error.desc);
      }

      return data.data;
    }
    return null;
  }, [url]);

  useEffect(() => {
    if (schema?.type === 'nothing') {
      onChange('apicallargs', undefined, 'nothing');
    }
  }, [schema]);

  if (loading) {
    return <ReqoreMessage intent='pending'>Loading...</ReqoreMessage>;
  }

  if (error) {
    return (
      <ReqoreMessage intent='danger'>Error: {error.message}</ReqoreMessage>
    );
  }

  if (schema?.type === 'nothing') {
    return (
      <ReqoreMessage intent='warning'>{t('APICallTakesNoArgs')}</ReqoreMessage>
    );
  }

  if (schema.type === 'hash') {
    return (
      <Options
        name='field'
        onChange={(n, v) => onChange(n, v, schema.type)}
        value={value}
        options={schema.arg_schema}
        placeholder='AddArgument'
      />
    );
  }

  return (
    <Auto
      name='field'
      onChange={(n, v) => onChange(n, v, schema.type)}
      value={value}
      defaultType={schema.type.replace('*', '')}
      requestFieldData={(key) => {
        if (key === 'can_be_undefined') {
          return schema.type.startsWith('*');
        }
      }}
    />
  );
};
