import { StoryObj } from '@storybook/react';
import { within } from '@storybook/test';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import { StoryMeta } from '../../types';
import {
  _testsSelectFromAppCatalogue,
  _testsSelectItemFromCollection,
  _testsWaitForText,
} from '../utils';
import { SwitchesToBuilder } from './Basic.stories';
import { NewIfStateWithExpression } from './States.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Regression Tests',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const MultipleOptionsWithOneAllowedValue: StoryFSM = {
  play: async (context) => {
    const canvas = within(context.canvasElement);

    await SwitchesToBuilder.play(context);
    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Haltian Empathic Building',
      'Sensor Events'
    );

    await _testsWaitForText('Create new connection');
    await _testsSelectItemFromCollection(canvas, 'Haltian Demo')();
    await _testsWaitForText('239');
    await _testsWaitForText('337');
  },
};

export const SubExpressionCanBeAddedInIfState: StoryFSM = {
  parameters: {
    chromatic: { disable: true },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await NewIfStateWithExpression.play(context);

    // Select concat from the list
    await _testsSelectItemFromCollection(canvas, 'equals', undefined, '.function-selector')();
  },
};
