"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiError, MessageOut, sendChatMessage } from "@/lib/api";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const SUGGESTIONS = [
  "我想在鹿特丹开一家火锅店，需要多少钱？",
  "阿姆斯特丹和海牙哪个更适合开奶茶店？",
  "在荷兰开餐馆需要哪些许可证？",
  "没有荷兰身份，可以先开公司吗？",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content: "你好，我是荷兰开店通的 AI 商业顾问。可以直接告诉我你想做的行业、意向城市和大致预算，我会帮你分析可行性、成本和风险。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationId.current = localStorage.getItem("dbn_conversation_id");
    userId.current = localStorage.getItem("dbn_user_id");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await sendChatMessage(message, conversationId.current, userId.current);
      conversationId.current = res.conversation_id;
      userId.current = res.user_id;
      localStorage.setItem("dbn_conversation_id", res.conversation_id);
      localStorage.setItem("dbn_user_id", res.user_id);

      setMessages((prev) => [...prev, { role: "assistant", content: res.reply.content, sources: res.sources }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "网络错误，请稍后重试";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-56px)]">
      <h1 className="text-xl font-bold text-navy-900 mb-4">AI 开店顾问</h1>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                m.role === "user" ? "bg-navy-900 text-white whitespace-pre-wrap" : "bg-white border border-slate-200 text-slate-800"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose-report prose-report--compact">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-400">
                  参考资料：{m.sources.join("、")}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400">顾问正在思考…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-3 py-1.5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入你的问题，例如：我想在乌得勒支开一家美容店……"
          className="flex-1 border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="bg-navy-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
