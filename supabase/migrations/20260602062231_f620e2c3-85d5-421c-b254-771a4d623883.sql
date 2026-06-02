
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.market_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  source text NOT NULL,
  source_url text NOT NULL,
  image_url text,
  published_at date,
  category text NOT NULL DEFAULT 'Operators',
  seed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX market_news_published_at_idx ON public.market_news (published_at DESC NULLS LAST, created_at DESC);

GRANT SELECT ON public.market_news TO anon; -- lovable:allow-open-rls
GRANT SELECT ON public.market_news TO authenticated;
GRANT ALL ON public.market_news TO service_role;

ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market news"
ON public.market_news
FOR SELECT
TO anon, authenticated
USING (true); -- lovable:allow-open-rls

CREATE TRIGGER market_news_set_updated_at
BEFORE UPDATE ON public.market_news
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.market_news (slug, title, summary, source, source_url, image_url, published_at, category, seed) VALUES
('servicenow-ai-specialists','AI agents and AI specialists: the new digital workforce','How enterprises are pairing AI agents with AI specialists to automate workflows and accelerate transformation.','ServiceNow','https://www.servicenow.com/workflow/ai/ai-agents-ai-specialists.html','https://logo.clearbit.com/servicenow.com','2026-01-01','Operators',true),
('microsoft-wti-2026','Agents, human agency and the opportunity for every organization','Microsoft''s 2026 Work Trend Index on how agentic AI is reshaping every role and every organization.','Microsoft WorkLab','https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization','https://assets-c4akfrf5b4d3f4b7.z01.azurefd.net/assets/2026/05/2026_WorkTrendIndex_Hero_-1920x1080_69f91cd0ef419.png','2026-05-01','Research',true),
('gcloud-agentic-era','What it takes to get your team ready for the agentic era','Google Cloud''s playbook on the skills, operating model and culture leaders need to thrive in an agentic workplace.','Google Cloud','https://cloud.google.com/transform/what-it-takes-to-get-your-team-ready-for-the-agentic-era','https://storage.googleapis.com/gweb-cloudblog-publish/images/GettyImages-1887444241.max-2600x2600.jpg','2026-01-01','Operators',true),
('gartner-hr-survey-2026','45% of managers report AI has lived up to their expectations','Gartner HR survey reveals where AI is delivering for managers — and where the expectations gap is widening.','Gartner','https://www.gartner.com/en/newsroom/press-releases/2026-3-4-gartner-hr-survey-reveals-45-percent-of-managers-report-ai-has-lived-up-to-their-expectations','https://logo.clearbit.com/gartner.com','2026-03-04','Analyst',true),
('mit-sloan-reshaping-workflows','How AI is reshaping workflows and redefining jobs','MIT Sloan on how chained AI tasks are restructuring work and what leaders should redesign first.','MIT Sloan','https://mitsloan.mit.edu/ideas-made-to-matter/how-ai-reshaping-workflows-and-redefining-jobs','https://mitsloan.mit.edu/sites/default/files/styles/og_image/public/2026-04/ai-chaining-tasks2.jpg.webp','2026-04-01','Research',true),
('basf-alphaevolve','How BASF manages thousands of supply chain decisions with AlphaEvolve','Inside BASF''s deployment of AlphaEvolve to orchestrate complex supply-chain decisions at industrial scale.','Google Cloud','https://cloud.google.com/blog/products/ai-machine-learning/how-basf-manages-thousands-of-supply-chain-decisions-with-alphaevolve','https://storage.googleapis.com/gweb-cloudblog-publish/images/image1_BFm5ksn.max-1500x1500.jpg','2026-01-01','Operators',true),
('aws-nonprofit-agentic-governance','A governance framework for nonprofit agentic AI on AWS','AWS lays out a governance framework for nonprofits deploying agentic AI responsibly and at scale.','AWS','https://aws.amazon.com/blogs/publicsector/a-governance-framework-for-nonprofit-agentic-ai-on-aws/','https://d2908q01vomqb2.cloudfront.net/9e6a55b6b4563e652a23be9d623ca5055c356940/2026/05/09/A-governance-framework-for-nonprofit-agentic-AI-on-AWS.png','2026-05-09','Regulation',true);
