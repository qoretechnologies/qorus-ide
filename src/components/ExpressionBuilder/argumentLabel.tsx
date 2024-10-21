import { ReqoreIcon, ReqoreP } from '@qoretechnologies/reqore';

export interface IExpressionBuilderArgumentLabelProps {
  label: string;
  required?: boolean;
}

export const ExpressionBuilderArgumentLabel = ({
  label,
  required,
}: IExpressionBuilderArgumentLabelProps) => {
  return (
    <ReqoreP
      size='tiny'
      effect={{
        uppercase: true,
        spaced: 1,
        weight: 'bold',
        opacity: 0.6,
      }}
    >
      {required && <ReqoreIcon icon='Asterisk' color='danger:lighten:5' size='10px' />} {label}
    </ReqoreP>
  );
};
