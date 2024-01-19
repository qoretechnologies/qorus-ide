import { FunctionComponent } from 'react';
import compose from 'recompose/compose';
import { TTranslator } from '../../App';
import withInitialDataConsumer from '../../hocomponents/withInitialDataConsumer';
import withTextContext from '../../hocomponents/withTextContext';
import { IField, IFieldChange } from '../FieldWrapper';
import ConnectorField from './connectors';

const TypeSelectorField: FunctionComponent<TTranslator & IField & IFieldChange> = ({
  name,
  onChange,
  value,
  t,
  initialData,
  providerType,
}) => {
  const handleChange: (name: string, val: any) => void = (name, val) => {
    onChange(name, val);
  };

  return (
    <ConnectorField
      value={value}
      isInitialEditing={!!initialData.workflow}
      name={name}
      onChange={handleChange}
      providerType={providerType}
    />
  );
};

export default compose(withInitialDataConsumer(), withTextContext())(TypeSelectorField);
