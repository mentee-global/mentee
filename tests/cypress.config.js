const { defineConfig } = require("cypress");

const dotenv = require("dotenv");
dotenv.config();

module.exports = defineConfig({
  rootPath: "../frontend",
  e2e: {
    baseUrl:process.env.CYPRESS_BASE_URL,
    watchForFileChanges:false,
    ensureScrollable: true,
    parseSpecialCharSequences: false,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: 2,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});