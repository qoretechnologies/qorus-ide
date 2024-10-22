import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';
import { ExpressionBuilder, IExpression } from '../../components/ExpressionBuilder';
import {
  _testsClickButton,
  _testsOpenTemplates,
  _testsSelectItemFromCollection,
  _testsWaitForText,
  sleep,
} from '../Tests/utils';
import { StoryMeta } from '../types';

const meta = {
  component: ExpressionBuilder,
  title: 'Components/Expression Builder',
  render: (args) => {
    const [exp, setExp] = useState<IExpression>(args.value);

    console.log(exp);

    return (
      <ExpressionBuilder
        {...args}
        localTemplates={{
          label: 'Testing',
          items: [
            {
              label: 'Testing bool',
              badge: 'Test',
              items: [
                {
                  label: 'Testing bool',
                  badge: 'bool',
                  value: '$local:some-bool',
                },
              ],
            },
          ],
        }}
        value={exp}
        onChange={(value) => {
          setExp(value);
        }}
      />
    );
  },
} as StoryMeta<typeof ExpressionBuilder>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    returnType: ['string', 'int'],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });
  },
};
export const WithSimpleValue: Story = {
  args: {
    value: {
      is_expression: true,
      value: {
        exp: 'CONTAINS',
        args: [
          {
            type: 'string',
            value: '$local:input',
          },
          {
            type: 'string',
            value: 'es',
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });
  },
};

export const WithComplexValue: Story = {
  args: {
    value: {
      is_expression: true,
      value: {
        exp: 'AND',
        args: [
          {
            value: {
              exp: 'OR',
              args: [
                {
                  value: {
                    exp: 'CONTAINS',
                    args: [
                      {
                        type: 'string',
                        value: '$local:input',
                      },
                      {
                        type: 'string',
                        value: 'es',
                      },
                    ],
                  },
                  is_expression: true,
                },
                {
                  value: {
                    exp: 'AND',
                    args: [
                      {
                        value: {
                          exp: 'STARTS-WITH',
                          args: [
                            {
                              type: 'string',
                              value: 'test',
                            },
                            {
                              type: 'string',
                              value: 't',
                            },
                          ],
                        },
                        is_expression: true,
                      },

                      {
                        value: {
                          exp: 'STARTS-WITH',
                          args: [
                            {
                              type: 'string',
                              value: 'test',
                            },
                            {
                              type: 'string',
                              value: 't',
                            },
                          ],
                        },
                        is_expression: true,
                      },
                    ],
                  },
                  is_expression: true,
                },

                {
                  value: {
                    exp: 'GREATER-THAN-OR-EQUALS',
                    args: [
                      {
                        type: 'int',
                        value: '23',
                      },
                      {
                        type: 'string',
                        value: '$local:id',
                      },
                    ],
                  },
                  is_expression: true,
                },
              ],
            },
            is_expression: true,
          },
          {
            value: {
              exp: 'ENDS-WITH',
              args: [
                {
                  type: 'string',
                  value: '$local:str',
                },
                {
                  type: 'string',
                  value: '$local:p',
                },
              ],
            },
            is_expression: true,
          },
          {
            value: {
              exp: 'LESS-THAN',
              args: [
                {
                  type: 'int',
                  value: '$local:input',
                },
                {
                  type: 'string',
                  value: '$local:p',
                },
              ],
            },
            is_expression: true,
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(6), {
      timeout: 10000,
    });
  },
};

export const WithIntType: Story = {
  args: {
    type: 'int',
    value: {
      value: {
        exp: 'GREATER-THAN-OR-EQUALS',
        args: [
          {
            type: 'int',
            value: '$local:input',
          },
          {
            type: 'int',
            value: 20,
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });
  },
};

export const WithSelectableType: Story = {
  args: {
    value: {
      value: {
        exp: 'EQUALS-BOOL',
        args: [
          {
            type: 'bool',
            value: '$local:test-bool',
          },
          {
            type: 'bool',
            value: true,
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });
  },
};

export const ArgsChangeWhenOperatorChanges: Story = {
  ...WithSimpleValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression .reqore-textarea')).toHaveLength(2),
      { timeout: 10000 }
    );

    await _testsSelectItemFromCollection(canvas, 'is between', 'contains')();

    await waitFor(
      () => expect(document.querySelectorAll('.expression .reqore-textarea')).toHaveLength(3),
      { timeout: 10000 }
    );

    await expect(document.querySelectorAll('.expression .reqore-textarea')).toHaveLength(3);
  },
};

export const NewGroupsCanBeCreated: Story = {
  ...WithSimpleValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });

    await fireEvent.click(document.querySelector('.expression-and'));

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(2), {
      timeout: 10000,
    });

    await fireEvent.click(document.querySelector('.expression-or'));

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(3), {
      timeout: 10000,
    });
  },
};

export const GroupsCanBeDeleted: Story = {
  ...WithComplexValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(6), {
      timeout: 10000,
    });

    await sleep(1000);

    await fireEvent.click(document.querySelectorAll('.expression-group-remove')[1]);

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(5), {
      timeout: 10000,
    });
  },
};

