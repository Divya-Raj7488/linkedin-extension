```mermaid
flowchart TD
    A([User opens extension]) --> B{User Logged In?}
    B -- No --> B1[Show login message] --> Z[End]
    B -- Yes --> C[Choose scraping method]

    %% --- DOM Scraping Path ---
    C --> D1[DOM Scraping]
    D1 --> E1[Open Connections Page]
    E1 --> F1[Scroll to load ~40 connections]
    F1 --> G1[Scrape Fullname, Position, Company, Profile Picture]
    G1 --> H1[Use MutationObserver to update UI]

    %% DOM Limitations in a single block
    H1 --> DL[DOM Scraping Limitations:
    • Must open connections page manually
    • Requires manual scrolling to load data
    • No explicit CSS classnames; nested div scraping unreliable
    • Breaks when LinkedIn changes DOM structure
    • Only renders 40 connections at once]

    %% --- API Scraping Path ---
    C --> D2[API Scraping]
    D2 --> E2[Voyager API + PQueue]
    E2 --> F2[IntersectionObserver triggers next fetch]
    F2 --> H2[Batch update ~200 connections]
    H2 --> I2[Cache data in localStorage with TTL]

    %% API Limitations in a single block
    H2 --> AL[API Scraping Limitations:
    • LinkedIn tab must remain open
    • Cannot fetch more than 40 users at once per request
    • Account may be disabled if automation detected
    • Voyager API endpoints may change
    • Requires careful rate limiting
    • May violate LinkedIn Terms of Service]

    %% Enhancements
    DL --> ENH[Enhancements:
    • Pagination with Request Queue
    • Request Throttling
    • API Scraping Capability
    • LocalStorage Caching with TTL]
    AL --> ENH

    ENH --> Z[End]