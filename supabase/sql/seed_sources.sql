-- Example RSS sources (optional seed)
insert into public.sources (kind, name, url, domain)
values
  ('rss', 'Hacker News – Front Page', 'https://hnrss.org/frontpage', 'news.ycombinator.com'),
  ('rss', 'Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'arstechnica.com')
on conflict do nothing;

