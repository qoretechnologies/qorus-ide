import { Colors } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';
import styled, { css } from 'styled-components';

const StyledFieldLabel = styled.div<{ fluid?: boolean }>`
  padding: 0px 10px 0 0;
  flex: 0 1 auto;
  ${({ fluid }) =>
    !fluid &&
    css`
      min-width: 150px;
    `}
  max-width: 150px;
  display: flex;
  flex-flow: row;
  position: relative;
  align-items: center;
`;

const FieldLabelName = styled.h4<{ isValid?: boolean }>`
  margin: 0;
  padding: 0;
  flex: 1;
  font-size: 16px;

  padding: 5px;
  border-radius: 3px;
  background-color: ${({ isValid }) => (!isValid ? '#ffe7e7' : undefined)};
  color: ${({ isValid }) => (isValid ? 'initial' : Colors.RED2)};
`;

const FieldLabelValid = styled.div`
  flex: 0;
  line-height: 30px;
`;

const FieldLabelInfo = styled.p`
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: #a9a9a9;
  font-weight: normal;
`;

export interface IFieldLabel {
  label?: string;
  isValid: boolean;
  info?: string;
}

const FieldLabel: FunctionComponent<IFieldLabel> = ({ label, isValid, info }) => (
  <StyledFieldLabel fluid={!label && !info}>
    {label || info ? (
      <FieldLabelName isValid={isValid}>
        {label}
        {info && <FieldLabelInfo>{info}</FieldLabelInfo>}
      </FieldLabelName>
    ) : null}
  </StyledFieldLabel>
);

export default FieldLabel;
