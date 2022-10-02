export default function statusBadgeColor(status: string) {
  if (status === 'Active') {
    return 'success';
  }
  if (status === 'Seen recently') {
    return 'warning';
  }
  return 'error';
}
