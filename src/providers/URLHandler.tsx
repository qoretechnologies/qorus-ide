import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Messages } from '../constants/messages';
import { postMessage } from '../hocomponents/withMessageHandler';

export const URLHandler = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (params?.id) {
      postMessage(
        Messages.GET_INTERFACE_DATA,
        {
          type: params?.subtab,
          id: params?.id,
          include_tabs: true,
          metadata: {
            searchParams: {
              ...Object.fromEntries(searchParams),
            },
          },
        },
        true
      );
    }
  }, [params?.id]);

  return null;
};
