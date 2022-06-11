export const pn = (value?: number | null): string | undefined => {
  if (value === null || value === undefined) {
    return;
  }

  const parts = value.toString().split(".");

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
};
