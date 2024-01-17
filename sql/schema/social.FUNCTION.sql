CREATE or replace FUNCTION public.social(token text) RETURNS public.jwt_token
    LANGUAGE plpython3u SECURITY DEFINER
    AS $$
import jwt
import requests
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

def validate_google_token(token):
    # Get Google public keys
    response = requests.get('https://www.googleapis.com/oauth2/v1/certs')
    if response.status_code != 200:
        raise Exception('Failed to retrieve Google public keys')
    keys = response.json()
    # Decode the JWT header to find the 'kid' value
    headers = jwt.get_unverified_header(token)
    kid = headers['kid']
    # Find the key with the matching 'kid'
    # Find the key with the matching 'kid' and construct a PEM formatted key
    if kid not in keys:
        raise Exception('Key ID not found in Google public keys')
    # Extract the public key from the X.509 certificate
    certificate_text = keys[kid]
    certificate = x509.load_pem_x509_certificate(certificate_text.encode(), default_backend())
    public_key = certificate.public_key()
    pem_public_key = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    # Debug: Output the PEM public key to verify its format
    plpy.notice("PEM public key:\n{}".format(pem_public_key.decode()))
    # Decode the token
    # Obtain the Google client ID set in the database configuration
    google_client_id = plpy.execute("SHOW app.google_client_id")[0]['app.google_client_id']
    id_info = jwt.decode(token, pem_public_key, algorithms=['RS256'], audience=google_client_id)
    # If the token is valid, return the user's ID
    if id_info['iss'] in ['accounts.google.com', 'https://accounts.google.com']:
        return {'sub': id_info['sub']}
    else:
        raise jwt.InvalidIssuerError
return validate_google_token(token)

return validate_google_token(token)
$$;
