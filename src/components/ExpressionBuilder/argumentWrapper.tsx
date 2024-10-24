import { ReqoreButton, ReqoreControlGroup, ReqorePanel } from '@qoretechnologies/reqore';
import { TQorusType } from '@qoretechnologies/ts-toolkit';
import { IExpression, IExpressionSchema, TExpressionSchemaArg } from '.';
import { useQorusTypes } from '../../hooks/useQorusTypes';
import Select from '../Field/select';
import { ExpressionBuilderArgumentLabel } from './argumentLabel';

export interface IExpressionBuilderArgumentWrapperProps {
  children: React.ReactNode;
  schema?: TExpressionSchemaArg;
  arg?: IExpression;
  onTypeChange?: (type: TQorusType | 'context') => void;
  onRemoveArgClick?: () => void;
  hasMultipleArgs?: boolean;
  expressions: IExpressionSchema[];
  label?: string;
}

export const ExpressionBuilderArgumentWrapper = ({
  children,
  schema,
  arg,
  onTypeChange,
  onRemoveArgClick,
  hasMultipleArgs,
  expressions,
  label,
}: IExpressionBuilderArgumentWrapperProps) => {
  const types = useQorusTypes();

  if (arg?.is_expression) {
    return (
      <ReqorePanel
        minimal
        fluid
        responsiveTitle={false}
        responsiveActions={false}
        label={`${label} - "${schema.display_name}"`}
        headerEffect={{
          uppercase: true,
          spaced: 1,
          weight: 'thick',
          textSize: 'tiny',
          opacity: 0.6,
        }}
        size='small'
        flat
        transparent
        icon={schema.required ? 'Asterisk' : undefined}
        iconColor='danger'
        iconProps={{
          margin: undefined,
        }}
        actions={[
          {
            icon: 'CloseLine',
            tooltip: 'Remove argument',
            customTheme: {
              main: 'danger:darken:3:0.5',
            },
            show: hasMultipleArgs === true,
            onClick: () => {
              onRemoveArgClick();
            },
          },
        ]}
      >
        {children}
      </ReqorePanel>
    );
  }

  return (
    <ReqoreControlGroup vertical wrap style={{ flexShrink: 1 }} size='small'>
      <ExpressionBuilderArgumentLabel
        arg={arg}
        schema={schema}
        label={label}
        expressions={expressions}
      />
      <ReqoreControlGroup verticalAlign='flex-start' stack wrap fluid>
        <Select
          compact
          fixed
          name='type'
          defaultItems={types.value}
          showDescription={false}
          value={arg?.type || schema?.type?.types_accepted[0] || 'context'}
          onChange={(_name, value) => {
            onTypeChange(value);
          }}
          flat
          labelEffect={{
            uppercase: true,
            spaced: 1,
            weight: 'thick',
            textSize: 'tiny',
            italic: true,
          }}
        />
        {children}
        {hasMultipleArgs && (
          <ReqoreButton
            flat
            compact
            customTheme={{
              main: 'danger:darken:3:0.5',
            }}
            fixed
            className='expression-remove-arg'
            icon='CloseLine'
            tooltip='Remove argument'
            onClick={() => {
              onRemoveArgClick();
            }}
          />
        )}
      </ReqoreControlGroup>
    </ReqoreControlGroup>
  );
};
