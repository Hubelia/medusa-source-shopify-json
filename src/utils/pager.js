const RateLimiter = require("limiter").RateLimiter;

const limiter = new RateLimiter({ tokensPerInterval: 2, interval: 1000 });

export async function pager(
  client,
  path,
  extraHeaders = null,
  extraQuery = {}
) {
  let objects = [];
  let nextPage = null;
  let hasNext = true;
  let idx = 0;

  while (hasNext) {
    const params = {
      path,
      query: { page_info: nextPage },
    };
    idx += 1;

    if (extraHeaders) {
      Object.assign(params, { extraHeaders: extraHeaders });
    }

    if (extraQuery) {
      Object.assign(params.query, extraQuery);
    }

    if (!params.query.page_info) {
      delete params.query.page_info;
    }
    await limiter.removeTokens(1);
    console.log("getting product page", idx);

    const response = await client.get(params);

    objects = [...objects, ...response.body[path]];

    const link = response.headers.get("link");
    const match =
      /(?:page_info=)(?<page_info>[a-zA-Z0-9]+)(?:>; rel="next")/.exec(link);

    if (match?.groups) {
      nextPage = match.groups["page_info"];
      hasNext = true;
    } else {
      hasNext = false;
    }
  }

  return objects;
}
