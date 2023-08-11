export default function statusBadgeColor(status: string): 'success' | 'warning' | 'error' {
  if (status === 'Active') {
    return 'success';
  }
  if (status === 'Seen recently') {
    return 'warning';
  }
  return 'error';
}
