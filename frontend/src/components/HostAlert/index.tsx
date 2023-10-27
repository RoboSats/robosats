import { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import SelfhostedAlert from './SelfhostedAlert';
import UnsafeAlert from './UnsafeAlert';

const HostAlert = (): JSX.Element => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const component = settings.selfhostedClient ? SelfhostedAlert : UnsafeAlert;
  return component();
};

export default HostAlert;
