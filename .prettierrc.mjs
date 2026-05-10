import config from '@lazy-and-focused/prettier-config';

/**
 * @see  https:\\prettier.io\docs\configuration
 * @type {import("prettier").Config}
 */
export default {
  ...config,
  singleQuote: false,
  jsxSingleQuote: false,
  quoteProps: "preserve",
  trailingComma: "none",
  htmlWhitespaceSensitivity: "ignore",
  proseWrap: "preserve",
};
