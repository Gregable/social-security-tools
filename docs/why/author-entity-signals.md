# Why every guide has a byline and an author page

## The problem

Guide traffic from the Bing index (Bing, DuckDuckGo, Yahoo) runs several
times higher than from Google, and Google sends almost nothing to the
competitive family-benefit guides even though it ranks the calculator and
the narrow guides fine. Technical SEO was clean: canonicals, sitemap,
prerendered HTML, structured data, hundreds of followed citations to
ssa.gov and POMS.

What was missing was the author as an entity. Each guide's structured data
named the author as a bare string with no URL, the Open Graph author tag
said "SSA.tools", no guide showed a byline, and nothing on a guide linked to
the about page. Google's guidance for finance topics leans on exactly these
signals: a named author, visible on the page, resolvable to one profile that
says why they are credible. Bing weighs them lightly, which fits the gap.

## What changed

- `src/lib/author.ts` holds one frozen `AUTHOR` record and builds the
  schema.org Person from it. The byline, the author box, the profile page,
  and every guide's JSON-LD read from this single source, so the entity is
  identical everywhere.
- The guide schema's author now carries `url`, `jobTitle`, and `sameAs`
  links, and the Open Graph author tag points at the profile URL.
- Every guide renders `GuideByline` under its title instead of a bare
  "Published" paragraph. The byline links the author with `rel="author"`,
  marks dates up with `<time datetime>`, and shows the update date whenever
  one is set. Before, most guides set an update date in schema but did not
  display it.
- `GuideAuthorBox` is rendered from the shared guide footer so all guides
  get the bio and profile link without per-page edits.
- `/author/greg-grothaus` is a `ProfilePage` whose `mainEntity` is the same
  Person. It explains how guides are sourced and how the calculator is
  checked, which is the content a quality rater looks for. The about page
  links to it and describes the author's role more accurately.
- A test walks every guide directory and fails if one lacks the byline or
  reintroduces the old paragraph.

## What was deliberately not done

- No `reviewedBy`. No one else wrote or reviewed the guides, so claiming a
  reviewer would be false.
- No backlink work; that is off-domain.
- No domain change. Google treats new gTLDs the same as `.com`, and the
  site ranks on Google for low-competition queries on this same domain.

## How to judge it

Search Console on the big guides is the test. Impressions rising at a
poor position means Google now surfaces them and authority is the remaining
lever. No change in impressions after a couple of months means the gap is
site-level quality or indexing, not the author entity.
