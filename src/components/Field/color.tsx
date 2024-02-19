import { SketchPicker } from 'react-color';
import styled from 'styled-components';
import { IField } from '../FieldWrapper';

export interface IColorFieldProps extends IField {
  value: { r: number; g: number; b: number; a: number };
}

export const StyledColorWrapper = styled.div`
  .color-picker {
    background-color: transparent !important;
    width: 100% !important;
    max-width: 400px !important;
    box-shadow: none !important;
    padding: 0 !important;

    > div:first-child {
      padding-bottom: unset !important;
      height: 100px !important;
    }

    input {
      width: 100% !important;
    }
  }
`;

export const ColorField = ({
  value,
  onChange,
  name,
  disabled,
  read_only,
}: IColorFieldProps) => {
  return (
    <StyledColorWrapper>
      <SketchPicker
        onChangeComplete={(color) => onChange(name, color.rgb)}
        color={value}
        readOnly={disabled || read_only}
        disableAlpha
        className='color-picker'
      />
    </StyledColorWrapper>
  );
};
