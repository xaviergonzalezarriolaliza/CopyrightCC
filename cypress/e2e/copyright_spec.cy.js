describe('Copyright.com homepage', () => {
  beforeEach(() => {
    cy.visitWithConsent('/')
  })

  it('loads and has a title containing Copyright', () => {
    cy.title().should('match', /copyright/i)
    cy.get('.menu-toggle__icon--close > svg').click({ force: true });                                           // menu
    cy.get('#primary-menu-list-mobile > #nav-menu-item-50313 > .main-menu-link').should('be.visible').click();  // log in
    
    const element = '#primary-menu-list-mobile > #nav-menu-item-50313 > .sub-menu > #nav-menu-item-50314 > .menu-link'  // my account
    // Ensure the link has an href before visiting it to avoid visiting `undefined`.
    cy.get(element).should('have.attr', 'href').then((myLink) => {
      cy.visit(myLink)
    })
    
    // Login form
    cy.get('#username').should('be.visible').type('xavier.gonzalez.arriola@gmail.com')
    cy.get('#password').should('be.visible').type('@RzHsJziGPzDQ@5')
    cy.get('.woocommerce-form > .button').should('be.visible').click()  // submit login

  })
})
