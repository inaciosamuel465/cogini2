/**
 * System utilities for Wake Lock and Display Management
 */

let wakeLock: any = null;

export const requestWakeLock = async (): Promise<boolean> => {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake Lock active - Screen will not sleep');
      return true;
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
      return false;
    }
  }
  return false;
};

export const releaseWakeLock = async () => {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log('Wake Lock released');
  }
};

// Re-request lock if visibility changes (e.g., user minimizes and comes back)
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

export const togglePictureInPicture = async (videoElement: HTMLVideoElement) => {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else if (document.pictureInPictureEnabled && videoElement) {
    await videoElement.requestPictureInPicture();
  }
};
