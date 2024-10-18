import NavBar from './NavBar';

export type Page = 'garage' | 'order' | 'create' | 'offers' | 'settings' | 'none';
export default NavBar;

export function isPage(page: string): page is Page {
  return ['garage', 'order', 'create', 'offers', 'settings', 'none'].includes(page);
}
