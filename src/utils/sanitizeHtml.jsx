import DOMPurify from 'dompurify';

// Strips <script>, event handler attributes (onerror, onclick, ...), javascript: URIs, etc.
// before content sourced from the question bank is rendered as HTML.
export const sanitizeHtml = (html) => DOMPurify.sanitize(html || '');

export default sanitizeHtml;
