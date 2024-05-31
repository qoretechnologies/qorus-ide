import { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn } from '@storybook/test';
import auto from '../../components/Field/auto';
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
    onChange: fn(),
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

export const TemplateWithFunctions: StoryObj<typeof meta> = {
  args: {
    allowFunctions: true,
    type: 'string',
    defaultType: 'string',
    component: auto,
    fixed: true,
    fluid: false,
  },
};

export const TemplateWithFunctionValue: StoryObj<typeof meta> = {
  args: {
    allowFunctions: true,
    isFunction: true,
    value: {
      exp: 'SUBSTR',
      args: [
        { type: 'string', value: '$local:name' },
        { type: 'int', value: '$local:start' },
        { type: 'int', value: 10 },
      ],
    },
    type: 'string',
    defaultType: 'string',
    component: auto,
    fixed: true,
    fluid: false,
  },
};

export const TemplateWithNestedFunctionValue: StoryObj<typeof meta> = {
  args: {
    allowFunctions: true,
    isFunction: true,
    value: {
      exp: 'SUBSTR',
      args: [
        { type: 'string', value: '$local:name' },
        {
          type: 'int',
          value: {
            exp: 'PLUS-INT',
            args: [
              { type: 'int', value: '$local:start' },
              { type: 'int', value: '5' },
            ],
          },
          is_expression: true,
        },
        { type: 'int', value: 10 },
      ],
    },
    type: 'string',
    defaultType: 'string',
    component: auto,
    fixed: true,
    fluid: false,
  },
};
