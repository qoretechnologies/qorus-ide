import {
  ReqoreControlGroup,
  ReqoreMessage,
  ReqoreModal,
  ReqoreP,
  ReqoreTextarea,
  ReqoreVerticalSpacer,
} from '@qoretechnologies/reqore';
import { useEffect, useState } from 'react';

import { IReqoreModalProps } from '@qoretechnologies/reqore/dist/components/Modal';
import { useFetch } from '@qoretechnologies/reqraft';
import { useNavigate } from 'react-router-dom';
import { interfaceToPlural } from '../../constants/interfaces';
import { QorusColorEffect, SynthColorEffect } from '../Field/multiPair';

export interface ICreateInterfaceFromTextProps extends IReqoreModalProps {
  type?: string;
}

export const CreateInterfaceFromTextModal = ({
  type,
  onClose,
}: ICreateInterfaceFromTextProps) => {
  const [text, setText] = useState<string>('');
  const navigate = useNavigate();

  const { load, loading, data, error } = useFetch({
    url: `${interfaceToPlural[type]}/createDraftFromText`,
    method: 'POST',
  });

  useEffect(() => {
    if (data && !error) {
      onClose();
      navigate(`/CreateInterface/${type}?draftId=${(data as any).draft_id}`);
    }
  }, [data, error]);

  const handleCreateClick = async () => {
    await load({ body: { input: text } });
  };

  return (
    <ReqoreModal
      isOpen
      onClose={onClose}
      {...{
        icon: 'MagicFill',
        label: 'Unleash the power of AI',
        iconColor: 'custom1:lighten:10',
        headerEffect: {
          weight: 'thick',
          gradient: {
            colors: {
              0: 'custom1:lighten:20',
              100: 'custom1:lighten:10',
            },
            animate: 'always',
          },
        },
        disabled: loading,
        bottomActions: [
          {
            label: 'Create manually',
            compact: true,
            icon: 'CloseLine',
            onClick: onClose,
          },
          {
            label: 'Create automagically',
            icon: 'MagicLine',
            compact: true,
            position: 'right',
            effect: QorusColorEffect,
            disabled: !text,
            onClick: handleCreateClick,
          },
        ],
        customZIndex: 99999,
        blur: 20,
        maxSize: '600px',
        minimal: true,
      }}
    >
      <ReqoreControlGroup vertical gapSize='big'>
        <ReqoreP size='small' effect={{ opacity: 0.6 }}>
          Simply input your text and let our intelligent system generate a
          ready-to-use interface for you. It's like magic, but real. Get ready
          to supercharge your development process!
        </ReqoreP>
        {error && (
          <ReqoreMessage opaque={false} size='small'>
            {error.message}
          </ReqoreMessage>
        )}
        <ReqoreTextarea
          placeholder='What would you like to create?'
          fluid
          scaleWithContent
          style={{ minHeight: '100px' }}
          effect={SynthColorEffect}
          value={text}
          onChange={(e: any) => setText(e.target.value)}
          transparent
        />
        <ReqoreVerticalSpacer height={1} />
      </ReqoreControlGroup>
    </ReqoreModal>
  );
};
