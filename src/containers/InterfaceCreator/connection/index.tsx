import { ReqoreVerticalSpacer } from '@qoretechnologies/reqore';
import { capitalize, isEqual, some } from 'lodash';
import map from 'lodash/map';
import size from 'lodash/size';
import React, { useContext, useState } from 'react';
import { useDebounce, useMount, useUpdateEffect } from 'react-use';
import shortid from 'shortid';
import Content from '../../../components/Content';
import Field from '../../../components/Field';
import { SaveColorEffect } from '../../../components/Field/multiPair';
import { IOptions } from '../../../components/Field/systemOptions';
import { getProtocol } from '../../../components/Field/urlField';
import FieldGroup from '../../../components/FieldGroup';
import {
  ContentWrapper,
  FieldWrapper,
  IField,
} from '../../../components/FieldWrapper';
import Loader from '../../../components/Loader';
import { Messages } from '../../../constants/messages';
import { DraftsContext, IDraftData } from '../../../context/drafts';
import { GlobalContext } from '../../../context/global';
import { InitialContext } from '../../../context/init';
import { TextContext } from '../../../context/text';
import { mapFieldsToGroups } from '../../../helpers/common';
import { getDraftId, hasValue } from '../../../helpers/functions';
import { validateField } from '../../../helpers/validations';
import {
  addMessageListener,
  postMessage,
} from '../../../hocomponents/withMessageHandler';

export interface IConnection {
  name?: string;
  display_name: string;
  short_desc?: string;
  desc: string;
  url: string;
  options?: IOptions;
}

