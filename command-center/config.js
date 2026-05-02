/*
  Dixon Command Center config

  This app is designed to work without private API keys.

  Optional future keys:
  - Google Calendar API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
    Add OAuth/client details here if replacing the localStorage schedule.
  - Instagram Basic Display / Graph API: https://developers.facebook.com/docs/instagram
    Public profile feeds are locked down; app review and access tokens are required.
  - X API: https://developer.x.com
    Add a handle and bearer-token-backed serverless function if replacing the placeholder card.
  - TikTok Display API: https://developers.tiktok.com/doc/display-api-overview/
    Add a handle and OAuth-backed serverless function if replacing the placeholder card.
*/

window.COMMAND_CENTER_CONFIG = {
  owner: "Dixon Van Hoozer-Bowles",
  locationLabel: "Orlando, FL",
  weather: {
    latitude: 28.5383,
    longitude: -81.3792,
    timezone: "America/New_York"
  },
  dwd: {
    registrationOpenDate: "2026-05-01T00:00:00-04:00",
    seasonOneDate: "2026-08-11T00:00:00-04:00",
    firstAuditionDate: "2026-06-01T00:00:00-04:00"
  },
  quickLaunchDefaults: [
    {
      title: "DWD Director App",
      url: "https://dwd-creator.web.app",
      note: "Company tools"
    },
    {
      title: "dancewithdixon.com",
      url: "https://dancewithdixon.com",
      note: "Public site"
    },
    {
      title: "Stripe",
      url: "https://dashboard.stripe.com",
      note: "Payments"
    },
    {
      title: "Bluevine",
      url: "https://www.bluevine.com/sign-in",
      note: "Banking"
    },
    {
      title: "Sunbiz",
      url: "https://dos.myflorida.com/sunbiz/manage-business/efile/annual-report/",
      note: "Florida LLC annual report",
      status: "OVERDUE"
    },
    {
      title: "Gmail",
      url: "https://mail.google.com",
      note: "Inbox"
    },
    {
      title: "GitHub",
      url: "https://github.com",
      note: "Code"
    }
  ],
  instagramAccounts: [
    { handle: "dwdproseries", label: "DWD ProSeries" },
    { handle: "dwd_collective", label: "DWD Collective" },
    { handle: "dancewithdixon", label: "Dance With Dixon" }
  ],
  socialPlaceholders: {
    xHandle: "",
    tiktokHandle: ""
  },
  newsFeeds: [
    { label: "Orlando", url: "https://www.orlandosentinel.com/arcio/rss/category/news/breaking-news/" },
    { label: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
    { label: "AP", url: "https://apnews.com/hub/ap-top-news?output=rss" },
    { label: "Dance Magazine", url: "https://www.dancemagazine.com/feed/" },
    { label: "Pointe", url: "https://pointemagazine.com/feed/" }
  ]
};
