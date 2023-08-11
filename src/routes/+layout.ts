import {dev} from '$app/environment';
import {inject} from '@vercel/analytics';

export const prerender = true;
export const trailingSlash = 'always';

inject({mode: dev ? 'development' : 'production'});
