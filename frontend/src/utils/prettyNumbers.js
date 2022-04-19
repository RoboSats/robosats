export const pn = (value) => {
  if (value === null) {
    return;
  }

  let parts = value.toString().split(".");

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
};
