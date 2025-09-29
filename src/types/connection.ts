export interface Connection {
  profilePicture?: string;
  fullName: string;
  companyName?: string;
  companyLogo?: string;
  position?: string;
}
export type LinkedInPhoto = {
  displayImageReference?: {
    vectorImage?: {
      rootUrl: string
      artifacts: { width: number; fileIdentifyingUrlPathSegment: string }[]
    }
  }
}

export type RawConnection = {
  firstName: string
  lastName: string
  headline: string
  profilePicture: LinkedInPhoto
  publicIdentifier: string
}

export type ProcessedConnection = {
  fullName: string
  position: string | null
  currentCompany: string | null
  profilePicture: string | null
  publicIdentifier: string
}

export interface QueueItem {
  fetchConnections: () => Promise<void>;
  delay: number;
}