/**
 * This class provides a type that represents a money amount.
 *
 * The amount is stored as a number of cents. This works for most currencies,
 * but not all as some currencies have smaller units than 1/100th. However, all
 * we care about is dollars.
 *
 * The reason for this class is to avoid issues with using floating point
 * arithmetic in JavaScript. For example, 0.1 cannot be represented exactly in
 * binary floating point. Therefore you get things like, 0.1 + 0.2 =
 * 0.30000000000000004
 */

export class Money {
  /**
   * Callers should always deal in float dollar amounts. This constructor
   * converts the float to an integer number of cents internally.
   *
   * @param dollars The amount of money in dollars.
   */
  public static from(dollars: number): Money {
    if (isNaN(dollars)) {
      throw new Error('Money.from() called with NaN');
    }
    return new Money(Math.round(dollars * 100));
  }

  public static min(a: Money, b: Money): Money {
    return new Money(Math.min(a.cents_, b.cents_));
  }

  public static max(a: Money, b: Money): Money {
    return new Money(Math.max(a.cents_, b.cents_));
  }

  /**
   * @return The amount of money in dollars.
   */
  value(): number {
    return Math.round(this.cents_) / 100;
  }

  /**
   * @returns The amount of money formatted as a currency string.
   * e.g. $1,234.56
   */
  string(): string {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'})
        .format(this.value());
  }

  /**
   * @returns The amount of money formatted as a whole dollar amount.
   * e.g. $1,234
   */
  wholeDollars(): string {
    return new Intl
        .NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
        .format(Math.round(this.value()));
  }

  plus(other: Money): Money {
    return new Money(this.cents_ + other.cents_);
  }

  sub(other: Money): Money {
    return new Money(this.cents_ - other.cents_);
  }

  times(factor: number): Money {
    return new Money(this.cents_ * factor);
  }

  div(factor: number): Money {
    if (factor == 0) {
      throw new Error('Money.div() called with 0');
    }
    return new Money(this.cents_ / factor);
  }

  div$(other: Money): number {
    if (other.cents_ == 0) {
      throw new Error('Money.div$() called with 0');
    }
    return this.cents_ / other.cents_;
  }

  /**
   * Rounds a Money to the nearest dollar (0 significant figures).
   * e.g. 1.26 -> 1.00
   */
  roundToDollar(): Money {
    return new Money(Math.round(this.cents_ / 100) * 100);
  }

  /**
   * Floors a Money down to the whole dollar (0 significant figures).
   */
  floorToDollar(): Money {
    return new Money(Math.floor(this.cents_ / 100) * 100);
  }


  private constructor(cents: number) {
    if (isNaN(cents)) {
      throw new Error('Money constructor called with NaN');
    }
    this.cents_ = cents;
  }

  private cents_: number;
}
