import NavBar from './NavBar';

export type Page = 'robot' | 'order' | 'create' | 'offers' | 'settings' | 'none';
export default NavBar;

export function isPage(page: string): page is Page {
  return ['robot', 'order', 'create', 'offers', 'settings', 'none'].includes(page);
}
