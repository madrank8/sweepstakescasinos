import assert from 'node:assert/strict';
import {
  expectedReviewCtaEligibility,
  geoDependentPaths,
  geoRequestHeaders,
  parseSitemapPaths,
  validateGeoRenderedRoutes,
  validateRenderedLinkGraph,
  type GeoMode,
  type GeoRenderedPage,
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

const nearbyDuplicatePages: RenderedPage[] = [
  ...validPages,
  {
    path: '/guides/nearby-duplicate/',
    status: 200,
    html: `
      <main>
        <p><a href="/state-legality/">State availability in the guide body</a></p>
        <nav class="guide-contextual-links">
          <a href="/guides/">Guide directory</a>
          <a href="/state-legality/">Repeated state availability</a>
        </nav>
      </main>`,
  },
  {
    path: '/news/nearby-duplicate/',
    status: 200,
    html: `
      <article>
        <p><a href="/states/california/">California in the article body</a></p>
        <nav class="article-contextual-links">
          <a href="/guides/">Guide directory</a>
          <a href="/states/california/">Repeated California context</a>
        </nav>
      </article>`,
  },
];
const nearbyDuplicates = validateRenderedLinkGraph(nearbyDuplicatePages);
assert.ok(
  nearbyDuplicates.duplicateBlockDestinations.some(
    (issue) =>
      issue.source === '/guides/nearby-duplicate/' &&
      issue.target === '/state-legality/',
  ),
);
assert.ok(
  nearbyDuplicates.duplicateBlockDestinations.some(
    (issue) =>
      issue.source === '/news/nearby-duplicate/' &&
      issue.target === '/states/california/',
  ),
);

assert.deepEqual(geoRequestHeaders('unknown'), {
  'x-vercel-ip-country': 'US',
});
assert.deepEqual(geoRequestHeaders('TX'), {
  'x-vercel-ip-country': 'US',
  'x-vercel-ip-country-region': 'TX',
});
assert.deepEqual(geoRequestHeaders('CA'), {
  'x-vercel-ip-country': 'US',
  'x-vercel-ip-country-region': 'CA',
});
assert.equal(expectedReviewCtaEligibility('rolla', 'TX'), true);
assert.equal(expectedReviewCtaEligibility('rolla', 'CA'), false);
assert.equal(expectedReviewCtaEligibility('rolla', 'unknown'), false);
assert.equal(expectedReviewCtaEligibility('american-luck', 'TX'), false);
assert.equal(
  geoDependentPaths().filter((path) => /^\/reviews\/[^/]+\/$/.test(path)).length,
  29,
  'the built geo crawl must cover all 29 rendered reviews',
);

const geoPaths = ['/reviews/example/', '/best/sweepstakes-casinos/'];
const modes: GeoMode[] = ['unknown', 'TX', 'CA'];
const geoPages: GeoRenderedPage[] = geoPaths.flatMap((path) =>
  modes.map((mode) => {
    const stateContext =
      path.startsWith('/reviews/') && mode === 'unknown'
        ? '<a href="/state-legality/">Availability context</a>'
        : path.startsWith('/reviews/')
          ? `<a href="/states/${mode === 'TX' ? 'texas' : 'california'}/">Availability context</a>`
          : '';
    const cta =
      mode === 'TX'
        ? path.startsWith('/reviews/')
          ? '<a href="/bonuses/example/">Claim editorial offer</a>'
          : '<a href="/bonuses/example/?clickId=test" data-affiliate="example">Claim offer</a>'
        : '<p data-reason="geo-suppressed">Informational only</p>';
    return {
      path,
      mode,
      status: 200,
      html: `<main><!--sc-contextual-nav--><aside>${stateContext}</aside>${cta}</main>`,
    };
  }),
);
assert.deepEqual(validateGeoRenderedRoutes(geoPages, geoPaths), []);

const brokenGeoPages = geoPages.map((page) =>
  page.path === '/reviews/example/' && page.mode === 'CA'
    ? {
        ...page,
        html: page.html.replace(
          '<p data-reason="geo-suppressed">Informational only</p>',
          '<a href="/bonuses/example/" data-affiliate="example">Claim offer</a>',
        ),
      }
    : page,
);
assert.ok(
  validateGeoRenderedRoutes(brokenGeoPages, geoPaths).some(
    (failure) =>
      failure.path === '/reviews/example/' &&
      failure.mode === 'CA' &&
      /affiliate CTA/.test(failure.reason),
  ),
);

console.log('rendered-link crawl tests: OK');
