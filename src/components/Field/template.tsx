import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreDropdown,
  ReqoreSpinner,
  ReqoreTag,
  ReqoreTagGroup,
} from '@qoretechnologies/reqore';
import { IReqoreTextareaProps } from '@qoretechnologies/reqore/dist/components/Textarea';
import { size } from 'lodash';
import { useEffect, useState } from 'react';
import { useAsyncRetry, useUpdateEffect } from 'react-use';
import {
  ExpressionBuilder,
  IExpression,
  IExpressionSchema,
} from '../../components/ExpressionBuilder';
import {
  fetchData,
  filterTemplatesByType,
  getExpressionArgumentType,
} from '../../helpers/functions';
import { useQorusTypes } from '../../hooks/useQorusTypes';
import Auto from '../Field/auto';
import BooleanField from '../Field/boolean';
import DateField from '../Field/date';
import LongStringField from '../Field/longString';
import Number from '../Field/number';
import { RichTextField } from './richText';

export type IQorusType =
  | 'string'
  | 'int'
  | 'integer'
  | 'list'
  | 'bool'
  | 'boolean'
  | 'float'
  | 'binary'
  | 'hash'
  | 'date'
  | 'any'
  | 'auto'
  | 'mapper'
  | 'workflow'
  | 'service'
  | 'job'
  | 'select-string'
  | 'data-provider'
  | 'file-as-string'
  | 'connection'
  | 'number'
  | 'nothing'
  | 'null'
  | 'rgbcolor';

/**
 * It checks if a string starts with a dollar sign, contains a colon, and if the text between the
 * dollar sign and the colon matches a template from the list
 * @param {string} value - The string to check if it's a template
 * @returns A function that takes a string and returns a boolean.
 */
export const isValueTemplate = (value?: any) => {
  if (typeof value !== 'string' || !value?.startsWith('$') || !value?.includes(':')) {
    return false;
  }

  return true;
};

/**
 * It returns the key of a template string, or null if the string is not a template
 * @param {string} [value] - The value to check.
 * @returns The key of the template.
 */
export const getTemplateKey = (value?: string) => {
  if (value && isValueTemplate(value)) {
    return value.substring(value.indexOf('$') + 1, value.indexOf(':'));
  }

  return null;
};

/**
 * It returns the value of a template string, or null if the value is not a template string
 * @param {string} [value] - The value to check.
 * @returns The value of the template.
 */
export const getTemplateValue = (value?: string) => {
  if (value && isValueTemplate(value)) {
    return value.substring(value.indexOf(':') + 1);
  }
  return null;
};

export interface ITemplateFieldProps {
  value?: any;
  name?: string;
  onChange?: (name: string, value: any, type?: IQorusType, isFunction?: boolean) => void;
  // React element
  component?: React.FC<any>;
  interfaceContext?: string;
  allowTemplates?: boolean;
  templates?: IReqoreTextareaProps['templates'];
  componentFromType?: boolean;
  allowCustomValues?: boolean;
  allowFunctions?: boolean;
  filterTemplates?: boolean;
  isFunction?: boolean;
  [key: string]: any;
}

export const ComponentMap = {
  string: LongStringField,
  number: Number,
  int: Number,
  float: Number,
  list: LongStringField,
  hash: LongStringField,
  binary: LongStringField,
  bool: BooleanField,
  boolean: BooleanField,
  date: DateField,
  richtext: RichTextField,
};

