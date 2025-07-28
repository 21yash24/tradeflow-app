
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const db = admin.firestore();

// It's recommended to use environment variables for your API key.
// Set it in your Firebase environment by running this command in your terminal:
// firebase functions:config:set finnhub.key="YOUR_API_KEY"
const FINNHUB_API_KEY = functions.config().finnhub?.key;


exports.checkPriceAlerts = functions.pubsub.schedule("every 1 minutes").onRun(async (context) => {
  console.log("Checking for price alerts...");
  
  if (!FINNHUB_API_KEY) {
    console.error("Finnhub API key not configured. Set it with `firebase functions:config:set finnhub.key=\"YOUR_API_KEY\"`");
    return null;
  }

  const activeAlertsSnapshot = await db.collection("alerts").where("active", "==", true).where("triggered", "==", false).get();

  if (activeAlertsSnapshot.empty) {
    console.log("No active alerts to check.");
    return null;
  }

  const promises = [];

  activeAlertsSnapshot.forEach(doc => {
    const alert = doc.data();
    alert.id = doc.id;
    promises.push(checkAndTriggerAlert(alert));
  });

  await Promise.all(promises);
  console.log("Finished checking alerts.");
  return null;
});

async function checkAndTriggerAlert(alert) {
  try {
    const symbol = alert.pair.replace("/", ""); // Finnhub uses symbols like "EURUSD"
    const url = `https://finnhub.io/api/v1/quote?symbol=OANDA:${symbol}&token=${FINNHUB_API_KEY}`;
    
    console.log(`Fetching price for: ${symbol}`);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error(`Finnhub API request failed with status ${response.status}`);
    }
    const data = await response.json();
    const currentPrice = data.c; // 'c' is the current price in the Finnhub response

    if (!currentPrice) {
      console.log(`No price data returned for ${symbol}`);
      return;
    }

    console.log(`Current price for ${symbol} is ${currentPrice}. Alert threshold is ${alert.threshold}.`);

    let shouldTrigger = false;
    if (alert.direction === "above" && currentPrice >= alert.threshold) {
      shouldTrigger = true;
    } else if (alert.direction === "below" && currentPrice <= alert.threshold) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      console.log(`TRIGGERING alert for ${alert.pair} at ${alert.threshold}`);
      
      // Update the alert in Firestore
      await db.collection("alerts").doc(alert.id).update({
        triggered: true,
        triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Send a push notification
      await sendPushNotification(alert, currentPrice);
    }
  } catch (error) {
    console.error(`Error checking alert for ${alert.pair}:`, error);
  }
}

async function sendPushNotification(alert, currentPrice) {
    const userRef = db.collection("users").doc(alert.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.log("User not found for notification:", alert.userId);
        return;
    }

    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens; // Array of tokens from user's devices

    if (!fcmTokens || fcmTokens.length === 0) {
        console.log("No FCM tokens for user:", alert.userId);
        return;
    }
    
    const payload = {
        notification: {
            title: `Price Alert Triggered! 🚨`,
            body: `${alert.pair} has reached ${currentPrice}, surpassing your target of ${alert.threshold}.`,
            icon: "/icons/icon-192x192.png" 
        }
    };
    
    console.log("Sending push notification to tokens:", fcmTokens);
    const response = await admin.messaging().sendToDevice(fcmTokens, payload);
    console.log("Push notification response:", response);

    // Clean up invalid tokens
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error('Failure sending notification to', fcmTokens[index], error);
            // Cleanup the tokens who are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(fcmTokens[index]);
            }
        }
    });

    if (tokensToRemove.length > 0) {
        await userRef.update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
        });
    }
}
