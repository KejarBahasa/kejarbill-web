const idr = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	maximumFractionDigits: 0
});

export function formatIDR(n: number): string {
	return idr.format(n);
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });
}

export function formatDateShort(iso: string): string {
	return new Date(iso).toLocaleDateString('id-ID');
}

export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
}

const jakartaDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Jakarta',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

/** Value for datetime-local, explicitly displayed in the group's Jakarta timezone. */
export function formatJakartaDateTimeInput(date = new Date()): string {
	const parts = Object.fromEntries(
		jakartaDateTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value])
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Convert a timezone-less datetime-local value to an explicit Jakarta timestamp. */
export function jakartaInputToISO(value: string): string {
	if (!value) return value;
	if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) return value;
	return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}
