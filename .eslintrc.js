module.exports = {
    root: true,
    env: {
        node: true,
        browser: true
    },
    rules: {
        // This disables all rules
        "no-unused-vars": "off",
        "no-console": "off"
    },
    // Set parserOptions to empty to prevent parsing
    parserOptions: {},
    // Disable all plugins and extends
    plugins: [],
    extends: []
};
