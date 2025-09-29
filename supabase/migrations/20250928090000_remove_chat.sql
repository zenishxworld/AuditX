-- Remove chatbot-related database objects
-- Drops tables if they exist; CASCADE removes dependent policies, indexes, and triggers

DROP TABLE IF EXISTS public.chat_interactions CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;

-- If any residual policies or functions existed, CASCADE clears dependencies
-- No chat-related schemas should remain after this migration