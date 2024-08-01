import {
  DatePicker,
  ReqoreInput,
  useReqoreTheme,
} from '@qoretechnologies/reqore';
import { FunctionComponent } from 'react';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import styled from 'styled-components';
import { TTranslator } from '../../App';
import { getValueOrDefaultValue } from '../../helpers/validations';
import {
  addMessageListener,
  postMessage,
} from '../../hocomponents/withMessageHandler';
import withTextContext from '../../hocomponents/withTextContext';
import { IField, IFieldChange } from '../FieldWrapper';

export interface IDateField {
  t?: TTranslator;
  fill?: boolean;
}

const StyledDateField = styled(ReqoreInput)`
  cursor: pointer;
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const DateField: FunctionComponent<IDateField & IField & IFieldChange> = ({
  name,
  onChange,
  value,
  default_value,
  get_message,
  return_message,
  t,
  disabled,
  ...rest
}) => {
  const theme = useReqoreTheme();
  // Fetch data on mount
  useMount(() => {
    // Populate default value
    if (default_value) {
      onChange(
        name,
        getValueOrDefaultValue(value, default_value || new Date(), false)
      );
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
  const handleInputChange = (date: string): void => {
    onChange(name, date);
  };

  return (
    <DatePicker
      {...rest}
      value={value || default_value}
      onChange={handleInputChange}
      customTheme={theme}
      isDisabled={disabled}
    />
  );
};

export default compose(withTextContext())(DateField) as FunctionComponent<
  IDateField & IField & IFieldChange
>;
