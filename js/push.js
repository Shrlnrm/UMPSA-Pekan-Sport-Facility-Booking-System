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

const VAPID_PUBLIC_KEY = 'BPepxP16n-6Xg-0QhlliK-100XpAHoWFvOhikUdJpzCExh4Eja0qfxtKWuXAewsKXfs40RNjAI6GWh9O80FX6Oc';

async function togglePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported by this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // UNSUBSCRIBE
      await subscription.unsubscribe();
      
      // Delete from DB
      await db.from('PushSubscriptions')
        .delete()
        .contains('subscription', { endpoint: subscription.endpoint });

      alert('Notifications disabled successfully.');
      updatePushButtonUI(false);

    } else {
      // SUBSCRIBE
      const publicVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey
      });

      // Determine who is logged in
      const uId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
      const aId = localStorage.getItem('admin_id') || sessionStorage.getItem('admin_id');

      if (!uId && !aId) {
        console.warn("User not logged in, cannot save push subscription.");
        return;
      }

      // Save to database
      await db.from('PushSubscriptions').insert([{
        user_id: uId || null,
        admin_id: (!uId && aId) ? aId : null,
        subscription: newSubscription
      }]);

      alert('Notifications enabled successfully!');
      updatePushButtonUI(true);
    }
  } catch (error) {
    console.error('Error toggling push:', error);
    alert('Failed to update notifications. Please ensure you clicked Allow when prompted by your browser.');
  }
}

// Update the UI button based on subscription state
function updatePushButtonUI(isSubscribed) {
  const btn = document.getElementById('enablePushBtn');
  if (!btn) return;
  
  if (isSubscribed) {
    btn.innerHTML = '<i data-lucide="bell-off" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Disable Notifications</span>';
    btn.className = 'text-[11px] sm:text-xs bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors font-medium shadow-sm flex items-center gap-1.5';
  } else {
    btn.innerHTML = '<i data-lucide="bell" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Enable Notifications</span>';
    btn.className = 'text-[11px] sm:text-xs bg-primary-teal text-white px-3 py-1.5 rounded-full hover:bg-primary-teal-hover transition-colors font-medium shadow-sm flex items-center gap-1.5';
  }
  
  // Re-initialize lucide icons inside the button
  if (window.lucide) {
    window.lucide.createIcons({ root: btn });
  }
}

// Automatically check if already subscribed to set initial button state
async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    const btn = document.getElementById('enablePushBtn');
    if (btn) btn.style.display = 'none'; // Hide if not supported
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    updatePushButtonUI(!!subscription);
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', checkPushSubscription);
