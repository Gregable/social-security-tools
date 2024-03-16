<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import posthog from "posthog-js";
</script>

<slot />

<style global>
  body {
    margin: 0;
    /**
     * Causes the browser to add horizontal scrollbars if the window
     * is narrower than this value. Set to 320px to match the width of
     * the iPhone 5/SE.
     */
    min-width: 320px;

    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: rgb(51, 51, 51);
    background-color: #fff;
  }

  * {
    scroll-behavior: smooth;
    /**
     * border-box tells the browser to account for any border and padding
     * in the values you specify for an element's width and height, rather than
     * adding padding and border to the outside of the element's box. This makes
     * it much easier to size elements.
     */
    box-sizing: border-box;
  }
  /**
   * The exception to border-box is for images/video where we want to use
   * explicit sizing of the underlying asset so as not to get any distortion.
   */
  img,
  video {
    box-sizing: content-box;
  }

  a {
    color: #337ab7;
    text-decoration: none;
  }

  p {
    margin: 0 0 10px;
  }

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    .noprint {
      display: none !important;
    }

    .pageBreakBefore {
      page-break-before: always;
    }

    .pageBreakAfter {
      page-break-after: always;
    }

    .pageBreakAvoid {
      page-break-inside: avoid;
    }

    * {
      transition: none !important;
      /* Disabling background graphics in print (default) breaks some
       of the UI elements. This forces them back on. */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  @media screen {
    .onlyprint {
      display: none !important;
    }
  }
</style>
