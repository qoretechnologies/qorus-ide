import { ReqoreControlGroup, ReqoreInput, ReqoreTag } from '@qoretechnologies/reqore';
import { IReqoreInputProps } from '@qoretechnologies/reqore/dist/components/Input';
import { ChangeEvent } from 'react';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import { isNull } from 'util';
import { TTranslator } from '../../App';
import { getValueOrDefaultValue } from '../../helpers/validations';
import { addMessageListener, postMessage } from '../../hocomponents/withMessageHandler';
import withTextContext from '../../hocomponents/withTextContext';
import { IField, IFieldChange } from '../FieldWrapper';

export interface IStringField
  extends IField,
    Omit<IReqoreInputProps, 'type' | 'value' | 'onChange'> {
  t?: TTranslator;
  fill?: boolean;
  read_only?: boolean;
  placeholder?: string;
  canBeNull?: boolean;
  sensitive?: boolean;
  autoFocus?: boolean;
  onChange?: IFieldChange;
  label?: string | number;
  fillVertically?: boolean;
}

const StringField = ({
  name,
  onChange,
  value,
  default_value,
  fill = true,
  get_message,
  return_message,
  read_only,
  disabled,
  placeholder,
  canBeNull,
  sensitive,
  autoFocus,
  label,
  id,
  fillVertically,
  ...rest
}: IStringField) => {
  // Fetch data on mount
  useMount(() => {
    // Populate default value
    onChange && onChange(name, getValueOrDefaultValue(value, default_value, canBeNull));
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
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(name, event.target.value.toString());
  };

  // Clear the input on reset click
  const handleResetClick = (): void => {
    onChange(name, '');
  };

  return (
    <ReqoreControlGroup {...rest} fluid={!!fill} fill={fillVertically}>
      {label || label === 0 ? <ReqoreTag label={label} fixed /> : null}
      <ReqoreInput
        key={name}
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={read_only || (canBeNull && isNull(value))}
        fluid={!!fill}
        value={
          canBeNull && isNull(value) ? 'Value set to [null]' : !value ? default_value || '' : value
        }
        onFocus={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onChange={handleInputChange}
        type={sensitive ? 'password' : 'text'}
        focusRules={
          autoFocus
            ? {
                type: 'auto',
                viewportOnly: true,
              }
            : undefined
        }
        onClearClick={value && value !== '' && !read_only && !disabled && handleResetClick}
      />
    </ReqoreControlGroup>
  );
};

export default compose(withTextContext())(StringField) as React.FC<IStringField & IField>;
