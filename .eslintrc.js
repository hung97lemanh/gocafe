module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es6: true
    },
    extends: ["eslint:recommended", "next/core-web-vitals"],
    rules: {
        // Keep your disabled rules
        "no-unused-vars": "off",
        "no-console": "off",

        // NextJS specific rules that might need disabling
        "@next/next/no-img-element": "off",
        "@next/next/no-html-link-for-pages": "off"
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: ["react"]
};
