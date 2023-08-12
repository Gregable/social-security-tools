/**
 * Global context for the application.
 */
import type {Recipient} from './recipient';

class Context {
  recipient: Recipient|null = null;
  spouse: Recipient|null = null;
};

export const context = new Context();
