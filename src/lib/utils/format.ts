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
