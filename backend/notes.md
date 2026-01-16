{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
        "src": "api/index.js",
        "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    },
    {
        "src": "/(.*)",
        "dest": "api/index.js"
    }
  ]
}
