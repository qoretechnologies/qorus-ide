import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreMessage,
} from '@qoretechnologies/reqore';
import { get, map, set, size } from 'lodash';
import { useEffect, useState } from 'react';
import useMount from 'react-use/lib/useMount';
import {
  getTypeFromValue,
  getValueOrDefaultValue,
  maybeParseYaml,
  validateField,
} from '../../helpers/validations';
import withTextContext from '../../hocomponents/withTextContext';
import { ConnectionManagement } from '../ConnectionManagement';
import { IField } from '../FieldWrapper';
import SubField from '../SubField';
import BooleanField from './boolean';
import ByteSizeField from './byteSize';
import { ColorField } from './color';
import ConnectorField from './connectors';
import DateField from './date';
import FileField from './fileString';
import { InterfaceSelector } from './interfaceSelector';
import LongStringField from './longString';
import MultiSelect from './multiSelect';
import NumberField from './number';
import OptionHashField from './optionHash';
import RadioField from './radioField';
import SelectField, { ISelectFieldItem } from './select';
import StringField from './string';
import { IOptionsSchema, IQorusType } from './systemOptions';

export interface IAutoFieldProps extends IField {
  arg_schema?: IOptionsSchema;
  path?: string;
  column?: boolean;
  level?: number;
  defaultType?: IQorusType;
  defaultInternalType?: IQorusType;
  noSoft?: boolean;

  allowed_values?: ISelectFieldItem[];
  app?: string;
  action?: string;

  isConfigItem?: boolean;
  isVariable?: boolean;
  disableSearchOptions?: boolean;

  allowedTypes?: { name: IQorusType }[];
}

export const DefaultNoSoftTypes = [
  { name: 'bool' },
  { name: 'date' },
  { name: 'string' },
  { name: 'binary' },
  { name: 'float' },
  { name: 'list' },
  { name: 'hash' },
  { name: 'int' },
  { name: 'color' },
];

