export function computeAge(birthday: string | null): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function computeAgeAtDate(birthday: string | null, referenceDate: Date): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function computeAverageAge(birthdays: (string | null)[]): number | null {
  const ages = birthdays.map(computeAge).filter((a): a is number => a !== null);
  if (ages.length === 0) return null;
  return ages.reduce((sum, a) => sum + a, 0) / ages.length;
}
