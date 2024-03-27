import { FunctionComponent } from 'react';

import styled from 'styled-components';

import { IField } from '.';
import { TTranslator } from '../../App';
import { IFieldChange } from '../FieldWrapper';
import MultiSelect from './multiSelect';
import TreeField from './tree';

export interface IMultiFileField {
  get_message: { action: string; object_type: string };
  return_message: { action: string; object_type: string; return_value: string };
  name: string;
  t: TTranslator;
}

const Spacer = styled.div`
  margin: 5px;
`;

const MultiFileField: FunctionComponent<
  IMultiFileField & IField & IFieldChange
> = ({ onChange, name, value = [], ...rest }) => {
  return (
    <>
      <MultiSelect
        simple
        name={name}
        onChange={onChange}
        value={value}
        canEdit
        default_items={(value || []).map((val) => ({ name: val.name || val }))}
      />
      <Spacer />
      <TreeField onChange={onChange} name={name} value={value} {...rest} />
    </>
  );
};

export default MultiFileField;