export const TemplateField = ({
  value,
  name,
  onChange,
  component: Comp = Auto,
  templates,
  interfaceContext,
  allowTemplates = true,
  allowFunctions,
  allowCustomValues = true,
  filterTemplates = true,
  componentFromType,
  isFunction,
  ...rest
}: ITemplateFieldProps) => {
  const qorusTypes = useQorusTypes();
  const type = rest.type || rest.defaultType;

  const functions = useAsyncRetry<IExpressionSchema[]>(async () => {
    if (!allowFunctions) {
      return [];
    }

    const data = await fetchData(`/system/expressions?first_arg_type=${type}`);

    return data.data;
  }, [type]);

  const [isTemplate, setIsTemplate] = useState<boolean>(
    isValueTemplate(value) || !allowCustomValues
  );
  const [templateValue, setTemplateValue] = useState<string | null>(value);

  useEffect(() => {
    if (isTemplate) {
      setTemplateValue(value);
    }
  }, [JSON.stringify(value)]);

  useEffect(() => {
    if (!isTemplate && isValueTemplate(value)) {
      setIsTemplate(true);
      setTemplateValue(value);
    }
  }, [JSON.stringify(value)]);

  // When template key or template value change run the onChange function
  useUpdateEffect(() => {
    if (templateValue) {
      onChange?.(name, templateValue, type, isFunction);
    }
  }, [JSON.stringify(templateValue)]);

  const showTemplateToggle =
    allowCustomValues &&
    allowTemplates &&
    !rest.arg_schema &&
    (type === 'boolean' ||
      type === 'date' ||
      type === 'bool' ||
      type === 'auto' ||
      type === 'hash' ||
      type === 'list' ||
      type === 'any');

  const templateSupportsCustomValues = allowCustomValues && type === 'string';
  const showTemplatesDropdown =
    allowTemplates && (!allowCustomValues || (isTemplate && !templateSupportsCustomValues));

  const Component = componentFromType ? ComponentMap[type] : Comp;

  if (allowFunctions && functions.loading) {
    return (
      <ReqoreSpinner type={5} iconColor='info'>
        Loading...{' '}
      </ReqoreSpinner>
    );
  }

  if (rest.disabled) {
    if (isTemplate) {
      return (
        <ReqoreTagGroup>
          <ReqoreTag label={templateValue} />
        </ReqoreTagGroup>
      );
    }

    return <Comp value={value} onChange={onChange} name={name} {...rest} />;
  }

  if (isFunction && !size(rest.allowed_values)) {
    return (
      <>
        <ExpressionBuilder
          value={{
            is_expression: true,
            value,
          }}
          type={type}
          returnType={type}
          onChange={(expressionValue: IExpression | undefined, remove: boolean) => {
            onChange(name, expressionValue?.value || value?.args[0]?.value, type, !remove);
          }}
        />
      </>
    );
  }

  return (
    <ReqoreControlGroup
      fluid={rest.fluid}
      fixed={rest.fixed}
      size={rest.size}
      stack={rest.stack}
      verticalAlign='flex-start'
    >
      {!isTemplate && (
        <Component
          value={value}
          onChange={onChange}
          name={name}
          {...rest}
          className={`${rest.className} template-selector`}
          templates={
            allowTemplates
              ? filterTemplates
                ? filterTemplatesByType(templates, type, !!rest.arg_schema)
                : templates
              : undefined
          }
        />
      )}
      {isTemplate && templateSupportsCustomValues ? (
        <LongStringField
          className='template-selector'
          type='string'
          name='templateVal'
          value={templateValue}
          templates={
            allowTemplates
              ? filterTemplates
                ? filterTemplatesByType(templates, type, !!rest.arg_schema)
                : templates
              : undefined
          }
          onChange={(_n, val) => {
            if (!val) {
              setIsTemplate(false);
              setTemplateValue(null);
              onChange(name, undefined);
            } else {
              setTemplateValue(val);
            }
          }}
          {...rest}
        />
      ) : null}
      {showTemplatesDropdown ? (
        <ReqoreControlGroup stack>
          <ReqoreDropdown
            className='template-selector'
            onItemSelect={(item) => onChange(name, item.value, item.badge as IQorusType)}
            items={
              filterTemplates
                ? filterTemplatesByType(templates, type, !!rest.arg_schema)?.items
                : templates?.items
            }
            label={isValueTemplate(value) ? value : 'Select Template'}
            filterable
          />
          {allowCustomValues || value ? (
            <ReqoreButton
              fixed
              icon='CloseLine'
              tooltip='Remove template value'
              className='template-remove'
              compact
              flat
              size={rest.size}
              onClick={() => {
                if (allowCustomValues) {
                  setIsTemplate(false);
                }

                setTemplateValue(null);
                onChange(name, undefined);
              }}
            />
          ) : null}
        </ReqoreControlGroup>
      ) : null}

      {allowFunctions && !size(rest.allowed_values) && !rest.readonly ? (
        <ReqoreDropdown
          items={functions.value?.map((func) => ({
            label: func.display_name,
            description: func.short_desc,
            value: func.name,
          }))}
          className='function-selector'
          icon='Functions'
          onItemSelect={(item) => {
            const func = functions.value.find((f) => f.name === item.value);
            setIsTemplate(false);
            setTemplateValue(null);

            onChange(
              name,
              {
                exp: func.name,
                args: [
                  {
                    type: getExpressionArgumentType(func.args[0], qorusTypes.value),
                    value,
                  },
                ],
              },
              undefined,
              true
            );
          }}
        />
      ) : null}

      {showTemplateToggle && !isTemplate ? (
        <ReqoreButton
          fixed
          icon='MoneyDollarCircleLine'
          className='template-toggle'
          customTheme={{
            main: isTemplate ? 'info:darken:1:0.3' : undefined,
          }}
          tooltip={isTemplate ? 'Use custom value' : 'Use a template'}
          compact
          flat={!isTemplate}
          size={rest.size}
          onClick={() => {
            setIsTemplate(true);
            setTemplateValue(null);
            onChange(name, undefined);
          }}
        />
      ) : null}
    </ReqoreControlGroup>
  );
};