export const ExpressionIsResetWhenValueIsRemoved: Story = {
  ...WithIntType,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression .template-remove')).toHaveLength(1),
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelectorAll('.expression .template-remove')[0]);

    await expect(document.querySelector('.expression-operator-selector')).not.toBeInTheDocument();
  },
};

export const NewExpression: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(document.querySelectorAll('.expression')).toHaveLength(1), {
      timeout: 10000,
    });

    console.log('Opening templates in new expression');

    await _testsOpenTemplates();

    await sleep(300);

    console.log('Clicking context data in new expression');

    await fireEvent.click(canvas.getAllByText(/Context Data/)[0]);

    await sleep(300);

    console.log('Clicking interface name in new expression');

    await fireEvent.click(canvas.getAllByText(/Interface Name/)[0]);

    await sleep(1500);

    console.log('Selecting `ends with` in new expression');

    await _testsSelectItemFromCollection(canvas, 'ends with', 'PleaseSelect')();

    await sleep(300);

    await fireEvent.change(document.querySelectorAll('.expression .reqore-textarea')[1], {
      target: { value: 'test' },
    });

    console.log('Waiting for the checkbox in the expression');

    await waitFor(
      () => {
        expect(document.querySelector('.expression .reqore-checkbox')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelector('.expression .reqore-checkbox'));
  },
};

export const ExpressionWithIntReturnType: Story = {
  args: {
    type: 'int',
    returnType: 'int',
    value: {
      value: {
        exp: 'PLUS-INT',
        args: [
          {
            type: 'int',
            value: '$local:id',
          },
          {
            type: 'int',
            value: 20,
          },
          {
            type: 'int',
            value: '$local:time',
          },
          {
            type: 'int',
            value: 10,
          },
        ],
      },
      is_expression: true,
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression .template-remove')).toHaveLength(2),
      { timeout: 10000 }
    );
  },
};

export const VariableArgumentsCanBeRemoved: Story = {
  ...ExpressionWithIntReturnType,
  play: async ({ canvasElement, ...rest }) => {
    await ExpressionWithIntReturnType.play({ canvasElement, ...rest });

    await fireEvent.click(document.querySelector('.expression-remove-arg'));

    await waitFor(
      () => expect(document.querySelectorAll('.expression-remove-arg')).toHaveLength(2),
      { timeout: 10000 }
    );
  },
};

export const VariableArgumentsCanBeAdded: Story = {
  ...ExpressionWithIntReturnType,
  play: async ({ canvasElement, ...rest }) => {
    await ExpressionWithIntReturnType.play({ canvasElement, ...rest });

    await fireEvent.click(document.querySelector('.expression-remove-arg'));

    await waitFor(
      () => expect(document.querySelectorAll('.expression-remove-arg')).toHaveLength(2),
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelector('.expression-add-arg'));

    await waitFor(
      () => expect(document.querySelectorAll('.expression-remove-arg')).toHaveLength(3),
      { timeout: 10000 }
    );
  },
};

