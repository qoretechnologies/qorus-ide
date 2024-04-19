import {
  ReqoreButton,
  ReqoreModal,
  useReqoreTheme,
} from '@qoretechnologies/reqore';
import { cloneDeep, get, isEqual, map, reduce, set, size, unset } from 'lodash';
import { useContext, useState } from 'react';
import { useDebounce, useUpdateEffect } from 'react-use';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import shortid from 'shortid';
import Content from '../../components/Content';
import Field from '../../components/Field';
import {
  NegativeColorEffect,
  PositiveColorEffect,
  SaveColorEffect,
} from '../../components/Field/multiPair';
import Suggest from '../../components/Field/suggest';
import FieldGroup from '../../components/FieldGroup';
import { ContentWrapper, FieldWrapper } from '../../components/FieldWrapper';
import { Messages } from '../../constants/messages';
import { DraftsContext, IDraftData } from '../../context/drafts';
import { fetchData, getDraftId, hasValue } from '../../helpers/functions';
import { flattenFields, getLastChildIndex } from '../../helpers/mapper';
import { validateField } from '../../helpers/validations';
import withGlobalOptionsConsumer from '../../hocomponents/withGlobalOptionsConsumer';
import withInitialDataConsumer from '../../hocomponents/withInitialDataConsumer';
import withTextContext from '../../hocomponents/withTextContext';
import TinyGrid from '../../images/graphy-dark.png';
import { StyledFieldsWrapper, StyledMapperWrapper } from '../Mapper';
import MapperInput from '../Mapper/input';
import MapperFieldModal from '../Mapper/modal';

export const formatFields = (fields) => {
  const newFields = reduce(
    fields,
    (formattedFields, field, fieldName) => {
      const name = fieldName.replace(/(?<!\\)\./g, '\\.');
      // Add the current order key or the maximum of this field set
      const order = field?.order || size(formattedFields);

      return {
        ...formattedFields,
        [name]: {
          ...field,
          order,
          name,
          type: {
            ...field?.type,
            fields: formatFields(field?.type?.fields || {}),
          },
        },
      };
    },
    {}
  );

  return newFields;
};

export const sortFields = (fields): Record<string, any> => {
  const newFields = Object.keys(fields)
    .sort((a, b) => fields[a].order - fields[b].order)
    .reduce((obj, key) => {
      obj[key] = fields[key];
      return {
        ...obj,
        [key]: {
          ...fields[key],
          type: {
            ...fields[key]?.type,
            fields: sortFields(fields[key]?.type?.fields || {}),
          },
        },
      };
    }, {});

  return newFields;
};

