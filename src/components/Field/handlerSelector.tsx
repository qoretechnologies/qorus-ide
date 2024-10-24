import { ReqoreButton, ReqoreControlGroup, ReqoreRadioGroup } from '@qoretechnologies/reqore';
import { IField } from '../FieldWrapper';
import MethodSelector from './methodSelector';
import Select from './select';

export interface IServiceHandler {
  type?: 'fsm' | 'method';
  value?: string;
}

export interface IServiceHandlerProps {
  value: IServiceHandler;
  onChange: (value: IServiceHandler) => void;
  requestFieldData?: IField['requestFieldData'];
}

export const ServiceHandler = ({
  value = {},
  onChange,
  requestFieldData,
}: IServiceHandlerProps) => {
  return (
    <ReqoreControlGroup wrap>
      <ReqoreRadioGroup
        vertical={false}
        margin='none'
        selected={value.type}
        onSelectClick={(type: 'fsm' | 'method') => {
          onChange({
            value: undefined,
            type,
          });
        }}
        items={[
          { label: 'Method', value: 'method', margin: 'right' },
          { label: 'FSM', value: 'fsm', margin: 'right' },
        ]}
      />
      {value.type === 'method' && (
        <MethodSelector
          value={value.value}
          name='method'
          onChange={(_name, method) => {
            onChange({
              ...value,
              value: method,
            });
          }}
        />
      )}
      {value.type === 'fsm' && (
        <Select
          onChange={(_name, fsmName) =>
            onChange({
              ...value,
              value: fsmName,
            })
          }
          requestFieldData={requestFieldData}
          name='fsm'
          value={value.value}
          get_message={{
            action: 'creator-get-objects',
            object_type: 'fsm',
          }}
          return_message={{
            action: 'creator-return-objects',
            object_type: 'fsm',
            return_value: 'objects',
          }}
          reference={{
            iface_kind: 'fsm',
          }}
        />
      )}
      {value.type && (
        <ReqoreButton
          icon='CloseLine'
          onClick={() => onChange(undefined)}
          intent='danger'
          flat
          tooltip='Remove handler'
        />
      )}
    </ReqoreControlGroup>
  );
};
