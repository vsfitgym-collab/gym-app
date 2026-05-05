-- =============================================
-- MIGRAÇÃO: Realtime apenas
-- Execute apenas esta parte
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;