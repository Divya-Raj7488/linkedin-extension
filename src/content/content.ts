// function isLoggedIn (): boolean {
//   return !!document.querySelector('header nav .global-nav__me-photo')
// }
function waitForCondition (
  conditionFn: () => boolean,
  interval = 100,
  timeout = 5000
): Promise<boolean> {
  return new Promise(resolve => {
    const start = Date.now()

    const check = () => {
      if (conditionFn()) {
        resolve(true)
      } else if (Date.now() - start > timeout) {
        resolve(false)
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}
async function isLoggedIn (): Promise<boolean> {
  const domReady = await waitForCondition(
    () => !!document.querySelector('header [data-test-global-nav-profile]')
  )

  if (!domReady) return false

  return new Promise(resolve => {
    chrome.cookies.get(
      { url: 'https://www.linkedin.com', name: 'li_at' },
      cookie => {
        resolve(!!cookie?.value)
      }
    )
  })
}
function scrapeConnections () {
  if (
    !window.location.href.includes('/mynetwork/invite-connect/connections/')
  ) {
    throw new Error('Not on LinkedIn connections page')
  }

  const connections: any[] = []
  const seenProfiles = new Set<string>()

  const container = document.querySelector<HTMLDivElement>(
    'div[componentkey="ConnectionsPage_ConnectionsList"]'
  )
  if (!container) {
    console.warn('Connections container not found')
    return connections
  }

  const cards = container.querySelectorAll<HTMLDivElement>(
    'div[data-view-name="connections-list"]'
  )

  cards.forEach(card => {
    try {
      const profileLink = card.querySelector<HTMLAnchorElement>(
        'a[href^="https://www.linkedin.com/in/"]'
      )
      if (!profileLink) return

      const profileUrl = profileLink.href
      if (seenProfiles.has(profileUrl)) return 
      seenProfiles.add(profileUrl)

      const img = profileLink.querySelector<HTMLImageElement>('img')
      const fullName =
        img?.alt.replace('’s profile picture', '').trim() ||
        profileLink.textContent?.trim() ||
        ''

      let position = ''
      const parentDiv = profileLink.closest('div')
      if (parentDiv) {
        const titleEl = Array.from(parentDiv.querySelectorAll('p, span')).find(
          el => el.textContent && !el.textContent.includes(fullName)
        )
        if (titleEl) position = titleEl.textContent?.trim() || ''
      }

      const profilePicture = img?.src || ''

      connections.push({ fullName, position, profilePicture, profileUrl })
    } catch (err) {
      console.warn('Failed to parse connection card', err)
    }
  })

  console.log('Scraped connections:', connections)
  return connections
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'CHECK_LOGIN') {
      sendResponse({ loggedIn: isLoggedIn() })
    } else if (message.type === 'SCRAPE_CONNECTIONS') {
      if (
        !window.location.href.startsWith(
          'https://www.linkedin.com/mynetwork/invite-connect/connections/'
        )
      ) {
        sendResponse({
          success: false,
          error: 'Not on LinkedIn connections page'
        })
        return true
      }
      const data = scrapeConnections()
      sendResponse({ success: true, data })
    }
  } catch (err) {
    console.log('error while scraping connections')
    sendResponse({ success: false, error: (err as Error).message })
  }
})
