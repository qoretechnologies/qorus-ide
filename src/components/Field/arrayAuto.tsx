import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqorePanel,
  ReqoreVerticalSpacer,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import size from 'lodash/size';
import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from 'react';
import useMount from 'react-use/lib/useMount';
import { IField } from '.';
import { TextContext } from '../../context/text';
import { IFieldChange } from '../FieldWrapper';
import AutoField from './auto';
import { PositiveColorEffect, StyledPairField } from './multiPair';
import { TemplateField } from './template';

export const allowedTypes: string[] = ['string', 'int', 'float', 'date'];

const ArrayAutoField: FunctionComponent<IField & IFieldChange> = ({
  name,
  onChange,
  value = [''],
  default_value,
  ...rest
}): any => {
  const transformValues: (
    toValues: boolean,
    data: any[] | { [id: number]: string | number | null }
  ) => any[] = (toValues, data) => {
    // Transform data to the object based values
    if (toValues) {
      return data.reduce(
        (newData, val: string | number, index: number) => ({
          ...newData,
          [index + 1]: val,
        }),
        {}
      );
    }
    // Transform the data to the end result (simple list)
    else {
      return reduce(
        data,
        (newData, value: string | number | null) => [...newData, value],
        []
      );
    }
  };

  const confirmAction = useReqoreProperty('confirmAction');

  const t = useContext(TextContext);
  const [values, setValues] = useState<{
    [id: number]: string | number | null;
  }>(transformValues(true, value));
  const [type, setType] = useState<string>(rest.type);
  const [lastId, setLastId] = useState<number>(size(value || []));

  useMount(() => {
    // Set the default value
    onChange(name, value || default_value || transformValues(false, values));
  });

  useEffect(() => {
    // Auto field type depends on other fields' value
    // which will be used as a type
    if (rest['type-depends-on']) {
      // Get the requested type
      const typeValue: string = rest.requestFieldData(
        rest['type-depends-on'],
        'value'
      );
      // Check if the field has the value set yet
      if (typeValue && typeValue !== type) {
        // Set the new type
        setType(typeValue);
        // Reset the values if the type is not
        // supported for allowed values
        if (!allowedTypes.includes(typeValue)) {
          setValues({ 1: '' });
        }
      }
    }
  });

  const canBeNull = (): boolean => {
    if (rest.requestFieldData) {
      return rest.requestFieldData('can_be_undefined', 'value');
    }

    return false;
  };

  useEffect(() => {
    // Transform the values and send them
    const data = transformValues(false, values);
    // Send the data
    onChange(name, data, undefined, canBeNull());
  }, [values]);

  const addValue: () => void = () => {
    setLastId((current: number) => {
      setValues((currentValues) => ({
        ...currentValues,
        [current + 1]: '',
      }));

      return current + 1;
    });
  };

  const handleRemoveClick: (name: number) => void = (name) => {
    setValues((current) => {
      const newValues = { ...current };
      delete newValues[name];
      return newValues;
    });
  };

  const handleChange: (name: string, value: any) => void = (name, value) => {
    // Set the new values
    setValues((current) => {
      const newValues = { ...current };
      newValues[name] = value;
      return newValues;
    });
  };

  // Render list of auto fields
  return (
    <>
      {map(
        values,
        (val: string | number, idx: string): typeof StyledPairField => (
          <React.Fragment key={idx}>
            <ReqorePanel
              label={`Item #${idx}`}
              collapsible
              className='array-auto-item'
              size='small'
              minimal
              actions={[
                {
                  show: size(values) !== 1,
                  icon: 'DeleteBinLine',
                  intent: 'danger',
                  className: 'array-auto-item-remove',
                  tooltip: 'Remove item',
                  onClick: () =>
                    confirmAction({
                      onConfirm: () => handleRemoveClick(Number(idx)),
                    }),
                  minimal: true,
                },
              ]}
            >
              <TemplateField
                component={AutoField}
                {...rest}
                fluid
                defaultType={type}
                name={`${name}-${idx}`}
                value={val}
                onChange={(_name, value) => handleChange(idx, value)}
              />
            </ReqorePanel>
            <ReqoreVerticalSpacer height={10} />
          </React.Fragment>
        )
      )}
      <ReqoreControlGroup fluid>
        <ReqoreButton
          onClick={addValue}
          icon='AddLine'
          rightIcon='AddLine'
          textAlign='center'
          effect={PositiveColorEffect}
        >
          Add new value
        </ReqoreButton>
      </ReqoreControlGroup>
    </>
  );
};

export default ArrayAutoField;
