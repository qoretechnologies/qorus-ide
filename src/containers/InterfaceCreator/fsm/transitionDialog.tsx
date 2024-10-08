import { ReqoreMessage, ReqorePanel, ReqoreVerticalSpacer } from '@qoretechnologies/reqore';
import { size } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import every from 'lodash/every';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import uniq from 'lodash/uniq';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useMount from 'react-use/lib/useMount';
import styled from 'styled-components';
import { FSMContext, IFSMState, IFSMStates, IFSMTransition } from '.';
import CustomDialog from '../../../components/CustomDialog';
import { ExpressionBuilder, ExpressionDefaultValue } from '../../../components/ExpressionBuilder';
import { SaveColorEffect } from '../../../components/Field/multiPair';
import MultiSelect from '../../../components/Field/multiSelect';
import RadioField from '../../../components/Field/radioField';
import String from '../../../components/Field/string';
import { ContentWrapper, FieldWrapper } from '../../../components/FieldWrapper';
import Loader from '../../../components/Loader';
import { InitialContext } from '../../../context/init';
import { TextContext } from '../../../context/text';
import { getStatesForTemplates, prepareFSMDataForPublishing } from '../../../helpers/fsm';
import { buildTemplates, fetchData } from '../../../helpers/functions';
import { validateField } from '../../../helpers/validations';

export interface IFSMTransitionDialogProps {
  onClose: () => any;
  states: IFSMStates;
  onSubmit: (newData: IModifiedTransitions) => void;
  editingData: { stateId: number; index: number }[];
}

export type TTransitionCondition = 'custom' | 'none' | 'expression';

export interface IModifiedTransition {
  name: string;
  data: IFSMTransition;
}

export interface IModifiedTransitions {
  [id: string]: IModifiedTransition;
}

const StyledTransitionWrapper = styled.div`
  padding-top: 10;

  h3 {
    padding-top: 10px;
  }

  &:not(:first-child) {
    margin-bottom: 10px;
    border-top: 1px solid #eee;
  }
`;

export const getConditionType: (condition: any, required?: boolean) => TTransitionCondition = (
  condition,
  required
) => {
  return condition === null || condition === undefined
    ? 'none'
    : typeof condition === 'object'
      ? 'expression'
      : 'custom';
};

export const isConditionValid: (transitionData: IFSMTransition | IFSMState) => boolean = (
  transitionData
) => {
  const condition = getConditionType(transitionData.condition);

  if (condition === 'custom') {
    return validateField('string', transitionData?.condition);
  }

  return true;
};

export const renderConditionField: (
  conditionType: TTransitionCondition,
  transitionData: IFSMTransition,
  onChange: any,
  localTemplates: any
) => any = (conditionType, transitionData, onChange, localTemplates) => {
  switch (conditionType) {
    case 'custom': {
      return (
        <String
          name='condition'
          onChange={(name, value) => onChange(name, value)}
          value={transitionData?.condition}
          autoFocus
          id='condition-field'
        />
      );
    }
    case 'expression': {
      return (
        <ExpressionBuilder
          value={transitionData?.condition}
          onChange={(value) => {
            console.log('Condition Value:', value);
            onChange('condition', value);
          }}
          localTemplates={localTemplates}
          returnType='bool'
        />
      );
    }
    default:
      return null;
  }
};

export const ConditionField = ({
  data: { condition = ExpressionDefaultValue, ...rest },
  onChange,
  required,
  id,
}) => {
  const t = useContext(TextContext);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [templates, setTemplates] = useState<any>();
  const { metadata, states } = useContext(FSMContext);
  const conditionType = getConditionType(condition, required);
  const connectedStates = useMemo(
    () => getStatesForTemplates(id, states),
    [JSON.stringify(states), id]
  );

  const fetchTemplates = useCallback(async () => {
    if (!size(connectedStates)) {
      setLoadingTemplates(false);
      return;
    }

    setLoadingTemplates(true);

    // Set the initial templates
    setTemplates(buildTemplates());

    // Get everything after "latest/" in action.options_url
    // TODO: Param FSM with the whole FSM
    // fsm_context: workflow | service | job
    //
    const response = await fetchData(`fsms/getStateData?context=ui`, 'PUT', {
      fsm: prepareFSMDataForPublishing(metadata, states),
      current_state: id,
    });

    if (response.ok) {
      setLoadingTemplates(false);

      const data = response.data;

      setTemplates(buildTemplates(data, states, 'Use data from connected actions'));
    }
  }, [JSON.stringify(connectedStates)]);

  useEffect(() => {
    fetchTemplates();
  }, [JSON.stringify(connectedStates)]);

  if (loadingTemplates) {
    return <Loader text='Loading...' />;
  }

  return (
    <>
      <FieldWrapper
        label={t('Condition')}
        isValid={isConditionValid({ condition, ...rest })}
        type={t('Optional')}
        compact
      >
        <RadioField
          name='conditionType'
          onChange={(_name, value) => {
            onChange(
              'condition',
              value === 'none' ? null : value === 'custom' ? '' : ExpressionDefaultValue
            );
          }}
          value={conditionType || 'expression'}
          items={
            required
              ? [{ value: 'expression' }, { value: 'custom' }]
              : [{ value: 'expression' }, { value: 'custom' }, { value: 'none' }]
          }
        />
        {conditionType && conditionType !== 'none' ? (
          <>
            <ReqoreVerticalSpacer height={10} />
            {renderConditionField(conditionType, { condition, ...rest }, onChange, templates)}
          </>
        ) : null}
      </FieldWrapper>
      {conditionType === 'custom' && (
        <FieldWrapper
          label={t('field-label-lang')}
          isValid={validateField('string', rest.language || 'qore')}
          compact
        >
          <RadioField
            name='language'
            onChange={(name, value) => {
              onChange(name, value);
            }}
            value={rest?.language || 'qore'}
            items={[
              {
                value: 'qore',
                icon_filename: 'qore-106x128.png',
              },
              {
                value: 'python',
                icon_filename: 'python-129x128.png',
              },
            ]}
          />
        </FieldWrapper>
      )}
    </>
  );
};

