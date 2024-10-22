import { ReqoreIcon, ReqoreP } from '@qoretechnologies/reqore';

export interface IExpressionBuilderArgumentLabelProps {
  label: string;
  required?: boolean;
  matchesType?: boolean;
  acceptedTypes?: string[];
  argumentType?: string;
}

export const ExpressionBuilderArgumentLabel = ({
  label,
  required,
  matchesType,
  acceptedTypes,
  argumentType,
}: IExpressionBuilderArgumentLabelProps) => {
  return (
    <ReqoreP
      size='tiny'
      effect={{
        uppercase: true,
        spaced: 1,
        weight: 'thick',
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
      {required && <ReqoreIcon icon='Asterisk' color='danger' size='10px' />} {label}:{' '}
      {matchesType ? `${argumentType}` : `Invalid type ${argumentType}`}
    </ReqoreP>
  );
};
