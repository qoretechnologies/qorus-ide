import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { InitialContext } from '../context/init';

export const withIdChecker = () => (Component: any) => {
  const EnhancedComponent = (props: any) => {
    const params = useParams();
    const initialData = useContext(InitialContext);

    if (params?.id && params?.subtab && !initialData?.[params.subtab]) {
      return <Loader centered text='Loading data...' />;
    }

    return <Component {...props} />;
  };

  return EnhancedComponent;
};
