// Just enough of NextResponse for same-origin.ts: a JSON response with a status.
export const NextResponse = {
  json: (body, init) => Response.json(body, init),
};
