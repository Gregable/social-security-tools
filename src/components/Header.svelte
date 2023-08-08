<!--
  @component Header

  some markdown here
-->
<script lang="ts">
  export let active = "none";

  let navOptions = [
    { name: "Calculator", link: "calculator.html", active: false },
    { name: "Guides", link: "guides.html", active: false },
    { name: "About", link: "about.html", active: false },
    { name: "Contact", link: "contact.html", active: false },
  ];
  $: active && navOptions.forEach((o) => (o.active = o.name === active));

  let navbar: HTMLDivElement;
  $: navbar &&
    navbar.style.setProperty("--pill-count", navOptions.length.toString());
</script>

<div class="header">
  <h3>Social Security Calculator</h3>

  <div class="navpills" bind:this={navbar}>
    {#each navOptions as option}
      <div class="pill" class:active={option.active}>
        {#if option.active}
          <span>{option.name}</span>
        {:else}
          <a href={option.link}>{option.name}</a>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  /* Page Header with title and static links */
  .header {
    display: grid;
    grid-template-columns: 1fr auto;
    width: 100%;
    border-bottom: 1px solid #c5c5c5;
    margin-bottom: 20px;
  }

  h3 {
    margin: 0;
    line-height: 40px;
    color: rgb(150, 150, 150);
    font-weight: 500;
    font-size: 24px;
    padding-left: 20px;
    white-space: nowrap;
  }

  /* Navigation Pills */
  .navpills {
    font-size: 14px;
    display: grid;
    grid-template-columns: repeat(var(--pill-count), auto);
    column-gap: 10px;
    margin: 5px;
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
  .pill.active span {
    color: #fff;
    background-color: #337ab7;
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
