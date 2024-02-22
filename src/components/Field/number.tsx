import { ReqoreDropdown, ReqoreInput } from '@qoretechnologies/reqore';
import { IReqoreFormTemplates } from '@qoretechnologies/reqore/dist/components/Textarea';
import { ChangeEvent, FunctionComponent } from 'react';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import { TTranslator } from '../../App';
import withMessageHandler, {
  TMessageListener,
  TPostMessage,
} from '../../hocomponents/withMessageHandler';
import withTextContext from '../../hocomponents/withTextContext';
import { IField, IFieldChange } from '../FieldWrapper';

export interface INumberField {
  t?: TTranslator;
  fill?: boolean;
  postMessage?: TPostMessage;
  addMessageListener?: TMessageListener;
  autoFocus?: boolean;
  templates?: IReqoreFormTemplates;
}

const NumberField: FunctionComponent<INumberField & IField & IFieldChange> = ({
  name,
  onChange,
  value,
  default_value,
  type,
  fill,
  postMessage,
  addMessageListener,
  get_message,
  return_message,
  autoFocus,
  templates,
  ...rest
}) => {
  // Fetch data on mount
  useMount(() => {
    // Populate default value
    if (value || default_value) {
      handleChange(value || default_value);
    }
    // Get backend data
    if (get_message && return_message) {
      postMessage(get_message.action);
      addMessageListener(return_message.action, (data: any) => {
        if (data) {
          handleChange(data[return_message.return_value]);
        }
      });
    }
  });

  const handleChange = (value: number | string): void => {
    onChange?.(
      name,
      type === 'int' || type === 'number'
        ? parseInt(value as string, 10)
        : parseFloat(value as string)
    );
  };

  // When input value changes
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleChange(event.target.value);
  };

  // Clear the input on reset click
  const handleResetClick = (): void => {
    onChange(name, null);
  };

  if (templates?.items) {
    return (
      <ReqoreDropdown
        {...rest}
        component={ReqoreInput}
        fluid={fill}
        icon='MoneyDollarCircleLine'
        items={templates?.items}
        filterable
        value={value ?? default_value ?? ''}
        onItemSelect={(item) => onChange(name, item.value)}
        onChange={handleInputChange}
        type='number'
        // @ts-ignore
        step={type === 'int' || type === 'number' ? 1 : 0.1}
        onClearClick={handleResetClick}
        focusRules={
          autoFocus
            ? {
                type: 'auto',
                viewportOnly: true,
              }
            : undefined
        }
      />
    );
  }

  return (
    <ReqoreInput
      {...rest}
      fluid={fill}
      icon='MoneyDollarCircleLine'
      value={value ?? default_value ?? ''}
      onChange={handleInputChange}
      type='number'
      // @ts-ignore
      step={type === 'int' || type === 'number' ? 1 : 0.1}
      onClearClick={handleResetClick}
      focusRules={
        autoFocus
          ? {
              type: 'auto',
              viewportOnly: true,
            }
          : undefined
      }
    />
  );
};

export default compose(
  withMessageHandler(),
  withTextContext()
)(NumberField) as FunctionComponent<INumberField & IField>;
