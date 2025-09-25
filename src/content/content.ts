import { RawConnection } from '../types/connection'
import {
  getCsrfToken,
  getLinkedInCsrfToken,
  processConnectionData,
  waitForCondition
} from '../utils/connection'

// const queue = new Pqueue({ concurrency: 1 })

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

const fetchConnectionDetails = async (start: number, count = 40) => {
  let data = []
  try {
    let csrfToken = getLinkedInCsrfToken() || getCsrfToken()

    if (!csrfToken) {
      throw new Error('CSRF token not found')
    }
    const url = `https://www.linkedin.com/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-16&count=${count}&q=search&sortType=RECENTLY_ADDED&start=${start}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.linkedin.normalized+json+2.1',
        'accept-language': 'en-US,en;q=0.9',
        'csrf-token': csrfToken,
        'x-restli-protocol-version': '2.0.0',
        'x-li-lang': 'en_US',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': navigator.userAgent,
        referer:
          'https://www.linkedin.com/mynetwork/invite-connect/connections/'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { included } = await response.json()
    data = included
  } catch (err) {
    console.error('Error fetching connections:', err)
    throw err
  }
  return data
}

const scrapeConnections = async () => {
  try {
    const connections = await fetchConnectionDetails(0, 40)
    const data = connections
      .filter((con: any) => con.publicIdentifier)
      .map((connection: RawConnection) => {
        return processConnectionData(connection)
      })
    return data
  } catch (error) {
    console.error('Error scraping connections:', error)
    throw error
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'CHECK_LOGIN') {
      sendResponse({ loggedIn: isLoggedIn() })
    } else if (message.type === 'SCRAPE_CONNECTIONS') {
      scrapeConnections()
        .then(data => {
          sendResponse({ success: true, data })
        })
        .catch(err => {
          sendResponse({ success: false, error: (err as Error).message })
        })
      return true
    }
  } catch (err) {
    console.log('error while scraping connections')
    sendResponse({ success: false, error: (err as Error).message })
  }
})
