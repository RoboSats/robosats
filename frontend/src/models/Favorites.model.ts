export interface Favorites {
  type: number | null;
  mode: 'swap' | 'fiat';
  currency: number;
  coordinator: string;
}

export default Favorites;
