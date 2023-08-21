<script lang="ts">
  import "$lib/global.css";

  import FacebookImg from "$lib/images/facebook.svg";
  import TwitterImg from "$lib/images/twitter.svg";
  import GithubImg from "$lib/images/github.svg";
</script>

<div class="container pageBreakAvoid pageBreakBefore">
  <h2>More Reading</h2>

  <div class="text">
    <h3>Additional Guides</h3>
    <p>
      <a href="/guides" target="_blank">Guides</a>: Additional articles
      explaining some of the details of Social Security, this calculator, and
      related topics. These guides don't include interactive and personalized
      information, but still can be very useful for understanding your benefits.
    </p>
    <a href="https://projectionlab.com?ref=ssa-tools">
      <div class="sponsored">
        <span class="sponsored">Sponsored</span><br />
        <p>
          <a href="https://projectionlab.com?ref=ssa-tools">ProjectionLab</a>:
          If you are interested in simulating more of your retirement, beyond
          just Social Security, check out ProjectionLab.
        </p>
        <p>
          ProjectionLab is a powerful tool that models your entire retirement
          plan, runs Monte Carlo simulations using historical market data,
          estimates taxes, and visualizes cash flow.<br />
        </p>
      </div>
    </a>

    <h3>Follow for updates</h3>
    <p>
      This calculator updates <u>at least</u> once a year with new adjusted numbers
      from the Social Security Administration. There are also sometimes additional
      improvements and changes throughout the year that you might find useful. To
      get notified of these occasional updates, follow along on social media:
    </p>
    <ul class="socialmedia">
      <li>
        <a href="https://twitter.com/SsaTools">
          <img src={TwitterImg} alt="Twitter Icon" />
          @SSATools
        </a>
      </li>
      <li>
        <a href="https://www.facebook.com/SsaToolsCalculator">
          <img src={FacebookImg} alt="Facebook Icon" />
          SSAToolsCalculator
        </a>
      </li>
      <li>
        <a href="https://github.com/Gregable/social-security-tools">
          <img src={GithubImg} alt="GitHub Icon" />
          social-security-tools
        </a>
      </li>
    </ul>

    <h3>Thank you</h3>
    <p>Many have asked me if they can support this site.</p>
    <p class="noprint">
      While absolutely not necessary, if you would like to say thanks you can
      contribute by clicking the button below:
    </p>
    <p class="onlyprint">
      While absolutely not necessary, if you would like to say thanks you can
      contribute at:
    </p>
    <p class="onlyprint" style="text-align:center; font-size: 1.8em">
      https://ko-fi.com/ssatools
    </p>
    <p style="text-align:center">
      <a href="https://ko-fi.com/ssatools" target="_blank"
        ><img
          height="55"
          width="214"
          style="border:0px"
          src="https://cdn.ko-fi.com/cdn/kofi1.png?v=3"
          alt="Buy me a coffee if you found this useful"
        /></a
      >
    </p>
  </div>
</div>

<style>
  @media screen {
    .container {
      /* Add some buffer space to support scrolling all the way to the bottom. */
      margin-bottom: 600px;
    }
  }
  .text,
  p {
    margin: 0 0.5em 10px;
  }

  /* Social Media Buttons in FAQ */
  ul.socialmedia {
    list-style: none;
  }

  ul.socialmedia li {
    padding: 3px;
    font-size: 1.8em;
  }

  ul.socialmedia img {
    width: 2em;
    height: 2em;
    vertical-align: middle;
  }
  div.sponsored {
    background-color: aliceblue;
  }
  div.sponsored p {
    margin: 0 0.5em 10px 1em;
  }
  span.sponsored {
    color: rgb(100, 100, 110);
  }
  a p {
    color: rgb(51, 51, 51);
  }
</style>
