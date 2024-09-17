import { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import SelfhostedAlert from './SelfhostedAlert';
import UnsafeAlert from './UnsafeAlert';

const HostAlert = (): JSX.Element => {
  const { client } = useContext<UseAppStoreType>(AppContext);
  const component = client === 'selfhosted' || client === 'desktop' ? SelfhostedAlert : UnsafeAlert;
  return component();
};

export default HostAlert;
