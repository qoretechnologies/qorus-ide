import { StoryObj } from '@storybook/react';
import { compose } from 'recompose';
import { CreateInterface } from '../../../containers/InterfaceCreator';
import Panel from '../../../containers/InterfaceCreator/panel';
import withFields from '../../../hocomponents/withFields';
import withGlobalOptions from '../../../hocomponents/withGlobalOptions';
import withInitialData from '../../../hocomponents/withInitialData';
import withMapper from '../../../hocomponents/withMapper';
import withMethods from '../../../hocomponents/withMethods';
import withSteps from '../../../hocomponents/withSteps';
import { DraftsProvider } from '../../../providers/Drafts';
import { InterfacesProvider } from '../../../providers/Interfaces';
import interfaces from '../../Data/interface_samples.json';
import { StoryMeta } from '../../types';

const classData = interfaces.class[0].data.class;

const Creator = compose(
  withFields(),
  withInitialData(),
  withMethods(),
  withSteps(),
  withGlobalOptions(),
  withMapper()
)(DraftsProvider);

const meta = {
  component: CreateInterface,
  title: 'Interfaces Manager/Config Item',
  args: {
    id: classData.id,
  },
  render: ({ id, data }) => {
    return (
      <InterfacesProvider>
        <Creator>
          <Panel
            forceSubmit
            parent='class'
            type={'config-item'}
            initialInterfaceId={id}
            data={data}
            disabledFields={data && data.parent && ['name']}
            isEditing={!!data}
          />
        </Creator>
      </InterfacesProvider>
    );
  },
} as StoryMeta<any>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const Existing: Story = {
  args: {
    data: classData['config-items'][0],
  },
};
