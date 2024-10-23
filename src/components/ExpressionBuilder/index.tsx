import {
  ReqoreControlGroup,
  ReqoreIcon,
  ReqoreP,
  ReqorePanel,
  ReqoreSpinner,
  ReqoreTag,
  ReqoreVerticalSpacer,
  useReqoreTheme,
} from '@qoretechnologies/reqore';
import { TReqoreHexColor } from '@qoretechnologies/reqore/dist/components/Effect';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import { IReqoreFormTemplates } from '@qoretechnologies/reqore/dist/components/Textarea';
import { getReadableColorFrom } from '@qoretechnologies/reqore/dist/helpers/colors';
import { clone, cloneDeep, get, isArray, set, size, unset } from 'lodash';
import { darken, rgba } from 'polished';
import { useAsyncRetry } from 'react-use';
import styled, { css } from 'styled-components';
import { fetchData } from '../../helpers/functions';
import { validateField } from '../../helpers/validations';
import { useQorusTypes } from '../../hooks/useQorusTypes';
import { useTemplates } from '../../hooks/useTemplates';
import auto from '../Field/auto';
import Select from '../Field/select';
import { IOptionsSchemaArg, IQorusType } from '../Field/systemOptions';
import { TemplateField } from '../Field/template';
import { ExpressionBuilderArgumentWrapper } from './argumentWrapper';

export const ExpressionDefaultValue: IExpression = {
  value: { args: [] },
  is_expression: true,
};
export const StyledExpressionItem: React.FC<
  IReqorePanelProps & { isChild?: boolean; isAndOr?: boolean }
> = styled.div`
  position: relative;
  overflow: unset;

  ${({ isChild, isAndOr }) =>
    isChild &&
    css`
      &::before {
        content: '';
        position: absolute;
        bottom: ${isAndOr ? '50%' : '11px'};
        left: -10px;
        width: 10px;
        height: 1px;
        background-color: ${({ theme }) => rgba(getReadableColorFrom(theme.main), 0.3)};
      }
    `}
`;

const StyledExpressionItemLabel = styled.div`
  position: absolute;
  text-orientation: upright;
  writing-mode: vertical-rl;
  top: calc(50%);
  transform: translateY(-50%);
  white-space: nowrap;
  height: calc(100% - 24px);
  // Centered flex
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding-right: 7px;
  border-right: 1px solid ${({ theme }) => rgba(getReadableColorFrom(theme.main), 0.3)};
`;
export interface IExpressionValue {
  exp?: string;
  args?: IExpression[];
}
export interface IExpression {
  value?: IExpressionValue | any;
  type?: IQorusType;
  is_expression?: boolean;
  required?: boolean;
}

export type TExpressionSchemaArg = Omit<IOptionsSchemaArg, 'type'> & {
  type: {
    base_type: IQorusType;
    name: string;
    types_accepted: IQorusType[];
  };
};

export interface IExpressionSchema {
  desc: string;
  short_desc: string;
  display_name: string;
  name: string;
  return_type: IQorusType;
  role: number;
  type: number;
  varargs: boolean;
  subtype: 1 | 2;
  args: TExpressionSchemaArg[];
  symbol: string;
}

export interface IExpressionBuilderProps {
  localTemplates?: IReqoreFormTemplates;
  value?: IExpression;
  isChild?: boolean;
  level?: number;
  type?: IQorusType;
  path?: string;
  index?: number;
  returnType?: IQorusType | IQorusType[];
  group?: 'AND' | 'OR';
  onChange?: (value: IExpression, remove?: boolean) => void;
  onValueChange?: (value: IExpression, path: string, remove?: boolean) => void;
}

export interface IExpressionProps extends IExpressionBuilderProps {}

