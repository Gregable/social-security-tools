<script lang="ts">
  export let active = "none";

  let navOptions = [
    { name: "Calculator", link: "calculator", active: false },
    { name: "Guides", link: "guides", active: false },
    { name: "About", link: "about", active: false },
    { name: "Contact", link: "contact", active: false },
  ];
  $: active && navOptions.forEach((o) => (o.active = o.name === active));
</script>

<div class="header">
  <h3><a href="/">SSA.tools</a></h3>

  <div class="navpills" style:--pill-count={navOptions.length.toString()}>
    {#each navOptions as option}
      <div class="pill noprint" class:active={option.active}>
        <a href="/{option.link}">{option.name}</a>
      </div>
    {/each}
  </div>
  <div class="onlyprint printurl">https://ssa.tools/</div>
</div>

<style>
  /* Page Header with title and static links */
  .header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center; /* Added for vertical alignment */
    width: 100%;
    border-bottom: 1px solid #c5c5c5;
    margin-bottom: 1.5em; /* Adjusted for better spacing */
  }

  h3 {
    margin: 0;
    /* Removed line-height: 40px; as align-items handles vertical centering */
    color: #333; /* Made title more prominent */
    font-weight: 500;
    font-size: 28px; /* Increased font size */
    padding-left: 1em; /* Adjusted padding */
    white-space: nowrap;
  }
  h3 a {
    color: #333; /* Made title more prominent */
  }
  .printurl {
    margin: 0 1em;
    line-height: 40px;
    color: rgb(50, 50, 50);
    font-weight: 900;
    font-size: 20px;
  }

  /* Navigation Pills */
  .navpills {
    font-size: 14px;
    display: grid !important;
    grid-template-columns: repeat(var(--pill-count), auto);
    column-gap: 10px;
    margin: 0.5em 1em; /* Adjusted margin */
  }
  .pill {
    /** Vertically aligns he pill */
    display: flex;
  }
  .pill a,
  .pill span {
    text-align: center;
    border-radius: 4px;
    padding: 10px 15px;
    text-decoration: none;
    vertical-align: middle;
  }
  .pill a:hover {
    background-color: #f0f0f0; /* Added hover effect */
  }
  .pill.active a {
    /* Changed from span to a */
    color: #fff;
    background-color: #337ab7;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Added subtle shadow */
  }

  @media screen and (max-width: 675px) {
    /**
    * Below 650px the pills and header start to collide, so
    * we move them to separate lines and center.
    */
    .header {
      grid-template-columns: 1fr;
      justify-items: center;
      margin-bottom: 10px;
    }
    h3 {
      padding-left: 0px;
      font-size: 20px;
      line-height: 30px;
    }
    .pill a,
    .pill span {
      padding: 5px 5px;
    }
  }
</style>
