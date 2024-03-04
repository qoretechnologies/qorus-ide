import { ReqoreTextarea } from '@qoretechnologies/reqore';
import { IReqoreTextareaProps } from '@qoretechnologies/reqore/dist/components/Textarea';
import { ChangeEvent, FunctionComponent } from 'react';
import useMount from 'react-use/lib/useMount';
import { TTranslator } from '../../App';
import {
  TMessageListener,
  TPostMessage,
  addMessageListener,
  postMessage,
} from '../../hocomponents/withMessageHandler';
import { IField, IFieldChange } from '../FieldWrapper';

export interface ILongStringField
  extends Omit<IReqoreTextareaProps, 'onChange'> {
  t?: TTranslator;
  postMessage?: TPostMessage;
  addMessageListener?: TMessageListener;
  noWrap?: boolean;
  onChange: IFieldChange;
  id?: string;
}

const LongStringField: FunctionComponent<ILongStringField & IField> = ({
  name,
  onChange,
  value,
  default_value,
  get_message,
  return_message,
  placeholder,
  intent,
  noWrap,
  id,
  disabled,
  ...rest
}) => {
  // Fetch data on mount
  useMount(() => {
    // Populate default value
    if (value || default_value) {
      onChange?.(name, value || default_value);
    }
    // Get backend data
    if (get_message && return_message) {
      postMessage(get_message.action);
      addMessageListener(return_message.action, (data: any) => {
        if (data) {
          onChange?.(name, data[return_message.return_value]);
        }
      });
    }
  });

  // When input value changes
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange?.(name, event.target.value.toString());
  };

  return (
    <ReqoreTextarea
      placeholder={placeholder}
      scaleWithContent
      fluid
      value={!value ? default_value || '' : value}
      onChange={handleInputChange}
      onClearClick={() => onChange?.(name, '')}
      intent={intent}
      id={id}
      disabled={disabled}
      {...rest}
    />
  );
};

export default LongStringField;
