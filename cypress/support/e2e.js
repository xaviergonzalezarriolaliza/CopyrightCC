Cypress.Commands.add('visitWithConsent', (url = '/') => {
  return cy.visit(url, {
    onBeforeLoad(win) {
      try {
        win.document.cookie = 'OptanonAlertBoxClosed=true; path=/;'
        win.document.cookie = 'OptanonConsent=true; path=/;'
      } catch (e) {
        // ignore
      }
    }
  }).then(() => {
    // Try top-level accept controls, text-based buttons, then accessible iframes.
    cy.document().then((doc) => {
      const topBtn = doc.getElementById('onetrust-accept-btn-handler')
      if (topBtn) { topBtn.click(); return }

      const candidates = Array.from(doc.querySelectorAll('button, input[type="button"], a'))
      const acceptBtn = candidates.find(el => /accept all cookies|accept cookies|accept all/i.test(el.innerText))
      if (acceptBtn) { acceptBtn.click(); return }

      const iframes = Array.from(doc.getElementsByTagName('iframe'))
      for (const iframe of iframes) {
        try {
          const idoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document)
          if (!idoc) continue
          const fBtn = idoc.getElementById('onetrust-accept-btn-handler')
          if (fBtn) { fBtn.click(); return }
          const fCandidates = Array.from(idoc.querySelectorAll('button, input[type="button"], a'))
          const fAccept = fCandidates.find(el => /accept all cookies|accept cookies|accept all/i.test(el.innerText))
          if (fAccept) { fAccept.click(); return }
        } catch (e) {
          // cross-origin iframe, skip
        }
      }

      if (doc.getElementById('onetrust-banner-sdk')) doc.getElementById('onetrust-banner-sdk').remove()
      const dark = doc.querySelector('.onetrust-pc-dark-filter')
      if (dark) dark.remove()
    })
  })
})
