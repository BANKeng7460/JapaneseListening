// Keep the existing local cache and notify the cloud synchronizer of every write.
export function saveLocal(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('kiku-save', { detail: { key, value } }));
}
