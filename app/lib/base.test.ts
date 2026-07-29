import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { redirectBareBasePath } from './base';

describe('redirectBareBasePath', () => {
	test('redirects the exact mount path and preserves the query', () => {
		const response = redirectBareBasePath(
			new Request('https://example.com/docs?source=nav'),
			'/docs',
		);

		assert.equal(response?.status, 308);
		assert.equal(
			response?.headers.get('location'),
			'https://example.com/docs/?source=nav',
		);
	});

	for (const pathname of ['/docs/', '/docs/quickstart', '/other']) {
		test(`does not redirect ${pathname}`, () => {
			const response = redirectBareBasePath(
				new Request(`https://example.com${pathname}`),
				'/docs',
			);

			assert.equal(response, null);
		});
	}

	test('does not redirect a site-root deployment', () => {
		const response = redirectBareBasePath(
			new Request('https://example.com/'),
			'',
		);

		assert.equal(response, null);
	});
});
