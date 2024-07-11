import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Messages } from '../constants/messages';
import { postMessage } from '../hocomponents/withMessageHandler';

export const URLHandler = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const proxy = searchParams.get('to');
  const navigate = useNavigate();

  useEffect(() => {
    if (params?.id) {
      postMessage(
        Messages.GET_INTERFACE_DATA,
        {
          type: params?.subtab,
          id: parseInt(params.id, 10),
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

  useEffect(() => {
    if (proxy) {
      navigate(proxy);
    }
  }, [proxy]);

  return null;
};
