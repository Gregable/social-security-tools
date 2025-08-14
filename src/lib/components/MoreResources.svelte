<script lang="ts">
  import GithubImg from '$lib/images/github.svg';
  import KoFiImg from '$lib/images/kofi.png';
  import BlueskyImg from '$lib/images/bluesky.jpg';
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

    <h3>Follow for updates</h3>
    <p>
      This calculator updates <u>at least</u> once a year with new adjusted numbers
      from the Social Security Administration. There are also sometimes additional
      improvements and changes throughout the year that you might find useful. To
      get notified of these occasional updates, follow along on social media:
    </p>
    <ul class="socialmedia">
      <li>
        <a href="https://bsky.app/profile/ssa.tools">
          <img src={BlueskyImg} alt="Bluesky Icon" />
          @ssa.tools
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
    <p class="onlyprint" style:text-align="center" style:font-size="1.8em">
      https://ko-fi.com/ssatools
    </p>
    <p style:text-align="center">
      <a href="https://ko-fi.com/ssatools" target="_blank"
        ><img
          height="55"
          width="214"
          style:border="0px"
          src={KoFiImg}
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
</style>
