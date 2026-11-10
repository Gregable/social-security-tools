<script lang="ts">
  import { AUTHOR } from "$lib/author";
  import Header from "$lib/components/Header.svelte";
  import { renderProfilePageSchema, renderWebsiteSocialMeta } from "$lib/schema-org";

  const pageTitle = `${AUTHOR.name} - Author of the SSA.tools Guides`;
  const pageDescription =
    `${AUTHOR.name} writes every guide on SSA.tools and built its open-source ` +
    "Social Security calculator. How the guides are researched, how the " +
    "math is checked, and how to get in touch.";
  const pageImageAlt = `About ${AUTHOR.name}, author of SSA.tools`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={AUTHOR.url} />
  {@html renderProfilePageSchema()}
  {@html renderWebsiteSocialMeta({
    url: AUTHOR.url,
    title: pageTitle,
    description: pageDescription,
    imageAlt: pageImageAlt,
  })}
</svelte:head>

<Header active="About" />
<main>
  <div class="profile">
    <h1>{AUTHOR.name}</h1>
    <p class="role">{AUTHOR.jobTitle}</p>

    <p>{AUTHOR.bio}</p>

    <h2>How the guides are written</h2>
    <p>
      Every guide on this site starts from the primary sources: the Social
      Security Act, the Code of Federal Regulations, and the Social Security
      Administration's own Program Operations Manual System (POMS), which is
      the handbook SSA staff use to decide claims. Guides cite those sources
      inline so you can check any rule yourself rather than take the site's
      word for it.
    </p>
    <p>
      Worked examples in the guides are not typed in by hand. They are
      computed by the same code that powers the
      <a href="/calculator">calculator</a>, with automated tests that pin each
      figure so a future change to the math cannot silently drift a published
      number.
    </p>

    <h2>How the calculator is checked</h2>
    <p>
      The calculator is <a href="https://github.com/Gregable/social-security-tools">open source</a>
      and has been in continuous development since 2017. Its test suite covers
      the benefit formulas, bend points, cost-of-living adjustments, earnings
      indexing, spousal and survivor rules, and the strategy optimizer, and is
      run on every change. The annual SSA figures are updated each October when
      the administration publishes them.
    </p>
    <p>
      None of this makes the site infallible. Social Security rules have
      corners, and SSA's own determination is the one that counts. If you
      find a case the site gets wrong, please
      <a href="/contact">say so</a>; corrections are the most useful mail the
      site gets.
    </p>

    <h2>Background</h2>
    <p>
      Greg is a software engineer. He has worked at Google and at the Federal
      Emergency Management Agency (FEMA). He built SSA.tools after finding that
      the official estimate tools gave a number without explaining it, and
      wanted something that showed people how their benefit is actually put
      together.
    </p>

    <h2>Elsewhere</h2>
    <ul>
      <li>Personal blog: <a href={AUTHOR.sameAs[0]} rel="me">gregable.com</a></li>
      <li>GitHub: <a href={AUTHOR.sameAs[1]} rel="me">github.com/Gregable</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>

    <h2>Guides</h2>
    <p>
      All of the <a href="/guides">Social Security guides</a> on this site are
      written and maintained by Greg. The <a href="/about">about page</a> lists
      the people who have contributed to the calculator itself.
    </p>
  </div>
</main>

<style>
  .profile {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1em 3em 1em;
  }
  h1 {
    margin-bottom: 0;
  }
  .role {
    margin-top: 0.3em;
    color: #666;
    font-style: italic;
  }
  h2 {
    margin-top: 1.8em;
  }
  p,
  li {
    font-size: 1.2em;
    line-height: 1.6;
    color: #333;
  }

  @media (max-width: 768px) {
    .profile {
      padding: 0 1.5em 2em 1.5em;
    }
    p,
    li {
      font-size: 1.05em;
    }
  }
</style>
