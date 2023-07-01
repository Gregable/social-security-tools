/**
 * Global context for the application.
 */

import {Recipient} from './recipient';

class Context {
  recipient: Recipient;
  spouse: Recipient;
};

export const context = new Context();
