import { ReqoreIcon, ReqoreP, ReqoreSpan } from '@qoretechnologies/reqore';
import { IExpression, IExpressionSchema, TExpressionSchemaArg } from '.';
import { argumentMatchesType, getArgumentType } from '../../helpers/expressions';

export interface IExpressionBuilderArgumentLabelProps {
  label: string;
  arg?: IExpression;
  expressions: IExpressionSchema[];
  schema?: TExpressionSchemaArg;
}

export const ExpressionBuilderArgumentLabel = ({
  label,
  arg,
  schema,
  expressions,
}: IExpressionBuilderArgumentLabelProps) => {
  if (!schema) {
    return (
      <ReqoreP
        size='tiny'
        effect={{
          uppercase: true,
          spaced: 1,
          weight: 'thick',
          opacity: 0.6,
        }}
      >
        {label}
      </ReqoreP>
    );
  }

  const matchesType = argumentMatchesType(expressions, arg, schema);
  const argumentType = getArgumentType(expressions, arg, schema);

  return (
    <ReqoreP
      size='tiny'
      effect={{
        uppercase: true,
        spaced: 1,
        weight: 'thick',
      }}
      customTheme={{
        text: {
          color: !matchesType ? 'warning:lighten:7' : undefined,
        },
      }}
      title={
        matchesType
          ? undefined
          : `Invalid type, expected ${schema.type.types_accepted?.join(' or ')}`
      }
    >
      {schema.required && <ReqoreIcon icon='Asterisk' color='danger' size='10px' />} {label} - "
      {schema.display_name}" {matchesType ? null : `Invalid type `} {'<'}
      <ReqoreSpan effect={{ italic: true }}>{argumentType}</ReqoreSpan>
      {'>'}
    </ReqoreP>
  );
};
