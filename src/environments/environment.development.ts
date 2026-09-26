export const environment = {
    production: false,
    baseUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000`,
    apiUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000/api/v1`,
};