const TypeView = ({ initialData, t, setTypeReset, onSubmitSuccess }) => {
  const [interfaceId, setInterfaceId] = useState(null);
  const [val, setVal] = useState(initialData?.type?.path || '');
  const [types, setTypes] = useState([]);
  const [addDialog, setAddDialog] = useState<any>({});
  const [fields, setFields] = useState(
    formatFields(
      initialData.type ? cloneDeep(initialData.type.typeinfo.fields) : {}
    )
  );
  const [displayName, setDisplayName] = useState(
    initialData?.type?.display_name || ''
  );
  const [shortDesc, setShortDesc] = useState(
    initialData?.type?.short_desc || ''
  );
  const [desc, setDesc] = useState(initialData?.type?.desc || '');
  const [selectedField, setSelectedField] = useState(undefined);
  const theme = useReqoreTheme();
  const { maybeApplyDraft, draft } = useContext(DraftsContext);

  const reset = (soft?: boolean) => {
    setInterfaceId(initialData?.type?.id || shortid.generate());

    if (soft) {
      setVal(initialData?.type?.path || '');
      setAddDialog({});
      setFields(
        initialData.type ? cloneDeep(initialData.type.typeinfo.fields) : {}
      );
      setDisplayName(initialData?.type?.display_name || '');
      setShortDesc(initialData?.type?.short_desc || '');
      setDesc(initialData?.type?.desc || '');
    } else {
      setVal('');
      setAddDialog({});
      setFields({});
      setDisplayName('');
      setShortDesc('');
      setDesc('');
    }
  };

  const applyDraft = () => {
    // Apply the draft with "type" as first parameter and a custom function
    maybeApplyDraft(
      'type',
      undefined,
      initialData?.type,
      ({
        typeData: { fields, val, displayName, shortDesc, types, desc },
        id,
      }: IDraftData) => {
        setInterfaceId(id);
        setVal(val);
        setTypes(types);
        setDesc(desc);
        setDisplayName(displayName);
        setShortDesc(shortDesc);
        setFields(fields);
      }
    );
  };

  useUpdateEffect(() => {
    if (draft) {
      applyDraft();
    }
  }, [draft]);

  useMount(() => {
    setTypeReset(() => reset);

    (async () => {
      const data = await fetchData('/system/metadata/types');
      setTypes(data.data);
      setInterfaceId(initialData?.type?.id || shortid.generate());
      applyDraft();
    })();

    return () => {
      setTypeReset(null);
    };
  });

  // Compare initial data with state to check if the type has changed
  const hasDataChanged = () => {
    return (
      initialData.type?.path !== val ||
      !isEqual(initialData.type?.typeinfo?.fields, fields) ||
      initialData.type?.display_name !== displayName ||
      initialData.type?.short_desc !== shortDesc
    );
  };

  useDebounce(
    () => {
      const draftId = getDraftId(initialData.type, interfaceId);
      const hasChanged = initialData.type ? hasDataChanged() : true;

      if (
        draftId &&
        (hasValue(val) ||
          hasValue(displayName) ||
          hasValue(shortDesc) ||
          size(fields)) &&
        hasChanged
      ) {
        initialData.saveDraft(
          'type',
          draftId,
          {
            typeData: {
              val,
              displayName,
              shortDesc,
              desc,
              fields,
              types,
            },
          },
          val
        );
      }
    },
    1500,
    [val, types, fields, displayName, shortDesc]
  );

  const addField = (path: string, data) => {
    // Set the new fields
    setFields((current) => {
      // Clone the current fields
      const result: any = { ...current };
      // If we are adding field to the top
      if (path === '') {
        // Simply add the field
        result[data.name] = data;
        return result;
      }
      // Build the path
      const fields: string[] = path.split(/(?<!\\)\./g);
      let newPath: string;
      let newPathList: string[];
      fields.forEach((fieldName) => {
        if (!newPath) {
          newPath = fieldName;
          newPathList = [fieldName];
        } else {
          newPath += `.type.fields.${fieldName}`;
          newPathList.push('type', 'fields', fieldName);
        }
      });
      // Get the object at the exact path
      const obj: any = get(result, newPathList);
      // Add new object
      obj.type.fields[data.name] = data;
      // Return new data
      return sortFields(result);
    });
  };

  const editField = (path, data, remove?: boolean, oldData?: any) => {
    // Set the new fields
    setFields((current) => {
      // Clone the current fields
      const result: any = cloneDeep(current);
      // Build the path
      const fields: string[] = path.split(/(?<!\\)\./g);
      let newPath: string;
      let newPathList: string[];
      fields.forEach((fieldName) => {
        if (!newPath) {
          newPath = fieldName;
          newPathList = [fieldName];
        } else {
          newPath += `.type.fields.${fieldName}`;
          newPathList.push('type', 'fields', fieldName);
        }
      });
      // Always remove the original object
      unset(result, newPathList);
      if (remove) {
        return sortFields(result);
      }
      // Build the updated path
      const oldFields: string[] = path.split(/(?<!\\)\./g);
      // Remove the last value from the fields
      oldFields.pop();
      // Add the new name to the end of the fields list
      oldFields.push(data.name);

      let newUpdatedPath: string;
      let newUpdatedPathList: string[];
      oldFields.forEach((fieldName) => {
        if (!newUpdatedPath) {
          newUpdatedPath = fieldName;
          newUpdatedPathList = [fieldName];
        } else {
          newUpdatedPath += `.type.fields.${fieldName}`;
          newUpdatedPathList.push('type', 'fields', fieldName);
        }
      });
      // Get the object at the exact path
      set(result, newUpdatedPathList, {
        ...data,
        path: oldFields.join('.'),
      });
      // Return new data
      return sortFields(result);
    });
  };

  const handleClick = (field?: any, edit?: boolean, remove?: boolean): void => {
    if (remove) {
      editField(field.path, null, true);
    } else {
      setAddDialog({
        isOpen: true,
        siblings: field ? field?.type?.fields : fields,
        fieldData: edit ? field : null,
        isParentCustom: field?.isCustom,
        onSubmit: (data, oldData) => {
          if (edit) {
            editField(field.path, data, false, oldData);
          } else {
            addField(field?.path || '', data);
          }
        },
      });
    }
  };

  const handleSubmitClick = async () => {
    const result = await initialData.callBackend(
      initialData.type ? Messages.EDIT_INTERFACE : Messages.CREATE_INTERFACE,
      undefined,
      {
        iface_kind: 'type',
        replace: !!initialData.type,
        orig_data: initialData.type,
        no_data_return: !!onSubmitSuccess,
        data: {
          display_name:
            !displayName || displayName === '' ? undefined : displayName,
          short_desc: !shortDesc || shortDesc === '' ? undefined : shortDesc,
          desc,
          path: val,
          typeinfo: {
            base_type: 'hash<auto>',
            name: 'hash<auto>',
            can_manage_fields: true,
            fields,
          },
        },
      },
      t('Saving type...')
    );

    if (result.ok) {
      setInterfaceId(result.id);

      if (onSubmitSuccess) {
        onSubmitSuccess({
          display_name:
            !displayName || displayName === '' ? undefined : displayName,
          short_desc: !shortDesc || shortDesc === '' ? undefined : shortDesc,
          desc,
          path: val,
          typeinfo: {
            base_type: 'hash<auto>',
            name: 'hash<auto>',
            can_manage_fields: true,
            fields,
          },
        });
      }
    }
  };

  const flattenedFields = flattenFields(fields);

  return (
    <Content
      bottomActions={[
        {
          label: t('Reset'),
          icon: 'HistoryLine',
          onClick: () => {
            initialData.confirmAction(
              'ResetFieldsConfirm',
              () => {
                reset(true);
              },
              'Confirm',
              'warning'
            );
          },
        },
        {
          label: t('Submit'),
          onClick: handleSubmitClick,
          disabled: !(size(fields) && validateField('string', val)),
          icon: 'CheckLine',
          effect: SaveColorEffect,
          position: 'right',
        },
      ]}
    >
      {selectedField && (
        <ReqoreModal
          isOpen
          label={selectedField?.name}
          badge={selectedField.type.base_type}
          onClose={() => setSelectedField(undefined)}
          blur={3}
          responsiveActions={false}
          actions={[
            {
              label: t('Add child field'),
              icon: 'AddLine',
              onClick: () => {
                handleClick(selectedField);
              },
              effect: PositiveColorEffect,
              flat: false,
              show: selectedField.type.can_manage_fields === true,
            },
            {
              label: t('Edit'),
              icon: 'EditLine',
              onClick: () => {
                handleClick(selectedField, true);
              },
              show: selectedField.isCustom === true,
            },
            {
              label: t('Remove'),
              icon: 'DeleteBinLine',
              effect: NegativeColorEffect,
              onClick: () => {
                handleClick(selectedField, false, true);
                setSelectedField(undefined);
              },
              show: selectedField.isCustom === true,
            },
          ]}
        >
          {selectedField?.desc || 'No description'}
        </ReqoreModal>
      )}
      <ContentWrapper style={{ flex: '0 auto' }}>
        <FieldGroup>
          <FieldWrapper
            compact
            name='selected-field'
            label={t('field-label-display_name')}
            isValid={validateField('string', displayName)}
          >
            <Field
              onChange={(_name, value) => setDisplayName(value)}
              name='display_name'
              value={displayName}
              type='string'
            />
          </FieldWrapper>
          <FieldWrapper
            compact
            name='selected-field'
            label={t('field-label-short_desc')}
            type={t('Optional')}
            isValid
          >
            <Field
              onChange={(_name, value) => setShortDesc(value)}
              name='short_desc'
              value={shortDesc}
              type='string'
            />
          </FieldWrapper>
        </FieldGroup>
        <FieldWrapper
          compact
          name='selected-field'
          label={t('field-label-desc')}
          type={t('Optional')}
          isValid
        >
          <Field
            onChange={(_name, value) => setDesc(value)}
            name='desc'
            value={desc}
            markdown
            type='long-string'
          />
        </FieldWrapper>
        <FieldGroup isValid={validateField('string', val)}>
          <FieldWrapper
            name='selected-field'
            label={t('Path')}
            isValid={validateField('string', val)}
            compact
          >
            <Suggest
              defaultItems={types}
              value={val}
              name='path'
              onChange={(_name, value) => setVal(value)}
              autoFocus={!initialData.type}
            />
          </FieldWrapper>
        </FieldGroup>
      </ContentWrapper>
      <div
        style={{
          width: '100%',
          marginTop: '15px',
          padding: 10,
          flex: 1,
          overflow: 'auto',
          background: `${theme.main} url(${TinyGrid})`,
          borderRadius: '10px',
        }}
      >
        <StyledMapperWrapper
          style={{
            justifyContent: 'center',
            paddingTop: '10px',
            width: '600px',
          }}
        >
          <StyledFieldsWrapper vertical width='600px'>
            {size(flattenedFields) !== 0
              ? map(flattenedFields, (input, index) => (
                  <MapperInput
                    key={`${input.order}${input.level}${input.path}`}
                    name={input.name}
                    types={input.type.types_returned}
                    {...input}
                    field={input}
                    isTypeView
                    id={index + 1}
                    lastChildIndex={
                      getLastChildIndex(input, flattenedFields) - index
                    }
                    onClick={() => {
                      setSelectedField(input);
                    }}
                    isLastInOrder={
                      size(
                        flattenedFields.find(
                          (field) => field.path === input.parentPath
                        )?.type?.fields
                      ) ===
                      input.order + 1
                    }
                    hasAvailableOutput={true}
                    onSortClick={(up?: boolean) => {
                      let newOrder = up ? input.order - 1 : input.order + 1;

                      newOrder = newOrder < 0 ? 0 : newOrder;

                      editField(input.path, {
                        ...input,
                        order: newOrder,
                      });
                      // Find the previous field based on order
                      const previousField = flattenedFields.find(
                        (field) =>
                          field.order === newOrder &&
                          field.level === input.level &&
                          field.parent === input.parent
                      );
                      // If the previous field exists
                      if (previousField) {
                        // Edit the previous field to have the current order
                        editField(previousField.path, {
                          ...previousField,
                          order: input.order,
                        });
                      }
                    }}
                  />
                ))
              : null}
            <ReqoreButton
              minimal
              fluid
              effect={SaveColorEffect}
              icon='AddLine'
              rightIcon='AddLine'
              textAlign='center'
              onClick={() => handleClick()}
            >
              {t('AddNewField')}
            </ReqoreButton>
          </StyledFieldsWrapper>
        </StyledMapperWrapper>
      </div>
      {addDialog.isOpen && (
        <MapperFieldModal
          t={t}
          onClose={() => setAddDialog({})}
          {...addDialog}
        />
      )}
    </Content>
  );
};

export default compose(
  withInitialDataConsumer(),
  withTextContext(),
  withGlobalOptionsConsumer()
)(TypeView);
