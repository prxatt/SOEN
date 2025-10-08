-- Praxis-AI Seed Data
-- This file contains sample data for testing and development

-- Insert sample projects
INSERT INTO public.projects (id, user_id, title, description, status, priority, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'Praxis AI Development', 'Core development for the Praxis AI application', 'active', 'high', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Surface Tension Branding', 'Brand identity and marketing materials', 'active', 'medium', '#EC4899'),
('550e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'Content Creation', 'Video and written content for marketing', 'active', 'medium', '#10B981');

-- Insert sample goals
INSERT INTO public.goals (id, user_id, project_id, term, text, description, status, priority) VALUES
('650e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', 'short', 'Complete backend API development', 'Finish all tRPC endpoints and database integration', 'active', 'high'),
('650e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', 'mid', 'Launch MVP to 100 beta users', 'Get initial user feedback and iterate', 'active', 'high'),
('650e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440002', 'long', 'Build Surface Tension into premium brand', 'Establish market presence and thought leadership', 'active', 'medium');

-- Insert sample notebooks
INSERT INTO public.notebooks (id, user_id, title, description, color, icon) VALUES
('750e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'General', 'Default notebook for notes', '#6B7280', '📝'),
('750e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Ideas', 'Creative ideas and brainstorming', '#F59E0B', '💡'),
('750e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'Learning', 'Educational content and insights', '#8B5CF6', '📚');

-- Insert sample notes
INSERT INTO public.notes (id, user_id, notebook_id, title, content, excerpt, flagged, tags, word_count, reading_time) VALUES
('850e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', '750e8400-e29b-41d4-a716-446655440001', 'Praxis AI Vision', 'Praxis AI is designed to be the iPhone of productivity - magical, default-on, and indispensable. It pairs a context-aware copilot with a minimal workflow OS, delivering Jobs-level simplicity with Altman-level AI leverage.', 'Praxis AI vision for productivity', true, ARRAY['vision', 'productivity', 'ai'], 45, 1),
('850e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', '750e8400-e29b-41d4-a716-446655440002', 'Feature Ideas', 'Key features to implement: Daily Mode, Smart Priorities, Focus Timer, Memory Graph, Routines & Habits, Project briefs, AI compose for updates.', 'Feature ideas for development', false, ARRAY['features', 'development', 'roadmap'], 25, 1),
('850e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', '750e8400-e29b-41d4-a716-446655440003', 'AI Integration Notes', 'Multi-agent system with Kiko orchestrator. Primary: Gemini, Fallback: OpenAI GPT-4o, Command parsing: Groq Llama 3. Vector embeddings for semantic search.', 'AI integration architecture', true, ARRAY['ai', 'architecture', 'integration'], 35, 1);

-- Insert sample tasks
INSERT INTO public.tasks (id, user_id, project_id, goal_id, title, description, category, status, priority, planned_duration, start_time, due_date) VALUES
('950e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Set up Supabase database', 'Create database schema with all tables and RLS policies', 'Prototyping', 'completed', 'high', 120, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
('950e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Implement tRPC routers', 'Create all tRPC procedures for data management', 'Prototyping', 'in_progress', 'high', 180, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours'),
('950e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'AI service integration', 'Connect OpenAI and Anthropic APIs', 'Prototyping', 'pending', 'medium', 90, NOW() + INTERVAL '3 hours', NOW() + INTERVAL '6 hours'),
('950e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 'Design brand guidelines', 'Create comprehensive brand identity system', 'Editing', 'pending', 'medium', 240, NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days'),
('950e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000000', NULL, NULL, 'Morning workout', '30-minute strength training session', 'Workout', 'pending', 'low', 30, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours');

-- Insert sample chat sessions
INSERT INTO public.chat_sessions (id, user_id, title, context, model) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'Productivity Planning', '{"focus": "daily_planning", "context": "morning_routine"}', 'gpt-4o-mini'),
('a50e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Technical Discussion', '{"focus": "backend_development", "context": "praxis_ai"}', 'gpt-4o-mini');

-- Insert sample chat messages
INSERT INTO public.chat_messages (id, session_id, role, content, metadata, token_count, model) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'a50e8400-e29b-41d4-a716-446655440001', 'user', 'Help me plan my day with focus on completing the backend API', '{"task_context": "backend_development"}', 15, 'gpt-4o-mini'),
('b50e8400-e29b-41d4-a716-446655440002', 'a50e8400-e29b-41d4-a716-446655440001', 'assistant', 'I''ll help you create an optimal daily plan focusing on your backend API work. Based on your current tasks, I recommend starting with the tRPC router implementation, then moving to AI service integration. Would you like me to break this down into specific time blocks?', '{"suggestions": ["time_blocking", "priority_ordering"]}', 45, 'gpt-4o-mini'),
('b50e8400-e29b-41d4-a716-446655440003', 'a50e8400-e29b-41d4-a716-446655440002', 'user', 'What''s the best way to implement vector embeddings for semantic search?', '{"technical_context": "vector_search"}', 12, 'gpt-4o-mini'),
('b50e8400-e29b-41d4-a716-446655440004', 'a50e8400-e29b-41d4-a716-446655440002', 'assistant', 'For semantic search with vector embeddings, I recommend using pgvector with OpenAI''s text-embedding-3-small model. Create IVFFLAT indexes for fast similarity search, and implement a hybrid approach combining vector similarity with traditional text search for best results.', '{"technical_details": ["pgvector", "ivfflat", "hybrid_search"]}', 38, 'gpt-4o-mini');

-- Insert sample health metrics
INSERT INTO public.health_metrics (id, user_id, date, sleep_hours, sleep_quality, steps, calories_burned, energy_level, stress_level, mood, water_intake) VALUES
('c50e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', CURRENT_DATE, 7.5, 'good', 8500, 2100, 'high', 3, 'good', 2000),
('c50e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '1 day', 6.5, 'fair', 7200, 1950, 'medium', 5, 'fair', 1800),
('c50e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '2 days', 8.0, 'excellent', 9200, 2250, 'high', 2, 'excellent', 2200);

-- Insert sample AI insights
INSERT INTO public.ai_insights (id, user_id, task_id, insight_type, title, content, data, confidence_score, model, tokens_used) VALUES
('d50e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', '950e8400-e29b-41d4-a716-446655440001', 'task_analysis', 'Database Setup Complete', 'Your database schema is well-structured with proper RLS policies. Consider adding composite indexes for common query patterns.', '{"recommendations": ["composite_indexes", "query_optimization"]}', 0.92, 'gpt-4o-mini', 150),
('d50e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', '950e8400-e29b-41d4-a716-446655440002', 'productivity_tip', 'Focus Session Recommendation', 'Based on your energy level and task complexity, schedule your tRPC router work during your peak focus hours (10-11 AM).', '{"timing": "10-11 AM", "reasoning": "peak_focus"}', 0.88, 'gpt-4o-mini', 120);

-- Insert sample usage analytics
INSERT INTO public.usage_analytics (id, user_id, request_type, model, tokens_input, tokens_output, tokens_total, cost_usd, response_time_ms, success, session_id, task_id) VALUES
('e50e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'chat_message', 'gpt-4o-mini', 15, 45, 60, 0.000090, 1200, true, 'a50e8400-e29b-41d4-a716-446655440001', NULL),
('e50e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'task_insight', 'gpt-4o-mini', 200, 150, 350, 0.000525, 2500, true, NULL, '950e8400-e29b-41d4-a716-446655440001'),
('e50e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'chat_message', 'gpt-4o-mini', 12, 38, 50, 0.000075, 980, true, 'a50e8400-e29b-41d4-a716-446655440002', NULL);
