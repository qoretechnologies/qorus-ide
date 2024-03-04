import { setupPreviews } from '@previewjs/plugin-react/setup';
import {
  ReqoreMessage,
  ReqorePanel,
  ReqoreVerticalSpacer,
} from '@qoretechnologies/reqore';
import { IReqoreButtonProps } from '@qoretechnologies/reqore/dist/components/Button';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import { noop } from 'lodash';
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { getGlobalDescriptionTooltip } from '../FieldWrapper';

const StyledDescriptionField = styled(ReqoreMessage)`
  p:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

export interface ISubFieldProps extends IReqorePanelProps {
  title?: string;
  desc?: string;
  children: any;
  subtle?: boolean;
  onRemove?: () => any;
  detail?: string;
  isValid?: boolean;
  collapsible?: boolean;
  nested?: boolean;
  descTitle?: string;
}
export const DescriptionField = ({ desc }: { desc?: string }) =>
  desc ? (
    <StyledDescriptionField
      size='small'
      minimal
      icon='InformationLine'
      customTheme={{ main: '#000000' }}
      effect={{
        color: '#aeaeae',
      }}
    >
      <ReactMarkdown>{desc}</ReactMarkdown>
    </StyledDescriptionField>
  ) : null;

const SubField: React.FC<ISubFieldProps> = ({
  title,
  desc,
  descTitle,
  children,
  subtle,
  onRemove,
  detail,
  isValid,
  collapsible,
  actions = [],
  ...rest
}) => {
  const badge = useMemo(() => {
    let _badge: IReqoreButtonProps['badge'] = [];

    if (detail) {
      _badge.push(detail);
    }

    if (desc) {
      _badge.push({
        icon: 'QuestionMark',
        tooltip: getGlobalDescriptionTooltip(desc, descTitle || title),
      });
    }

    return _badge;
  }, [detail, desc]);
  return (
    <>
      <ReqorePanel
        {...rest}
        flat
        transparent={subtle}
        minimal
        size='small'
        style={{ width: '100%' }}
        contentStyle={{ display: 'flex', flexFlow: 'column' }}
        contentEffect={
          subtle
            ? undefined
            : { gradient: { colors: 'main', direction: 'to right bottom' } }
        }
        intent={isValid === false ? 'danger' : undefined}
        label={title}
        badge={badge}
        icon={subtle ? undefined : title || detail ? 'SettingsLine' : undefined}
        collapsible={collapsible}
        unMountContentOnCollapse={false}
        responsiveTitle={false}
        actions={[
          ...actions,

          {
            icon: 'DeleteBinLine',
            intent: 'danger',
            minimal: true,
            onClick: onRemove,
            size: 'small',
            show: !!onRemove,
          },
        ]}
      >
        {desc ? <ReqoreVerticalSpacer height={10} /> : null}
        {children}
      </ReqorePanel>
      <ReqoreVerticalSpacer height={10} />
    </>
  );
};

setupPreviews(SubField, () => ({
  Basic: { title: 'SubField', children: <p> Hello </p> },
  InValid: { title: 'SubField', children: <p> Hello </p>, isValid: false },
  Subtle: { title: 'SubField', children: <p> Hello </p>, subtle: true },
  WithDetail: {
    title: 'SubField',
    children: <p> Hello </p>,
    detail: 'This is detail',
  },
  WithRemoveButton: {
    title: 'SubField',
    children: <p> Hello </p>,
    detail: 'This is detail',
    onRemove: noop,
  },
}));

export default SubField;
