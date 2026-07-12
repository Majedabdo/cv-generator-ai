import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { integratedAiClient } from '@/lib/integratedAiClient';
import { pocketbaseClient } from '@/lib/pocketbaseClient';

/**
 * @typedef {object} TextContentBlock
 * @property {string} text
 * @property {'text'} type
 */

/**
 * @typedef {object} ImageContentBlock
 * @property {string} image
 * @property {'image'} type
 */

/**
 * @typedef {TextContentBlock | ImageContentBlock} ContentBlock
 */

/**
 * @typedef {object} SSEEventContent
 * @property {'content'} type
 * @property {{ content: string }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventToolUse
 * @property {'tool_use'} type
 * @property {{ toolId: string, toolName: string, inputParams: Record<string, any> }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventToolResult
 * @property {'tool_result'} type
 * @property {{ toolCallId: string, content: string }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {SSEEventContent | SSEEventToolUse | SSEEventToolResult} SSEEventHistory
 */

/**
 * @typedef {object} HistoryMessage
 * @property {string} role
 * @property {string} content
 * @property {string[]} [images]
 * @property {Array<{ id: string, type: string, function: { name: string, arguments: string } }>} [tool_calls]
 * @property {string} [tool_call_id]
 * @property {string} [agent_name]
 */

const MessageRole = Object.freeze({
	User: 'user',
	Assistant: 'assistant',
	Tool: 'tool',
});

const ContentBlockType = Object.freeze({
	Text: 'text',
	Image: 'image',
});

const STORAGE_KEY = 'cvpilot-chat-session';
const SESSIONS_STORAGE_KEY = 'cvpilot-chat-sessions';
const ACTIVE_SESSION_ID_KEY = 'cvpilot-active-session-id';

const SSEEventType = Object.freeze({
	Content: 'content',
	Reasoning: 'reasoning',
	ToolUse: 'tool_use',
	ToolResult: 'tool_result',
	Usage: 'usage',
	Error: 'error',
	Done: 'done',
	Completed: 'completed',
});

/**
 * Extracts generated images from tool call results in the message history.
 *
 * @param {object} msg - The message to extract images from
 * @param {Array} history - The full message history
 * @returns {Array} Array of image URLs
 */
function extractGeneratedImages(msg, history) {
	const images = [];
	if (msg.role !== 'assistant') {
		return images;
	}

	const generateImageToolCall = msg.tool_calls?.find(toolCall => toolCall.function.name === 'generate_image');

	if (generateImageToolCall) {
		const generateImageToolCallResult = history.find(historyMessage => historyMessage.role === 'tool' && historyMessage.tool_call_id === generateImageToolCall.id)?.content;
		if (generateImageToolCallResult) {
			images.push(generateImageToolCallResult);
		}
	}

	return images;
}

/**
 * @param {{ message: ContentBlock[] }} params
 * @returns {HistoryMessage}
 */
function mapUserMessage({ message }) {
	const textParts = message.filter(b => b.type === ContentBlockType.Text).map(b => b.text);
	const images = message.filter(b => b.type === ContentBlockType.Image).map(b => b.image);

	return {
		role: MessageRole.User,
		content: textParts.join('\n'),
		...(images.length > 0 && { images }),
	};
}

/**
 * @param {{ message: SSEEventHistory[] }} params
 * @returns {HistoryMessage[]}
 */
function mapAssistantMessages({ message }) {
	/** @type {HistoryMessage[]} */
	const mapped = [];

	for (const event of message) {
		const agentName = event?.metadata?.agent_name;

		if (event.type === SSEEventType.ToolResult) {
			mapped.push({
				role: MessageRole.Tool,
				tool_call_id: event.data.tool_call_id,
				content: event.data.content,
				...(agentName && { agent_name: agentName }),
			});
			continue;
		}

		mapped.push({
			role: MessageRole.Assistant,
			content: event.data.content,
			...(event.type === SSEEventType.ToolUse && {
				tool_calls: event.data.tool_calls.map(toolCall => ({
					id: toolCall.id,
					type: 'function',
					function: {
						name: toolCall.name,
						arguments: JSON.stringify(toolCall.input),
					},
				})),
			}),
			...(agentName && { agent_name: agentName }),
		});
	}

	return mapped;
}

