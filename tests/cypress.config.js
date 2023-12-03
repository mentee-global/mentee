const { defineConfig } = require("cypress");

const dotenv = require("dotenv");
dotenv.config();

module.exports = defineConfig({
  rootPath: "../frontend",
  e2e: {
    baseUrl:process.env.BASE_URL,
    watchForFileChanges:false,
    ensureScrollable: true,
    parseSpecialCharSequences: false,
    defaultCommandTimeout:4000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});