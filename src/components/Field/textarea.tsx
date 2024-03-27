import { ReqoreTextarea } from '@qoretechnologies/reqore';
import { FunctionComponent } from 'react';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import { TTranslator } from '../../App';
import {
  addMessageListener,
  postMessage,
} from '../../hocomponents/withMessageHandler';
import withTextContext from '../../hocomponents/withTextContext';
import { IField, IFieldChange } from '../FieldWrapper';

export interface ITextareaField {
  t?: TTranslator;
  fill?: boolean;
}

const TextareaField: FunctionComponent<
  ITextareaField & IField & IFieldChange
> = ({
  name,
  onChange,
  value,
  default_value,
  fill,
  get_message,
  return_message,
  placeholder,
}) => {
  // Fetch data on mount
  useMount(() => {
    // Populate default value
    if (default_value) {
      onChange(name, default_value);
    }
    // Get backend data
    if (get_message && return_message) {
      postMessage(get_message.action);
      addMessageListener(return_message.action, (data: any) => {
        if (data) {
          onChange(name, data[return_message.return_value]);
        }
      });
    }
  });

  // When input value changes
  const handleInputChange = (event: any): void => {
    onChange(name, event.target.value);
  };

  // Clear the input on reset click
  const handleResetClick = (): void => {
    onChange(name, '');
  };

  return (
    <ReqoreTextarea
      placeholder={placeholder}
      fluid={fill}
      value={!value ? default_value || '' : value}
      onChange={handleInputChange}
      scaleWithContent
    />
  );
};

export default compose(withTextContext())(TextareaField) as FunctionComponent<
  ITextareaField & IField & IFieldChange
>;
