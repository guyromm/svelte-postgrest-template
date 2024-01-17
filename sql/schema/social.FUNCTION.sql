CREATE or replace FUNCTION public.social(token text) RETURNS public.jwt_token
    LANGUAGE plpythonu SECURITY DEFINER
    AS $$
import jwt
import requests

def validate_google_token(token):
    # Get Google's public keys
    keys = requests.get('https://www.googleapis.com/oauth2/v1/certs').json()
    # Decode the token
    # Obtain the Google client ID set in the database configuration
    google_client_id = plpy.execute("SHOW app.google_client_id")[0]['app.google_client_id']
    id_info = jwt.decode(token, keys, algorithms=['RS256'], audience=google_client_id)
    # If the token is valid, return the user's ID
    if id_info['iss'] in ['accounts.google.com', 'https://accounts.google.com']:
        return id_info['sub']
    else:
        raise jwt.InvalidIssuerError

return validate_google_token(token)
$$;
