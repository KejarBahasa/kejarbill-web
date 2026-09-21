import { ApiError } from '../types';

export interface FieldError {
	field: string;
	message: string;
}

const messages: Record<string, string> = {
	'group not found': 'Grup tidak ditemukan.',
	'forbidden group access': 'Kamu bukan anggota grup ini.',
	'user not found': 'User tidak ditemukan.',
	'expense not found': 'Expense tidak ditemukan.',
	'settlement not found': 'Settlement tidak ditemukan.',
	'invalid total amount': 'Total harus habis dibagi jumlah peserta.',
	'total amount is not evenly divisible among participants': 'Total harus habis dibagi jumlah peserta.',
	'participants required': 'Pilih minimal satu peserta.',
	'payer not included in participants': 'Pembayar harus termasuk peserta yang dibagi.',
	'payer participant not found in group': 'Pembayar bukan peserta grup ini.',
	'participant not found in group': 'Peserta tidak ada di grup ini.',
	'participants contains duplicate': 'Ada peserta yang dipilih dua kali.',
	'invalid expense date': 'Format tanggal expense tidak valid.',
	'user already member': 'User sudah menjadi member grup ini.',
	'one or more users not found': 'Ada user yang tidak ditemukan.',
	'one or more users already member': 'Ada user yang sudah menjadi member.',
	'requires group owner or admin role': 'Hanya owner/admin grup yang boleh melakukan ini.',
	'duplicate guest display name': 'Nama tamu tidak boleh sama.',
	'participant not found': 'Participant tidak ditemukan.',
	'participant is not a claimable guest': 'Participant ini bukan tamu yang bisa di-claim.',
	'invalid settlement participants': 'Peserta settlement tidak valid.',
	'settlement amount exceeded outstanding balance':
		'Jumlah melebihi saldo utang peserta tersebut ke penerima.',
	'idempotency key is required': 'Terjadi kesalahan permintaan. Coba lagi.',
	'idempotency key has already been used with a different request':
		'Permintaan bentrok dengan submit sebelumnya. Coba lagi.',
	'payment method must be empty for cash payment channel':
		'Untuk tunai, metode pembayaran tidak dipakai.',
	'payment method is required for bank transfer and e-wallet payment channels':
		'Pilih metode pembayaran untuk transfer bank / e-wallet.',
	'payment method is not owned by the recipient': 'Metode pembayaran harus milik penerima.',
	'invalid payment method type for the selected payment channel':
		'Tipe metode tidak cocok dengan saluran bayar.',
	'payment method not found': 'Metode pembayaran tidak ditemukan.',
	'payment method is inactive': 'Metode pembayaran sedang dinonaktifkan.',
	'username already taken': 'Username sudah dipakai.',
	'email already registered': 'Email sudah terdaftar.',
	'username and email already taken': 'Username dan email sudah dipakai.',
	'invalid credentials': 'Username/email atau password salah.'
};

export function mapApiError(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
	if (err instanceof ApiError) {
		const known = messages[err.message];
		if (known) return known;
		const fields = fieldErrors(err);
		if (fields.length > 0) return `${err.message}: ${fields[0].message}`;
		return err.message || fallback;
	}
	return fallback;
}

export function fieldErrors(err: unknown): FieldError[] {
	if (err instanceof ApiError && Array.isArray(err.errors)) {
		return err.errors.filter(
			(e): e is FieldError => !!e && typeof e === 'object' && 'field' in e && 'message' in e
		);
	}
	return [];
}
