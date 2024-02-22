import { expect } from '@storybook/jest';
import { Meta, StoryObj } from '@storybook/react';
import { fireEvent } from '@storybook/testing-library';
import LongStringField from '../../components/Field/longString';
import Number from '../../components/Field/number';
import { TemplateField } from '../../components/Field/template';
import { buildTemplates } from '../../helpers/functions';
import templates from '../Data/templates.json';
import { _testsOpenTemplates } from '../Tests/utils';

const meta = {
  component: TemplateField,
  title: 'Fields/Template',
  args: {
    templates: buildTemplates(templates as any),
  },
} as Meta<typeof TemplateField>;

export default meta;

export const StringComponent: StoryObj<typeof meta> = {
  args: {
    component: LongStringField,
    value: 'Some string',
  },
};

export const BooleanComponent: StoryObj<typeof meta> = {
  args: {
    value: true,
    type: 'boolean',
    allowTemplates: true,
    componentFromType: true,
  },
};

export const NumberComponent: StoryObj<typeof meta> = {
  args: {
    value: 25,
    type: 'int',
    allowTemplates: true,
    componentFromType: true,
  },
};

export const TemplateValue: StoryObj<typeof meta> = {
  args: {
    component: Number,
    type: 'int',
    value: '$config:something',
  },
};

export const ShowsTemplatesList: StoryObj<typeof meta> = {
  ...TemplateValue,
  play: async () => {
    await _testsOpenTemplates();
  },
};

export const ShowsTemplatesListForString: StoryObj<typeof meta> = {
  ...StringComponent,
  play: async () => {
    await _testsOpenTemplates();
  },
};

export const ShowsTemplatesListForBoolean: StoryObj<typeof meta> = {
  ...BooleanComponent,
  play: async () => {
    await fireEvent.click(document.querySelector('.template-toggle'));

    await _testsOpenTemplates();
  },
};

export const ShowsTemplatesListForNumber: StoryObj<typeof meta> = {
  ...NumberComponent,
  play: async () => {
    await _testsOpenTemplates();
  },
};

export const TemplateValueCanBeRemoved: StoryObj<typeof meta> = {
  args: {
    value: '$config:boolean',
    type: 'boolean',
    allowTemplates: true,
    componentFromType: true,
  },
  play: async () => {
    await expect(
      document.querySelector('.template-selector')
    ).toBeInTheDocument();

    await fireEvent.click(document.querySelector('.template-remove'));

    await expect(
      document.querySelector('.reqore-checkbox')
    ).toBeInTheDocument();
  },
};
