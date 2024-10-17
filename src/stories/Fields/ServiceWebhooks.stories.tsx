import { StoryObj } from '@storybook/react';
import { expect } from '@storybook/test';
import { useState } from 'react';
import { ServiceWebhooksField } from '../../components/Field/serviceWebhooks';
import { validateField } from '../../helpers/validations';
import { InterfacesProvider } from '../../providers/Interfaces';
import { _testsClickButton } from '../Tests/utils';
import { StoryMeta } from '../types';

const meta = {
  component: ServiceWebhooksField,
  title: 'Fields/Service/Webhooks',
  render: (args) => {
    const [val, setVal] = useState(args.value);

    return (
      <InterfacesProvider>
        <ServiceWebhooksField
          value={val}
          onChange={(_name, val) => setVal(val)}
          intent={validateField('service-webhooks', val) ? undefined : 'danger'}
        />
      </InterfacesProvider>
    );
  },
} as StoryMeta<typeof ServiceWebhooksField>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
export const WithValue: StoryObj<typeof meta> = {
  args: {
    value: [
      {
        name: 'test',
        'rest-method': 'PUT',
        auth: 'QORUS',
        handler: {
          type: 'fsm',
          value: 'fsm-actions',
        },
      },
      {
        name: 'test2',
        'rest-method': 'GET',
        auth: 'NONE',
        handler: {
          type: 'method',
        } as any,
      },
      {
        name: 'test3',
        'rest-method': 'POST',
        auth: 'QORUS',
      },
    ],
  },
};

export const NewWebhookCanBeAdded: StoryObj<typeof meta> = {
  play: async () => {
    await _testsClickButton({ label: 'Add webhook' });
    await expect(document.querySelectorAll('.reqore-collection-item')).toHaveLength(2);
  },
};

export const WebhookCanBeRemoved: StoryObj<typeof meta> = {
  ...WithValue,
  play: async () => {
    await _testsClickButton({ selector: '.service-webhook-remove' });
    await expect(document.querySelectorAll('.reqore-collection-item')).toHaveLength(2);
  },
};