function AutoField<T = any>({
  name,
  onChange,
  value,
  default_value,
  defaultType,
  defaultInternalType,
  requestFieldData,
  type,
  t,
  noSoft,
  path,
  arg_schema,
  column,
  level = 0,
  canBeNull,
  isConfigItem,
  isVariable,
  allowedTypes,
  ...rest
}: IAutoFieldProps & T) {
  const [currentType, setType] = useState<IQorusType>(
    defaultInternalType || null
  );
  const [currentInternalType, setInternalType] = useState<IQorusType>(
    defaultInternalType || 'any'
  );
  const [isSetToNull, setIsSetToNull] = useState<boolean>(false);

  useMount(() => {
    let defType: IQorusType =
      defaultType && (defaultType.replace(/"/g, '').trim() as any);
    defType = defType || 'any';
    let internalType;
    // If value already exists, but the type is auto or any
    // set the type based on the value
    if (
      value &&
      (defType === 'auto' || defType === 'any') &&
      !defaultInternalType
    ) {
      internalType = getTypeFromValue(maybeParseYaml(value));
    } else {
      internalType = defaultInternalType || defType;
    }
    setInternalType(internalType);
    setType(defType);
    // If the value is null and can be null, set the null flag
    if (
      (getValueOrDefaultValue(value, default_value, _canBeNull(defType)) ===
        'null' ||
        getValueOrDefaultValue(value, default_value, _canBeNull(defType)) ===
          null) &&
      _canBeNull(defType)
    ) {
      setIsSetToNull(true);
    }

    // Set the default value
    handleChange(
      name,
      getValueOrDefaultValue(value, default_value, _canBeNull(internalType)),
      internalType
    );
  });

  useEffect(() => {
    // Auto field type depends on other fields' value
    // which will be used as a type
    if (rest['type-depends-on']) {
      // Get the requested type
      const typeValue: IQorusType = requestFieldData(
        rest['type-depends-on'],
        'value'
      );
      // Check if the field has the value set yet
      if (typeValue && typeValue !== currentType) {
        // If this is auto / any field
        // set the internal type
        if (typeValue === 'auto' || typeValue === 'any') {
          setInternalType(
            value ? getTypeFromValue(maybeParseYaml(value)) : 'any'
          );
        } else {
          setInternalType(typeValue);
        }
        // Set the new type
        setType(typeValue);
        if (!currentType) {
          handleChange(
            name,
            value === undefined ? undefined : value,
            typeValue
          );
        } else if (typeValue !== 'any') {
          const typeFromValue =
            value || value === null
              ? getTypeFromValue(maybeParseYaml(value))
              : 'any';

          handleChange(
            name,
            value === null
              ? null
              : typeValue === typeFromValue
              ? value
              : undefined,
            typeValue
          );
        }
      }
    }
    // If can be undefined was toggled off, but the value right now is null
    // we need to set the ability to be null to false and remove
    if (!_canBeNull() && isSetToNull) {
      setIsSetToNull(false);
      handleChange(name, null);
    }
  });

  const _canBeNull = (type = currentType) => {
    console.log(type);
    if (type === 'any' || type === 'Any' || canBeNull) {
      return true;
    }

    if (requestFieldData) {
      return requestFieldData('can_be_undefined', 'value');
    }

    return false;
  };

  const handleChange: (name: string, value: any, type?: IQorusType) => void = (
    name,
    value,
    type
  ) => {
    const returnType: IQorusType = currentInternalType || currentType || type;
    // Run the onchange
    if (onChange && returnType) {
      onChange(name, value, returnType, _canBeNull(returnType));
    }
  };

  const handleTypeChange: (name: string, type?: IQorusType) => void = (
    name,
    type
  ) => {
    // Run the onchange
    onChange?.(name, null, type);
    setInternalType(type);
  };

  const handleNullToggle = () => {
    setType(defaultType || 'any');
    setInternalType(defaultType || 'any');
    setIsSetToNull((current) => {
      return !current;
    });

    // Handle change
    handleChange(name, isSetToNull ? undefined : null);
  };

  const renderField = (currentType: string) => {
    // If this field is set to null
    if (isSetToNull) {
      // Render a readonly field with null
      return (
        <StringField
          name={name}
          value={null}
          onChange={handleChange}
          read_only
          canBeNull
        />
      );
    }
    if (!currentType) {
      return null;
    }
    // Check if there is a `<` in the type
    const pos: number = currentType.indexOf('<');

    if (pos > 0) {
      // Get the type from start to the position of the `<`
      currentType = currentType.slice(0, pos);
    }

    if (rest.allowed_values && currentType !== 'enum') {
      if (currentType === 'list') {
        return (
          <MultiSelect
            default_items={rest.allowed_values.map(
              ({ value, name, ...rest }) => ({
                name: name || value,
                value,
                ...rest,
              })
            )}
            name={name}
            onChange={(name, value) => onChange(name, value)}
          />
        );
      }

      return (
        <SelectField
          defaultItems={rest.allowed_values.map(({ value, name, ...rest }) => ({
            name: name || value,
            ...rest,
          }))}
          value={value}
          autoSelect
          name={name}
          onChange={(name, value) => onChange(name, value)}
          type={currentType}
          fluid
          fixed={false}
          showDescription={rest.showDescription}
          style={{ width: '100%' }}
          size={rest.size}
        />
      );
    }

    // Render the field based on the type
    switch (currentType) {
      case 'string':
      case 'softstring':
      case 'data':
      case 'binary':
        return (
          <LongStringField
            fill
            {...rest}
            name={name}
            onChange={(name, value) => {
              handleChange(name, value);
            }}
            value={value}
            type={currentType}
          />
        );
      case 'bool':
      case 'softbool':
        return (
          <BooleanField
            fill
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            type={currentType}
          />
        );
      case 'date':
        return (
          <DateField
            fill
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            type={currentType}
          />
        );
      case 'hash':
      case 'hash<auto>': {
        if (arg_schema) {
          const currentPath = path ? `${path}.` : '';
          const transformedValue =
            typeof value === 'string' ? maybeParseYaml(value) : value;

          return map(arg_schema, (schema, option) => {
            return (
              <SubField
                title={option}
                {...schema}
                desc={`${schema.desc}`}
                descTitle={`${currentPath}${option}`}
                collapsible
                nested={level > 0}
                isValid={
                  schema.required
                    ? validateField(
                        schema.type,
                        get(transformedValue, `${option}`)
                      )
                    : true
                }
                detail={schema.required ? 'Required' : 'Optional'}
              >
                <AutoField
                  {...schema}
                  path={`${currentPath}${option}`}
                  name={`${currentPath}${option}`}
                  level={level + 1}
                  defaultType={schema.type}
                  defaultInternalType={schema.type}
                  value={get(transformedValue, `${option}`)}
                  onChange={(n, v) => {
                    if (v !== undefined) {
                      if (level === 0) {
                        const newValue = set(transformedValue || {}, n, v);

                        handleChange(name, newValue);
                      } else {
                        handleChange(n, v);
                      }
                    }
                  }}
                  column
                />
              </SubField>
            );
          });
        }

        return (
          <LongStringField
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            fill
            type={currentType}
            noWrap
            placeholder={'Yaml'}
          />
        );
      }
      case 'list':
      case 'softlist<string>':
      case 'softlist':
      case 'list<auto>':
        return (
          <LongStringField
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            fill
            type={currentType}
            noWrap
            placeholder={'Yaml'}
          />
        );
      case 'int':
      case 'integer':
      case 'softint':
      case 'float':
      case 'softfloat':
      case 'number':
        return (
          <NumberField
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            fill
            type={currentType}
          />
        );
      case 'option_hash':
        return (
          <OptionHashField
            {...rest}
            name={name}
            onChange={handleChange}
            value={value || undefined}
            fill
            type={currentType}
          />
        );
      case 'byte-size':
        return (
          <ByteSizeField
            {...rest}
            name={name}
            onChange={handleChange}
            value={value}
            type={currentType}
          />
        );
      case 'enum':
        return (
          <RadioField
            items={rest.allowed_values}
            value={value}
            name={name}
            onChange={handleChange}
            type={currentType}
          />
        );
      case 'select-string': {
        return (
          <SelectField
            defaultItems={rest.allowed_values}
            value={value}
            name={name}
            onChange={handleChange}
            type={currentType}
          />
        );
      }
      case 'multi-select': {
        return (
          <MultiSelect
            {...rest}
            value={value}
            name={name}
            onChange={handleChange}
          />
        );
      }
      case 'mapper':
      case 'workflow':
      case 'service':
      case 'job':
      case 'value-map':
      case 'connection': {
        return (
          <InterfaceSelector
            type={currentType}
            name={name}
            value={value}
            onChange={handleChange}
          />
        );
      }
      case 'data-provider': {
        return (
          <ConnectorField
            value={value}
            isInitialEditing={!!default_value}
            name={name}
            inline
            minimal
            isConfigItem={isConfigItem}
            isVariable={isVariable}
            onChange={handleChange}
            readOnly={rest.disabled}
            disableSearchOptions={rest.disableSearchOptions}
            {...rest}
          />
        );
      }
      case 'file-as-string': {
        return (
          <FileField
            {...rest}
            name={name}
            value={value}
            filesOnly
            label='Select File'
            onChange={handleChange}
            type={currentType}
            get_message={{
              action: 'creator-get-resources',
              object_type: 'files',
            }}
            return_message={{
              action: 'creator-return-resources',
              object_type: 'files',
              return_value: 'resources',
            }}
          />
        );
      }
      case 'color': {
        return (
          <ColorField
            {...rest}
            value={!value ? undefined : value}
            name={name}
            onChange={handleChange}
          />
        );
      }
      case 'any':
        return null;
      case 'auto':
        return (
          <ReqoreMessage intent='info'>Please select data type</ReqoreMessage>
        );
      default:
        return (
          <ReqoreMessage intent='danger'>{t('UnknownType')}</ReqoreMessage>
        );
    }
  };

  console.log(allowedTypes, defaultType, currentType);

  const showPicker =
    size(allowedTypes) > 1 ||
    (!isSetToNull &&
      (defaultType === 'auto' ||
        defaultType === 'any' ||
        currentType === 'auto' ||
        currentType === 'any'));

  const types =
    allowedTypes ||
    (!noSoft
      ? [
          { name: 'bool' },
          { name: 'softbool' },
          { name: 'date' },
          { name: 'string' },
          { name: 'softstring' },
          { name: 'binary' },
          { name: 'float' },
          { name: 'softfloat' },
          { name: 'list' },
          { name: 'softlist' },
          { name: 'hash' },
          { name: 'int' },
          { name: 'softint' },
          { name: 'color' },
        ]
      : DefaultNoSoftTypes);

  console.log(canBeNull, _canBeNull());

  // Render type picker if the type is auto or any
  return (
    <div
      style={{
        flexFlow: column || arg_schema ? 'column' : 'row',
        marginLeft: arg_schema ? 10 * level : 0,
        overflow: 'hidden',
        flex: '1 1 auto',
        maxHeight: arg_schema && level === 0 ? '500px' : undefined,
        overflowY: arg_schema && level === 0 ? 'auto' : undefined,
      }}
    >
      <ReqoreControlGroup fill>
        {showPicker && (
          <SelectField
            size={rest.size}
            name='type'
            defaultItems={types}
            value={currentInternalType}
            onChange={(_name, value) => {
              handleTypeChange(name, value);
            }}
          />
        )}

        {renderField(currentInternalType)}
        {canBeNull && (
          <ReqoreButton
            intent={isSetToNull ? 'warning' : undefined}
            icon={isSetToNull ? 'CloseLine' : undefined}
            onClick={handleNullToggle}
            fixed
          >
            {isSetToNull ? 'Unset null' : 'Set as null'}
          </ReqoreButton>
        )}
        {type === 'connection' ? (
          <ConnectionManagement
            selectedConnection={value}
            onChange={(value) => handleChange(name, value)}
            allowedValues={rest.allowed_values}
            // TODO: Change this to dynamic URL
            redirectUri='https://hq.qoretechnologies.com:8092/grant'
            app={rest.app}
            action={rest.action}
          />
        ) : null}
      </ReqoreControlGroup>
    </div>
  );
}

export default withTextContext()(AutoField) as React.FC<IAutoFieldProps>;
