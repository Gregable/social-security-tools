<script lang="ts">
  import ProjectionLabImage from "$lib/images/projection-lab.png";
  import MintImage from "$lib/images/evergreen-fox.png";
</script>

<!--
<div class="pageBreakAvoid sponsor">
  <h2>ProjectionLab</h2>
  <h4>Sponsor</h4>

  <div class="text">
    <p>
      Financial planning for retirement is hard, a problem that
      <a href="https://projectionlab.com?ref=ssa-tools">ProjectionLab</a>, takes
      on head first. With
      <a href="https://projectionlab.com?ref=ssa-tools">ProjectionLab</a>, you
      can build an experiment with a living model of your financial life and
      chart a course towards the financial future you want.
    </p>
    <p>
      ProjectionLab models your entire retirement plan, runs Monte Carlo
      simulations using historical market data, and provides clear
      visualizations. Like this site, you can even try out ProjectionLab for
      free. Use the code <strong>SSA-TOOLS</strong> for 10% off.
    </p>
    <p>
      <a href="https://projectionlab.com?ref=ssa-tools">
        <img
          src={ProjectionLabImage}
          width="1160px"
          height="940px"
          class="sponsor-image image-fit"
          alt="ProjectionLab"
        />
      </a>
    </p>
  </div>
</div>
-->

<a href="/mint-mobile" class="ad-anchor">
  <div class="pageBreakAvoid sponsor">
    <h2>Mint Mobile</h2>
    <h4>Sponsor</h4>

    <div class="ad-container">
      <div style="width: 30%">
        <a href="/mint-mobile">
          <img
            src={MintImage}
            width="324px"
            height="426px"
            class="sponsor-image image-fit"
            alt="Mint Mobile"
          />
        </a>
      </div>

      <div class="text" style="width: 70%">
        <p>Save More with Mint Mobile!</p>
        <p>
          Looking to cut down on expenses? Sign up through ssa.tools before
          August and get $15 in free credit from Mint Mobile. Enjoy affordable,
          reliable phone service and keep your savings on track. Don't miss out
          on this opportunity to make the most of your budget while planning for
          retirement!
        </p>
      </div>
    </div>
  </div>
</a>

<style>
  .text {
    margin: 0 0.5em;
    font-size: 1.2em;
  }

  h2,
  h4 {
    margin: 0.5em 0;
  }

  .ad-anchor {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .ad-container {
    display: flex;
    padding: 10px;
  }
  .ad-container div {
    padding: 10px;
    margin: 5px;
  }

  .sponsor {
    background-color: aliceblue;
    padding-left: 20px;
    cursor: pointer;
  }

  img.image-fit {
    width: 100px;
    height: auto;
    object-fit: contain;
  }
</style>
