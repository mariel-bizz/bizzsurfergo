
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('iframe-alert-check') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'iframe-alert-check');

SELECT cron.schedule(
  'iframe-alert-check',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bizzsurfergo.lovable.app/api/public/hooks/iframe-alert-check',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZHNtYnhxbmZ1cmthaGd3bG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzI3ODAsImV4cCI6MjA5Mzc0ODc4MH0.7X4VzZ_Cd3e1yOCmv0Csn3jai5WhIzeOQLSsp-TsGRc"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
