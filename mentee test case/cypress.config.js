const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    watchForFileChanges:false,
    ensureScrollable: true,
    parseSpecialCharSequences: false,
    defaultCommandTimeout:4000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
