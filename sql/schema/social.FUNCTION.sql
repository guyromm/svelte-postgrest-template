CREATE or replace FUNCTION public.social(token text) RETURNS public.jwt_token
    LANGUAGE plpython3u SECURITY DEFINER
    AS $$
import jwt
import requests

def validate_google_token(token):
    # Get Google public keys
    response = requests.get('https://www.googleapis.com/oauth2/v1/certs')
    if response.status_code != 200:
        raise Exception('Failed to retrieve Google public keys')
    keys = response.json()
    # Decode the JWT header to find the 'kid' value
    headers = jwt.get_unverified_header(token)
    kid = headers['kid']
    # Find the key with the matching 'kid' and construct a PEM formatted key
    if kid not in keys:
        raise Exception('Key ID not found in Google public keys')
    # Ensure the key is properly PEM formatted
    public_key = keys[kid]
    if not public_key.startswith("-----BEGIN PUBLIC KEY-----"):
        public_key = "-----BEGIN PUBLIC KEY-----\n" + public_key
    if not public_key.endswith("-----END PUBLIC KEY-----"):
        public_key = public_key + "\n-----END PUBLIC KEY-----"
    # Debug: Output the public key to verify its format
    plpy.notice("Public key:\n{}".format(public_key))
    # Decode the token
    # Obtain the Google client ID set in the database configuration
    google_client_id = plpy.execute("SHOW app.google_client_id")[0]['app.google_client_id']
    id_info = jwt.decode(token, public_key, algorithms=['RS256'], audience=google_client_id)
    # If the token is valid, return the user's ID
    if id_info['iss'] in ['accounts.google.com', 'https://accounts.google.com']:
        return id_info['sub']
    else:
        raise jwt.InvalidIssuerError
return validate_google_token(token)

return validate_google_token(token)
$$;
