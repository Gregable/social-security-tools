<script lang="ts">
  import "$lib/global.css";
  import Header from "$lib/components/Header.svelte";
</script>

<Header active="Guides" />
<main>
  <slot />
  <div class="footer">
    <h1>Try SSA.tools to see your personalized benefit</h1>
    <p>See your personal benefit data and ask 'What If?' Questions.</p>
    <div class="bigbtn">
      <a class="bigbtn" href="/calculator" role="button"
        ><span>Get Started</span>
        <div class="freebadge">Free</div></a
      >
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
  .footer {
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin: auto auto;
    width: max-content;
  }
  .bigbtn {
    position: relative;
  }

  .bigbtn a {
    background-color: #5cb85c;
    border-color: #4cae4c;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    padding: 14px 24px;
    font-size: 24px;
    font-weight: 400;
    text-decoration: none;
    display: flex;
    box-shadow: 0 0 0 1px #5cb85c, 0 1px 2px 0 rgba(31, 42, 55, 0.4);
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-out;
    width: min-content;
    margin: auto;
  }
  .footer h1,
  .footer p {
    text-align: center;
  }

  .bigbtn a:hover {
    background-color: #449d44;
    border-color: #398439;
  }

  .bigbtn .freebadge {
    background: #fd6054;
    border-radius: 4px;
    margin-left: 10px;
    padding: 3px 5px;
  }
</style>