export const ConnectionView = ({ onSubmitSuccess, connection }) => {
  const { confirmAction, callBackend, saveDraft } = useContext(InitialContext);
  const { resetAllInterfaceData, setConnectionReset } =
    useContext(GlobalContext);
  const t = useContext(TextContext);
  const { maybeApplyDraft, draft } = useContext(DraftsContext);

  const [data, setData] = useState<IConnection>({
    options: {},
    ...(connection || {}),
  });
  const [interfaceId, setInterfaceId] = useState(null);
  const [fields, setFields] = useState(undefined);

  const handleDataChange = (name: string, value: any) => {
    setData((cur) => {
      const result = { ...cur };

      // Remove the connection options if they are empty
      if (name === 'connection_options' && size(value) === 0) {
        delete result.options;
      } else {
        result[name] = value;
      }

      return result;
    });
  };

  useMount(() => {
    setConnectionReset(() => () => setData(connection || {}));

    addMessageListener(
      Messages.FIELDS_FETCHED,
      ({ fields }) => {
        setFields(fields);
        setInterfaceId(connection?.id || shortid.generate());
        applyDraft();
      },
      true
    );

    postMessage(
      Messages.GET_FIELDS,
      { iface_kind: 'connection', is_editing: !!connection },
      true
    );
  });

  const applyDraft = () => {
    // Apply the draft with "type" as first parameter and a custom function
    maybeApplyDraft(
      'connection',
      undefined,
      connection,
      ({
        connectionData: { fields, data },
        interfaceId: ifaceId,
      }: IDraftData) => {
        setInterfaceId(ifaceId);
        setData(data);
        setFields(fields);
      }
    );
  };

  useUpdateEffect(() => {
    if (draft) {
      applyDraft();
    }
  }, [draft]);

  useDebounce(
    () => {
      const draftId = getDraftId(connection, interfaceId);
      const hasChanged = connection
        ? some(data, (value, key) => {
            return !isEqual(value, connection[key]);
          })
        : true;

      if (
        draftId &&
        (hasValue(data.display_name) ||
          hasValue(data.desc) ||
          hasValue(data.name) ||
          hasValue(data.short_desc) ||
          (hasValue(data.url) && data.url !== '://')) &&
        hasChanged
      ) {
        saveDraft(
          'connection',
          draftId,
          {
            connectionData: {
              fields,
              data,
            },
          },
          data.name
        );
      }
    },
    1500,
    [data, interfaceId]
  );

  const reset = () => {
    setData(connection || {});
  };

  const isDataValid = () => {
    return (
      validateField('string', data.display_name) &&
      validateField('string', data.desc) &&
      validateField('url', data.url) &&
      (!data.options ||
        size(data.options) === 0 ||
        validateField('options', data.options))
    );
  };

  const handleSubmitClick = async () => {
    let fixedMetadata = { ...data };

    if (size(fixedMetadata.options) === 0) {
      delete fixedMetadata.options;
    }

    const result = await callBackend(
      connection ? Messages.EDIT_INTERFACE : Messages.CREATE_INTERFACE,
      undefined,
      {
        iface_kind: 'connection',
        iface_id: interfaceId,
        orig_data: connection,
        no_data_return: !!onSubmitSuccess,
        data: fixedMetadata,
      },
      t('SavingConnection...')
    );

    if (result.ok) {
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }

      setInterfaceId(result.id);
    }
  };

  if (!size(fields)) {
    return <Loader text={t('LoadingFields')} />;
  }

  const renderFields = (fields: IField[]) => {
    return map(fields, (field: IField) => (
      <FieldWrapper
        key={field.name}
        name='selected-field'
        label={t(`field-label-${field.name}`)}
        desc={t(`field-desc-${field.name}`)}
        info={
          field.markdown
            ? t('MarkdownSupported')
            : field.mandatory === false
            ? t('Optional')
            : undefined
        }
        isValid={
          field.mandatory !== false || data[field.name]
            ? validateField(field.type || 'string', data[field.name], field)
            : true
        }
        compact={field.compact}
      >
        <Field
          {...field}
          isValid={
            field.mandatory !== false || data[field.name]
              ? validateField(field.type || 'string', data[field.name], field)
              : true
          }
          value={data[field.name]}
          onChange={handleDataChange}
        />
      </FieldWrapper>
    ));
  };

  const renderGroups = (groups: Record<string, IField[]>) => {
    return map(groups, (fields, groupName) => {
      if (size(fields) > 1) {
        return (
          <FieldGroup
            key={groupName}
            label={capitalize(groupName)}
            isValid={!fields.some((field) => field.isValid === false)}
          >
            {renderFields(fields)}
          </FieldGroup>
        );
      }

      return (
        <React.Fragment key={groupName}>{renderFields(fields)}</React.Fragment>
      );
    });
  };

  return (
    <>
      <Content
        title={'Fill in the details'}
        bottomActions={[
          {
            label: t('DiscardChangesButton'),
            icon: 'HistoryLine',
            tooltip: t('ResetTooltip'),
            onClick: () => {
              confirmAction(
                'ResetFieldsConfirm',
                () => {
                  reset();
                },
                'Confirm',
                'warning'
              );
            },
            position: 'left',
          },
          {
            label: t('Submit'),
            disabled: !isDataValid(),
            icon: 'CheckLine',
            responsive: false,
            flat: false,
            effect: SaveColorEffect,
            onClick: handleSubmitClick,
            position: 'right',
          },
        ]}
      >
        <ContentWrapper>
          {renderGroups(mapFieldsToGroups(fields))}
          <FieldWrapper
            name='selected-field'
            desc={t(`field-desc-url`)}
            label={t('field-label-url')}
            isValid={
              validateField('url', data.url) &&
              (data.options && size(data.options)
                ? validateField('options', data.options)
                : true)
            }
            collapsible={false}
          >
            <Field
              type='url'
              value={data.url}
              url='options/remote?list'
              onChange={handleDataChange}
              name='url'
            />
            {getProtocol(data.url) && (
              <>
                <ReqoreVerticalSpacer height={10} />
                <Field
                  type='options'
                  value={data.options}
                  url={`remote/${getProtocol(data.url)}`}
                  onChange={handleDataChange}
                  name='connection_options'
                />
              </>
            )}
          </FieldWrapper>
        </ContentWrapper>
      </Content>
    </>
  );
};
