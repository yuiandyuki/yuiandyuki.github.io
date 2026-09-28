import type { APIContext } from 'astro';
import { feed } from '../../lib/feed';
import { OTHER_LANGS } from '../../lib/paths';

export const getStaticPaths = () => OTHER_LANGS.map((lang) => ({ params: { lang } }));
export const GET = (context: APIContext) => feed(context.params.lang as (typeof OTHER_LANGS)[number], context);
