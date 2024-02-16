<script lang="ts">
  import "$lib/global.css";
  import SponsorImage from "$lib/images/projection-lab.png";
</script>

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
          src={SponsorImage}
          width="1160px"
          height="940px"
          class="sponsor-image image-fit"
          alt="ProjectionLab"
        />
      </a>
    </p>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  h2,
  h4 {
    margin: 0.5em 0;
  }

  .sponsor {
    background-color: aliceblue;
    padding-left: 20px;
    cursor: pointer;
  }

  img.image-fit {
    width: 100%;
    height: auto;
    object-fit: contain;
    padding: 0 3em;
  }
</style>
