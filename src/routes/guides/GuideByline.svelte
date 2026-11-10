<script lang="ts">
  import { AUTHOR } from "$lib/author";

  /**
   * Byline shown under every guide's title: the author, linked to the author
   * profile page, plus the publish and (optional) update dates. The visible
   * author matches the Person in the guide's structured data, which is what
   * lets search engines credit the article to a known entity.
   */
  let { publishDate, updateDate }: { publishDate: Date; updateDate?: Date } =
    $props();

  // Guides construct dates at UTC midnight, and the <time datetime> and the
  // JSON-LD carry that UTC date. Formatting in UTC keeps the visible date on
  // the same day instead of slipping back one in US timezones.
  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { timeZone: "UTC" });
  }

  // A guide may set updateDate equal to publishDate when it has never been
  // revised; an "Updated" line that repeats the publish date is noise.
  const showUpdated = $derived(
    updateDate !== undefined && updateDate.getTime() !== publishDate.getTime()
  );
</script>

<p class="byline">
  <span class="author">
    By <a href={AUTHOR.path} rel="author">{AUTHOR.name}</a>
  </span>
  <span class="dates">
    Published:
    <time datetime={publishDate.toISOString()}>{formatDate(publishDate)}</time>
    {#if showUpdated && updateDate}
      <span class="separator" aria-hidden="true">&middot;</span>
      Updated:
      <time datetime={updateDate.toISOString()}>{formatDate(updateDate)}</time>
    {/if}
  </span>
</p>

<style>
  .byline {
    margin: 0.4em 0 1.5em 0;
    font-size: 0.8em;
    color: #666;
    line-height: 1.5;
  }
  .author {
    display: block;
  }
  .author a {
    color: #337ab7;
    text-decoration: none;
  }
  .author a:hover {
    text-decoration: underline;
  }
  .dates {
    display: block;
  }
  .separator {
    margin: 0 0.3em;
  }
</style>
