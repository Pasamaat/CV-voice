// Keep recognition callbacks independent of React render closures.
export function createVoiceInput(Recognition: any, options: {
  language: string;
  onText: (text: string) => void;
  onSend: (text: string) => void;
  onListening: (listening: boolean) => void;
  onError: (error: string) => void;
}) {
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.language;
  let active = false;
  let transcript = '';
  let prefix = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const cancel = () => {
    active = false;
    clear();
    recognition.abort();
    options.onListening(false);
  };
  const arm = () => {
    clear();
    if (!active || !transcript.trim()) return;
    timer = setTimeout(() => {
      if (!active) return;
      active = false;
      clear();
      recognition.stop();
      options.onListening(false);
      options.onSend(transcript.trim());
    }, 3000);
  };
  recognition.onstart = () => { if (active) options.onListening(true); };
  recognition.onspeechstart = clear;
  recognition.onspeechend = arm;
  recognition.onresult = (event: any) => {
    if (!active) return;
    const words = Array.from(event.results as any[]).map((result: any) => result[0].transcript).join(' ');
    transcript = [prefix, words].filter(Boolean).join(' ');
    options.onText(transcript);
    arm();
  };
  recognition.onerror = (event: any) => {
    if (!active) return;
    cancel();
    if (event.error !== 'no-speech' && event.error !== 'aborted') options.onError(event.error);
  };
  recognition.onend = () => {
    if (!active) return;
    // Some browsers end recognition themselves. Keep listening during our pause.
    if (!transcript.trim()) { cancel(); return; }
    prefix = transcript;
    try { recognition.start(); } catch { arm(); }
  };
  return {
    start() {
      active = true;
      try { recognition.start(); } catch (error) { cancel(); throw error; }
    },
    cancel,
  };
}
