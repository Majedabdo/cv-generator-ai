import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp, Paperclip, Mic, Sparkles, ArrowLeft, X, RotateCcw,
  Loader2, FileUp, FileText, Wand2,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useLang } from "@/context/LanguageContext";
import { useIntegratedAi } from "@/hooks/use-integrated-ai";
import { useAnimatedText } from "@/hooks/use-animated-text";
import { toast } from "@/hooks/use-toast";
import { hasReadyMarker, stripMarker } from "@/lib/resumeSignal";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_EXTS = [".pdf", ".docx", ".doc"];
const MAX_IMAGES = 6;

function isImageFile(f) {
  return IMAGE_TYPES.includes(f.type);
}
function isDocFile(f) {
  const n = (f.name || "").toLowerCase();
  return (
    f.type === "application/pdf" ||
    f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    f.type === "application/msword" ||
    DOC_EXTS.some((ext) => n.endsWith(ext))
  );
}

const STATUS_MESSAGES = {
  en: ["Thinking", "Analyzing what you shared", "Reasoning", "Preparing your resume"],
  ar: ["يفكّر", "يحلّل ما شاركته", "يستنتج", "يجهّز سيرتك الذاتية"],
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/70"
          style={{ animation: "cvpilot-bounce 1.2s infinite", animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function readTextFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

export default function ChatPage() {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const { messages, isStreaming, isLoadingHistory, sendMessage, clearMessages } = useIntegratedAi();

  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [statusIndex, setStatusIndex] = useState(0);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const handoffRef = useRef(false);
  const streamedRef = useRef(false);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  const lastMessage = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMessage?.role === "assistant";
  const animatedText = useAnimatedText(isLastStreaming ? lastMessage.content : "");

  const previews = useMemo(
    () =>
      selectedImages.map((file) => ({
        file,
        isImage: isImageFile(file),
        url: isImageFile(file) ? URL.createObjectURL(file) : null,
      })),
    [selectedImages]
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  // When Pilot signals it has enough information, auto-launch the resume
  // generation engine + live preview instead of ever showing resume text.
  useEffect(() => {
    if (isStreaming) streamedRef.current = true;
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming || handoffRef.current || !streamedRef.current) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && hasReadyMarker(last.content)) {
      handoffRef.current = true;
      setHandoff(true);
      const id = setTimeout(() => {
        navigate("/builder", { state: { autoGenerate: true } });
      }, 1600);
      return () => clearTimeout(id);
    }
  }, [messages, isStreaming, navigate]);

  useEffect(() => {
    if (!isStreaming) return;
    setStatusIndex(0);
    const id = setInterval(() => setStatusIndex((i) => (i + 1) % STATUS_MESSAGES[isAr ? "ar" : "en"].length), 1800);
    return () => clearInterval(id);
  }, [isStreaming, isAr]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const attachments = files.filter((f) => isImageFile(f) || isDocFile(f));
    const textFiles = files.filter(
      (f) => f.type === "text/plain" || f.name.toLowerCase().endsWith(".txt")
    );
    const unsupported = files.filter(
      (f) => !attachments.includes(f) && !textFiles.includes(f)
    );

    if (attachments.length) {
      setSelectedImages((prev) => [...prev, ...attachments].slice(0, MAX_IMAGES));
    }

    if (textFiles.length) {
      setUploadingDocs(true);
      const texts = await Promise.all(textFiles.map(readTextFile));
      setUploadingDocs(false);
      const combined = texts.filter(Boolean).join("\n\n");
      if (combined) {
        setInput((prev) => `${prev ? prev + "\n\n" : ""}${combined}`.slice(0, 12000));
        setTimeout(autoResize, 0);
      }
    }

    if (unsupported.length) {
      toast({
        title: isAr ? "صيغة غير مدعومة مباشرة" : "Format not directly supported",
        description: isAr
          ? "ارفع صورة أو لقطة شاشة للمستند (PNG/JPG) وسأقرأه، أو الصق النص هنا."
          : "Upload a photo or screenshot of the document (PNG/JPG) and I'll read it, or paste the text here.",
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [autoResize, isAr]);

  const submit = useCallback(
    (overrideText) => {
      const text = (overrideText ?? input).trim();
      if ((!text && selectedImages.length === 0) || isStreaming || isLoadingHistory) return;
      sendMessage(text, selectedImages);
      setInput("");
      setSelectedImages([]);
      setTimeout(autoResize, 0);
    },
    [input, selectedImages, isStreaming, isLoadingHistory, sendMessage, autoResize]
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <style>{`@keyframes cvpilot-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>

      <AnimatePresence>
        {handoff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-md"
          >
            <div className="flex flex-col items-center px-6 text-center">
              <motion.span
                className="grid h-20 w-20 place-items-center rounded-3xl gradient-primary text-white shadow-2xl shadow-violet-600/40"
                animate={{ scale: [1, 1.09, 1], rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Wand2 className="h-9 w-9" />
              </motion.span>
              <h2 className="mt-7 text-2xl font-bold">
                {isAr ? "أجهّز سيرتك الذاتية…" : "Building your resume…"}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {isAr
                  ? "أصمّم سيرة احترافية متوافقة مع أنظمة التوظيف مع معاينة مباشرة."
                  : "Designing a professional, ATS-optimized document with a live preview."}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAr ? "لحظات…" : "One moment…"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/50 text-foreground/80 transition hover:text-foreground"
            aria-label="Back home"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/builder"
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow shadow-violet-600/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "بناء السيرة" : "Build resume"}
          </Link>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isAr ? "محادثة جديدة" : "New chat"}
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Conversation column */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : empty ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-white shadow-xl shadow-violet-600/30">
                    <Sparkles className="h-8 w-8" />
                  </span>
                  <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">
                    {isAr ? "أهلاً، أنا Pilot" : "Hi, I'm Pilot"}
                  </h1>
                  <p className="mt-3 max-w-lg text-muted-foreground">
                    {isAr
                      ? "أنا مستشارك المهني. أخبرني عن الوظيفة التي تريدها، أو الصق إعلان وظيفة أو سيرتك الذاتية الحالية — وسأحلّلها وأتولّى الباقي."
                      : "I'm your career consultant. Tell me about the role you're going for, or paste a job post or your current CV — I'll analyze it and take it from there."}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    <FileUp className="h-4 w-4 text-primary" />
                    {isAr ? "ارفع سيرتك أو إعلان الوظيفة" : "Upload your CV or a job post"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const isThisStreaming = isStreaming && i === messages.length - 1 && msg.role === "assistant";
                    const display = stripMarker(isThisStreaming ? animatedText : msg.content);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary text-white">
                            <Sparkles className="h-4 w-4" />
                          </span>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isUser
                              ? "gradient-primary text-white shadow-lg shadow-violet-600/20"
                              : "border border-border bg-card"
                          }`}
                        >
                          {msg.images?.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {msg.images.map((url, j) => (
                                <img key={j} src={url} alt="" className="h-24 w-24 rounded-lg object-cover" loading="lazy" />
                              ))}
                            </div>
                          )}
                          {display ? (
                            <p className="whitespace-pre-wrap">{display}</p>
                          ) : isThisStreaming ? (
                            <TypingDots />
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                  {isStreaming && (
                    <div className="flex items-center gap-2 ps-11 text-xs font-medium text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      {STATUS_MESSAGES[isAr ? "ar" : "en"][statusIndex]}…
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur">
            <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex flex-wrap gap-2 overflow-hidden"
                  >
                    {previews.map((p, i) => (
                      <div key={i} className="relative">
                        {p.isImage ? (
                          <img src={p.url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                        ) : (
                          <div className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-1 text-center">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="w-full truncate text-[10px] text-muted-foreground">{p.file.name}</span>
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -end-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,.txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  title={isAr ? "رفع مستند أو صورة" : "Upload a document or photo"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  {uploadingDocs ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={onKeyDown}
                  placeholder={isAr ? "اكتب رسالتك…" : "Message Pilot…"}
                  disabled={isLoadingHistory}
                  className="max-h-44 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  disabled
                  title={isAr ? "الإدخال الصوتي قريباً" : "Voice input coming soon"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground/50"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={isStreaming || isLoadingHistory || (!input.trim() && selectedImages.length === 0)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-lg shadow-violet-600/25 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {isAr
                  ? "لا حاجة للتسجيل — محادثتك محفوظة تلقائياً على هذا الجهاز."
                  : "No sign-up needed — your chat is auto-saved on this device."}
              </p>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <aside className="hidden w-72 shrink-0 border-s border-border bg-secondary/20 p-6 lg:block">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              {isAr ? "كيف يعمل Pilot" : "How Pilot works"}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {isAr
                ? "Pilot يحلّل ما تشاركه أولاً ويستنتج قبل أن يسأل. الصق إعلان وظيفة أو ارفع سيرتك، وسيفهم كل شيء ويبني سيرتك تلقائياً."
                : "Pilot analyzes what you share and reasons before asking. Paste a job post or upload your CV — it understands everything and builds your resume automatically."}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              {isAr ? "المستندات" : "Documents"}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {isAr
                ? "ارفع سيرة ذاتية أو شهادات أو إعلان وظيفة كصور، وسيقرأها Pilot تلقائياً."
                : "Upload a CV, certificates or a job post as images and Pilot reads them automatically."}
            </p>
            <div className="mt-3 flex gap-2 text-muted-foreground">
              <FileUp className="h-4 w-4" />
              <span className="text-xs">PNG · JPG · TXT · PDF</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
