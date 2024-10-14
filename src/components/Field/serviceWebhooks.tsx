import {
  ReqoreButton,
  ReqoreCollection,
  ReqoreControlGroup,
  ReqoreLabel,
} from '@qoretechnologies/reqore';
import { IReqoreCollectionProps } from '@qoretechnologies/reqore/dist/components/Collection';
import { validateField } from '../../helpers/validations';
import { IField } from '../FieldWrapper';
import { ServiceHandler } from './handlerSelector';
import { PositiveColorEffect } from './multiPair';
import Select from './select';
import String from './string';

export type TServiceWebhookRestMethod = 'POST' | 'PUT' | 'GET';
export type TServiceWebhookAuth = 'NONE' | 'QORUS';

export interface IServiceWebhookHandler {
  type: 'fsm' | 'method';
  value: string;
}

export interface IServiceWebhook {
  name: string;
  'rest-method': TServiceWebhookRestMethod;
  auth: TServiceWebhookAuth;
  handler?: IServiceWebhookHandler;
}

export interface IServiceWebhooksFieldProps
  extends Omit<IReqoreCollectionProps, 'value' | 'onChange'>,
    Pick<IField, 'requestFieldData'> {
  value: IServiceWebhook[];
  onChange: (name: string, value: IServiceWebhook[]) => void;
}

export const ServiceWebhookFieldItem = ({ label, children }: { label: string; children?: any }) => {
  return (
    <ReqoreControlGroup vertical style={{ maxWidth: '100%' }}>
      <ReqoreLabel
        size='tiny'
        effect={{ weight: 'bold', uppercase: true }}
        intent='muted'
        label={label}
        minimal
      />
      {children}
    </ReqoreControlGroup>
  );
};

export const ServiceWebhooksField = ({
  value = [{ name: '', 'rest-method': 'POST', auth: 'QORUS' }],
  onChange,
  requestFieldData,
  intent,
}: IServiceWebhooksFieldProps) => {
  const handleValueChange = (index: number, key: string, val: any) => {
    const newValue = [...value];
    newValue[index][key] = val;

    onChange('webhooks', newValue);
  };

  const handleRemoveWebhookClick = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);

    onChange('webhooks', newValue);
  };

  return (
    <>
      <ReqoreCollection
        sortable
        filterable
        zoomable
        sortKeys={{
          name: 'Name',
        }}
        intent={intent}
        items={value.map((webhook, index) => ({
          label: `Webhook #${index + 1}`,
          metadata: {
            name: webhook.name,
          },
          searchString: webhook.name,
          intent: validateField('service-webhook', webhook) ? undefined : 'danger',
          size: 'small',
          actions: [
            {
              icon: 'DeleteBinLine',
              onClick: () => handleRemoveWebhookClick(index),
              intent: 'danger',
              compact: true,
              className: 'service-webhook-remove',
              minimal: true,
              leftIconColor: 'danger',
              flat: true,
              show: value.length > 1,
            },
          ],
          content: (
            <ReqoreControlGroup key={index} wrap>
              <ServiceWebhookFieldItem label='Name'>
                <String
                  value={webhook.name}
                  name='name'
                  onChange={(name, val) => handleValueChange(index, name, val)}
                />
              </ServiceWebhookFieldItem>
              <ServiceWebhookFieldItem label='REST Method'>
                <Select
                  defaultItems={[
                    {
                      name: 'POST',
                    },
                    {
                      name: 'PUT',
                    },
                    {
                      name: 'GET',
                    },
                  ]}
                  value={webhook['rest-method']}
                  name='rest-method'
                  onChange={(name, val) => handleValueChange(index, name, val)}
                />
              </ServiceWebhookFieldItem>
              <ServiceWebhookFieldItem label='AUTH'>
                <Select
                  defaultItems={[
                    {
                      name: 'QORUS',
                    },
                    {
                      name: 'NONE',
                    },
                  ]}
                  value={webhook.auth}
                  name='auth'
                  onChange={(name, val) => handleValueChange(index, name, val)}
                />
              </ServiceWebhookFieldItem>
              <ServiceWebhookFieldItem label='Handler'>
                <ServiceHandler
                  value={webhook.handler}
                  requestFieldData={requestFieldData}
                  onChange={(val) => handleValueChange(index, 'handler', val)}
                />
              </ServiceWebhookFieldItem>
            </ReqoreControlGroup>
          ),
        }))}
      />
      <ReqoreButton
        effect={PositiveColorEffect}
        icon='AddLine'
        rightIcon='AddLine'
        textAlign='center'
        iconsAlign='center'
        className='service-webhook-add'
        onClick={() => {
          const newValue = [...value];
          newValue.push({ name: '', 'rest-method': 'POST', auth: 'QORUS' });

          onChange('webhooks', newValue);
        }}
      >
        Add webhook
      </ReqoreButton>
    </>
  );
};
