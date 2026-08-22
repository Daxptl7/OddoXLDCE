const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return currencyFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

const categoryLabels: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  outdoor: "Outdoor",
  culture: "Culture",
  nightlife: "Nightlife",
  shopping: "Shopping",
};

export function formatCategory(category: string): string {
  return categoryLabels[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
