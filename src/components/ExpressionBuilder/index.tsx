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
import { clone, cloneDeep, set, size } from 'lodash';
import { darken, rgba } from 'polished';
import { useAsyncRetry } from 'react-use';
import styled, { css } from 'styled-components';
import { fetchData, getTypesAccepted } from '../../helpers/functions';
import { validateField } from '../../helpers/validations';
import { useTemplates } from '../../hooks/useTemplates';
import auto, { DefaultNoSoftTypes } from '../Field/auto';
import Select from '../Field/select';
import { IOptionsSchemaArg, IQorusType } from '../Field/systemOptions';
import { TemplateField } from '../Field/template';

export const ExpressionDefaultValue = { args: [] };
export const StyledExpressionItem = styled.div`
  position: relative;
  overflow: unset;

  ${({ isChild }) =>
    isChild &&
    css`
      &::before {
        content: '';
        position: absolute;
        top: 11px;
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
  onChange?: (value: IExpression) => void;
  onValueChange?: (value: IExpression, path: string) => void;
}

export interface IExpressionProps extends IExpressionBuilderProps {}

export const Expression = ({
  localTemplates,
  value = { args: [] },
  isChild,
  type,
  path,
  onValueChange,
}: IExpressionProps) => {
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

  if (expressions.loading) {
    return (
      <StyledExpressionItem
        isChild={isChild}
        as={ReqoreControlGroup}
        fluid={false}
        size='small'
        style={{
          marginLeft: isChild ? 30 : undefined,
        }}
      >
        <ReqoreSpinner iconColor='pending' type={5} size='small'>
          Loading...
        </ReqoreSpinner>
      </StyledExpressionItem>
    );
  }

  const updateType = (val: IQorusType) => {
    console.log('UPDATING TYPE');
    onValueChange(
      {
        args: [
          {
            ...firstArgument,
            type: val,
          },
          ...rest,
        ],
      },
      path
    );
  };

  const updateExp = (val: string) => {
    console.log('UPDATING EXP');
    onValueChange(
      {
        ...value,
        exp: val,
      },
      path
    );
  };

  const updateExpToAndOr = (val: 'AND' | 'OR') => {
    console.log('UPDATING ARG TO AND OR OR');
    onValueChange(
      {
        exp: val,
        args: [value, { args: [] }],
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

    console.log('UPDATING ARG', val, index, type);
    // let _type = type;
    // // Check if the value is a template
    // if (typeof val === 'string' && val.startsWith('$')) {
    //   const template = findTemplate(templates, val);
    //   if (template) {
    //     _type = template.badge as IQorusType;
    //   }
    // }

    onValueChange(
      {
        ...value,
        args,
      },
      path
    );
  };

  const selectedExpression = expressions.value?.find(
    (exp) => exp.name === value.exp
  );
  const restOfArgs = selectedExpression?.args.slice(1);

  console.log(
    'SELECTED EXPRESSION',
    selectedExpression,
    value.exp,
    expressions,
    firstArgument,
    firstParamType
  );

  return (
    <StyledExpressionItem
      isChild={isChild}
      as={ReqoreControlGroup}
      fluid={false}
      fill
      size='small'
      style={{
        marginLeft: isChild ? 30 : undefined,
      }}
    >
      {!type && (
        <Select
          name='type'
          defaultItems={DefaultNoSoftTypes}
          value={firstArgument?.type || type || 'string'}
          onChange={(_name, value) => {
            updateType(value);
          }}
        />
      )}
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
            key={firstParamType}
            type={firstParamType}
            defaultType={firstParamType}
            value={firstArgument?.value}
            onChange={(name, value) => {
              updateArg(value);
            }}
            templates={localTemplates}
            allowTemplates
            fluid={false}
            fixed={true}
          />
        </ReqoreControlGroup>
      )}
      {firstArgument?.value !== undefined && firstArgument?.value !== null ? (
        <Select
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
          size='small'
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
              <TemplateField
                key={index}
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
                allowedTypes={getTypesAccepted(arg.type.types_accepted)}
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
            </ReqoreControlGroup>
          ))
        : null}
      {validateField(firstParamType, firstArgument?.value) &&
      selectedExpression ? (
        <>
          <ReqoreButton
            minimal
            flat
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
            minimal
            flat
            compact
            label='OR'
            textAlign='center'
            icon='AddLine'
            fixed
            onClick={() => updateExpToAndOr('OR')}
          />
        </>
      ) : null}
    </StyledExpressionItem>
  );
};

export const ExpressionBuilder = ({
  localTemplates,
  value = ExpressionDefaultValue,
  isChild,
  level = 0,
  path,
  type,
  onChange,
  onValueChange,
}: IExpressionBuilderProps) => {
  const templates = useTemplates(true, localTemplates);
  const theme = useReqoreTheme();

  if (templates.loading) {
    return (
      <ReqoreSpinner type={5} size='small'>
        Loading...
      </ReqoreSpinner>
    );
  }

  const handleChange = (newValue, newPath) => {
    if (onChange) {
      if (!newPath) {
        onChange(newValue);
        return;
      }

      let clonedValue = cloneDeep(value);

      set(clonedValue, newPath, newValue);

      onChange(clonedValue);
    } else if (onValueChange) {
      onValueChange(newValue, newPath);
    }
  };

  if (value.exp === 'AND' || value.exp === 'OR') {
    return (
      <StyledExpressionItem
        as={ReqorePanel}
        isChild={isChild}
        minimal
        size='small'
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
          size='small'
          fill
          style={{ position: 'relative' }}
          wrap
        >
          <StyledExpressionItemLabel
            as={ReqoreP}
            color='transparent'
            intent='pending'
            size='tiny'
            effect={{
              spaced: 2,
              weight: 'bold',
              interactive: true,
            }}
            onClick={() => {
              handleChange(
                {
                  args: [],
                },
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
      path={path}
      onValueChange={handleChange}
    />
  );
};