/**
 * Hook for streaming AI chat responses using fetch-based SSE.
 * Supports multiple chat sessions stored in localStorage.
 */
function useIntegratedAi() {
	const [sessions, setSessions] = useState([]);
	const [activeSessionId, setActiveSessionId] = useState(null);
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	
	const abortControllerRef = useRef(null);
	
	const activeSession = sessions.find(s => s.id === activeSessionId);
	const messages = activeSession ? activeSession.messages : [];
	const messagesRef = useRef([]);

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	// Load sessions from localStorage on mount
	useEffect(() => {
		try {
			const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
			const savedActiveId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
			
			let loadedSessions = [];
			let loadedActiveId = null;

			if (savedSessions) {
				loadedSessions = JSON.parse(savedSessions);
			}

			if (Array.isArray(loadedSessions) && loadedSessions.length > 0) {
				loadedActiveId = savedActiveId && loadedSessions.some(s => s.id === savedActiveId)
					? savedActiveId
					: loadedSessions[0].id;
			} else {
				// No sessions exist, create a default one
				const newId = 'session_' + Date.now();
				loadedSessions = [{
					id: newId,
					title: 'New Chat',
					messages: [],
					created: new Date().toISOString()
				}];
				loadedActiveId = newId;
			}

			setSessions(loadedSessions);
			setActiveSessionId(loadedActiveId);
		} catch {
			const newId = 'session_' + Date.now();
			setSessions([{ id: newId, title: 'New Chat', messages: [], created: new Date().toISOString() }]);
			setActiveSessionId(newId);
		} finally {
			setIsLoadingHistory(false);
		}
	}, []);

	// Save sessions to localStorage when they change
	useEffect(() => {
		if (isLoadingHistory) return;
		try {
			if (sessions.length > 0) {
				localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
			} else {
				localStorage.removeItem(SESSIONS_STORAGE_KEY);
			}
		} catch {
			// ignore
		}
	}, [sessions, isLoadingHistory]);

	// Save active session ID and synchronize current chat messages for the resume builder transcript
	useEffect(() => {
		if (isLoadingHistory) return;
		try {
			if (activeSessionId) {
				localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
				const active = sessions.find(s => s.id === activeSessionId);
				if (active && active.messages.length > 0) {
					const persistable = active.messages.filter(m => !(m.role === 'assistant' && !m.content));
					localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			} else {
				localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch {
			// ignore
		}
	}, [activeSessionId, sessions, isLoadingHistory]);

	// Clean up abort controller on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	// Update messages in the currently active session
	const updateActiveSessionMessages = useCallback((fn) => {
		setSessions((prevSessions) => {
			return prevSessions.map((session) => {
				if (session.id === activeSessionId) {
					const updatedMessages = typeof fn === 'function' ? fn(session.messages) : fn;
					return { ...session, messages: updatedMessages };
				}
				return session;
			});
		});
	}, [activeSessionId]);

	// Rename session
	const renameSession = useCallback((id, newTitle) => {
		setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
	}, []);

	// Create a new session
	const createSession = useCallback((title = 'New Chat') => {
		const newId = 'session_' + Date.now();
		const newSession = {
			id: newId,
			title: title,
			messages: [],
			created: new Date().toISOString()
		};
		setSessions(prev => [newSession, ...prev]);
		setActiveSessionId(newId);
		return newId;
	}, []);

	// Delete a session
	const deleteSession = useCallback((id) => {
		setSessions(prev => {
			const filtered = prev.filter(s => s.id !== id);
			if (filtered.length === 0) {
				const newId = 'session_' + Date.now();
				const newSession = {
					id: newId,
					title: 'New Chat',
					messages: [],
					created: new Date().toISOString()
				};
				setActiveSessionId(newId);
				return [newSession];
			}
			if (activeSessionId === id) {
				setActiveSessionId(filtered[0].id);
			}
			return filtered;
		});
	}, [activeSessionId]);

	const handleSSEEvent = useCallback((parsed) => {
		if (parsed.type === SSEEventType.Content) {
			updateActiveSessionMessages((prev) => {
				const updated = [...prev];
				const last = updated[updated.length - 1];
				updated[updated.length - 1] = {
					...last,
					content: last.content + parsed.data.content,
				};

				return updated;
			});
		}

		if (parsed.type === SSEEventType.ToolResult) {
			const isImageResult = parsed.data.tool_name === 'generate_image' && parsed.data.content;

			if (isImageResult) {
				updateActiveSessionMessages((prev) => {
					const updated = [...prev];
					const last = updated[updated.length - 1];
					updated[updated.length - 1] = {
						...last,
						images: [...(last.images || []), parsed.data.content],
					};

					return updated;
				});
			}
		}
	}, [updateActiveSessionMessages]);

	const sendMessage = useCallback(async (userMessage, images = []) => {
		setIsStreaming(true);

		const prior = messagesRef.current.filter(
			m => m.content && (m.role === 'user' || m.role === 'assistant'),
		);
		const transcript = prior
			.map(m => `${m.role === 'user' ? 'User' : 'Pilot'}: ${m.content}`)
			.join('\n\n');
		const composedText = transcript
			? `[CONVERSATION SO FAR — this is our ongoing session; use it as your memory. Do NOT re-ask anything already answered or already analyzed below.]\n${transcript}\n\n[NEW USER MESSAGE]\n${userMessage}`
			: userMessage;

		// If this is the first message in the session, automatically rename the session based on it
		if (messagesRef.current.length === 0) {
			const cleanTitle = userMessage.length > 28 ? userMessage.slice(0, 25) + '...' : userMessage;
			renameSession(activeSessionId, cleanTitle || 'New Chat');
		}

		updateActiveSessionMessages(prev => [
			...prev,
			{
				role: 'user',
				content: userMessage,
				...(images.length > 0 && {
					images: images.map(img => URL.createObjectURL(img)),
				}),
			},
			{ role: 'assistant', content: '' },
		]);

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const response = await integratedAiClient.stream('/integrated-ai/stream', {
				body: { message: [{ text: composedText, type: 'text' }] },
				signal: abortController.signal,
				images,
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				const events = buffer.split('\n\n');
				buffer = events.pop() || '';

				for (const event of events) {
					if (!event.trim()) {
						continue;
					}

					const lines = event.split('\n');
					let eventData = '';

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							eventData += line.slice(6);
						}
					}

					if (!eventData) {
						continue;
					}

					const parsed = JSON.parse(eventData);

					if (parsed.type === SSEEventType.Error) {
						throw new Error(parsed.data.content);
					}

					if (parsed.type === SSEEventType.Completed) {
						return;
					}

					if (parsed.type === 'document_extracted') {
						updateActiveSessionMessages((prev) => {
							const updated = [...prev];
							const userMsgIndex = updated.length - 2;
							if (userMsgIndex >= 0 && updated[userMsgIndex].role === 'user') {
								const userMsg = updated[userMsgIndex];
								const docText = `\n\n[ATTACHED DOCUMENT: ${parsed.data.name}]\n${parsed.data.text}`;
								updated[userMsgIndex] = {
									...userMsg,
									content: userMsg.content + docText,
								};
							}
							return updated;
						});
						continue;
					}

					handleSSEEvent(parsed);
				}
			}
		} catch (err) {
			if (err.name === 'AbortError') {
				updateActiveSessionMessages((prev) => {
					const updated = [...prev];
					const last = updated[updated.length - 1];
					if (last?.role === 'assistant' && !last.content) {
						updated.pop();
					}

					return updated;
				});

				return;
			}

			toast({
				variant: 'destructive',
				title: 'Error',
				description: err.message,
			});

			updateActiveSessionMessages((prev) => {
				const updated = [...prev];
				const last = updated[updated.length - 1];

				if (last?.role === 'assistant' && !last.content) {
					updated.pop();
				}

				return updated;
			});
		} finally {
			abortControllerRef.current = null;
			setIsStreaming(false);
		}
	}, [handleSSEEvent, updateActiveSessionMessages, activeSessionId, renameSession]);

	const clearMessages = useCallback(() => {
		updateActiveSessionMessages([]);
	}, [updateActiveSessionMessages]);

	return {
		messages,
		sessions,
		activeSessionId,
		isStreaming,
		isLoadingHistory,
		sendMessage,
		createSession,
		deleteSession,
		clearMessages,
		renameSession,
		setActiveSessionId,
	};
}

export default useIntegratedAi;
export { useIntegratedAi };
