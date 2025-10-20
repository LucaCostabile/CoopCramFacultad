export function paginate(items, page = 1, perPage = 50, totalOverride) {
  const total = typeof totalOverride === 'number' ? totalOverride : items.length;
  const last_page = Math.max(1, Math.ceil(total / perPage));
  const current_page = Math.min(page, last_page);
  const from = (current_page - 1) * perPage;
  const to = Math.min(from + perPage, total);
  return {
    data: items.slice(from, to),
    total,
    per_page: perPage,
    current_page,
    last_page,
  };
}
