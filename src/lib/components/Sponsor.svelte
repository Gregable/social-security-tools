<script lang="ts">
  import ProjectionLabImage from "$lib/images/projection-lab.png";

  const currentDate = new Date();
  // 10% off in {currentMonth} is misleading, but it's not false.
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
</script>

<a href="https://projectionlab.com?ref=ssa-tools" class="spon-anchor">
  <div class="pageBreakAvoid sponsor">
    <div class="spon-container">
      <div class="left-top-region">
        <h2>ProjectionLab</h2>
        <h4>Sponsor</h4>
      </div>
      <div class="left-bottom-region">
        <img
          src={ProjectionLabImage}
          width="1160px"
          height="940px"
          class="sponsor-image image-fit"
          alt="ProjectionLab"
        />
      </div>
      <div class="right-region">
        <div class="text">
          <p>
            Are you planning for retirement? Discover ProjectionLab, an advanced
            tool designed to help you simulate and understand your overall plan.
          </p>
          <p>
            Try for free. Use code <strong>SSA-TOOLS</strong> for 10% off in
            {currentMonth}.
          </p>
          <ul>
            <li>
              <strong>Simulate the market:</strong> Run Monte Carlo simulations using
              historical market data.
            </li>
            <li>
              <strong>Visualize your life:</strong> Explore various investment strategies
              and potential outcomes over time.
            </li>
            <li>
              <strong>Secure your data:</strong> Keep your financial information
              safe with flexible data persistence options.
            </li>
          </ul>
        </div>
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

  .spon-anchor {
    display: block;
    text-decoration: none;
    color: inherit;
    margin: 30px 4px;
  }

  .spon-container {
    display: grid;
    grid-template-columns: 30% 70%;
    grid-template-rows: auto auto;
    gap: 10px;
    padding: 10px 4px 4px 0;
  }
  .left-top-region {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;
  }
  .left-bottom-region {
    display: flex;
    justify-content: center;
    align-items: center;
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
  }
  .right-region {
    display: flex;
    align-items: center;
    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 3;
  }
  @media (max-width: 600px) {
    .left-bottom-region,
    .left-top-region,
    li {
      display: none;
    }
    .text {
      margin: 0;
    }
    .spon-container {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .right-region {
      grid-row: auto;
    }
  }
  li {
    margin-bottom: 14px;
  }

  .sponsor {
    background-color: aliceblue;
    padding-left: 20px;
    cursor: pointer;
  }

  img.image-fit {
    max-width: 100%;
    height: auto;
  }
</style>
