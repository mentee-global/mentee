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
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 30000,
    retries: 2,
    "numTestsKeptInMemory": 0,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});