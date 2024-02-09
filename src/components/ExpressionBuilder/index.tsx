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
import { clone, cloneDeep, debounce, set, size } from 'lodash';
import { darken, rgba } from 'polished';
import { useAsyncRetry } from 'react-use';
import styled, { css } from 'styled-components';
import { fetchData } from '../../helpers/functions';
import { validateField } from '../../helpers/validations';
import { DefaultNoSoftTypes } from '../Field/auto';
import Select from '../Field/select';
import { IQorusType } from '../Field/systemOptions';
import { TemplateField } from '../Field/template';

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
  template?: string;
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
  args: {
    type_code: IQorusType;
    type: IQorusType;
  }[];
  symbol: string;
}

export interface IExpressionBuilderProps {
  templates?: IReqoreFormTemplates;
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
  templates,
  value = { args: [] },
  isChild,
  type,
  path,
  onValueChange,
}: IExpressionProps) => {
  const [firstArgument, ...rest] = value.args;

  const firstParamType = firstArgument?.type || type;

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

  const updateArg = debounce(
    (val: string | number | boolean, index: number = 0) => {
      const args = clone(value.args);

      args[index] = {
        ...args[index],
        value: val,
      };

      console.log(
        'UPDATING ARG',
        val,
        {
          ...value,
          args,
        },
        path
      );
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
    },
    300
  );

  const selectedExpression = expressions.value?.find(
    (exp) => exp.name === value.exp
  );
  const restOfArgs = selectedExpression?.args.slice(1);

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
      <Select
        name='type'
        defaultItems={DefaultNoSoftTypes}
        value={firstArgument?.type || type}
        onChange={(_name, value) => {
          updateType(value);
        }}
      />
      {firstParamType && (
        <TemplateField
          componentFromType
          key={firstParamType}
          type={firstParamType}
          value={firstArgument?.value}
          onChange={(name, value) => {
            updateArg(value);
          }}
          templates={templates}
          allowTemplates
          fluid={false}
          fixed={true}
        />
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
      {restOfArgs?.map((arg, index) => (
        <TemplateField
          key={index}
          componentFromType
          type={firstParamType}
          value={rest[index]?.value}
          templates={templates}
          allowTemplates
          onChange={(_name, value) => {
            updateArg(value, index + 1);
          }}
          fluid={false}
          fixed={true}
        />
      ))}
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
  templates,
  value = { args: [] },
  isChild,
  level = 0,
  path,
  type,
  onChange,
  onValueChange,
}: IExpressionBuilderProps) => {
  const theme = useReqoreTheme();

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
              templates={templates}
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
      templates={templates}
      value={value}
      isChild={isChild}
      type={type}
      path={path}
      onValueChange={handleChange}
    />
  );
};
