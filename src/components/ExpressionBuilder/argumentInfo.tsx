import { ReqoreP } from '@qoretechnologies/reqore';

export interface IExpressionBuilderArgumentInfoProps {
  matchesType?: boolean;
  acceptedTypes?: string[];
  argumentType?: string;
}

export const ExpressionBuilderArgumentInfo = ({
  matchesType,
  acceptedTypes,
  argumentType,
}: IExpressionBuilderArgumentInfoProps) => {
  return (
    <ReqoreP
      size='tiny'
      effect={{
        uppercase: true,
        spaced: 1,
        weight: 'bold',
        opacity: 0.6,
        underline: !matchesType,
      }}
      customTheme={{
        text: {
          color: !matchesType ? 'warning:lighten:5' : undefined,
        },
      }}
      title={matchesType ? undefined : `Invalid type, expected ${acceptedTypes.join(' or ')}`}
    >
      {matchesType ? `Type: ${argumentType}` : `Warning: Invalid type ${argumentType}`}
    </ReqoreP>
  );
};
