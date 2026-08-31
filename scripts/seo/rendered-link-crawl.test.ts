import assert from 'node:assert/strict';
import {
  parseSitemapPaths,
  validateRenderedLinkGraph,
  type RenderedPage,
} from './rendered-link-crawl';

assert.deepEqual(
  parseSitemapPaths(
    '<urlset><url><loc>https://sweepstakeswiz.com/</loc></url><url><loc>https://sweepstakeswiz.com/reviews/example/</loc></url></urlset>',
  ),
  ['/', '/reviews/example/'],
);

const validPages: RenderedPage[] = [
  {
    path: '/',
    status: 200,
    html: `
      <main>
        <link href="/_external/fonts.googleapis.com/css2__fixture" rel="stylesheet">
        <a href="/reviews/">All reviews</a>
        <a href="/best/sweepstakes-casinos/">Detailed comparison</a>
        <a href="/new/">New casino research</a>
        <a href="/bonuses/no-deposit/">No-purchase offers</a>
        <a href="/state-legality/">State availability</a>
      </main>`,
  },
  {
    path: '/reviews/',
    status: 200,
    html: '<main><a href="/reviews/example/">Example review</a></main>',
  },
  {
    path: '/reviews/example/',
    status: 200,
    html: `
      <main>
        <!--sc-contextual-nav-->
        <aside><nav>
          <a href="/reviews/">Review directory</a>
          <a href="/best/sweepstakes-casinos/">Detailed comparison</a>
          <a href="/reviews/related/">Related review</a>
          <a href="/state-legality/">State availability context</a>
        </nav></aside>
      </main>`,
  },
  {
    path: '/reviews/related/',
    status: 200,
    html: `
      <main>
        <!--sc-contextual-nav-->
        <aside><nav>
          <a href="/reviews/">Review directory</a>
          <a href="/best/sweepstakes-casinos/">Detailed comparison</a>
          <a href="/reviews/example/">Related review</a>
          <a href="/state-legality/">State availability context</a>
        </nav></aside>
      </main>`,
  },
  {
    path: '/states/texas/',
    status: 200,
    html: `
      <main>
        <a href="/reviews/">All reviews</a>
        <a href="/best/sweepstakes-casinos/">Detailed comparison</a>
        <a href="/reviews/example/">Available review</a>
      </main>`,
  },
  {
    path: '/guides/example/',
    status: 200,
    html: `
      <main>
        <a href="/guides/">All guides</a>
        <a href="/bonuses/no-deposit/">No-purchase offers</a>
      </main>`,
  },
  { path: '/guides/', status: 200, html: '<main>Guides</main>' },
  {
    path: '/best/sweepstakes-casinos/',
    status: 200,
    html: '<main><a href="/reviews/example/">Example review</a></main>',
  },
  {
    path: '/new/',
    status: 200,
    html: '<main><a href="/reviews/example/">Example review</a></main>',
  },
  {
    path: '/bonuses/no-deposit/',
    status: 200,
    html: '<main><a href="/reviews/example/">Example review</a></main>',
  },
  {
    path: '/state-legality/',
    status: 200,
    html: '<main><a href="/states/texas/">Texas</a></main>',
  },
];

const valid = validateRenderedLinkGraph(validPages);
assert.deepEqual(valid.missingTargets, []);
assert.deepEqual(valid.unintendedRedirects, []);
assert.deepEqual(valid.duplicateBlockDestinations, []);
assert.deepEqual(valid.hierarchyFailures, []);
assert.deepEqual(valid.missingImportantInbound, []);

const brokenPages: RenderedPage[] = [
  ...validPages,
  {
    path: '/reviews/broken/',
    status: 200,
    html: `
      <main>
        <!--sc-contextual-nav-->
        <aside><nav>
          <a href="/best/">Thin redirect root</a>
          <a href="/missing/">Missing</a>
          <a href="/reviews/example/">Related</a>
          <a href="/reviews/example/">Related duplicate</a>
        </nav></aside>
      </main>`,
  },
  {
    path: '/best/',
    status: 301,
    location: '/best/sweepstakes-casinos/',
    html: '',
  },
];
const broken = validateRenderedLinkGraph(brokenPages);
assert.ok(broken.missingTargets.some((issue) => issue.target === '/missing/'));
assert.ok(broken.unintendedRedirects.some((issue) => issue.target === '/best/'));
assert.ok(
  broken.duplicateBlockDestinations.some(
    (issue) => issue.target === '/reviews/example/',
  ),
);

console.log('rendered-link crawl tests: OK');
