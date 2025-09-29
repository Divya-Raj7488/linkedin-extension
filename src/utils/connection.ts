import {
  CachedConnections,
  LinkedInPhoto,
  ProcessedConnection,
  RawConnection
} from '../types/connection'

export function waitForCondition (
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

export function extractProfileImage (
  photoObj: LinkedInPhoto | undefined,
  preferredWidth = 400
): string | null {
  const vectorImage = photoObj?.displayImageReference?.vectorImage
  if (!vectorImage) return null

  const root = vectorImage.rootUrl
  const artifact =
    vectorImage.artifacts.find(a => a.width === preferredWidth) ||
    vectorImage.artifacts.sort((a, b) => b.width - a.width)[0]

  return artifact ? root + artifact.fileIdentifyingUrlPathSegment : null
}

export function processConnectionData (
  conn: RawConnection
): ProcessedConnection {
  const fullName = `${conn.firstName} ${conn.lastName}`.trim()

  let position: string | null = null
  let currentCompany: string | null = null

  if (conn.headline) {
    console.log(conn.headline)
    const parts = conn.headline.split('|')[0]?.split('@')
    position = parts[0] || null
    currentCompany = parts[1] || null
  }

  const profilePicture = extractProfileImage(conn.profilePicture)
  const publicIdentifier = conn.publicIdentifier

  return {
    fullName,
    position,
    currentCompany,
    profilePicture,
    publicIdentifier
  }
}

export const getCsrfToken = () => {
  const match = document.cookie.match(/JSESSIONID="?(ajax[^";]+)"?/)
  if (match) {
    return match[1]
  }

  const match2 = document.cookie.match(/JSESSIONID=ajax([^;]+)/)
  if (match2) {
    return 'ajax' + match2[1]
  }

  const csrfMeta = document.querySelector('meta[name="csrf-token"]')
  if (csrfMeta) return csrfMeta.getAttribute('content')

  return null
}

export const getLinkedInCsrfToken = () => {
  try {
    if ((window as any).lix && (window as any).lix.csrfToken) {
      return (window as any).lix.csrfToken
    }

    if ((window as any).LI_ARG && (window as any).LI_ARG.csrfToken) {
      return (window as any).LI_ARG.csrfToken
    }

    const scripts = document.querySelectorAll('script')
    for (const script of scripts) {
      const match = script.textContent?.match(
        /csrfToken['"]\s*:\s*['"]([^'"]+)['"]/
      )
      if (match) return match[1]
    }

    return null
  } catch (error) {
    console.error('Error extracting CSRF token:', error)
    return null
  }
}

export const getHeaders = (csrfToken: string, agent: string) => {
  return {
    accept: 'application/vnd.linkedin.normalized+json+2.1',
    'accept-language': 'en-US,en;q=0.9',
    'csrf-token': csrfToken,
    'x-restli-protocol-version': '2.0.0',
    'x-li-lang': 'en_US',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': agent,
    referer: 'https://www.linkedin.com/mynetwork/invite-connect/connections/'
  }
}

export const fetchCachedData = async (
  offset: number
): Promise<ProcessedConnection[]> => {
  const requestedBatchId = Math.floor(offset / 200)
  const key = `linkedin_connection_${requestedBatchId}`
  const itemStr = localStorage.getItem(key)

  if (!itemStr) return []

  try {
    const cacheEntry: CachedConnections = JSON.parse(itemStr)
    if (Date.now() < cacheEntry.expires) {
      return cacheEntry.data
    } else {
      localStorage.removeItem(key)
      return []
    }
  } catch (err) {
    console.error(`Error parsing cached batch ${requestedBatchId}:`, err)
    localStorage.removeItem(key)
    return []
  }
}

export const cacheData = (data: ProcessedConnection[]) => {
  const BATCH_COUNT_KEY = 'connections_batch_count';
  if (!data || data.length === 0) return

  const batchCount = parseInt(localStorage.getItem(BATCH_COUNT_KEY) || '0', 10)
  const key = `linkedin_connection_${batchCount}`

  const cacheEntry: CachedConnections = {
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
    data
  }

  localStorage.setItem(key, JSON.stringify(cacheEntry))
  localStorage.setItem(BATCH_COUNT_KEY, (batchCount + 1).toString())
}
