import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreTag,
  ReqoreTagGroup,
} from '@qoretechnologies/reqore';
import { IReqoreTextareaProps } from '@qoretechnologies/reqore/dist/components/Textarea';
import { useContext, useEffect, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import { TextContext } from '../../context/text';
import { filterTemplatesByType } from '../../helpers/functions';
import Auto from './auto';
import BooleanField from './boolean';
import DateField from './date';
import LongStringField from './longString';
import Number from './number';

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
  onChange?: (name: string, value: any) => void;
  // React element
  component?: React.FC<any>;
  interfaceContext?: string;
  allowTemplates?: boolean;
  templates?: IReqoreTextareaProps['templates'];
  componentFromType?: boolean;
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
  componentFromType,
  ...rest
}: ITemplateFieldProps) => {
  const [isTemplate, setIsTemplate] = useState<boolean>(isValueTemplate(value));
  const [templateValue, setTemplateValue] = useState<string | null>(value);
  const t = useContext(TextContext);

  useEffect(() => {
    if (isTemplate) {
      setTemplateValue(value);
    }
  }, [value]);

  // When template key or template value change run the onChange function
  useUpdateEffect(() => {
    if (templateValue) {
      onChange?.(name, templateValue);
    }
  }, [templateValue]);

  const showTemplateToggle =
    allowTemplates &&
    (rest.type === 'number' ||
      rest.type === 'boolean' ||
      rest.type === 'date' ||
      rest.type === 'bool' ||
      rest.type === 'int');

  const Component = componentFromType ? ComponentMap[rest.type] : Comp;

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

  return (
    <ReqoreControlGroup fluid={rest.fluid} fixed={rest.fixed} size={rest.size}>
      {!isTemplate ? (
        <Component
          value={value}
          onChange={onChange}
          name={name}
          {...rest}
          className={`${rest.className} template-selector`}
          templates={
            allowTemplates
              ? filterTemplatesByType(templates, rest.type)
              : undefined
          }
        />
      ) : (
        <LongStringField
          className='template-selector'
          type='string'
          name='templateVal'
          value={templateValue}
          templates={
            allowTemplates
              ? filterTemplatesByType(templates, rest.type)
              : undefined
          }
          onChange={(_n, val) => setTemplateValue(val)}
          {...rest}
        />
      )}

      {showTemplateToggle && (
        <ReqoreButton
          fixed
          icon='MoneyDollarCircleLine'
          customTheme={{
            main: isTemplate ? 'info:darken:1:0.3' : undefined,
          }}
          tooltip={isTemplate ? 'Use custom value' : 'Use a template'}
          compact
          flat={!isTemplate}
          size={rest.size}
          onClick={() => {
            if (isTemplate) {
              setIsTemplate(false);
              setTemplateValue(null);
              onChange(name, null);
            } else {
              setIsTemplate(true);
              setTemplateValue(null);
              onChange(name, null);
            }
          }}
        />
      )}
    </ReqoreControlGroup>
  );
};
