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
import { fetchData, getTypesAccepted } from '../../helpers/functions';
import { validateField } from '../../helpers/validations';
import { useQorusTypes } from '../../hooks/useQorusTypes';
import { useTemplates } from '../../hooks/useTemplates';
import auto from '../Field/auto';
import Select from '../Field/select';
import { IOptionsSchemaArg, IQorusType } from '../Field/systemOptions';
import { TemplateField } from '../Field/template';

export const ExpressionDefaultValue = { args: [] };
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

export interface IExpression {
  exp?: string;
  args?: IExpression[];
  value?: any;
  type?: IQorusType;
}

export interface IExpressionSchema {
  desc: string;
  display_name: string;
  name: string;
  return_type: IQorusType;
  role: number;
  type: number;
  varargs: boolean;
  subtype: 1 | 2;
  args: (Omit<IOptionsSchemaArg, 'type'> & {
    type: {
      base_type: IQorusType;
      name: string;
      types_accepted: IQorusType[];
    };
  })[];
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
  onChange?: (value: IExpression) => void;
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
}: IExpressionProps) => {
  const types = useQorusTypes();
  const theme = useReqoreTheme();
  const [firstArgument, ...rest] = value.args;

  const firstParamType = firstArgument?.type || type || 'string';

  const expressions = useAsyncRetry<IExpressionSchema[]>(async () => {
    if (!firstParamType) {
      return [];
    }

    const data = await fetchData(
      `/system/expressions?return_type=bool&first_arg_type=${firstParamType}`
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

  const updateType = (val: IQorusType) => {
    onValueChange(
      {
        args: [
          {
            type: val,
          },
        ],
      },
      path
    );
  };

  const updateExp = (val: string) => {
    onValueChange(
      {
        ...value,
        exp: val,
        args: [value.args[0]],
      },
      path
    );
  };

  const updateExpToAndOr = (val: 'AND' | 'OR') => {
    onValueChange(
      {
        exp: val,
        args: [value, ExpressionDefaultValue],
      },
      path
    );
  };

  const updateArg = (
    val: string | number | boolean,
    index: number = 0,
    type?: IQorusType
  ) => {
    const args = clone(value.args);

    args[index] = {
      ...args[index],
      value: val,
      type: type || args[index]?.type,
    };

    onValueChange(
      {
        ...value,
        args,
      },
      path
    );
  };

  const handleRemoveClick = () => {
    onValueChange?.(undefined, path, true);
  };

  const selectedExpression = expressions.value?.find(
    (exp) => exp.name === value.exp
  );
  const restOfArgs = selectedExpression?.args.slice(1);

  return (
    <StyledExpressionItem
      as={ReqorePanel}
      intent={validateField('expression', value) ? undefined : 'danger'}
      flat
      isChild={isChild}
      className='expression'
      customTheme={{
        main: darken(`0.0${level * 25}`, theme.main) as TReqoreHexColor,
      }}
      style={{
        marginLeft: isChild ? 30 : undefined,
      }}
    >
      <ReqoreControlGroup
        fluid={false}
        wrap
        verticalAlign='flex-end'
        size='normal'
      >
        {firstParamType && (
          <ReqoreControlGroup vertical>
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
              key={firstParamType}
              type={firstParamType}
              defaultType={firstParamType}
              value={firstArgument?.value}
              onChange={(name, value, type) => {
                if (type !== 'any' && type !== 'auto') {
                  updateArg(value, 0, type);
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
          defaultItems={types.value}
          value={firstArgument?.type || type || 'ctx'}
          onChange={(_name, value) => {
            updateType(value === 'context' ? undefined : value);
          }}
          minimal
          flat
          showDescription={false}
          customTheme={{ main: 'info:darken:1:0.1' }}
          disabled={!!type}
        />
        {firstArgument?.value !== undefined && firstArgument?.value !== null ? (
          <Select
            minimal
            flat
            className='expression-operator-selector'
            value={value?.exp}
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
            showDescription={false}
            size='normal'
          />
        ) : null}
        {firstArgument?.value !== undefined &&
        firstArgument?.value !== null &&
        validateField(firstParamType, firstArgument?.value) &&
        selectedExpression
          ? restOfArgs?.map((arg, index) => (
              <ReqoreControlGroup vertical>
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
                <ReqoreControlGroup>
                  <TemplateField
                    key={`${value?.exp}${index}`}
                    minimal
                    component={auto}
                    noSoft
                    defaultType={arg.type.base_type}
                    defaultInternalType={
                      size(getTypesAccepted(arg.type.types_accepted)) === 1
                        ? getTypesAccepted(arg.type.types_accepted)[0].name
                        : rest[index]?.type || firstParamType
                    }
                    type={
                      size(getTypesAccepted(arg.type.types_accepted)) === 1
                        ? getTypesAccepted(arg.type.types_accepted)[0].name
                        : rest[index]?.type || firstParamType
                    }
                    canBeNull={false}
                    value={rest[index]?.value}
                    templates={localTemplates}
                    allowTemplates
                    onChange={(_name, value, type) => {
                      updateArg(value, index + 1, type);
                    }}
                    fluid={false}
                    fixed={true}
                  />
                  <Select
                    name='type'
                    defaultItems={getTypesAccepted(
                      arg.type.types_accepted,
                      types.value
                    )}
                    showDescription={false}
                    value={
                      size(
                        getTypesAccepted(arg.type.types_accepted, types.value)
                      ) === 1
                        ? getTypesAccepted(
                            arg.type.types_accepted,
                            types.value
                          )[0].name
                        : rest[index]?.type || firstParamType
                    }
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
        <ReqoreControlGroup stack>
          {validateField(firstParamType, firstArgument?.value) &&
          selectedExpression ? (
            <>
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
        onChange(newValue);
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
            onChange(parent[0]);
            return;
          }

          set(clonedValue, grandParentPath, parent[0]);
        } else {
          set(clonedValue, parentPath, parent);
        }
      } else {
        set(clonedValue, newPath, newValue);
      }

      onChange(clonedValue);
    } else if (onValueChange) {
      onValueChange(newValue, newPath, remove);
    }
  };

  if (value.exp === 'AND' || value.exp === 'OR') {
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
                `${path ? `${path}.` : ''}args.${size(value.args)}`
              );
            }}
          >
            {value.exp} <ReqoreIcon icon='AddLine' size='tiny' />
          </StyledExpressionItemLabel>
          {value.args?.map((arg, index) => (
            <ExpressionBuilder
              value={arg}
              localTemplates={templates.value}
              key={index}
              isChild
              path={`${path ? `${path}.` : ''}args.${index}`}
              level={level + 1}
              index={index}
              type={type}
              onValueChange={handleChange}
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
      level={level}
      path={path}
      index={index}
      onValueChange={handleChange}
    />
  );
};
