// Helpers for sharing BizzSurfer content to LinkedIn.
//
// Two surfaces:
//  1. `linkedInShareOffsiteUrl(url)` — the browser-side share link that
//     does NOT require the user to have authorized our LinkedIn app. This
//     is what the "Share to LinkedIn" buttons in the UI use today.
//  2. `buildLinkedInUgcPostBody({...})` — the JSON body for LinkedIn's
//     `POST /v2/ugcPosts` endpoint, used when posting on behalf of a
//     member that granted `w_member_social`. The `[xxxLink lovablexxx]`
//     placeholder from the spec is replaced with the actual resource URL.
//
// The UGC payload is exported here so any future server function that
// publishes a member post (via the LinkedIn connector gateway) has a
// single, consistent template.

export function linkedInShareOffsiteUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export interface LinkedInUgcPostInput {
  /** LinkedIn member URN, e.g. "urn:li:person:8675309". */
  authorUrn: string;
  /** Canonical URL of the BizzSurfer insight or article. */
  resourceUrl: string;
  /** Optional override for the share commentary text. */
  commentary?: string;
  /** Optional override for the article title. */
  articleTitle?: string;
  /** Optional override for the article description. */
  articleDescription?: string;
}

export function buildLinkedInUgcPostBody({
  authorUrn,
  resourceUrl,
  commentary = "Learning more about BizzSurfer Agentic AI by reading this content on Go.BizzSurfer.ai",
  articleTitle = "Official BizzSurfer News & Insights",
  articleDescription = "BizzSurfer News & Articles - Your source for insights and information about LinkedIn.",
}: LinkedInUgcPostInput) {
  return {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: commentary },
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            description: { text: articleDescription },
            originalUrl: resourceUrl,
            title: { text: articleTitle },
          },
        ],
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  } as const;
}