export const Expression = ({
  localTemplates,
  value = ExpressionDefaultValue,
  isChild,
  type,
  level,
  path,
  onValueChange,
  group,
  returnType,
}: IExpressionProps) => {
  const types = useQorusTypes();
  const theme = useReqoreTheme();
  const [firstArgument, ...rest] = value.value.args;

  const expressions = useAsyncRetry<IExpressionSchema[]>(async () => {
    const data = await fetchData(`/system/expressions`);

    return data.data;
  }, []);

  if (expressions.loading || types.loading) {
    return (
      <StyledExpressionItem
        isChild={isChild}
        as={ReqoreControlGroup}
        fluid={false}
        size='normal'
        style={{
          marginLeft: isChild ? 30 : undefined,
        }}
      >
        <ReqoreSpinner iconColor='pending' type={5} size='normal'>
          Loading...
        </ReqoreSpinner>
      </StyledExpressionItem>
    );
  }

  const updateType = (val: IQorusType, conformsCurrentType?: boolean) => {
    if (conformsCurrentType) {
      onValueChange(
        {
          ...value,
          value: {
            ...value.value,
            args: [
              {
                ...value.value.args[0],
                type: val,
              },
              ...value.value.args.slice(1),
            ],
          },
        },
        path
      );

      return;
    }

    onValueChange(
      {
        value: {
          args: [
            {
              type: val,
            },
          ],
        },
      },
      path
    );
  };

  const updateExp = (val: string) => {
    const args = [value.value.args[0]];

    // Check if this expression has variable arguments
    const selectedExpression = expressions.value?.find((exp) => exp.name === val);

    if (selectedExpression.varargs) {
      args.push({});
    }

    onValueChange(
      {
        ...value,
        value: {
          ...value.value,
          exp: val,
          args,
        },
      },
      path
    );
  };

  const wrapExpression = (expression: string) => {
    onValueChange(
      {
        value: {
          exp: expression,
          args: [value],
        },
        is_expression: true,
      },
      path
    );
  };

  const unwrapExpression = () => {
    onValueChange(value.value.args[0], path);
  };

  const updateExpToAndOr = (val: 'AND' | 'OR') => {
    onValueChange(
      {
        value: {
          exp: val,
          args: [value, ExpressionDefaultValue],
        },
        is_expression: true,
      },
      path
    );
  };

  const removeVarArg = (index: number) => {
    const args = value.value.args.filter((_, i) => i !== index);

    onValueChange(
      {
        ...value,
        value: {
          ...value.value,
          args,
        },
      },
      path
    );
  };

  const updateArg = (
    val: any,
    index: number = 0,
    type?: IQorusType,
    isFunction?: boolean,
    isRequired?: boolean
  ) => {
    const args = clone(value.value.args);

    args[index] = {
      ...args[index],
      value: val,
      type: type || args[index]?.type,
      is_expression: isFunction,
      required: isRequired,
    };

    onValueChange(
      {
        ...value,
        value: {
          ...value.value,
          args,
        },
      },
      path
    );
  };

  const handleRemoveClick = () => {
    onValueChange?.(undefined, path, true);
  };

  const selectedExpression = expressions.value?.find((exp) => exp.name === value.value.exp);
  const firstArgSchema = selectedExpression?.args[0];
  const firstParamType = firstArgument?.is_expression
    ? firstArgSchema?.type?.types_accepted[0]
    : firstArgument?.type || type || 'context';
  let restOfArgs = selectedExpression?.args.slice(1);

  if (selectedExpression?.varargs) {
    restOfArgs = [
      ...restOfArgs,
      ...rest.map(() => ({
        ...selectedExpression.args[0],
      })),
    ];
  }

  const expressionReturnType = selectedExpression?.return_type;
  const isReturnTypeMatching = isArray(returnType)
    ? returnType.includes(expressionReturnType)
    : returnType === 'auto' ||
      returnType === 'any' ||
      returnType === 'context' ||
      returnType === expressionReturnType;

  return (
    <StyledExpressionItem
      as={ReqorePanel}
      intent={validateField('expression', value) && isReturnTypeMatching ? 'info' : 'danger'}
      flat
      minimal
      size='small'
      isChild={isChild}
      className='expression'
      customTheme={{
        main: `main:darken:${level}`,
      }}
      label={
        <Select
          flat
          size='small'
          className='expression-operator-selector'
          value={value?.value?.exp}
          icon='Functions'
          placeholder='Select function'
          fluid={false}
          fixed={true}
          compact
          defaultItems={expressions.value
            ?.filter((exp) => exp.subtype !== 2)
            .map((exp) => ({
              name: exp.name,
              value: exp.name,
              display_name: exp.display_name,
              short_desc: exp.desc,
              badge: exp.symbol,
            }))}
          onChange={(_name, value) => {
            updateExp(value);
          }}
          showDescription='tooltip'
        />
      }
      style={{
        marginLeft: isChild ? 30 : undefined,
        borderStyle: 'dashed',
      }}
      contentStyle={{
        overflowX: 'hidden',
      }}
      actions={[
        {
          flat: true,
          compact: true,
          className: 'expression-add-arg',
          tooltip: 'Add argument',
          label: 'Add arg',
          icon: 'AddLine',
          fixed: true,
          disabled: !validateField('expression', value),
          onClick: () => {
            updateArg(undefined, size(value.value.args), undefined, false);
          },
          show: !!selectedExpression && selectedExpression.varargs === true,
        },
        {
          as: Select,
          props: {
            flat: true,
            compact: true,
            className: 'expression-wrap',
            placeholder: 'Wrap',
            icon: 'Functions',
            showRightIcon: false,
            fluid: false,
            fixed: true,
            defaultItems: expressions.value
              ?.filter((exp) => exp.subtype !== 2)
              .map((exp) => ({
                name: exp.name,
                value: exp.name,
                display_name: exp.display_name,
                short_desc: exp.desc,
                badge: exp.symbol,
              })),
            onChange: (_name, value) => {
              wrapExpression(value);
            },
            showDescription: 'tooltip',
            tooltip: 'Wrap this expression in another expression',
          },
        },
        {
          flat: true,
          compact: true,
          className: 'expression-unwrap',
          label: 'Remove',
          textAlign: 'center',
          icon: 'CloseLine',
          tooltip: 'Remove this expression but keep the children',
          fixed: true,
          onClick: unwrapExpression,
          show: value.value.args?.[0]?.is_expression === true,
        },
        {
          flat: true,
          compact: true,
          className: 'expression-group-remove',
          intent: 'danger',
          textAlign: 'center',
          icon: 'DeleteBinLine',
          tooltip: 'Remove this expression and its children',
          fixed: true,
          onClick: handleRemoveClick,
        },
      ]}
      bottomActions={[
        {
          show: !!selectedExpression && expressionReturnType === 'bool',
          group: [
            {
              flat: true,
              compact: true,
              className: 'expression-and',
              label: 'AND',
              textAlign: 'center',
              icon: 'AddLine',
              fixed: true,
              show: !group || group === 'OR',
              onClick: () => {
                updateExpToAndOr('AND');
              },
            },
            {
              flat: true,
              compact: true,
              className: 'expression-or',
              label: 'OR',
              textAlign: 'center',
              icon: 'AddLine',
              show: !group || group === 'AND',
              fixed: true,
              onClick: () => {
                updateExpToAndOr('OR');
              },
            },
          ],
        },
      ]}
    >
      {selectedExpression && (
        <>
          <ReqoreTag
            wrap
            icon='InformationFill'
            label={selectedExpression?.desc}
            minimal
            size='small'
          />
          <ReqoreVerticalSpacer height={10} />
        </>
      )}
      <ReqoreControlGroup
        fluid={false}
        style={{ maxWidth: '100%' }}
        wrap
        verticalAlign='flex-start'
        size='normal'
        gapSize='huge'
      >
        {firstParamType && (
          <ExpressionBuilderArgumentWrapper
            expressions={expressions.value}
            arg={firstArgument}
            schema={firstArgSchema}
            onTypeChange={(value) => {
              updateType(value === 'context' ? undefined : value, true);
            }}
            label='Arg #1'
          >
            <TemplateField
              component={auto}
              minimal
              allowFunctions
              level={level + 1}
              key={firstParamType}
              type={firstParamType}
              defaultType={firstParamType}
              returnType={firstArgSchema?.type?.types_accepted}
              value={firstArgument?.value}
              isFunction={firstArgument?.is_expression}
              onChange={(_name, value, type, isFunction) => {
                if (type !== 'any' && type !== 'auto') {
                  updateArg(
                    value,
                    0,
                    isFunction ? undefined : type,
                    isFunction,
                    selectedExpression?.args?.[0]?.required
                  );
                }
              }}
              templates={localTemplates}
              allowTemplates
              allowCustomValues={!!firstArgument?.type}
              filterTemplates={!!firstArgument?.type}
              fluid={false}
              fixed={true}
              disableManagement
            />
          </ExpressionBuilderArgumentWrapper>
        )}
        {selectedExpression
          ? restOfArgs?.map((arg, index) => (
              <ExpressionBuilderArgumentWrapper
                expressions={expressions.value}
                arg={rest[index]}
                schema={arg}
                onTypeChange={(value) => {
                  updateArg(
                    undefined,
                    index + 1,
                    value === 'context' ? undefined : (value as IQorusType)
                  );
                }}
                onRemoveArgClick={() => {
                  removeVarArg(index + 1);
                }}
                label={`Arg #${index + 2}`}
                key={index}
                hasMultipleArgs={selectedExpression.varargs && size(rest) > 1}
              >
                <TemplateField
                  minimal
                  component={auto}
                  noSoft
                  level={level + 1}
                  allowFunctions
                  isFunction={rest[index]?.is_expression}
                  key={index}
                  type={rest[index]?.type || arg.type?.types_accepted[0]}
                  defaultType={rest[index]?.type || arg.type?.types_accepted[0]}
                  returnType={arg.type.types_accepted}
                  canBeNull={false}
                  value={rest[index]?.value ?? arg.default_value}
                  templates={localTemplates}
                  allowTemplates
                  onChange={(_name, value, type, isFunction) => {
                    updateArg(
                      value,
                      index + 1,
                      isFunction ? undefined : type,
                      isFunction,
                      arg.required
                    );
                  }}
                  fluid={false}
                  fixed={true}
                  disableManagement
                />
              </ExpressionBuilderArgumentWrapper>
            ))
          : null}
      </ReqoreControlGroup>
      {!isReturnTypeMatching && (
        <>
          <ReqoreVerticalSpacer height={5} />
          <ReqoreTag
            minimal
            icon='ErrorWarningLine'
            intent='danger'
            size='small'
            wrap
            label={`This expression returns ${expressionReturnType || 'nothing'} but the expected return type is ${isArray(returnType) ? returnType.join(' or ') : returnType}`}
          />
        </>
      )}
    </StyledExpressionItem>
  );
};

