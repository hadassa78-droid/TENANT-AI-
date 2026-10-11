import React, { useState, useEffect, useRef } from 'react';
import { User, Tenant } from '../types';
import { Mic, Volume2, VolumeX, X, Send } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  tenant: Tenant | null;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  user,
  tenant,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [citations, setCitations] = useState<{ title: string; snippet: string }[]>([]);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      setIsListening(false);
      setIsSpeaking(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setTranscript(text);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendVoiceQuery = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean || processing) return;

    setProcessing(true);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/voice/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: clean }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastResponse(data.text || '');
        setCitations(data.citations || []);

        if (!muted && 'speechSynthesis' in window && data.text) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.text);
          utterance.rate = 1.02;
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.error('Voice query error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Spoken Knowledge Assistant
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded voice responses isolated to {tenant ? tenant.name : user.tenantId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center py-4 space-y-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors border ${
              isListening
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] border-slate-300'
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>
          <div className="text-center text-xs text-slate-600">
            {isListening
              ? 'Listening for your question...'
              : processing
              ? 'Synthesizing grounded answer...'
              : isSpeaking
              ? 'Speaking response...'
              : 'Click the microphone to speak or type below'}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speak or type a policy inquiry..."
              className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && transcript.trim()) {
                  handleSendVoiceQuery(transcript);
                }
              }}
            />
            <button
              type="button"
              disabled={!transcript.trim() || processing}
              onClick={() => handleSendVoiceQuery(transcript)}
              className="px-3 py-1.5 rounded-md bg-[#1E3A8A] text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1"
            >
              <span>Submit</span>
              <Send className="w-3 h-3" />
            </button>
          </div>

          {lastResponse && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-slate-800">Spoken Answer</span>
                <button
                  type="button"
                  onClick={() => {
                    setMuted(!muted);
                    if (!muted) window.speechSynthesis?.cancel();
                  }}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
                >
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{muted ? 'Unmute Audio' : 'Mute Audio'}</span>
                </button>
              </div>
              <p className="text-slate-800 leading-relaxed">{lastResponse}</p>
              {citations.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-slate-500">
                  Source Document: <strong className="text-slate-800">{citations[0].title}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              'What are the Project Falcon specs?',
              'What is the travel meal allowance?',
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTranscript(q);
                  handleSendVoiceQuery(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700"
              >
                {q}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
