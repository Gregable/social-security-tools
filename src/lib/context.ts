/**
 * Global context for the application.
 */
import type {Recipient} from './recipient';

class Context {
  recipient: Recipient|null = null;
  spouse: Recipient|null = null;

  // The filing date sliders track themselves to see if they are currently
  // visible and stuck to the top of the screen. This is used to deteremine
  // what is the top element visible for the purpose of the sidebar.
  isFirstStuck: boolean = false;
  isSecondStuck: boolean = false;
  isStuck() {
    return this.isFirstStuck || this.isSecondStuck;
  }
};

export const context = new Context();
