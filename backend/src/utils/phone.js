const normalizePhone = (value = '') => {
  if (!value) return '';
  const trimmed = value.toString().trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return '';

  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }

  return digits;
};

module.exports = {
  normalizePhone,
};

