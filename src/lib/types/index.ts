export interface Pagination {
	page: number;
	limit: number;
	total_items: number;
	total_pages: number;
}

export interface Meta {
	pagination?: Pagination;
}

export interface ApiResponse<T> {
	status: string;
	message: string;
	data: T;
	errors?: unknown;
	meta?: Meta;
}

export class ApiError extends Error {
	readonly status: number;
	readonly errors?: unknown;

	constructor(status: number, message: string, errors?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}
}
