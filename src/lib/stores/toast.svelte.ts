export type ToastType = 'success' | 'error';

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
}

const store = $state({ items: [] as Toast[] });

let counter = 0;

function dismiss(id: number) {
	store.items = store.items.filter((t) => t.id !== id);
}

function push(type: ToastType, message: string) {
	const id = ++counter;
	store.items = [...store.items, { id, type, message }];
	setTimeout(() => dismiss(id), 4000);
}

export const toast = {
	get items(): Toast[] {
		return store.items;
	},
	success: (message: string) => push('success', message),
	error: (message: string) => push('error', message),
	dismiss
};
