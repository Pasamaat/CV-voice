/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createVoiceInput } from './voiceInput';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Sparkles,
  User,
  Bot,
  GraduationCap,
  Briefcase,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  ChevronDown,
  Volume1,
} from 'lucide-react';

export type Language = 'en' | 'et';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface ErrorDetails {
  category: 'authentication_error' | 'quota_exceeded' | 'model_unavailable' | 'upstream_error' | 'timeout';
  message: string;
  canRetry: boolean;
  failedPrompt?: string;
}

const TRANSLATIONS = {
  en: {
    title: 'Ask about Erik',
    subtitle: 'Get to know Erik’s studies, experience, and interests.',
    disclosure: 'AI assistant based on information provided by Erik.',
    profileSummaryBtn: 'Profile Summary',
    resetBtn: 'Reset',
    voiceOn: 'Voice: On',
    voiceOff: 'Voice: Off',
    stopAudio: 'Stop Audio',
    chooseVoice: 'Voice',
    previewVoice: 'Preview voice',
    previewText: "Hello, I am Erik's assistant. How can I help you today?",
    noVoiceForLangNotice: 'No suitable voice found for this language on your device. Answers are displayed as text.',
    welcomeTitle: 'Welcome to Erik’s CV Assistant',
    welcomeDesc: 'Ask any question by typing or speaking. Learn about Erik Radik’s university studies at EBS, practical work experience, leadership in the Estonian Defence Forces, or ongoing CNC training.',
    placeholder: 'Ask about studies, work, CNC training, or languages...',
    send: 'Send',
    listeningNow: 'Listening… your question sends after 3 seconds of silence.',
    stopListening: 'Stop listening',
    micUnsupported: 'Speech recognition is not supported in this browser. Please type your question.',
    micDenied: 'Microphone permission was denied. Please allow microphone access in your browser or type your question.',
    micErrorPrefix: 'Voice recognition notice: ',
    dismiss: 'Dismiss',
    retry: 'Retry question',
    generatingAnswer: 'Generating answer...',
    streamingAnswer: 'Streaming answer...',
    you: 'You',
    assistant: 'Assistant',
    close: 'Close',
    // Summary Drawer
    summaryTitle: 'Erik Radik — Key Overview',
    educationLabel: 'Education:',
    educationText: '3rd-year at Estonian Business School (EBS) studying Entrepreneurship and Business Administration, expected graduation May 2027.',
    militaryLabel: 'Military Service:',
    militaryText: 'Junior Sergeant (11 mos, 2023–2024), helped train ~50 conscripts in the Estonian Defence Forces.',
    cncLabel: 'CNC Machining:',
    cncText: 'Enrolled in ongoing end-to-end CNC course (designing parts, CAM toolpaths, G-code, machine setup, practical fundamentals).',
    workLabel: 'Work & Internships:',
    workText: 'Internships at Pagaripoisid (bakery/pastry) & VDI (ski machine research); Bolt Food courier; TUUL electric scooter battery replacement; event ticket sales.',
    languagesLabel: 'Languages:',
    languagesText: 'Estonian (native), English (B2 level), Russian (~B1 level self-assessed).',
    interestsLabel: 'Interests:',
    interestsText: 'Regular gym training, baking, and spending time with friends.',
    // Errors
    authErrorTitle: 'Gemini API Authentication Error',
    quotaErrorTitle: 'Free-Tier Quota Limit Reached',
    modelErrorTitle: 'Gemini Model Unavailable',
    timeoutErrorTitle: 'Request Timed Out',
    upstreamErrorTitle: 'Upstream Service Interruption',
    networkErrorText: 'Network or connection failure. Please verify connection and try again.',
    emptyResponseText: "I couldn't generate a response. Please try rephrasing your question.",
  },
  et: {
    title: 'Küsi Eriku kohta',
    subtitle: 'Tutvu Eriku õpingute, kogemuste ja huvidega.',
    disclosure: 'Tehisintellektil põhinev assistent Eriku esitatud andmete põhjal.',
    profileSummaryBtn: 'Eriku profiil',
    resetBtn: 'Alusta uuesti',
    voiceOn: 'Hääl: Sees',
    voiceOff: 'Hääl: Väljas',
    stopAudio: 'Peata heli',
    chooseVoice: 'Hääl',
    previewVoice: 'Kuula näidist',
    previewText: 'Tere! Olen Eriku assistent. Kuidas saan teid aidata?',
    noVoiceForLangNotice: 'Selle keele jaoks ei leitud teie seadmes sobivat häält. Vastuseid kuvatakse tekstina.',
    welcomeTitle: 'Tere tulemast Eriku CV-assistenti',
    welcomeDesc: 'Esita küsimus trükkides või häälega. Tutvu Erik Radiku õpingutega EBS-is, praktiliste töökogemustega, juhtimiskogemusega Kaitseväes või poolelioleva CNC-koolitusega.',
    placeholder: 'Küsi õpingute, töökogemuse, CNC-koolituse või keelte kohta...',
    send: 'Saada',
    listeningNow: 'Kuulan… küsimus saadetakse pärast 3 sekundit vaikust.',
    stopListening: 'Lõpeta kuulamine',
    micUnsupported: 'Kõnetuvastus pole selles veebilehitsejas toetatud. Palun trüki oma küsimus.',
    micDenied: 'Mikrofoni ligipääs on keelatud. Palun luba mikrofon brauseri seadetest või trüki oma küsimus.',
    micErrorPrefix: 'Kõnetuvastuse teade: ',
    dismiss: 'Sulge',
    retry: 'Proovi uuesti',
    generatingAnswer: 'Koostan vastust...',
    streamingAnswer: 'Vastan...',
    you: 'Sina',
    assistant: 'Assistent',
    close: 'Sulge',
    // Summary Drawer
    summaryTitle: 'Erik Radik — Põhiülevaade',
    educationLabel: 'Haridus:',
    educationText: 'Estonian Business School (EBS) 3. kursus, eriala Ettevõtlus ja ärijuhtimine, oodatav lõpetamine mai 2027.',
    militaryLabel: 'Ajateenistus:',
    militaryText: 'Nooremseersant (11 kuud, 2023–2024), aitas välja õpetada ligikaudu 50 ajateenijat Eesti Kaitseväes.',
    cncLabel: 'CNC metallitöötlus:',
    cncText: 'Käimasolev terviklik CNC koolitus (detailide projekteerimine, CAM-töörajad, G-kood, seadistus, baasoskuste omandamine).',
    workLabel: 'Töökogemus ja praktikad:',
    workText: 'Praktikad: Pagaripoisid (pagari- ja kondiitriala) & VDI (sisesuusamasinad); Bolt Food kuller; TUUL elektritõukerataste akude vahetamine; ürituste piletite müük.',
    languagesLabel: 'Keeled:',
    languagesText: 'Eesti keel (emakeel), inglise keel (B2 tase), vene keel (~B1 enesehinnanguline).',
    interestsLabel: 'Huvid:',
    interestsText: 'Jõusaalitreeningud, küpsetamine ja sõpradega aja veetmine.',
    // Errors
    authErrorTitle: 'Autentimise tõrge',
    quotaErrorTitle: 'Päringute limiit on täis',
    modelErrorTitle: 'Mudel pole hetkel kättesaadav',
    timeoutErrorTitle: 'Päring aegus',
    upstreamErrorTitle: 'Ühenduse tõrge',
    networkErrorText: 'Võrgu või ühenduse tõrge. Kontrolli ühendust ja proovi uuesti.',
    emptyResponseText: 'Vastuse koostamine ebaõnnestus. Palun proovi küsimust ümber sõnastada.',
  },
};

