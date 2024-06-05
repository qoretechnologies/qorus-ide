import { IReqoreUIProviderProps } from '@qoretechnologies/reqore/dist/containers/UIProvider';
import { IReqraftProviderProps } from '@qoretechnologies/reqraft/dist/providers/ReqraftProvider';
import { Meta } from '@storybook/react';
import { TQorusStorage } from '../providers/Interfaces';

export type StoryMeta<
  Component extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any>,
  AdditionalArgs = {},
> = Meta<
  React.ComponentProps<Component> &
    AdditionalArgs & {
      reqoreOptions?: IReqoreUIProviderProps['options'];
      reqraftOptions?: Partial<IReqraftProviderProps>;
      qorus_instance?: boolean;
      isFullIDE?: boolean;
      initialData?: Record<string, any>;
      storage?: TQorusStorage;
    }
>;
