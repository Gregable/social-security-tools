<script lang="ts">
  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <title>Social Security Calculator - Contact</title>
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
        Email: <a href="mailto:ggrothau@gmail.com">ggrothau@gmail.com</a>
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
</style>
