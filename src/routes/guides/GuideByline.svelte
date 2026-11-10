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

  const authorPath = new URL(AUTHOR.url).pathname;

  // Some guides set updateDate equal to publishDate as a placeholder; an
  // "Updated" line that repeats the publish date is noise.
  const showUpdated = $derived(
    updateDate !== undefined && updateDate.getTime() !== publishDate.getTime()
  );
</script>

<p class="byline">
  <span class="author">
    By <a href={authorPath} rel="author">{AUTHOR.name}</a>
  </span>
  <span class="dates">
    Published:
    <time datetime={publishDate.toISOString()}>
      {publishDate.toLocaleDateString()}
    </time>
    {#if showUpdated && updateDate}
      <span class="separator" aria-hidden="true">&middot;</span>
      Updated:
      <time datetime={updateDate.toISOString()}>
        {updateDate.toLocaleDateString()}
      </time>
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
