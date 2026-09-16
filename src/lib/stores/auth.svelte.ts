const TOKEN_KEY = 'kejarbill.access_token';

let token: string | null = $state(
	typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
);

export const auth = {
	get token() {
		return token;
	},
	get isAuthenticated() {
		return token !== null;
	},
	setToken(value: string | null) {
		token = value;
		if (value === null) {
			localStorage.removeItem(TOKEN_KEY);
		} else {
			localStorage.setItem(TOKEN_KEY, value);
		}
	},
	clear() {
		this.setToken(null);
	}
};