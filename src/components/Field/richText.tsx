import {
  IReqoreRichTextEditorProps,
  ReqoreRichTextEditor,
} from '@qoretechnologies/reqore/dist/components/RichTextEditor';
import { IReqoreTagProps } from '@qoretechnologies/reqore/dist/components/Tag';
import { map, size } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import {
  interfaceIcons,
  interfaceKindToName,
} from '../../constants/interfaces';
import { QorusPurpleIntent } from '../../constants/util';
import { InterfacesContext } from '../../context/interfaces';
import { IFieldChange } from '../FieldWrapper';
import { IOptionsSchemaArg } from './systemOptions';

export interface IRichTextFieldProps
  extends Omit<IReqoreRichTextEditorProps, 'onChange'>,
    Pick<
      IOptionsSchemaArg,
      'supports_templates' | 'supports_references' | 'supports_styling'
    > {
  onChange: IFieldChange;
  id?: string;
  richText?: boolean;
  name?: string;
  default_value?: IReqoreRichTextEditorProps['value'];
}

export const RichTextField = memo(
  ({
    name,
    onChange,
    value,
    default_value,
    id,
    richText,
    supports_references,
    supports_templates,
    supports_styling,
    templates,
    ...rest
  }: IRichTextFieldProps) => {
    const interfaces = useContextSelector(
      InterfacesContext,
      (value) => value.interfaces
    );
    const navigate = useNavigate();

    console.log(templates);

    const handleChange = (value: any): void => {
      if (
        JSON.stringify(value) ===
        '[{"type":"paragraph","children":[{"text":""}]}]'
      ) {
        onChange?.('');
        return;
      }

      onChange?.(value);
    };

    const handleGetTagProps = useCallback((tag): IReqoreTagProps => {
      const value = tag.value?.toString();

      if (!value) {
        return {};
      }

      if (value.startsWith('interface')) {
        const [_, interfaceType, id] = tag.value.toString().split(':');

        return {
          labelKey: interfaceKindToName[interfaceType],
          icon: interfaceIcons[interfaceType],
          intent: 'info',
          onClick: () => navigate(`/Interfaces/${interfaceType}/${id}`),
        };
      }

      if (value.startsWith('$')) {
        return {
          labelKey: '$',
          intent: QorusPurpleIntent,
        };
      }

      return {};
    }, []);

    const _value = value || default_value;
    const formattedValue: IReqoreRichTextEditorProps['value'] =
      typeof _value !== 'object'
        ? [
            {
              type: 'paragraph',
              children: [{ text: _value || '' }],
            },
          ]
        : _value;

    const tags = useMemo<
      IReqoreRichTextEditorProps['tags']
    >((): IReqoreRichTextEditorProps['tags'] => {
      const _tags: IReqoreRichTextEditorProps['tags'] = {};

      if (size(templates?.items) && supports_templates) {
        _tags.templates = {
          icon: 'MoneyDollarBoxLine',
          label: 'Templates',
          description: 'Universal values that can be used in multiple places',
          leftIconProps: {
            image:
              'https://hq.qoretechnologies.com:8092/api/public/apps/Qorus/qorus-logo.svg',
          },
          items: templates?.items,
        };
      }

      if (size(interfaces) && supports_references) {
        _tags.references = {
          label: 'References',
          description: 'References to Qorus interfaces',
          icon: 'ListSettingsLine',
          leftIconProps: {
            image:
              'https://hq.qoretechnologies.com:8092/api/public/apps/Qorus/qorus-logo.svg',
          },
          items: map(interfaces, (interfaceItems, interfaceType) => ({
            icon: interfaceIcons[interfaceType],
            label: interfaceKindToName[interfaceType],
            items: map(
              interfaceItems.filter((interfaceItem) => !!interfaceItem.data),
              (item) => ({
                icon: interfaceIcons[interfaceType],
                label: item.data.display_name,
                value: `interface:${interfaceType}:${item.data.id}`,
              })
            ),
          })),
        };
      }

      return _tags;
    }, [supports_references, supports_templates, interfaces, templates]);

    return (
      <ReqoreRichTextEditor
        fluid
        value={formattedValue}
        onChange={handleChange}
        id={id}
        actions={{
          redo: true,
          undo: true,
          styling: supports_styling,
        }}
        tagsListProps={{}}
        {...rest}
        getTagProps={handleGetTagProps}
        tags={tags}
      />
    );
  }
);
