// Base64 to Uint8Array helper for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ⚠️ IMPORTANT: You must replace this with your actual VAPID Public Key!
const VAPID_PUBLIC_KEY = 'BPepxP16n-6Xg-0QhlliK-100XpAHoWFvOhikUdJpzCExh4Eja0qfxtKWuXAewsKXfs40RNjAI6GWh9O80FX6Oc';

async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported by this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey
      });
    }

    // Determine who is logged in
    const uId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    const aId = localStorage.getItem('admin_id') || sessionStorage.getItem('admin_id');

    if (!uId && !aId) {
      console.warn("User not logged in, cannot save push subscription.");
      return;
    }

    // Save to database
    const { error } = await db.from('PushSubscriptions').insert([{
      user_id: uId || null,
      admin_id: (!uId && aId) ? aId : null,
      subscription: subscription
    }]);

    if (error) {
      console.error('Error saving subscription to DB:', error);
      // It might error if it already exists, which is fine, we just want to ensure it's there
    }
    
    alert('Notifications enabled successfully!');
    const btn = document.getElementById('enablePushBtn');
    if (btn) btn.style.display = 'none';

  } catch (error) {
    console.error('Error subscribing to push:', error);
    alert('Failed to enable notifications. Please ensure you clicked Allow when prompted by your browser.');
  }
}

// Automatically check if already subscribed to hide the button
async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const btn = document.getElementById('enablePushBtn');
      if (btn) btn.style.display = 'none';
    }
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', checkPushSubscription);
