<script lang="ts">
import Header from '$lib/components/Header.svelte';
import KoFiImg from '$lib/images/kofi.png';
import { renderWebsiteSocialMeta } from '$lib/schema-org';

const pageTitle = 'Contact - Social Security Calculator | SSA.tools';
const pageDescription =
  'Contact the developer of SSA.tools social security calculator. Report bugs, suggest improvements, or reach out with questions about the site.';
const pageUrl = 'https://ssa.tools/contact';
const pageImageAlt = 'Contact the Social Security Calculator developer';
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    imageAlt: pageImageAlt,
  })}
</svelte:head>

<Header active="Contact" />
<main>
  <div>
    <h1>Contact the Developer</h1>
    <p>
      I'm not the best person to answer questions about social security
      benefits. For that, please contact the Social Security administration.
    </p>
    <p>
      I am the right person to answer questions specifically about this site, if
      you spot bugs or have suggestions for things that could be clearer, or
      even just want to say thanks, you can contact me at:
    </p>
    <ul>
      <li>
        Email: <a href="mailto:greg@grot.haus">greg@grot.haus</a>
      </li>
      <li>
        Web: <a href="https://gregable.com">Gregable.com</a>
      </li>
      <li>
        Github:
        <a href="https://github.com/Gregable/social-security-tools">
          Gregable/social-security-tools
        </a>
      </li>
    </ul>

    <div class="kofi-section">
      <h3>Thank you</h3>
      <p>Many have asked me if they can support this site.</p>
      <p class="noprint">
        While absolutely not necessary, if you would like to say thanks you can
        contribute by clicking the button below:
      </p>
      <p class="onlyprint">
        While absolutely not necessary, if you would like to say thanks you can
        contribute at:
      </p>
      <p class="onlyprint kofi-url">https://ko-fi.com/ssatools</p>
      <p class="kofi-button">
        <a href="https://ko-fi.com/ssatools" target="_blank"
          ><img
            height="55"
            width="214"
            style:border="0px"
            src={KoFiImg}
            alt="Buy me a coffee if you found this useful"
          /></a
        >
      </p>
    </div>
  </div>
</main>

<style>
  a {
    color: #337ab7;
  }
  main {
    max-width: 1080px;
    margin: 0 auto;
  }

  .kofi-section {
    margin-top: 2em; /* Add some space above the new section */
  }

  .kofi-section .kofi-url {
    font-size: 1.8em;
  }

  .kofi-section .kofi-button img {
    display: block; /* Make image a block element for margin:auto */
    margin: auto; /* Center the image */
  }

  @media (max-width: 768px) {
    main {
      padding: 0 1.5em; /* Added horizontal padding for mobile */
    }
  }
</style>