export const TransitionEditor = ({ onChange, transitionData, errors, qorus_instance, id }) => {
  const t = useContext(TextContext);

  const renderErrorsField: (transitionData: IFSMTransition) => any = (transitionData) => {
    if (qorus_instance && !errors) {
      return <Loader text='Loading...' />;
    }

    return (
      <MultiSelect
        simple
        default_items={[{ name: 'All' }, ...(errors || [])]}
        name='errors'
        onChange={(_name, value) => onChange('errors', value)}
        value={transitionData?.errors}
      />
    );
  };

  return (
    <>
      {transitionData.branch && (
        <FieldWrapper label={t('Branch')} isValid compact>
          <RadioField
            name='branch'
            onChange={(_name, value) => {
              onChange('branch', value);
            }}
            value={transitionData.branch}
            items={[{ value: 'true' }, { value: 'false' }]}
          />
        </FieldWrapper>
      )}
      {!transitionData.branch && (
        <>
          <ConditionField onChange={onChange} data={transitionData} id={transitionData.state} />
          <FieldWrapper label={t('Errors')} isValid type={t('Optional')} compact>
            {!qorus_instance && (
              <>
                <ReqoreMessage intent='warning'>{t('TransitionErrorsNoInstance')}</ReqoreMessage>
                <ReqoreVerticalSpacer height={10} />
              </>
            )}
            {renderErrorsField(transitionData)}
          </FieldWrapper>
        </>
      )}
    </>
  );
};

const FSMTransitionDialog: React.FC<IFSMTransitionDialogProps> = ({
  onClose,
  states,
  editingData,
  onSubmit,
}) => {
  const { qorus_instance } = useContext<{ qorus_instance?: string }>(InitialContext);

  const getTransitionFromStates: () => IModifiedTransitions = () =>
    editingData.reduce(
      (modifiedData, { stateId, index }) => ({
        ...modifiedData,
        [`${stateId}:${index}`]: {
          id: stateId,
          name: `${states[stateId].name} -> ${
            states[states[stateId].transitions[index].state].name
          }`,
          data: cloneDeep(states)[stateId].transitions[index],
        },
      }),
      {}
    );

  const [newData, setNewData] = useState<IModifiedTransitions>(getTransitionFromStates());
  const [errors, setErrors] = useState<{ name: string }[] | null>(null);
  const t = useContext(TextContext);

  useMount(() => {
    if (qorus_instance) {
      (async () => {
        const result = await fetchData('/errors?list');
        setErrors(uniq(result.data).map((datum) => ({ name: datum })));
      })();
    }
  });

  const removeTransition = (id: string) => {
    setNewData((cur) => {
      const result = { ...cur };

      result[id] = null;

      return result;
    });
  };

  const handleDataUpdate = (id: string, name: string, value: any) => {
    setNewData((cur) => {
      const result = { ...cur };

      result[id].data[name] = value;

      return result;
    });
  };

  const handleSubmitClick = async () => {
    onClose();
    onSubmit(newData);
  };

  const isDataValid: () => boolean = () => {
    let isValid = true;

    forEach(newData, (transitionData, id) => {
      if (transitionData && !isConditionValid(transitionData.data)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const areAllTransitionsDeleted = () => {
    return every(newData, (data) => {
      return !data;
    });
  };

  return (
    <CustomDialog
      onClose={onClose}
      isOpen
      label={t('EditingTransition')}
      bottomActions={[
        {
          label: t('Reset'),
          icon: 'HistoryLine',
          className: 'fsm-reset-transitions',
          tooltip: t('ResetTooltip'),
          onClick: () => setNewData(getTransitionFromStates()),
        },
        {
          label: t('Submit'),
          disabled: !isDataValid(),
          className: 'fsm-save-transitions',
          icon: 'CheckLine',
          effect: SaveColorEffect,
          onClick: handleSubmitClick,
          position: 'right',
        },
      ]}
    >
      {areAllTransitionsDeleted() ? (
        <ReqoreMessage intent='warning'>{t('AllTransitionsRemoved')}</ReqoreMessage>
      ) : (
        <>
          {map(
            newData,
            (transitionData: IModifiedTransition, id: string) =>
              transitionData && (
                <ReqorePanel
                  minimal
                  transparent
                  flat
                  label={transitionData.name}
                  actions={[
                    {
                      intent: 'danger',
                      icon: 'DeleteBinLine',
                      className: 'fsm-delete-transition',
                      onClick: () => {
                        removeTransition(id);
                      },
                    },
                  ]}
                >
                  <ContentWrapper>
                    <TransitionEditor
                      onChange={(name, value) => handleDataUpdate(id, name, value)}
                      transitionData={transitionData.data}
                      id={id}
                      errors={errors}
                      qorus_instance={qorus_instance}
                    />
                  </ContentWrapper>
                </ReqorePanel>
              )
          )}
        </>
      )}
    </CustomDialog>
  );
};

export default FSMTransitionDialog;
