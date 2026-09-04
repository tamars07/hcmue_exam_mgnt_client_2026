import safeJsonParse from 'utils/safeJsonParse';

export default function authHeader() {
    const user = safeJsonParse(localStorage.getItem('user'), {});

    if (user && user.accessToken) {
        // for Node.js Express back-end
        return { 'x-access-token': user.accessToken };
    } else {
        return {};
    }
}