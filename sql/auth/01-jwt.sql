CREATE TYPE public.jwt_token AS (
  token text
);

CREATE FUNCTION jwt_test() RETURNS public.jwt_token AS $$
  SELECT public.sign(
    row_to_json(r), current_setting('app.jwt_secret')
  ) AS token
  FROM (
    SELECT
      'my_role'::text as role,
      extract(epoch from now())::integer + 300 AS exp
  ) r;
$$ LANGUAGE sql;
