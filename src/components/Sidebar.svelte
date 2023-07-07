<script lang="ts">
  function scrollTo(id: string) {
    return () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    };
  }
</script>

<div class="sidebar">
  <ul>
    <li>
      <a href="#nav-earnings" on:click={scrollTo("nav-earnings")}>
        <div class="navlabel">Earnings Record</div>
        <i class="glyphicon glyphicon-chevron-right" />
      </a>
    </li>
    <li>
      <a href="#nav-eligibility" data-ng-click="scrollTo('nav-eligibility')">
        <div class="navlabel">Benefits Eligibility</div>
        <i class="glyphicon glyphicon-chevron-right" />
      </a>
    </li>
  </ul>
</div>

<style>
  @media print {
    .sidebar {
      display: none;
    }
  }
  ul {
    top: 10px;
    position: sticky;
    margin: 20px 15px 0 0;
    border-radius: 6px;
    max-width: 220px;
    list-style: none;
    padding: 0;
  }
  li {
    line-height: 20px;
    margin-top: 0;
    position: relative;
    display: block;
  }
  a {
    color: #0088cc;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
    border: 1px solid #e5e5e5;
    padding: 8px 14px;
    margin: 0 0 -1px;
    display: block;
    font-size: 14px;
  }
  .active a {
    background-color: #0088cc;
    color: #fff;
    border-color: #0088cc;
  }
  li:first-child a {
    border-radius: 6px 6px 0 0;
  }
  li:last-child a {
    border-radius: 0 0 6px 6px;
  }
  .navlabel {
    display: inline-block;
    max-width: 175px;
    padding-right: 20px;
  }
</style>
