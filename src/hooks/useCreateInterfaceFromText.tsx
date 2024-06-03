import {
  ReqoreControlGroup,
  ReqoreModal,
  ReqoreP,
  ReqoreTextarea,
  ReqoreTextEffect,
  ReqoreVerticalSpacer,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import { useEffect, useState } from 'react';
import {
  QorusColorEffect,
  SynthColorEffect,
} from '../components/Field/multiPair';

import { useFetch } from '@qoretechnologies/reqraft';

export interface IUseCreateInterfaceFromTextConfig {
  enable?: boolean;
}

export const CreateInterfaceFromTextModal = () => {
  const [text, setText] = useState<string>('');
  const removeModal = useReqoreProperty('removeModal');

  const { load, loading } = useFetch({
    url: 'fsms/createDraftFromText',
    method: 'POST',
  });

  const handleCreateClick = async () => {
    const draftData = await load({ body: { input: text } });
    console.log(draftData);
  };

  return (
    <ReqoreModal
      isOpen
      {...{
        icon: 'MagicFill',
        label: 'Create interface from text',
        disabled: loading,
        bottomActions: [
          {
            label: 'Create manually',
            compact: true,
            icon: 'CloseLine',
            onClick: () => {
              removeModal('create-interface-from-text');
            },
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
        <ReqoreP size='small'>
          Unleash the power of{' '}
          <ReqoreTextEffect
            effect={{
              weight: 'thick',
              spaced: 1,
              gradient: {
                colors: {
                  0: 'custom1:lighten:10',
                  100: 'custom1',
                },
                animate: 'always',
              },
            }}
          >
            AI
          </ReqoreTextEffect>
          ! Simply input your text and let our intelligent system generate a
          ready-to-use interface for you. It's like magic, but real. Get ready
          to supercharge your development process!
        </ReqoreP>
        <ReqoreTextarea
          placeholder='What would you like to create?'
          fluid
          scaleWithContent
          style={{ minHeight: '100px' }}
          effect={SynthColorEffect}
          value={text}
          onChange={(e: any) => setText(e.target.value)}
          minimal
        />
        <ReqoreVerticalSpacer height={1} />
      </ReqoreControlGroup>
    </ReqoreModal>
  );
};

export const useCreateInterfaceFromText = ({ enable = true }) => {
  const addModal = useReqoreProperty('addModal');
  const removeModal = useReqoreProperty('removeModal');

  useEffect(() => {
    if (enable) {
      addModal(<CreateInterfaceFromTextModal />, 'create-interface-from-text');
    }

    return () => {
      removeModal('create-interface-from-text');
    };
  }, [enable]);
};
