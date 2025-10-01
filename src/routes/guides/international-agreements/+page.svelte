<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';
  import HeroImage from './hero.png';

  const title = 'Social Security International Agreements';
  const description = 'How does working abroad affect social security?';
  const publishDate = new Date('2022-06-26T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/international-agreements';
  schema.title = title;
  schema.image = HeroImage; // Added HeroImage to schema
  schema.datePublished = publishDate.toISOString();
  schema.description = description; // Pass the description to the schema
  schema.imageAlt = 'Image of earth from space';
  schema.tags = [
    'International',
    'Social Security',
    'Totalization',
    'Expat Benefits',
  ];
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Depiction of the earth with North Amerca in the center"
    />
  </figure>

  <p>
    SSA.tools calculates social security benefits based on a person's earnings
    record, copy/pasted from ssa.gov. In cases of work abroad, this record may
    be insufficient to estimate one's benefit.
  </p>
  <p>
    Since the late 1970's, the United States has established a network of
    bilateral Social Security agreements that coordinate the U.S. Social
    Security program with the comparable programs of other countries.
    International Social Security agreements, often called "Totalization
    agreements", help fill gaps in benefit protection for workers who have
    divided their careers between the United States and another country.
  </p>
  <p>
    The ssa.gov website maintains a full list of all <a
      href="https://www.ssa.gov/international/agreements_overview.html"
      >Totalization Agreements</a
    >.
  </p>
  <p>
    These agreements allow earned income credits to be earned overseas and still
    count towards the minimum of 40 credits required for benefits in the US.
    They also allow for an adjusted benefit based on the amount of time employed
    in each location.
  </p>
  <p>
    This website does not provide a way to directly enter overseas earnings nor
    to compute the related benefits. It should be used as a starting point, but
    not the final answer, in a case of a multinational career.
  </p>
  <GuideFooter />
</div>
