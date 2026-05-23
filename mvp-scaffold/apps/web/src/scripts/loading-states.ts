export function setButtonLoading(btn: HTMLButtonElement, text?: string): () => void {
  const originalText = btn.textContent ?? '';
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';
  if (text) btn.textContent = text;

  return () => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = '';
    btn.textContent = originalText;
  };
}

export function initLoadingStates(): void {
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (!form) return;
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn && !btn.disabled) {
      setButtonLoading(btn, 'Enviando...');
    }
  }, { capture: true });
}
