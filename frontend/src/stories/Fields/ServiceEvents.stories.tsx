import { expect } from '@storybook/jest';
import { Meta, StoryObj } from '@storybook/react';
import { waitFor } from '@storybook/testing-library';
import { IServiceEventList, ServiceEventListField } from '../../components/Field/serviceEvents';
import serviceEvents from '../Data/serviceEvents.json';

const meta = {
  component: ServiceEventListField,
  title: 'Fields/Service Events',
} as Meta<typeof ServiceEventListField>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
export const Existing: StoryObj<typeof meta> = {
  play: async () => {
    await waitFor(
      () => {
        expect(document.querySelectorAll('.service-event-handler').length).toBe(3);
      },
      { timeout: 5000 }
    );
  },
  args: {
    value: serviceEvents as IServiceEventList,
  },
};
