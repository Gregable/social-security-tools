<script lang="ts">
  /**
   * As far as I can tell, there is no good way to implement demo slots
   * in Storybook. This is a hack to get around that, by creating a new
   * component that is only used in the demo.
   */
  import Expando from '$lib/components/Expando.svelte';
</script>

<div>
  <Expando collapsedText="Cat Ipsum" expandedText="Collapse Me">
    <!-- https://ipsum-community.github.io/catipsum.com/ -->
    <p>
      Present belly, scratch hand when stroked man running from cops stops to
      pet cats, goes to jail. Sit in window and stare ooo, a bird! Claws in your
      leg under the bed, or if it smells like fish eat as much as you wish.
    </p>
    <p>
      Dream about hunting birds stretch, yet stick butt in face. Kitty loves
      pigs chase the pig around the house. Meow, for meowzer! Fall over dead
      (not really but gets sypathy) stick butt in face.
    </p>
    <p>
      Spend all night ensuring people don't sleep sleep all day intrigued by the
      shower. Stare at ceiling light or see owner, run in terror, but thinking
      longingly about tuna brine.
    </p>
    <p>
      Ears back wide eyed. When in doubt, wash immediately regret falling into
      bathtub. Chase dog then run away spend all night ensuring people don't
      sleep sleep all day for hack up furballs. I'm getting hungry and rub face
      on everything burrow under covers meow to be let in.
    </p>
  </Expando>
</div>

<style>
  p {
    margin: 1em 2em;
  }
</style>
