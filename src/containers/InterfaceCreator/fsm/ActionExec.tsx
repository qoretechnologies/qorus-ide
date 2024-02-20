import {
  ReqoreIcon,
  ReqoreMessage,
  ReqoreP,
  ReqorePanel,
  ReqoreSpinner,
  ReqoreTag,
  ReqoreTree,
} from '@qoretechnologies/reqore';
import { size } from 'lodash';
import { memo, useCallback, useEffect, useState } from 'react';
import { IOptions } from '../../../components/Field/systemOptions';
import { fetchData } from '../../../helpers/functions';
import { validateField } from '../../../helpers/validations';
import { useFetchActionOptions } from '../../../hooks/useFetchActionOptions';
import { useGetAppActionData } from '../../../hooks/useGetAppActionData';
import { useWhyDidYouUpdate } from '../../../hooks/useWhyDidYouUpdate';

export interface IQodexActionExecProps {
  appName: string;
  actionName: string;
  options?: IOptions;
  id: string | number;
}

export const QodexActionExec = memo(
  ({ appName, actionName, options, id }: IQodexActionExecProps) => {
    const { action } = useGetAppActionData(appName, actionName);
    const [response, setResponse] = useState<any>(undefined);
    const [error, setError] = useState<any>(undefined);
    const [loadingResponse, setLoading] = useState<boolean>(false);
    const { loading, data, load } = useFetchActionOptions({
      action,
      options,
      onStart: () => {
        setError(undefined);
        setResponse(undefined);
      },
    });

    useWhyDidYouUpdate('QodexActionExec', {
      appName,
      actionName,
      options,
      response,
      loadingResponse,
      loading,
      data,
    });

    const executeAction = async () => {
      setLoading(true);
      setError(undefined);

      const optionsUrl = action.exec_url.split('latest/')[1];

      const response = await fetchData(
        `${optionsUrl}?context=ui${
          action.action_code_str === 'EVENT' ? '&generate=true' : ''
        }`,
        'POST',
        {
          options,
          id,
        }
      );

      if (response.ok) {
        setResponse(response.data);
      } else {
        console.error(response.data, response);
        setError('There was an error in the test call!');
      }

      setLoading(false);
    };

    const areOptionsValid = useCallback(() => {
      console.log(options, data, action);
      return (
        size(data) && validateField('options', options, { optionSchema: data })
      );
    }, [data, options]);

    useEffect(() => {
      load();
    }, [JSON.stringify(options)]);

    useEffect(() => {
      console.log(areOptionsValid() && action.action_code_str === 'EVENT');
      // Only execute action automatically if it's an event
      if (areOptionsValid() && action.action_code_str === 'EVENT') {
        executeAction();
      }
    }, [JSON.stringify(data)]);

    if (loading) {
      return (
        <ReqoreSpinner size='small' type={3} iconColor='pending' centered>
          Loading test action runner...
        </ReqoreSpinner>
      );
    }

    return (
      <>
        <ReqorePanel
          size='small'
          fill
          label={
            action.action_code_str !== 'EVENT' ? 'Test Action' : `Event example`
          }
          collapsible
          minimal
          responsiveActions={false}
          responsiveTitle={false}
          actions={[
            {
              icon: 'RefreshLine',
              onClick: executeAction,
              readOnly: response && loadingResponse,
              disabled: !areOptionsValid(),
              tooltip: 'Refresh data',
              intent: response && loadingResponse ? 'pending' : undefined,
              leftIconProps: {
                animation: response && loadingResponse ? 'spin' : undefined,
              },
              show: !!response && action.action_code_str === 'EVENT',
            },
            {
              icon: 'PlayLine',
              onClick: executeAction,
              readOnly: response && loadingResponse,
              disabled: !areOptionsValid(),
              label: 'Run',
              tooltip: 'Test action',
              intent: response && loadingResponse ? 'pending' : undefined,
              leftIconProps: {
                animation: response && loadingResponse ? 'spin' : undefined,
              },
              show: action.action_code_str !== 'EVENT',
            },
          ]}
        >
          {!areOptionsValid() && (
            <>
              <ReqoreIcon
                icon='InformationLine'
                size='small'
                intent='pending'
                margin='right'
              />
              {action.action_code_str === 'EVENT' ? (
                <ReqoreP>
                  Fill all required fields to see automatically generated event
                  data
                </ReqoreP>
              ) : (
                <ReqoreP>
                  Fill all required fields and press the{' '}
                  <ReqoreTag icon='PlayLine' size='small' label='Run' /> button
                  to test your action
                </ReqoreP>
              )}
            </>
          )}
          {areOptionsValid() && !response ? (
            <>
              {loadingResponse || loading ? (
                <>
                  <ReqoreSpinner size='small' type={3} iconColor='pending'>
                    Working...
                  </ReqoreSpinner>
                </>
              ) : (
                <ReqoreP>
                  <ReqoreIcon
                    icon='InformationLine'
                    size='small'
                    intent='info'
                    margin='right'
                  />
                  Press the <ReqoreIcon icon='PlayLine' size='small' /> button
                  to test your action
                </ReqoreP>
              )}
            </>
          ) : null}
          {error && (
            <ReqoreMessage intent='danger' opaque={false} margin='top'>
              {error}
            </ReqoreMessage>
          )}
          {response && (
            <ReqoreTree size='small' data={response} withLabelCopy />
          )}
        </ReqorePanel>
      </>
    );
  }
);
