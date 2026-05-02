<script lang="ts">
export let active = 'none';

const flowNav = [
  { name: 'Calculator', link: 'calculator' },
  { name: 'Strategy', link: 'strategy' },
];

const mainNav = [
  { name: 'Guides', link: 'guides' },
  { name: 'About', link: 'about' },
  { name: 'Contact', link: 'contact' },
];
</script>

<div class="header">
  <h3><a href="/">SSA.tools</a></h3>

  <nav class="navpills noprint">
    <div class="flow-group">
      {#each flowNav as option, i}
        {#if i > 0}
          <svg
            class="flow-arrow"
            viewBox="0 0 16 16"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 3l6 5-6 5" />
          </svg>
        {/if}
        <div class="pill" class:active={option.name === active}>
          <a href="/{option.link}">{option.name}</a>
        </div>
      {/each}
    </div>

    <div class="main-group">
      {#each mainNav as option}
        <div class="pill" class:active={option.name === active}>
          <a href="/{option.link}">{option.name}</a>
        </div>
      {/each}
    </div>
  </nav>

  <div class="onlyprint printurl">https://ssa.tools/</div>
</div>

<style>
  .header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    width: 100%;
    border-bottom: 1px solid #c5c5c5;
    margin-bottom: 1.5em;
  }

  h3 {
    margin: 0;
    color: #333;
    font-weight: 500;
    font-size: 28px;
    padding-left: 1em;
    white-space: nowrap;
  }
  h3 a {
    color: #333;
    text-decoration: none;
  }

  .printurl {
    margin: 0 1em;
    line-height: 40px;
    color: rgb(50, 50, 50);
    font-weight: 900;
    font-size: 20px;
    display: none;
  }
  @media print {
    .printurl {
      display: block;
    }
  }

  .navpills {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0.5em 1em;
    font-size: 14px;
  }

  .flow-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .main-group {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 10px;
    padding-left: 10px;
    border-left: 1px solid #e0e0e0;
  }

  .flow-arrow {
    color: #bbb;
    flex-shrink: 0;
    margin: 0 1px;
  }

  .pill {
    display: flex;
  }
  .pill a {
    text-align: center;
    border-radius: 4px;
    padding: 10px 15px;
    text-decoration: none;
    vertical-align: middle;
    color: inherit;
  }
  .pill a:hover {
    background-color: #f0f0f0;
  }
  .pill.active a {
    color: #fff;
    background-color: #337ab7;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  @media screen and (max-width: 675px) {
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
    .pill a {
      padding: 5px 5px;
    }
  }
</style>
