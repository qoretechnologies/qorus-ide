import {
  ReqoreButton,
  ReqoreCollection,
  ReqoreControlGroup,
  ReqoreMessage,
  ReqorePanel,
  ReqoreSpinner,
  ReqoreTag,
  ReqoreTagGroup,
  ReqoreVerticalSpacer,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import { IReqoreCollectionProps } from '@qoretechnologies/reqore/dist/components/Collection';
import { IReqoreCollectionItemProps } from '@qoretechnologies/reqore/dist/components/Collection/item';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import { IReqoreTextareaProps } from '@qoretechnologies/reqore/dist/components/Textarea';
import { TReqoreIntent } from '@qoretechnologies/reqore/dist/constants/theme';
import { IReqoreAutoFocusRules } from '@qoretechnologies/reqore/dist/hooks/useAutoFocus';
import {
  IQorusFormField,
  IQorusFormFieldMessage,
  IQorusFormFieldOnChangeMeta,
  IQorusFormFieldSchema,
  IQorusFormOperator,
  IQorusFormOperatorsSchema,
  IQorusFormSchema,
  TQorusFlatForm,
  TQorusForm,
  TQorusFormOperatorValue,
  TQorusType,
} from '@qoretechnologies/ts-toolkit';
import { cloneDeep, findKey, forEach, last } from 'lodash';
import isArray from 'lodash/isArray';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import size from 'lodash/size';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import useMount from 'react-use/lib/useMount';
import useUpdateEffect from 'react-use/lib/useUpdateEffect';
import { isObject } from 'util';
import { TextContext } from '../../context/text';
import { fetchData, insertAtIndex } from '../../helpers/functions';
import { hasAllDependenciesFullfilled, validateField } from '../../helpers/validations';
import { useTemplates } from '../../hooks/useTemplates';
import { Description } from '../Description';
import AutoField from './auto';
import { NegativeColorEffect, PositiveColorEffect } from './multiPair';
import { OptionFieldMessages } from './optionFieldMessages';
import SelectField, { ISelectFieldItem } from './select';
import { TemplateField } from './template';

export const getType = (
  type: IQorusType | IQorusType[],
  operators?: IOperatorsSchema,
  operator?: TOperatorValue
) => {
  const finalType = getTypeFromOperator(operators, fixOperatorValue(operator)) || type;

  return isArray(finalType) ? finalType[0] : finalType;
};

const getTypeFromOperator = (
  operators?: IOperatorsSchema,
  operatorData?: (string | null | undefined)[]
) => {
  if (!operators || !operatorData || !size(operatorData) || !last(operatorData)) {
    return null;
  }

  return operators[last(operatorData) as string]?.type || null;
};

export const fixOperatorValue = (operator: TOperatorValue): (string | null | undefined)[] => {
  return isArray(operator) ? operator : [operator];
};

export const hasRequiredOptions = (options: IOptionsSchema = {}) => {
  return !!findKey(options, (option) => option.required);
};

/* "Fix options to be an object with the correct type." */
export const fixOptions = (
  value: IOptions | TFlatOptions = {},
  options: IOptionsSchema,
  operators?: IOperatorsSchema
): IOptions => {
  const fixedValue = cloneDeep(value);

  // Add missing required options to the fixedValue
  forEach(options, (option, name) => {
    if (
      option.preselected ||
      option.value ||
      (option.required && !fixedValue[name]) ||
      (option.required && option.default_value && !option.value)
    ) {
      fixedValue[name] = {
        is_expression: fixedValue[name]?.is_expression,
        type: getType(option.type, operators, fixedValue[name]?.op),
        value:
          (typeof fixedValue[name] === 'object' ? fixedValue[name]?.value : fixedValue[name]) ??
          option.value ??
          option.default_value,
      };
    }
  });

  const res = reduce(
    fixedValue,
    (newValue, option, optionName) => {
      if (!isObject(option) || !option?.type) {
        return {
          ...newValue,
          [optionName]: {
            type: getType(options?.[optionName]?.type, operators, option?.op),
            value: option,
            is_expression: option?.is_expression,
          },
        };
      }

      return { ...newValue, [optionName]: option };
    },
    {}
  );

  return res;
};

export const flattenOptions = (options: IOptions): TFlatOptions => {
  return reduce(
    options,
    (newOptions, option, optionName) => {
      return {
        ...newOptions,
        [optionName]: typeof option === 'object' ? option?.value : option,
      };
    },
    {}
  );
};

export type IQorusType = TQorusType | 'context' | 'select-string';

export type TOperatorValue = TQorusFormOperatorValue;

export type TOption = IQorusFormField;
export type IOptions = TQorusForm;

export type TFlatOptions = TQorusFlatForm;

export interface IOptionFieldMessage extends IQorusFormFieldMessage<TReqoreIntent> {}

export interface IOptionsSchemaArg
  extends IQorusFormFieldSchema<TReqoreIntent, IReqoreAutoFocusRules> {}

export interface IOptionsSchema extends IQorusFormSchema<TReqoreIntent, IReqoreAutoFocusRules> {}

export interface IOperator extends IQorusFormOperator {}

export interface IOperatorsSchema extends IQorusFormOperatorsSchema {}

export interface IOptionsOnChangeMeta extends IQorusFormFieldOnChangeMeta {}

export interface IOptionsProps extends Omit<IReqoreCollectionProps, 'onChange'> {
  name: string;
  url?: string;
  customUrl?: string;
  value?: IOptions | TFlatOptions;
  options?: IOptionsSchema;
  onChange?: (name: string, value?: IOptions, meta?: IOptionsOnChangeMeta) => void;
  onSingleOptionsChange?: (name: string, value: TOption) => void;
  onDependableOptionChange?: (
    name: string,
    value: TOption,
    options: IOptions,
    schema: IOptionsSchema
  ) => void;
  placeholder?: string;
  operatorsUrl?: string;
  noValueString?: string;
  isValid?: boolean;
  onOptionsLoaded?: (options: IOptionsSchema) => void;
  recordRequiresSearchOptions?: boolean;
  readOnly?: boolean;
  allowTemplates?: boolean;
  stringTemplates?: IReqoreTextareaProps['templates'];
  interfaceContext?: string;
}

export const getTypeAndCanBeNull = (
  type: IQorusType | IQorusType[],
  allowed_values?: any[],
  operatorData?: TOperatorValue,
  operators?: IOperatorsSchema
) => {
  let canBeNull = false;
  let realType = getType(type, operators, operatorData);

  if (realType?.startsWith('*')) {
    realType = realType.replace('*', '') as IQorusType;
    canBeNull = true;
  }

  realType = realType === 'string' && allowed_values ? 'string' : realType;

  return {
    type: realType,
    defaultType: realType,
    defaultInternalType: realType === 'auto' || realType === 'any' ? undefined : realType,
    canBeNull,
  };
};

const templatesCache: { [key: string]: IReqoreTextareaProps['templates'] } = {};

const Options = ({
  name,
  value = {},
  onChange,
  onSingleOptionsChange,
  onDependableOptionChange,
  url,
  customUrl,
  placeholder,
  operatorsUrl,
  noValueString,
  isValid,
  onOptionsLoaded,
  recordRequiresSearchOptions,
  readOnly,
  allowTemplates = true,
  ...rest
}: IOptionsProps) => {
  const t: any = useContext(TextContext);
  const [options, setOptions] = useState<IOptionsSchema | undefined>(rest?.options || undefined);
  const [operators, setOperators] = useState<IOperatorsSchema | undefined>(undefined);
  const confirmAction = useReqoreProperty('confirmAction');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(rest.options ? false : true);

  const getUrl = () => customUrl || `/options/${url}`;

  useMount(() => {
    if (url || customUrl) {
      (async () => {
        setOptions(undefined);
        setLoading(true);
        // Fetch the options for this mapper type
        const data = await fetchData(getUrl());
        if (!data.ok) {
          setLoading(false);
          setOptions({});
          return;
        }
        onChange?.(name, fixOptions(value, data.data));
        // Save the new options
        if (!operatorsUrl) {
          setLoading(false);
        }
        setOptions(data.data);
        onOptionsLoaded?.(data.data);
      })();
    }
    if (operatorsUrl) {
      (async () => {
        setOperators(undefined);
        setLoading(true);
        // Fetch the options for this mapper type
        const data = await fetchData(`/${operatorsUrl}`);

        if (!data.ok) {
          setLoading(false);
          setOperators({});
          return;
        }
        setOperators(data.data);
        // Save the new options
        setLoading(false);
      })();
    }
  });

  useUpdateEffect(() => {
    if (url || customUrl) {
      (async () => {
        setOptions(undefined);
        setError(null);
        removeValue();
        setLoading(true);
        // Fetch the options for this mapper type
        const data = await fetchData(getUrl());

        if (!data.ok) {
          setLoading(false);
          setOptions({});
          return;
        }
        // Save the new options
        if (!operatorsUrl) {
          setLoading(false);
        }
        setOptions(data.data);
        onOptionsLoaded?.(data.data);
        onChange?.(name, fixOptions({}, data.data));
      })();
    }
  }, [url, customUrl]);

  useEffect(() => {
    setOptions(rest.options);
    setLoading(false);
  }, [JSON.stringify(rest.options)]);

  useEffect(() => {
    // Fix the value accorditong to the new options
    onChange?.(name, fixOptions(value, options));
  }, [JSON.stringify(options), JSON.stringify(value)]);

  useUpdateEffect(() => {
    if (operatorsUrl) {
      (async () => {
        setOperators(undefined);
        setLoading(true);
        // Fetch the options for this mapper type
        const data = await fetchData(`/${operatorsUrl}`);

        if (data.error) {
          setLoading(false);
          setOperators({});
          return;
        }
        // Save the new options
        setLoading(false);
        setOperators(data.data);
      })();
    }
  }, [operatorsUrl]);

  const templates = useTemplates(allowTemplates, rest.stringTemplates);

  const handleValueChange = (
    optionName: string,
    currentValue: any = {},
    val?: any,
    type?: string,
    isFunction?: boolean
  ) => {
    // Check if this option is already added
    if (!currentValue[optionName]) {
      // If it's not, add potential default operators
      const defaultOperators: TOperatorValue = reduce(
        operators || {},
        (filteredOperators: TOperatorValue, operator, operatorKey) => {
          if (operator.selected) {
            return [...(filteredOperators as string[]), operatorKey];
          }

          return filteredOperators;
        },
        []
      );
      // If there are default operators, add them to the value
      if (defaultOperators?.length) {
        onChange?.(name, {
          ...currentValue,
          [optionName]: {
            type,
            value: val,
            op: defaultOperators,
          },
        });

        return;
      }
    }

    const updatedValue: IOptions = {
      ...currentValue,
      [optionName]: {
        ...currentValue[optionName],
        type,
        value: val,
      },
    };

    if (isFunction) {
      updatedValue[optionName].is_expression = true;
    } else {
      delete updatedValue[optionName].is_expression;
    }

    const meta: IOptionsOnChangeMeta = {};

    // Check if this option has dependents and if the value has changed
    // If it has, call the onDependableOptionChange function
    if (
      options[optionName].has_dependents &&
      val !== undefined &&
      val !== currentValue[optionName]?.value
    ) {
      // We also need to remove the value from all dependants
      forEach(options, (option, name) => {
        if (option.depends_on?.includes(optionName) && updatedValue[name]) {
          updatedValue[name].value = undefined;
        }
      });

      onDependableOptionChange?.(optionName, val, updatedValue, options);
    }

    // Check if this option has on_change events
    if (size(options[optionName].on_change)) {
      meta.events = options[optionName].on_change;
    }

    onSingleOptionsChange?.(optionName, updatedValue[optionName]);
    onChange?.(name, updatedValue, meta);
  };

  const handleOperatorChange = (
    optionName: string,
    currentValue: IOptions,
    operator: string,
    index: number
  ) => {
    onChange?.(name, {
      ...currentValue,
      [optionName]: {
        ...currentValue[optionName],
        op: fixOperatorValue(currentValue[optionName].op).map((op, idx) => {
          if (idx === index) {
            return operator;
          }
          return op as string;
        }),
      },
    });
  };

  // Add empty operator at the provider index
  const handleAddOperator = (optionName, currentValue: IOptions, index: number) => {
    onChange?.(name, {
      ...currentValue,
      [optionName]: {
        ...currentValue[optionName],
        op: insertAtIndex(fixOperatorValue(currentValue[optionName].op), index, null),
      },
    });
  };

  const handleRemoveOperator = (optionName, currentValue: IOptions, index: number) => {
    onChange?.(name, {
      ...currentValue,
      [optionName]: {
        ...currentValue[optionName],
        op: fixOperatorValue(currentValue[optionName].op).filter((_op, idx) => idx !== index),
      },
    });
  };

  const removeValue = () => {
    onChange?.(name, undefined);
  };

  const buildBadges = useCallback((option: IOptionsSchemaArg): IReqorePanelProps['badge'] => {
    const badges: IReqorePanelProps['badge'] = [];

    if (option.required) {
      badges.push({
        icon: 'Asterisk',
        leftIconProps: {
          size: 'tiny',
        },
        tooltip: t('This option is required'),
      });
    }

    if (option.has_dependents) {
      badges.push({
        icon: 'LinkUnlink',
        intent: 'info',
        tooltip: t(
          'Other options depend on this option, changing it may result in configuration changes.'
        ),
      });
    }

    return badges;
  }, []);

  if ((operatorsUrl && !operators) || (!rest.options && !options) || templates.loading || loading) {
    return (
      <ReqorePanel fill flat transparent>
        <ReqoreSpinner
          iconColor='info'
          type={3}
          centered
          size='big'
          iconProps={{
            image:
              'https://hq.qoretechnologies.com:8092/api/public/apps/QorusBuiltinApi/qorus-builtin-api.svg',
          }}
          labelEffect={{
            uppercase: true,
            spaced: 4,
            textSize: 'small',
            weight: 'bold',
          }}
        >
          {t('LoadingOptions')}
        </ReqoreSpinner>
      </ReqorePanel>
    );
  }

  if (!options || !size(options)) {
    return (
      <ReqoreMessage intent='warning' opaque={false}>
        {t('NoOptionsAvailable')}
      </ReqoreMessage>
    );
  }

  const fixedValue: IOptions = value;
  const removeSelectedOption = (optionName: string) => {
    const newValue = cloneDeep(value);

    delete newValue?.[optionName];

    onChange?.(name, newValue);
  };

  const addSelectedOption = (optionName: string) => {
    handleValueChange(
      optionName,
      fixedValue,
      options[optionName].default_value,
      getTypeAndCanBeNull(options[optionName].type, options[optionName].allowed_values).type
    );
  };

  let unavailableOptionsCount = 0;
  const availableOptions: IOptions = Object.keys(fixedValue)
    .sort((a, b) => {
      const aSort = options[a]?.sort || 0;
      const bSort = options[b]?.sort || 0;

      return aSort - bSort;
    })
    .reduce((newValue, optionName) => {
      const option = fixedValue[optionName];
      // Check if this option is in the options schema
      // do not add it if not
      if (!options?.[optionName]) {
        unavailableOptionsCount += 1;
        return newValue;
      }

      if (!isObject(option)) {
        return {
          ...newValue,
          [optionName]: {
            type: getType(options[optionName].type, operators, option?.op),
            value: option,
          },
        };
      }

      return { ...newValue, [optionName]: option };
    }, {});

  const filteredOptions: IOptionsSchema = reduce(
    options,
    (newOptions, option, name) => {
      if (fixedValue && name in fixedValue) {
        return newOptions;
      }

      return { ...newOptions, [name]: option };
    },
    {}
  );

  const isOptionValid = (optionName: string, type: IQorusType, optionValue: any) => {
    // If the option is not required and undefined it's valid :)
    if (!options[optionName].required && (optionValue === undefined || optionValue === '')) {
      return true;
    }

    return validateField(getType(type), optionValue, {
      isFunction: value[optionName]?.is_expression,
      has_to_have_value: true,
      ...options[optionName],
    });
  };

  const getIntent = (name, type, value, op): TReqoreIntent => {
    const intent =
      isOptionValid(name, type, value) && (operatorsUrl ? !!op : true)
        ? undefined
        : recordRequiresSearchOptions
          ? 'info'
          : 'danger';

    return intent || options[name].intent;
  };

  if (error) {
    return (
      <ReqoreMessage intent='danger' title={t('ErrorLoadingOptions')}>
        {t(error)}
      </ReqoreMessage>
    );
  }

  return (
    <>
      {recordRequiresSearchOptions && !readOnly ? (
        <>
          <ReqoreMessage intent='info'>
            This provider record requires some search options to be set. You can set them below.
          </ReqoreMessage>
          <ReqoreVerticalSpacer height={10} />
        </>
      ) : null}
      <ReqoreCollection
        label='Options'
        minColumnWidth='450px'
        responsiveTitle={false}
        headerSize={4}
        filterable
        sortable
        flat={false}
        minimal
        contentRenderer={(children) => (
          <>
            {unavailableOptionsCount ? (
              <>
                <ReqoreMessage intent='warning' opaque={false}>
                  {`${unavailableOptionsCount} option(s) hidden because they are not supported on the current instance`}
                </ReqoreMessage>
                <ReqoreVerticalSpacer height={10} />
              </>
            ) : null}
            {children}
            {size(filteredOptions) >= 1 && !readOnly ? (
              <>
                <ReqoreVerticalSpacer height={10} />
                <SelectField
                  name='options'
                  defaultItems={Object.keys(filteredOptions).map(
                    (option): ISelectFieldItem => ({
                      name: option,
                      desc: options[option].desc,
                      short_desc: options[option].short_desc,
                      disabled: options[option].disabled,
                      display_name: options[option].display_name,
                      intent: options[option].intent,
                      messages: options[option].messages,
                    })
                  )}
                  fill
                  customTheme={{
                    main: '#22273b',
                  }}
                  onChange={(_name, value) => addSelectedOption(value)}
                  placeholder={`${t(placeholder || 'AddNewOption')} (${size(filteredOptions)})`}
                />
              </>
            ) : null}
          </>
        )}
        badge={size(fixedValue)}
        intent={isValid === false ? 'danger' : undefined}
        style={{ width: '100%' }}
        defaultZoom={0.5}
        items={map(
          availableOptions,
          ({ type, ...other }, optionName): IReqoreCollectionItemProps => ({
            label: options[optionName]?.display_name || optionName,
            customTheme: {
              main: 'main:darken:1',
            },
            icon: !isOptionValid(optionName, type, other.value) ? 'SpamFill' : undefined,
            transparent: false,
            intent: getIntent(optionName, type, other.value, other.op),
            badge: buildBadges(options[optionName]),
            className: 'system-option',
            actions: [
              {
                icon: 'DeleteBinLine',
                intent: 'danger',
                show:
                  !options[optionName].preselected && !options[optionName].required && !readOnly,
                onClick: () => {
                  confirmAction({
                    title: 'RemoveSelectedOption',
                    onConfirm: () => {
                      removeSelectedOption(optionName);
                    },
                  });
                },
              },
            ],
            content: (
              <>
                <Description
                  type={options[optionName].type as TQorusType}
                  shortDescription={options[optionName].short_desc}
                  longDescription={options[optionName].desc}
                />
                {(options[optionName].messages || []).map(({ intent, title, content }, index) => (
                  <ReqoreMessage
                    intent={intent}
                    title={title}
                    key={title || index}
                    opaque={false}
                    size='small'
                    margin='bottom'
                  >
                    {content}
                  </ReqoreMessage>
                ))}
                {operators && size(operators) ? (
                  <>
                    <ReqoreControlGroup fill wrap className='operators'>
                      {fixOperatorValue(other.op).map((operator, index) => (
                        <React.Fragment key={index}>
                          <SelectField
                            fixed
                            defaultItems={map(operators, (operator) => ({
                              ...operator,
                            }))}
                            disabled={readOnly}
                            value={operator && `${operators?.[operator].name}`}
                            onChange={(_n, val) => {
                              if (val !== undefined) {
                                handleOperatorChange(
                                  optionName,
                                  fixedValue,
                                  findKey(operators, (operator) => operator.name === val) as string,
                                  index
                                );
                              }
                            }}
                          />
                          {index === fixOperatorValue(other.op).length - 1 &&
                          operator &&
                          operators[operator].supports_nesting ? (
                            <ReqoreButton
                              icon='AddLine'
                              disabled={readOnly}
                              fixed
                              effect={PositiveColorEffect}
                              onClick={() => handleAddOperator(optionName, fixedValue, index + 1)}
                            />
                          ) : null}
                          {size(fixOperatorValue(other.op)) > 1 ? (
                            <ReqoreButton
                              disabled={readOnly}
                              icon='DeleteBinLine'
                              effect={NegativeColorEffect}
                              fixed
                              onClick={() => handleRemoveOperator(optionName, fixedValue, index)}
                            />
                          ) : null}
                        </React.Fragment>
                      ))}
                    </ReqoreControlGroup>
                    <ReqoreVerticalSpacer height={5} />
                  </>
                ) : null}
                <TemplateField
                  {...options[optionName]}
                  allowTemplates={!!(allowTemplates && options[optionName].supports_templates)}
                  allowFunctions={!!options[optionName].supports_expressions}
                  fluid
                  templates={templates.value}
                  component={AutoField}
                  {...getTypeAndCanBeNull(type, options[optionName].allowed_values, other.op)}
                  className='system-option'
                  name={optionName}
                  onChange={(optionName, val, givenType, isFunction) => {
                    if (val !== undefined && val !== other.value) {
                      handleValueChange(
                        optionName,
                        fixedValue,
                        val,
                        givenType ||
                          getTypeAndCanBeNull(type, options[optionName].allowed_values).type,
                        isFunction
                      );
                    }
                  }}
                  key={optionName}
                  arg_schema={options[optionName].arg_schema}
                  noSoft={!!rest?.options}
                  value={other.value}
                  isFunction={other.is_expression}
                  sensitive={options[optionName].sensitive}
                  default_value={options[optionName].default_value}
                  allowed_values={options[optionName].allowed_values}
                  disabled={
                    options[optionName].disabled ||
                    readOnly ||
                    !hasAllDependenciesFullfilled(
                      options[optionName].depends_on,
                      availableOptions,
                      options
                    )
                  }
                  readOnly={readOnly}
                />
                <OptionFieldMessages
                  schema={options}
                  allOptions={availableOptions}
                  name={optionName}
                  option={{ type, ...other }}
                />
                {operators && size(operators) && size(other.op) ? (
                  <>
                    <ReqoreVerticalSpacer height={5} />
                    <ReqoreMessage size='small'>
                      <ReqoreTagGroup>
                        <ReqoreTag size='small' labelKey='WHERE' label={optionName} />
                        <ReqoreTag
                          size='small'
                          labelKey='IS'
                          label={fixOperatorValue(other.op).join(' ')}
                        />
                        <ReqoreTag
                          size='small'
                          intent='info'
                          label={other.value?.toString() || ''}
                        />
                      </ReqoreTagGroup>
                    </ReqoreMessage>
                  </>
                ) : null}
              </>
            ),
          })
        )}
        {...rest}
      />
    </>
  );
};

export default Options;
