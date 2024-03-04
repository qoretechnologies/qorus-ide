import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Messages } from '../constants/messages';
import { postMessage } from '../hocomponents/withMessageHandler';

export const URLHandler = () => {
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      postMessage(
        Messages.GET_INTERFACE_DATA,
        {
          type: params?.subtab,
          id: params?.id,
          include_tabs: true,
        },
        true
      );
    }
  }, [params?.id]);

  return null;
};
