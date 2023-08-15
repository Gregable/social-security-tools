import {dev} from '$app/environment';
import {inject} from '@vercel/analytics';

export const prerender = true;

inject({mode: dev ? 'development' : 'production'});
