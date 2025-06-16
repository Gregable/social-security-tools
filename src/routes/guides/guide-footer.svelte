<div class="footer">
  <h1>Try SSA.tools to calculate your personalized benefit</h1>
  <p>See your personal benefit data and ask 'What If?' Questions.</p>
  <div class="bigbtn">
    <a class="bigbtn" href="/calculator" role="button"
      ><span>Get Started</span>
      <div class="freebadge">Free</div></a
    >
  </div>
</div>

<style>
  a {
    color: #337ab7;
  }
  .footer {
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin: 3em auto 3em auto; /* Added top and bottom margin for separation */
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
    box-shadow:
      0 0 0 1px #5cb85c,
      0 1px 2px 0 rgba(31, 42, 55, 0.4);
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-out;
    width: min-content;
    max-width: 300px; /* Added max-width for desktop button */
    margin: auto;
  }
  .footer h1 {
    text-align: center;
    font-size: 2em; /* Adjusted font size for footer h1 */
  }
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

  @media (max-width: 600px) {
    .footer h1 {
      font-size: 1.5em; /* Smaller font for h1 on mobile */
    }
    .bigbtn a {
      font-size: 20px; /* Smaller font for button on mobile */
      padding: 12px 20px; /* Smaller padding */
      width: 90%; /* Make button wider on mobile */
    }
  }
</style>
