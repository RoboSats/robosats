import { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import SelfhostedAlert from './SelfhostedAlert';
import UnsafeAlert from './UnsafeAlert';

const HostAlert = (): React.JSX.Element => {
  const { client, hostUrl } = useContext<UseAppStoreType>(AppContext);
  const component =
    !hostUrl.includes('robosats') && (client === 'selfhosted' || client === 'desktop')
      ? SelfhostedAlert
      : UnsafeAlert;
  return component();
};

export default HostAlert;
