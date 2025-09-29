import { ProcessedConnection, RawConnection } from '../types/connection'
import {
  getCsrfToken,
  getHeaders,
  getLinkedInCsrfToken,
  processConnectionData,
  waitForCondition
} from '../utils/connection'
import Pqueue from 'p-queue'

const queue = new Pqueue({ concurrency: 1 })

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
      headers: getHeaders(csrfToken, navigator.userAgent),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { included } = await response.json()
    data = included
  } catch (err) {
    throw err
  }
  return data
}

const scrapeConnections = async (page: number, offset: number) => {
  try {
    const connections = await fetchConnectionDetails(offset + (page * 40), 40)
    const data = connections
      .filter((con: any) => con.publicIdentifier)
      .map((connection: RawConnection) => {
        return processConnectionData(connection)
      })
    return data
  } catch (error) {
    throw error
  }
}
const createReqQueue = async (offset: number) => {
  const connections: ProcessedConnection[] = []

  for (let i = 0; i < 5; i++) {
    const delay = Math.random() * (1000 - 300) + 300

    queue.add(async () => {
      await new Promise(resolve => setTimeout(resolve, delay))
      try {
        const data: ProcessedConnection[] = await scrapeConnections(i, offset);
        if(!data){
          queue.clear();
          return;
        }
        connections.push(...data)
      } catch (err) {
        i -= 1
        console.log('Error occured. Fetching data again', err)
      }
    })
  }
  await queue.onIdle()
  return connections
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'CHECK_LOGIN') {
      sendResponse({ loggedIn: isLoggedIn() })
    } else if (message.type === 'SCRAPE_CONNECTIONS') {
      createReqQueue(message.offset)
        .then(connections => {
          sendResponse({ success: true, data: connections })
        })
        .catch(err => {
          sendResponse({ success: false, error: (err as Error).message })
        })
      return true
    }
  } catch (err) {
    sendResponse({ success: false, error: (err as Error).message })
  }
})
