/**
 * Convierte BigInt y Decimal a tipos serializables
 * @param {any} value - Valor a convertir
 * @returns {any} Valor convertido
 */
function convertBigInt(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  // Detectar objetos Decimal de Prisma (tienen propiedades s, e, d)
  if (
    value !== null &&
    typeof value === "object" &&
    "d" in value &&
    "e" in value &&
    "s" in value
  ) {
    return parseFloat(value.toString());
  }
  if (Array.isArray(value)) {
    return value.map(convertBigInt);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, convertBigInt(v)])
    );
  }
  return value;
}

export function paginate(items, page = 1, perPage = 50, totalOverride) {
  const total =
    typeof totalOverride === "number" ? totalOverride : items.length;
  const last_page = Math.max(1, Math.ceil(total / perPage));
  const current_page = Math.min(page, last_page);
  const from = (current_page - 1) * perPage;
  const to = Math.min(from + perPage, total);

  // Convertir BigInt a String en los datos
  const convertedData = convertBigInt(items);

  return {
    data: convertedData,
    total,
    per_page: perPage,
    current_page,
    last_page,
  };
}
