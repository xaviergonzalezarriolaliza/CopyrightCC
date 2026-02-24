const { defineConfig } = require('cypress')

module.exports = defineConfig({
  experimentalStudio: true,
  e2e: {
    baseUrl: 'https://www.copyright.com',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.js'
  }
})
