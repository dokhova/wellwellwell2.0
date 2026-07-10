export const pluralizeParticipants = (count: number) => {
  const value = Math.abs(Math.trunc(count));
  const mod100 = value % 100;
  const mod10 = value % 10;

  if (mod100 >= 11 && mod100 <= 14) return `${count} участников`;
  if (mod10 === 1) return `${count} участник`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} участника`;
  return `${count} участников`;
};
