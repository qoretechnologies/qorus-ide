import { ReqoreButton } from '@qoretechnologies/reqore';
import { IReqoreButtonProps } from '@qoretechnologies/reqore/dist/components/Button';
import { memo, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import { useContextSelector } from 'use-context-selector';
import {
  SaveColorEffect,
  SelectorColorEffect,
} from '../components/Field/multiPair';
import { InterfacesContext } from '../context/interfaces';

export interface IEnableToggleProps
  extends Omit<IReqoreButtonProps, 'id' | 'enabled' | 'type'> {
  enabled?: boolean;
  type?: string;
  id: string | number;
  hasLabel?: boolean;
}

export const EnableToggle = memo(
  ({ enabled, type, id, hasLabel, ...rest }: IEnableToggleProps) => {
    const [value, setValue] = useState<IEnableToggleProps['enabled']>(enabled);

    const { toggleEnabled } = useContextSelector(
      InterfacesContext,
      ({ toggleEnabled }) => ({ toggleEnabled })
    );

    useUpdateEffect(() => {
      if (process.env.NODE_ENV === 'storybook') return;

      toggleEnabled(type, id, value);
    }, [value]);

    return (
      <ReqoreButton
        fixed
        {...rest}
        {...{
          icon: 'ToggleLine',
          effect: value ? SaveColorEffect : SelectorColorEffect,
          label: hasLabel ? (value ? 'Disable' : 'Enable') : undefined,
          tooltip: value ? 'Disable' : 'Enable',
          onClick: (e) => {
            e.stopPropagation();
            setValue(!value);
          },
        }}
      />
    );
  }
);
