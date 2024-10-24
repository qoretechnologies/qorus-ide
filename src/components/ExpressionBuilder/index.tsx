import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreIcon,
  ReqoreP,
  ReqorePanel,
  ReqoreSpinner,
  useReqoreTheme,
} from '@qoretechnologies/reqore';
import { TReqoreHexColor } from '@qoretechnologies/reqore/dist/components/Effect';
import { IReqoreFormTemplates } from '@qoretechnologies/reqore/dist/components/Textarea';
import { getReadableColorFrom } from '@qoretechnologies/reqore/dist/helpers/colors';
import { clone, cloneDeep, get, set, size, unset } from 'lodash';
import { darken, rgba } from 'polished';
import { useAsyncRetry } from 'react-use';
import styled, { css } from 'styled-components';
import {
  fetchData,
  getExpressionArgumentType,
  getTypesAccepted,
} from '../../helpers/functions';
import { validateField } from '../../helpers/validations';
import { useQorusTypes } from '../../hooks/useQorusTypes';
import { useTemplates } from '../../hooks/useTemplates';
import auto from '../Field/auto';
import Select from '../Field/select';
import { IOptionsSchemaArg, IQorusType } from '../Field/systemOptions';
import { TemplateField } from '../Field/template';

export const ExpressionDefaultValue: IExpression = {
  value: { args: [] },
  is_expression: true,
};
export const StyledExpressionItem = styled.div`
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
        background-color: ${({ theme }) =>
          rgba(getReadableColorFrom(theme.main), 0.3)};
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
  border-right: 1px solid
    ${({ theme }) => rgba(getReadableColorFrom(theme.main), 0.3)};
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
  returnType?: IQorusType;
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
}: IExpressionProps) => {
  const types = useQorusTypes();
  const theme = useReqoreTheme();
  const [firstArgument, ...rest] = value.value.args;

  const firstParamType = firstArgument?.type || type || 'context';

  const expressions = useAsyncRetry<IExpressionSchema[]>(async () => {
    if (!firstParamType) {
      return [];
    }

    const data = await fetchData(
      `/system/expressions?first_arg_type=${firstParamType}`
    );

    return data.data;
  }, [firstParamType]);

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
    const selectedExpression = expressions.value?.find(
      (exp) => exp.name === val
    );

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

  const selectedExpression = expressions.value?.find(
    (exp) => exp.name === value.value.exp
  );
  const firstArgSchema = selectedExpression?.args[0];
  let restOfArgs = selectedExpression?.args.slice(1);

  if (selectedExpression?.varargs) {
    restOfArgs = [
      ...restOfArgs,
      ...rest.map(() => ({
        ...selectedExpression.args[0],
      })),
    ];
  }

  const returnType = selectedExpression?.return_type;

  return (
    <StyledExpressionItem
      as={ReqorePanel}
      intent={
        validateField('expression', value)
          ? returnType !== 'bool'
            ? 'info'
            : undefined
          : 'danger'
      }
      flat
      isChild={isChild}
      className='expression'
      customTheme={{
        main: darken(`0.0${level * 25}`, theme.main) as TReqoreHexColor,
      }}
      style={{
        marginLeft: isChild ? 30 : undefined,
        borderStyle: returnType !== 'bool' ? 'dashed' : undefined,
      }}
      contentStyle={{
        overflowX: 'hidden',
      }}
    >
      <ReqoreControlGroup
        fluid={false}
        wrap
        verticalAlign='flex-end'
        size='normal'
      >
        {firstParamType && (
          <ReqoreControlGroup style={{ flexShrink: 1 }} vertical>
            <ReqoreP
              size='tiny'
              effect={{
                uppercase: true,
                spaced: 1,
                weight: 'bold',
                opacity: 0.6,
              }}
            >
              {selectedExpression?.args[0].display_name}
            </ReqoreP>
            <TemplateField
              component={auto}
              minimal
              allowFunctions
              key={firstParamType}
              type={firstParamType}
              defaultType={firstParamType}
              value={firstArgument?.value}
              isFunction={firstArgument?.is_expression}
              onChange={(name, value, type, isFunction) => {
                if (type !== 'any' && type !== 'auto') {
                  updateArg(
                    value,
                    0,
                    type,
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
            />
          </ReqoreControlGroup>
        )}
        <Select
          name='type'
          defaultItems={
            firstArgSchema?.type?.types_accepted?.map((type) => ({
              name: type,
              display_name: types.value.find((t) => t.name === type)
                ?.display_name,
            })) || types.value
          }
          value={firstArgument?.type || type || 'ctx'}
          onChange={(_name, value) => {
            const conformsType = firstArgSchema?.type?.types_accepted?.includes(
              value as IQorusType
            );

            updateType(value === 'context' ? undefined : value, conformsType);
          }}
          minimal
          flat
          showDescription={false}
          customTheme={{ main: 'info:darken:1:0.1' }}
        />
        {firstArgument?.value !== undefined && firstArgument?.value !== null ? (
          <Select
            flat
            className='expression-operator-selector'
            value={value?.value?.exp}
            fluid={false}
            fixed={true}
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
            size='normal'
          />
        ) : null}
        {firstArgument?.value !== undefined &&
        firstArgument?.value !== null &&
        validateField(firstParamType, firstArgument?.value, {
          isFunction: firstArgument?.is_expression,
        }) &&
        selectedExpression
          ? restOfArgs?.map((arg, index) => (
              <ReqoreControlGroup
                vertical
                key={`${value?.value.exp}${index}-group`}
                wrap
              >
                <ReqoreP
                  size='tiny'
                  effect={{
                    uppercase: true,
                    spaced: 1,
                    weight: 'bold',
                    opacity: 0.6,
                  }}
                >
                  {arg.display_name}
                </ReqoreP>
                <ReqoreControlGroup verticalAlign='flex-end'>
                  <TemplateField
                    key={`${value?.value.exp}${index}`}
                    minimal
                    component={auto}
                    noSoft
                    allowFunctions
                    isFunction={rest[index]?.is_expression}
                    defaultType={arg.type.base_type}
                    defaultInternalType={getExpressionArgumentType(
                      arg,
                      types.value,
                      rest[index]?.type,
                      firstParamType
                    )}
                    type={getExpressionArgumentType(
                      arg,
                      types.value,
                      rest[index]?.type,
                      firstParamType
                    )}
                    canBeNull={false}
                    value={rest[index]?.value ?? arg.default_value}
                    templates={localTemplates}
                    allowTemplates
                    onChange={(_name, value, type, isFunction) => {
                      updateArg(
                        value,
                        index + 1,
                        type,
                        isFunction,
                        arg.required
                      );
                    }}
                    fluid={false}
                    fixed={true}
                  />
                  {selectedExpression.varargs && size(rest) > 1 ? (
                    <ReqoreButton
                      flat
                      compact
                      customTheme={{
                        main: 'warning:darken:3:0.5',
                      }}
                      fixed
                      className='expression-remove-arg'
                      icon='CloseLine'
                      tooltip='Remove argument'
                      onClick={() => {
                        removeVarArg(index + 1);
                      }}
                    />
                  ) : null}
                  <Select
                    name='type'
                    defaultItems={getTypesAccepted(
                      arg.type.types_accepted,
                      types.value
                    )}
                    showDescription={false}
                    value={getExpressionArgumentType(
                      arg,
                      types.value,
                      rest[index]?.type,
                      firstParamType
                    )}
                    onChange={(_name, value) => {
                      updateArg(undefined, index + 1, value as IQorusType);
                    }}
                    minimal
                    flat
                    customTheme={{ main: 'info:darken:1:0.1' }}
                  />
                </ReqoreControlGroup>
              </ReqoreControlGroup>
            ))
          : null}
        {selectedExpression?.varargs && (
          <ReqoreButton
            flat
            compact
            className='expression-add-arg'
            tooltip='Add argument'
            icon='AddLine'
            fixed
            onClick={() => {
              updateArg(
                undefined,
                size(value.value.args),
                firstParamType,
                false
              );
            }}
          />
        )}
        <ReqoreControlGroup stack>
          {validateField(firstParamType, firstArgument?.value, {
            isFunction: firstArgument?.is_expression,
          }) &&
          selectedExpression &&
          returnType === 'bool' ? (
            <>
              {!group || group === 'OR' ? (
                <ReqoreButton
                  flat
                  className='expression-and'
                  compact
                  label='AND'
                  textAlign='center'
                  icon='AddLine'
                  fixed
                  onClick={() => {
                    updateExpToAndOr('AND');
                  }}
                />
              ) : null}
              {!group || group === 'AND' ? (
                <ReqoreButton
                  flat
                  compact
                  className='expression-or'
                  label='OR'
                  textAlign='center'
                  icon='AddLine'
                  fixed
                  onClick={() => updateExpToAndOr('OR')}
                />
              ) : null}
            </>
          ) : null}
          <ReqoreButton
            flat
            compact
            className='expression-group-remove'
            intent='danger'
            textAlign='center'
            icon='DeleteBinLine'
            fixed
            onClick={handleRemoveClick}
          />
        </ReqoreControlGroup>
      </ReqoreControlGroup>
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

  const handleChange = (
    newValue: IExpression,
    newPath: string,
    remove?: boolean
  ) => {
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

  if (
    value.is_expression &&
    (value.value.exp === 'AND' || value.value.exp === 'OR')
  ) {
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
        <ReqoreControlGroup
          vertical
          fluid
          size='normal'
          style={{ position: 'relative' }}
          wrap
        >
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
              returnType={returnType}
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
