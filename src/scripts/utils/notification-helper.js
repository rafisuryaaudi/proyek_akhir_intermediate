import { convertBase64ToUint8Array } from './index';
import { VAPID_PUBLIC_KEY } from '../config';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api';

export function isNotificationAvailable() {
  return 'Notification' in window;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Browser tidak mendukung Notification API.');
    return false;
  }

  if (isNotificationGranted()) return true;

  const permission = await Notification.requestPermission();

  switch (permission) {
    case 'granted':
      return true;
    case 'denied':
      alert('Izin notifikasi ditolak.');
      return false;
    case 'default':
    default:
      alert('Izin notifikasi belum dipilih atau ditutup.');
      return false;
  }
}

export async function getPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.pushManager.getSubscription() || null;
  } catch (error) {
    console.error('Gagal mengambil push subscription:', error);
    return null;
  }
}

export async function isCurrentPushSubscriptionAvailable() {
  const subscription = await getPushSubscription();
  return Boolean(subscription);
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!(await requestNotificationPermission())) return;

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Kamu sudah berlangganan notifikasi.');
    return;
  }

  console.log('Memulai proses berlangganan push notification...');

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('Service Worker belum terdaftar.');

    const subscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = subscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });

    if (!response.ok) {
      console.error('Gagal menyimpan langganan di server:', response);
      await subscription.unsubscribe();
      alert('Gagal mengaktifkan push notification.');
      return;
    }

    alert('Berhasil berlangganan push notification!');
  } catch (error) {
    console.error('Kesalahan saat berlangganan:', error);
    alert('Gagal mengaktifkan push notification.');
  }
}

export async function unsubscribe() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
      alert('Kamu belum berlangganan notifikasi.');
      return;
    }

    await subscription.unsubscribe();
    alert('Berhasil berhenti berlangganan notifikasi.');
  } catch (error) {
    console.error('Gagal berhenti berlangganan:', error);
    alert('Terjadi kesalahan saat menghentikan langganan.');
  }
}
