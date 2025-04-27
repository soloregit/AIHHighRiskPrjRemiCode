export const isAuthenticated = () => {
    if (typeof window !== 'undefined') {
        const storedOaiKey = localStorage.getItem('acnt::oai_key');
        const storedApiToken = localStorage.getItem('acnt::api_token');

        if (storedOaiKey && storedApiToken) {
            return true;
        }
    }
    return false;
};
export const getApiKey = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('acnt::oai_key');
    }
}
export const getUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('acnt::user');
        if (user) {
            return JSON.parse(user);
        }
    }
    return null;
}
export const setCredentials = (oai_key: string, api_token: string, user: any) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('acnt::oai_key', oai_key);
        localStorage.setItem('acnt::api_token', api_token);
        localStorage.setItem('acnt::user', JSON.stringify(user));
    }
};
