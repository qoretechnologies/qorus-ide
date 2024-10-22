import {
  IExpression,
  IExpressionSchema,
  TExpressionSchemaArg,
} from '../components/ExpressionBuilder';

export const getArgumentType = (
  expressions: IExpressionSchema[],
  arg: IExpression,
  schema: TExpressionSchemaArg
) => {
  if (arg?.is_expression) {
    return expressions?.find((exp) => exp.name === arg.value.exp)?.return_type;
  }

  return arg?.type || schema.type?.types_accepted[0];
};

export const argumentMatchesType = (
  expressions: IExpressionSchema[],
  arg: IExpression,
  schema: TExpressionSchemaArg
) => {
  return (
    schema.type.types_accepted.includes('any') ||
    schema.type.types_accepted.includes(getArgumentType(expressions, arg, schema))
  );
};