export const ExpressionBuilder = ({
  localTemplates,
  value = ExpressionDefaultValue,
  isChild,
  level = 0,
  index = 0,
  path,
  type,
  returnType,
  group,
  onChange,
  onValueChange,
}: IExpressionBuilderProps) => {
  const templates = useTemplates(!isChild, localTemplates);
  const theme = useReqoreTheme();

  if (templates.loading) {
    return (
      <ReqoreSpinner type={5} size='normal'>
        Loading...
      </ReqoreSpinner>
    );
  }

  const handleChange = (newValue: IExpression, newPath: string, remove?: boolean) => {
    if (onChange) {
      if (!newPath) {
        onChange(newValue, remove);
        return;
      }

      let clonedValue = cloneDeep(value);

      if (remove) {
        unset(clonedValue, newPath);
        const pathArray = newPath.split('.');

        pathArray.pop();

        const parentPath = pathArray.join('.');
        let parent = get(clonedValue, parentPath);

        parent = parent.filter((item: any) => item);

        if (size(parent) === 1) {
          pathArray.pop();

          const grandParentPath = pathArray.join('.');

          if (grandParentPath === '') {
            onChange(parent[0].value, remove);
            return;
          }

          set(clonedValue, grandParentPath, parent[0].value);
        } else {
          set(clonedValue, parentPath, parent);
        }
      } else {
        set(clonedValue, newPath, newValue);
      }

      onChange(clonedValue, remove);
    } else if (onValueChange) {
      onValueChange(newValue, newPath, remove);
    }
  };

  if (value.is_expression && (value.value.exp === 'AND' || value.value.exp === 'OR')) {
    return (
      <StyledExpressionItem
        as={ReqorePanel}
        isChild={isChild}
        isAndOr
        minimal
        size='normal'
        flat
        customTheme={{
          main: darken(`0.0${level * 25}`, theme.main) as TReqoreHexColor,
        }}
        label={isChild ? undefined : 'IF'}
        style={{
          marginLeft: isChild ? 30 : 0,
        }}
        headerEffect={{ color: theme.intents.pending }}
        headerSize={5}
      >
        <ReqoreControlGroup vertical fluid size='normal' style={{ position: 'relative' }} wrap>
          <StyledExpressionItemLabel
            as={ReqoreP}
            color='transparent'
            className='expression-operator'
            intent='pending'
            size='tiny'
            effect={{
              spaced: 2,
              weight: 'bold',
              interactive: true,
            }}
            onClick={() => {
              handleChange(
                ExpressionDefaultValue,
                `${path ? `${path}.` : ''}value.args.${size(value.value.args)}`
              );
            }}
          >
            {value.value.exp} <ReqoreIcon icon='AddLine' size='tiny' />
          </StyledExpressionItemLabel>
          {value.value.args?.map((arg, index) => (
            <ExpressionBuilder
              value={arg}
              localTemplates={templates.value}
              key={index}
              isChild
              path={`${path ? `${path}.` : ''}value.args.${index}`}
              level={level + 1}
              index={index}
              type={type}
              onValueChange={handleChange}
              returnType='bool'
              group={value.value.exp}
            />
          ))}
        </ReqoreControlGroup>
      </StyledExpressionItem>
    );
  }

  return (
    <Expression
      localTemplates={templates.value}
      value={value}
      isChild={isChild}
      type={type}
      returnType={returnType}
      level={level}
      path={path}
      index={index}
      onValueChange={handleChange}
      group={group}
    />
  );
};
