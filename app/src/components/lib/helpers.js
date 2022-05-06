/**
 * Function to turn props of components into css variables or values.
 */
function cssValue(...values) {
  return values.map((v) => `var(--${sanitize(v)}, ${v})`).join(' ');
}

/**
 * Function to generate 'sanitized' Id.
 */
function buildId(...values) {
  return values.map((v) => (typeof v === 'string' ? sanitize(v, '_') : String(v))).join('-');
}

/**
 * Function to get px value of variable or relative unit on DOM node.
 */
function pxValue(node, value) {
  const style = node.style;
  const currentValue = style.width;

  style.width = cssValue(value);
  const pixels = getComputedStyle(node).width;
  style.width = currentValue;

  return pixels.replace('px', '');
}

/**
 * Function to make string CSS variable- and class-name compatible.
 */
function sanitize(string, replacement = '') {
  return string.replace(/[^a-zA-Z0-9-_]/g, replacement);
}

export { cssValue, buildId, pxValue };
