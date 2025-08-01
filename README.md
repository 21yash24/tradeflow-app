# TradeFlow - A Firebase Studio Project

This is a Next.js starter application built in Firebase Studio. It's a comprehensive toolkit for traders, combining a detailed trading journal, analytics, a discipline tracker, and an AI-powered market analyzer.

## Getting Started

To run the application locally:

1.  Install dependencies: `npm install`
2.  Run the development server: `npm run dev`
3.  Open [http://localhost:9002](http://localhost:9002) in your browser.

## Deployment

This application is configured for deployment using Firebase App Hosting.

### Prerequisites

- You must have the [Firebase CLI](https://firebase.google.com/docs/cli) installed: `npm install -g firebase-tools`
- You must be logged into your Firebase account: `firebase login`

### Deployment Steps

1.  **Initialize App Hosting:** If you haven't already, run the following command and follow the prompts to connect your local project to Firebase:
    ```bash
    firebase init apphosting
    ```

2.  **Deploy the Application:**
    ```bash
    firebase deploy
    ```

After the deployment is complete, the Firebase CLI will provide you with the public URL for your live application.