// Clean text for natural speech synthesis (remove markdown formatting symbols and URLs)
function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split accumulated text into complete sentences and remainder
function extractCompleteSentences(text: string): { sentences: string[]; remainder: string } {
  const regex = /([^.!?]+[.!?]+(?:\s+|$))/g;
  const matches = text.match(regex);
  if (!matches) {
    return { sentences: [], remainder: text };
  }

  let consumed = 0;
  for (const s of matches) {
    consumed += s.length;
  }

  return {
    sentences: matches.map((s) => s.trim()).filter(Boolean),
    remainder: text.slice(consumed),
  };
}

export default function App() {
  // Language state (persisted in localStorage)
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ask_erik_lang');
      if (saved === 'et' || saved === 'en') return saved;
    }
    return 'en';
  });

  const t = TRANSLATIONS[selectedLang];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<ErrorDetails | null>(null);
  const [showProfileSummary, setShowProfileSummary] = useState(false);

  // Voice Input (Speech Recognition) state
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechRecSupported, setSpeechRecSupported] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createVoiceInput> | null>(null);
  const sendMessageRef = useRef<(text: string) => void>(() => {});
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const speechRequestRef = useRef<AbortController | null>(null);
  const speechGenerationRef = useRef(0);
  const sendingRef = useRef(false);

  // Spoken Output (Speech Synthesis) state
  const [speechSynthSupported, setSpeechSynthSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ask_erik_voice_enabled');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const voiceEnabledRef = useRef<boolean>(false);
  const queuedSentenceCountRef = useRef<number>(0);
  const selectedVoiceUriRef = useRef<string>('');
  const selectedLangRef = useRef<Language>('en');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep refs synchronized
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ask_erik_voice_enabled', String(voiceEnabled));
    }
    if (!voiceEnabled) {
      stopSpeaking();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  useEffect(() => {
    selectedVoiceUriRef.current = selectedVoiceUri;
  }, [selectedVoiceUri]);

  // Check browser speech recognition & synthesis capabilities
  useEffect(() => {
    const hasRec =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechRecSupported(Boolean(hasRec));

    const hasSynth = typeof window !== 'undefined' && ('speechSynthesis' in window || 'AudioContext' in window);
    setSpeechSynthSupported(Boolean(hasSynth));
  }, []);

  // Populate synthesis voices
  const refreshVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    setAvailableVoices(voices);
  };

  useEffect(() => {
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }, []);

  // Filter voices according to current language
  const currentLangVoices = useMemo(() => {
    if (selectedLang === 'et') {
      return availableVoices.filter((v) => v.lang.toLowerCase().startsWith('et'));
    }
    return availableVoices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  }, [availableVoices, selectedLang]);

  // Pick default preferred voice for the language
  useEffect(() => {
    if (!speechSynthSupported) return;

    const savedKey = `ask_erik_voice_${selectedLang}`;
    const savedUri = typeof window !== 'undefined' ? localStorage.getItem(savedKey) : null;

    if (savedUri && currentLangVoices.some((v) => v.voiceURI === savedUri)) {
      setSelectedVoiceUri(savedUri);
      setVoiceNotice(null);
      return;
    }

    if (selectedLang === 'et') {
      if (currentLangVoices.length === 0) {
        setSelectedVoiceUri('');
        setVoiceNotice(null);
      } else {
        // Prefer male Estonian voice if discernible, otherwise first Estonian voice
        const maleEt = currentLangVoices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('mees') ||
            v.name.toLowerCase().includes('jüri')
        );
        const chosen = maleEt || currentLangVoices[0];
        setSelectedVoiceUri(chosen.voiceURI);
        setVoiceNotice(null);
      }
    } else {
      // English: prefer male natural voice
      const maleEn = currentLangVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('david') ||
          n.includes('guy') ||
          n.includes('daniel') ||
          n.includes('george') ||
          n.includes('oliver') ||
          n.includes('james') ||
          n.includes('male')
        );
      });
      const chosen = maleEn || currentLangVoices[0];
      if (chosen) {
        setSelectedVoiceUri(chosen.voiceURI);
        setVoiceNotice(null);
      } else if (currentLangVoices.length === 0) {
        setSelectedVoiceUri('');
        setVoiceNotice(t.noVoiceForLangNotice);
      }
    }
  }, [selectedLang, currentLangVoices, speechSynthSupported, t]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, errorState]);

  // Clean up recognition and speech on unmount
  useEffect(() => {
    return () => {
      speechRequestRef.current?.abort();
      speechGenerationRef.current++;
      if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
      }
      void audioContextRef.current?.close();
      if (recognitionRef.current) {
        recognitionRef.current.cancel();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const unlockAudio = () => {
    if (!audioContextRef.current && 'AudioContext' in window) audioContextRef.current = new AudioContext();
    void audioContextRef.current?.resume().catch(() => {});
  };

  const stopSpeaking = () => {
    speechGenerationRef.current++;
    speechRequestRef.current?.abort();
    speechRequestRef.current = null;
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.cancel();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
  };

  // Switch language handler
  const handleLanguageChange = (newLang: Language) => {
    if (newLang === selectedLang) return;

    // Stop active listening and speech playback, clear speech queue
    stopListening();
    stopSpeaking();
    setMicError(null);
    setShowVoiceDropdown(false);

    setSelectedLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ask_erik_lang', newLang);
    }
  };

  // Speech synthesis queue processor
  const processSpeechQueue = () => {
    if (!speechSynthSupported || !voiceEnabledRef.current) return;


    if (speechQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    if (isSpeakingRef.current) return;

    const sentenceToSpeak = speechQueueRef.current.shift();
    if (!sentenceToSpeak) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    if (selectedLangRef.current === 'et' && !window.speechSynthesis?.getVoices().some(v => v.lang.toLowerCase().startsWith('et'))) {
      const generation = speechGenerationRef.current;
      const controller = new AbortController();
      speechRequestRef.current = controller;
      void (async () => {
        try {
          const response = await fetch('/api/speech', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sentenceToSpeak, language: 'et' }), signal: controller.signal,
          });
          if (!response.ok) throw new Error('Speech unavailable');
          const data = await response.arrayBuffer();
          if (generation !== speechGenerationRef.current) return;
          const context = audioContextRef.current;
          if (!context) throw new Error('Audio unavailable');
          const buffer = await context.decodeAudioData(data);
          if (generation !== speechGenerationRef.current) return;
          await context.resume();
          if (generation !== speechGenerationRef.current) return;
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(context.destination);
          audioSourceRef.current = source;
          source.onended = () => {
            audioSourceRef.current = null;
            isSpeakingRef.current = false;
            processSpeechQueue();
          };
          source.start();
        } catch {
          if (generation !== speechGenerationRef.current) return;
          speechQueueRef.current = [];
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          setVoiceNotice('Eestikeelse heli esitamine ebaõnnestus. Vastus on loetav tekstina. Proovi hääl uuesti sisse lülitada.');
        }
      })();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentenceToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = selectedLangRef.current === 'et' ? 'et-EE' : 'en-GB';

    // Find assigned voice
    try {
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find((v) => v.voiceURI === selectedVoiceUriRef.current);
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
    } catch {
      // fallback
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      processSpeechQueue();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      isSpeakingRef.current = false;
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  };

  const queueSentenceForSpeech = (sentence: string) => {
    if (!speechSynthSupported || !voiceEnabledRef.current) return;


    const cleaned = cleanTextForSpeech(sentence);
    if (!cleaned || cleaned.length < 2) return;

    speechQueueRef.current.push(cleaned);
    processSpeechQueue();
  };

  // Preview selected voice
  const handlePreviewVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!speechSynthSupported) return;

    stopSpeaking();

    if (selectedLang === 'et' && currentLangVoices.length === 0) {
      unlockAudio();
      queueSentenceForSpeech(t.previewText);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(t.previewText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = selectedLang === 'et' ? 'et-EE' : 'en-GB';

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) => v.voiceURI === selectedVoiceUri);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Select voice from dropdown
  const handleSelectVoice = (uri: string) => {
    setSelectedVoiceUri(uri);
    setShowVoiceDropdown(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ask_erik_voice_${selectedLang}`, uri);
    }
  };

  // Toggle voice playback
  const handleToggleVoice = () => {
    if (!speechSynthSupported) return;
    if (voiceEnabled) {
      setVoiceEnabled(false);
      stopSpeaking();
    } else {
      unlockAudio();
      setVoiceNotice(null);
      setVoiceEnabled(true);
    }
  };

  // Speech Recognition (Voice Input) controls
  const startListening = () => {
    if (!speechRecSupported) {
      setMicError(t.micUnsupported);
      return;
    }
    setMicError(null);
    stopSpeaking();

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      unlockAudio();
      setVoiceEnabled(true);
      const recognition = createVoiceInput(SpeechRec, {
        language: selectedLang === 'et' ? 'et-EE' : 'en-GB',
        onText: setInputValue,
        onSend: (text) => sendMessageRef.current(text),
        onListening: setIsListening,
        onError: (error) => setMicError(error === 'not-allowed' || error === 'permission-denied' ? t.micDenied : `${t.micErrorPrefix}${error}`),
      });
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setMicError(t.micUnsupported);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend ?? inputValue).trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    if (voiceEnabledRef.current) unlockAudio();

    setErrorState(null);
    setMicError(null);
    stopListening();
    stopSpeaking();
    setInputValue('');
    queuedSentenceCountRef.current = 0;

    const userMessageId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text,
      timestamp: userTimestamp,
    };

    const assistantMessageId = `model-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = [...messages];
    setMessages([...currentHistory, userMessage, initialAssistantMessage]);
    setIsLoading(true);

    try {
      const historyPayload = currentHistory
        .filter((m) => !m.isError && m.text.trim())
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          stream: true,
          language: selectedLang,
        }),
      });

      if (!response.ok) {
        const rawText = await response.text();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          // non-JSON handled cleanly
        }

        const category =
          parsedData?.category ||
          (response.status === 401
            ? 'authentication_error'
            : response.status === 429
            ? 'quota_exceeded'
            : 'upstream_error');

        const message =
          parsedData?.message ||
          rawText ||
          `Server error (${response.status}).`;

        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));

        setErrorState({
          category,
          message,
          canRetry: category !== 'authentication_error' && category !== 'quota_exceeded',
          failedPrompt: text,
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response stream body is unavailable.');
      }

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);

                if (parsed.isError || parsed.error) {
                  setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
                  setErrorState({
                    category: parsed.category || 'upstream_error',
                    message: parsed.message || 'Error communicating with service.',
                    canRetry: parsed.category !== 'authentication_error' && parsed.category !== 'quota_exceeded',
                    failedPrompt: text,
                  });
                  return;
                }

                if (parsed.text) {
                  accumulatedText += parsed.text;

                  // Progressive streaming update
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, text: accumulatedText }
                        : m
                    )
                  );

                  // Extract complete sentences for spoken answers
                  if (voiceEnabledRef.current && !(selectedLang === 'et' && currentLangVoices.length === 0)) {
                    const { sentences } = extractCompleteSentences(accumulatedText);
                    while (queuedSentenceCountRef.current < sentences.length) {
                      const nextSentence = sentences[queuedSentenceCountRef.current];
                      queueSentenceForSpeech(nextSentence);
                      queuedSentenceCountRef.current++;
                    }
                  }
                }
              } catch (parseErr) {
                console.error('Failed to parse SSE payload:', parseErr, dataStr);
              }
            }
          }
        }
      }

      // Speak any remaining unpunctuated text at end of stream
      if (voiceEnabledRef.current && accumulatedText.trim()) {
        const { remainder } = selectedLang === 'et' && currentLangVoices.length === 0
          ? { remainder: accumulatedText }
          : extractCompleteSentences(accumulatedText);
        if (remainder && remainder.trim()) {
          queueSentenceForSpeech(remainder.trim());
        }
      }

      // Finalize assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                text: accumulatedText.trim()
                  ? accumulatedText
                  : t.emptyResponseText,
              }
            : m
        )
      );
    } catch (err: unknown) {
      console.error('Chat request exception:', err);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));

      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorState({
        category: 'upstream_error',
        message: `${t.networkErrorText} (${errMsg})`,
        canRetry: true,
        failedPrompt: text,
      });
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };
  sendMessageRef.current = (text) => { void handleSendMessage(text); };

  const handleReset = () => {
    stopSpeaking();
    stopListening();
    setMessages([]);
    setErrorState(null);
    setMicError(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format assistant text with paragraphs and clean bold / list items
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((para, pIdx) => {
      const lines = para.split(/\n/);
      const isList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));

      if (isList) {
        return (
          <ul key={pIdx} className="list-disc list-outside pl-5 space-y-1 my-2 text-[#292520]">
            {lines.map((line, lIdx) => {
              const cleaned = line.replace(/^[-*]\s+/, '');
              return <li key={lIdx}>{formatInline(cleaned)}</li>;
            })}
          </ul>
        );
      }

      return (
        <p key={pIdx} className="my-1.5 leading-relaxed text-[#292520]">
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {formatInline(line)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[#292520]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const selectedVoiceName = useMemo(() => {
    const found = currentLangVoices.find((v) => v.voiceURI === selectedVoiceUri);
    return found ? found.name : currentLangVoices.length > 0 ? currentLangVoices[0].name : '';
  }, [currentLangVoices, selectedVoiceUri]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#292520] flex flex-col font-sans selection:bg-[#E8DED0]">
      {/* Background warm tint highlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#E8DED0]/35 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-[#D8CDBC]/25 blur-[130px] rounded-full" />
      </div>

      {/* Header bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FFFDF9]/90 border-b border-[#E3DACB] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Logo & Titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#514236] text-[#FAF7F2] flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#292520] flex items-center gap-2">
                {t.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#62584D]">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Controls: Language Selector, Voice, Profile Summary, Reset */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Language Selector: English / Eesti */}
            <div className="flex items-center rounded-lg border border-[#D8CDBC] bg-[#FAF7F2] p-0.5 text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedLang === 'en'
                    ? 'bg-[#514236] text-[#FFFDF9] shadow-xs'
                    : 'text-[#62584D] hover:text-[#292520]'
                }`}
                title="English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('et')}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedLang === 'et'
                    ? 'bg-[#514236] text-[#FFFDF9] shadow-xs'
                    : 'text-[#62584D] hover:text-[#292520]'
                }`}
                title="Eesti keel"
              >
                Eesti
              </button>
            </div>

            {/* Voice Toggle */}
            {speechSynthSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                  voiceEnabled
                    ? 'border-[#514236] bg-[#E8DED0] text-[#292520] font-semibold'
                    : 'border-[#D8CDBC] bg-[#FFFDF9] text-[#62584D] hover:text-[#292520] hover:bg-[#FAF7F2]'
                }`}
                title={voiceEnabled ? t.voiceOn : t.voiceOff}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#514236]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-[#8A7E72]" />
                )}
                <span className="hidden sm:inline">{voiceEnabled ? t.voiceOn : t.voiceOff}</span>
              </button>
            )}

            {/* Voice Selector & Preview Button */}
            {speechSynthSupported && voiceEnabled && currentLangVoices.length > 0 && (
              <div className="relative">
                <div className="flex items-center rounded-lg border border-[#D8CDBC] bg-[#FFFDF9] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                    className="text-xs px-2 py-1.5 text-[#514236] hover:bg-[#FAF7F2] rounded-l-lg flex items-center gap-1 max-w-[120px] truncate"
                    title={t.chooseVoice}
                  >
                    <span className="truncate">{selectedVoiceName || t.chooseVoice}</span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewVoice}
                    className="p-1.5 border-l border-[#D8CDBC] text-[#62584D] hover:text-[#292520] hover:bg-[#FAF7F2] rounded-r-lg"
                    title={t.previewVoice}
                  >
                    <Volume1 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showVoiceDropdown && (
                  <div className="absolute right-0 mt-1 w-64 bg-[#FFFDF9] border border-[#D8CDBC] rounded-xl shadow-lg p-1.5 z-30 max-h-56 overflow-y-auto">
                    <div className="px-2 py-1 text-[11px] font-semibold text-[#8A7E72] uppercase tracking-wider">
                      {t.chooseVoice} ({selectedLang.toUpperCase()})
                    </div>
                    {currentLangVoices.map((v) => (
                      <button
                        key={v.voiceURI}
                        type="button"
                        onClick={() => handleSelectVoice(v.voiceURI)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between transition ${
                          selectedVoiceUri === v.voiceURI
                            ? 'bg-[#E8DED0] text-[#292520] font-semibold'
                            : 'text-[#62584D] hover:bg-[#FAF7F2] hover:text-[#292520]'
                        }`}
                      >
                        <span className="truncate">{v.name}</span>
                        {selectedVoiceUri === v.voiceURI && (
                          <span className="text-[10px] text-[#514236] font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stop Speaking button if active */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-600/40 bg-amber-50 text-amber-900 hover:bg-amber-100 transition flex items-center gap-1 animate-pulse shadow-xs"
                title={t.stopAudio}
              >
                <Square className="w-3 h-3 fill-amber-700 text-amber-700" />
                <span className="hidden sm:inline">{t.stopAudio}</span>
              </button>
            )}

            {/* Profile Summary Button */}
            <button
              type="button"
              onClick={() => setShowProfileSummary(!showProfileSummary)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D8CDBC] hover:border-[#514236]/50 bg-[#FFFDF9] text-[#514236] hover:bg-[#FAF7F2] transition flex items-center gap-1.5 shadow-xs"
              title={t.profileSummaryBtn}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#514236]" />
              <span className="hidden sm:inline">{t.profileSummaryBtn}</span>
            </button>

            {/* Reset Button */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#D8CDBC] hover:border-red-400 bg-[#FFFDF9] text-[#62584D] hover:text-red-700 transition flex items-center gap-1 disabled:opacity-50 shadow-xs"
                title={t.resetBtn}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.resetBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Visible disclosure bar (model & timing diagnostics hidden per instructions) */}
        <div className="bg-[#FAF7F2]/95 border-t border-[#E3DACB] px-4 py-1.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] sm:text-xs text-[#62584D]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#514236]/60" />
              <span>{t.disclosure}</span>
            </div>
            {isSpeaking && (
              <span className="text-[#514236] font-medium flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#514236] animate-ping" />
                {t.streamingAnswer}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Brief Profile Summary Drawer */}
      {showProfileSummary && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="bg-[#FFFDF9] border border-[#D8CDBC] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-[#292520] shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-[#E3DACB] pb-2.5">
              <h3 className="font-bold text-[#292520] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#514236]" />
                {t.summaryTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileSummary(false)}
                className="text-[#62584D] hover:text-[#292520] px-2 py-0.5 rounded text-xs font-medium"
              >
                ✕ {t.close}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.educationLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.educationText}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.militaryLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.militaryText}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.cncLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.cncText}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.workLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.workText}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.languagesLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.languagesText}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#514236] font-semibold">{t.interestsLabel}</span>
                <p className="text-[#62584D] leading-relaxed">{t.interestsText}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main chat container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between">
        {/* Welcome message (clean layout, no suggested question buttons or gaps) */}
        {messages.length === 0 && (
          <div className="my-auto py-12 sm:py-16 flex flex-col items-center text-center max-w-xl mx-auto px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFFDF9] border border-[#D8CDBC] flex items-center justify-center shadow-sm mb-5 text-[#514236]">
              <Sparkles className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292520] tracking-tight">
              {t.welcomeTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#62584D] mt-3 leading-relaxed">
              {t.welcomeDesc}
            </p>
          </div>
        )}

        {/* Message history */}
        {messages.length > 0 && (
          <div className="space-y-4 pb-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-[#E8DED0] border border-[#D8CDBC] flex items-center justify-center text-[#514236] shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-xs ${
                      isUser
                        ? 'bg-[#E8DED0] text-[#292520] rounded-tr-none border border-[#DACFBF]'
                        : 'bg-[#FFFDF9] text-[#292520] rounded-tl-none border border-[#E3DACB]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[11px] text-[#62584D]">
                      <span className="font-semibold">{isUser ? t.you : t.assistant}</span>
                      <span>{message.timestamp}</span>
                    </div>

                    <div className="text-sm">
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed text-[#292520]">{message.text}</p>
                      ) : message.text ? (
                        renderFormattedText(message.text)
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-[#514236] text-xs">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#514236] animate-ping" />
                          <span>{t.generatingAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-[#514236] flex items-center justify-center text-[#FFFDF9] shrink-0 mt-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Error Callout Banner if request failed */}
            {errorState && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm shadow-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-950">
                      {errorState.category === 'authentication_error' && t.authErrorTitle}
                      {errorState.category === 'quota_exceeded' && t.quotaErrorTitle}
                      {errorState.category === 'model_unavailable' && t.modelErrorTitle}
                      {errorState.category === 'timeout' && t.timeoutErrorTitle}
                      {errorState.category === 'upstream_error' && t.upstreamErrorTitle}
                    </p>
                    <p className="text-xs sm:text-sm text-red-800">{errorState.message}</p>
                  </div>
                </div>

                {errorState.canRetry && errorState.failedPrompt && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(errorState.failedPrompt)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-xs font-medium text-white transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t.retry}
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorState(null)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs text-red-900 hover:bg-red-100/50 transition"
                    >
                      {t.dismiss}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Informative voice notices (e.g. device lacks Estonian voice) */}
        {voiceNotice && voiceEnabled && (
          <div className="mb-2 p-2.5 rounded-xl bg-[#E8DED0]/60 border border-[#D8CDBC] text-[#62584D] text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#514236] shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-[#514236] hover:text-[#292520] px-2 py-0.5 text-xs font-semibold"
            >
              {t.dismiss}
            </button>
          </div>
        )}

        {/* Microphone Notice / Error */}
        {micError && (
          <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              type="button"
              onClick={() => setMicError(null)}
              className="text-amber-800 hover:text-amber-950 px-2 py-0.5 text-xs font-semibold"
            >
              {t.dismiss}
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="sticky bottom-0 py-3 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E3DACB]">
          {/* Active Listening Indicator */}
          {isListening && (
            <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-xs text-red-900 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="font-semibold">{t.listeningNow}</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] underline font-medium text-red-800 hover:text-red-950"
              >
                {t.stopListening}
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => { stopListening(); setInputValue(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full bg-[#FFFDF9] border border-[#D8CDBC] focus:border-[#514236] rounded-xl pl-4 pr-11 py-3 text-sm text-[#292520] placeholder-[#8A7E72] focus:outline-none focus:ring-2 focus:ring-[#514236]/20 resize-none transition disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              />

              {/* Microphone Button inside input box */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                  isListening
                    ? 'bg-red-600 text-white shadow-xs animate-pulse'
                    : speechRecSupported
                    ? 'text-[#62584D] hover:text-[#292520] hover:bg-[#E8DED0]/60'
                    : 'text-[#B0A597] cursor-not-allowed'
                }`}
                title={
                  !speechRecSupported
                    ? t.micUnsupported
                    : isListening
                    ? t.stopListening
                    : 'Voice Input'
                }
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-3 bg-[#514236] hover:bg-[#3F332A] text-[#FFFDF9] font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
              title={t.send}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#FFFDF9]" />
              ) : (
                <Send className="w-4 h-4 text-[#FFFDF9]" />
              )}
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">{t.send}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
