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
import { debounce } from 'lodash';
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
      loading={loading}
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
        bottomActions: [
          {
            label: 'Create manually',
            compact: true,
            icon: 'CloseLine',
            onClick: onClose,
            disabled: loading,
          },
          {
            label: loading ? 'Generating...' : 'Create automagically',
            icon: 'MagicLine',
            compact: true,
            position: 'right',
            effect: QorusColorEffect,
            disabled: !text,
            onClick: handleCreateClick,
            loading: loading,
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
          <ReqoreMessage opaque={false} size='small' intent='danger' fluid>
            The prompt lacks specific details for creating an automated
            workflow. Please provide specific actions or scenarios you would
            like to automate. For example, 'Send an email when a new file is
            added to a directory' or 'React to a new message in a Discord
            channel and send a notification.
          </ReqoreMessage>
        )}
        <ReqoreTextarea
          placeholder='What would you like to create?'
          fluid
          disabled={loading}
          scaleWithContent
          style={{ minHeight: '100px' }}
          effect={SynthColorEffect}
          value={text}
          onChange={debounce((e: any) => setText(e.target.value), 300)}
          transparent
        />
        <ReqoreVerticalSpacer height={1} />
      </ReqoreControlGroup>
    </ReqoreModal>
  );
};