export const FunctionsInsideExpression: Story = {
  ...NewExpression,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await NewExpression.play({ canvasElement, ...rest });

    await sleep(300);

    await fireEvent.click(document.querySelector('.function-selector'));
    await waitFor(() => fireEvent.click(canvas.queryAllByText('substr()')[0]), {
      timeout: 10000,
    });
    await waitFor(() => expect(document.querySelectorAll('.reqore-input')).toHaveLength(2), {
      timeout: 10000,
    });

    await fireEvent.change(document.querySelectorAll('.reqore-input')[0], {
      target: { value: 10 },
    });
  },
};

export const FunctionFirstArgTypeCanBeChanged: Story = {
  args: {
    returnType: 'string',
    value: {
      value: {
        exp: 'FORMAT-NUMBER',
        args: [
          {
            type: 'number',
            value: 1,
            is_expression: false,
            required: true,
          },
          {
            type: 'string',
            is_expression: false,
            required: true,
          },
          {
            type: 'string',
            is_expression: false,
            required: true,
          },
          {
            type: 'int',
            is_expression: false,
            required: true,
          },
        ],
      },
      type: 'string',
      is_expression: true,
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(canvas.queryAllByText(/format number with/)[0]).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    await sleep(5000);

    await _testsSelectItemFromCollection(canvas, 'str', 'num')();

    // await waitFor(() => expect(canvas.queryAllByText(/int/)).toHaveLength(2), {
    //   timeout: 10000,
    // });
  },
};

export const ExpressionCanBeWrapped: Story = {
  args: {
    value: {
      value: {
        exp: 'OR',
        args: [
          {
            value: {
              args: [
                {
                  value: '$local:some-bool',
                  type: 'bool',
                },
                {
                  value: 'kek',
                  type: 'string',
                  is_expression: false,
                  required: true,
                },
              ],
              exp: 'ABSOLUTE-EQUALS',
            },
            is_expression: true,
          },
          {
            value: {
              args: [
                {
                  value: '$timestamp:next_midnight',
                  type: 'date',
                },
                {
                  value: 'test',
                  type: 'string',
                  is_expression: false,
                  required: true,
                },
              ],
              exp: 'LIST-CONTAINS',
            },
            is_expression: true,
            type: 'string',
            required: true,
          },
        ],
      },
      is_expression: true,
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await _testsWaitForText('absolutely equals');
    await _testsWaitForText('contains');

    await _testsSelectItemFromCollection(canvas, 'concatenate (string)', 'Wrap')();

    await _testsWaitForText('concatenate (string)');
  },
};
export const ExpressionCanBeUnwrapped: Story = {
  ...ExpressionCanBeWrapped,
  play: async ({ canvasElement, ...rest }) => {
    await ExpressionCanBeWrapped.play({ canvasElement, ...rest });

    await _testsClickButton({ selector: '.expression-unwrap' });

    await expect(document.querySelectorAll('.expression')).toHaveLength(2);
  },
};

export const ExpressionCanBeChanged: Story = {
  args: {
    value: {
      value: {
        exp: 'GREATER-THAN',
        args: [
          {
            value: {
              args: [
                {
                  value: '$local:name',
                  type: 'string',
                },
              ],
              exp: 'SIZE',
            },
            is_expression: true,
            required: true,
          },
          {
            type: 'int',
            is_expression: false,
            required: true,
          },
        ],
      },
      is_expression: true,
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    await _testsWaitForText('get size');

    await sleep(2000);

    await _testsSelectItemFromCollection(within(canvasElement), 'contains', 'get size')();

    await sleep(2000);

    await _testsSelectItemFromCollection(
      within(canvasElement),
      'concatenate (string)',
      'contains'
    )();
  },
};

export const MultipleAcceptedTypes: Story = {
  args: {
    returnType: ['string', 'int'],
    value: {
      value: {
        args: [
          {
            value: {
              exp: 'PLUS-STRING',
              args: [
                {
                  type: 'string',
                  value: '$local:name',
                },
                {
                  value: 'issue3102service',
                  type: 'service',
                  is_expression: false,
                  required: true,
                },
                {
                  value: 'telco-om-demo',
                  type: 'job',
                  is_expression: false,
                  required: true,
                },
              ],
            },
            type: 'string',
            is_expression: true,
            required: true,
          },
          {
            value: 1,
            type: 'float',
            is_expression: false,
            required: true,
          },
        ],
        exp: 'DIV-FLOAT',
      },
      is_expression: true,
    },
  },
};
