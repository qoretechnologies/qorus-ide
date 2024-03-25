import { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import compose from 'recompose/compose';
import { Messages } from '../constants/messages';
import { addMessageListener, postMessage } from './withMessageHandler';

// A HoC helper that gets the current target dir
export default () =>
  (Component: FunctionComponent): FunctionComponent => {
    interface IEnhancedComponent {
      setTargetDir: (dir: string) => void;
    }
    const EnhancedComponent: FunctionComponent<IEnhancedComponent> = ({
      setTargetDir,
      ...rest
    }) => {
      useEffectOnce(() => {
        // Request the target dir
        postMessage(Messages.GET_OPENING_PATH);
        // Register the listener for the target dir
        addMessageListener(Messages.RETURN_OPENING_PATH, (data: any) => {
          setTargetDir(data.path);
        });
      });
      // Return the enhanced component
      return <Component {...rest} />;
    };

    return compose(
      connect(
        (state) => ({
          targetDir: state.create_iface_target_dir,
        }),
        (dispatch) => ({
          setTargetDir: (targetDir) =>
            dispatch({
              type: 'create_iface_target_dir',
              create_iface_target_dir: targetDir,
            }),
        })
      )
    )(EnhancedComponent);
  };
