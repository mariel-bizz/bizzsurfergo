-- Explicit INSERT policy on user_notifications: a user may only insert a notification
-- whose user_id matches their auth uid. Service-role paths still bypass RLS.
GRANT INSERT ON public.user_notifications TO authenticated;
CREATE POLICY "Users insert own notifications"
  ON public.user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);