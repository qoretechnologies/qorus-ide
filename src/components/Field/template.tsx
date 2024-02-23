import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreDropdown,
  ReqoreSpinner,
  ReqoreTag,
  ReqoreTagGroup,
} from '@qoretechnologies/reqore';
import { IReqoreTextareaProps } from '@qoretechnologies/reqore/dist/components/Textarea';
import { useContext, useEffect, useState } from 'react';
import { useAsyncRetry, useUpdateEffect } from 'react-use';
import { TextContext } from '../../context/text';
import { fetchData, filterTemplatesByType } from '../../helpers/functions';
import {
  ExpressionBuilder,
  IExpression,
  IExpressionSchema,
} from '../ExpressionBuilder';
import Auto from './auto';
import BooleanField from './boolean';
import DateField from './date';
import LongStringField from './longString';
import Number from './number';
import { IQorusType } from './systemOptions';

/**
 * It checks if a string starts with a dollar sign, contains a colon, and if the text between the
 * dollar sign and the colon matches a template from the list
 * @param {string} value - The string to check if it's a template
 * @returns A function that takes a string and returns a boolean.
 */
export const isValueTemplate = (value?: any) => {
  if (
    typeof value !== 'string' ||
    !value?.startsWith('$') ||
    !value?.includes(':')
  ) {
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
  onChange?: (
    name: string,
    value: any,
    type?: IQorusType,
    isFunction?: boolean
  ) => void;
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
  const type = rest.type || rest.defaultType;

  const functions = useAsyncRetry<IExpressionSchema[]>(async () => {
    if (!allowFunctions) {
      return [];
    }

    const data = await fetchData(`/system/expressions?return_type=${type}`);

    return data.data;
  }, [type]);

  const [isTemplate, setIsTemplate] = useState<boolean>(
    isValueTemplate(value) || !allowCustomValues
  );
  const [templateValue, setTemplateValue] = useState<string | null>(value);
  const t = useContext(TextContext);

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
    (type === 'boolean' ||
      type === 'date' ||
      type === 'bool' ||
      type === 'auto' ||
      type === 'any');

  const templateSupportsCustomValues =
    allowCustomValues &&
    (type === 'string' || type === 'list' || type === 'hash');
  const showTemplatesDropdown =
    allowTemplates &&
    (!allowCustomValues || (isTemplate && !templateSupportsCustomValues));

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

  if (isFunction) {
    return (
      <>
        <ExpressionBuilder
          value={value}
          type={type}
          returnType={type}
          onChange={(
            expressionValue: IExpression | undefined,
            remove: boolean
          ) => {
            onChange(
              name,
              expressionValue || value?.args[0]?.value,
              type,
              !remove
            );
          }}
        />
      </>
    );
  }

  return (
    <ReqoreControlGroup fluid={rest.fluid} fixed={rest.fixed} size={rest.size}>
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
                ? filterTemplatesByType(templates, type)
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
                ? filterTemplatesByType(templates, type)
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
            onItemSelect={(item) =>
              onChange(name, item.value, item.badge as IQorusType)
            }
            items={
              filterTemplates
                ? filterTemplatesByType(templates, type)?.items
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

      {allowFunctions && (
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
                    type,
                    value,
                  },
                ],
              },
              undefined,
              true
            );
          }}
        />
      )}

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
