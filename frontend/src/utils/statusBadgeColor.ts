export default function statusBadgeColor(status: string): string {
  if (status === 'Active') {
    return 'success';
  }
  if (status === 'Seen recently') {
    return 'warning';
  }
  return 'error';
}
