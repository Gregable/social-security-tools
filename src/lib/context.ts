/**
 * Global context for the application.
 */

import {Recipient} from './recipient';

class Context {
  recipient: Recipient;
  spouse: Recipient|null = null;
};

export const context = new Context();
