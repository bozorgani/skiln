const sanitizeHtml = require('sanitize-html');

const textOnly = (value = '') => sanitizeHtml(String(value), {
  allowedTags: [],
  allowedAttributes: {},
}).trim();

const richText = (value = '') => sanitizeHtml(String(value), {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    span: ['class'],
    code: ['class'],
    pre: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
  },
});

module.exports = {
  textOnly,
  richText,
};
