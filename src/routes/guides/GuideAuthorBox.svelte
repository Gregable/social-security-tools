<script lang="ts">
  import { AUTHOR } from "$lib/author";

  /**
   * Short "About the author" block shown at the end of every guide, above
   * the calculator call to action. Repeats the author entity visibly so a
   * reader (or a search quality rater) can see who wrote the page and follow
   * through to the profile.
   */
  const authorPath = new URL(AUTHOR.url).pathname;
</script>

<aside class="author-box" aria-label="About the author">
  <div class="label">About the author</div>
  <p class="bio">
    <a href={authorPath} rel="author" class="name">{AUTHOR.name}</a>
    {AUTHOR.bio.replace(`${AUTHOR.name} `, "")}
  </p>
  <p class="more">
    <a href={authorPath}>More about {AUTHOR.name.split(" ")[0]} and how this site is checked &rarr;</a>
  </p>
</aside>

<style>
  .author-box {
    max-width: 600px;
    margin: 3em auto 0 auto;
    padding: 1.2em 1.6em;
    border-left: 4px solid #337ab7;
    background: #f7f9fb;
    border-radius: 0 8px 8px 0;
  }
  .label {
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #777;
    margin-bottom: 0.4em;
  }
  .author-box p {
    font-size: 1em;
    line-height: 1.5;
    color: #444;
    margin: 0 0 0.6em 0;
  }
  .name {
    font-weight: 600;
    color: #2c3e50;
    text-decoration: none;
  }
  .more {
    font-size: 0.9em;
  }
  .more a {
    color: #337ab7;
    text-decoration: none;
  }
  .more a:hover,
  .name:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .author-box {
      margin: 2.5em 1em 0 1em;
    }
  }
</style>
