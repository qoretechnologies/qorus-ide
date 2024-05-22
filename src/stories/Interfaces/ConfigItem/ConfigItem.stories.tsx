import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor } from "@storybook/test";
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
import {
  _testsClickButton,
  _testsConfirmDialog,
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
  sleep,
} from '../../Tests/utils';
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
  render: ({ id, data, onSubmit }) => {
    return (
      <InterfacesProvider>
        <Creator>
          <Panel
            forceSubmit
            parent='class'
            type={'config-item'}
            initialInterfaceId={id}
            data={data}
            onSubmitSuccess={onSubmit}
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

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ beforeCount, afterCount }) => {
    await _testsExpectFieldsCountToMatch(beforeCount ?? 7, true);
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(afterCount ?? 6, true);
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'strictly_local',
      'Optional fields available (5)'
    )();
    await _testsExpectFieldsCountToMatch(5, true);
    await sleep(300);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (4)'
    )();
    await _testsExpectFieldsCountToMatch(9, true);
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (5)'
    )();
    await _testsExpectFieldsCountToMatch(9, true);
    await _testsClickButton({ label: 'DiscardChangesButton' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(4, true);
  },
};

export const SubmittedDataAreCorrect: Story = {
  args: {
    ...Existing.args,
  },
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ args, ...rest }) => {
    await FieldCanBeRemoved.play({ args, ...rest });
    await fireEvent.change(
      document.querySelector('.creator-field .reqore-input'),
      { target: { value: 'Test' } }
    );
    await _testsClickButton({ label: 'Submit' });

    await waitFor(
      () =>
        expect(args.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Test' })
        ),
      { timeout: 5000 }
    );
  },
};
