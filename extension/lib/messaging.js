/**
 * Safe messaging — never throws to UI
 */
export async function sendMessage(type, data = {}) {
  try {
    const res = await chrome.runtime.sendMessage({ type, ...data });
    if (res?.error) return { success: false, message: res.error };
    return res ?? {};
  } catch (err) {
    return { success: false, message: err.message };
  }
}
