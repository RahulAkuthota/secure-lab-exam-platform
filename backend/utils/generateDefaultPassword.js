export const generateDefaultPassword = () => {
  const randomPart = Math.random().toString(36).slice(-8);
  return `Lab@${randomPart}`;
};
