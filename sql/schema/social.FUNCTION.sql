CREATE or replace FUNCTION public.social(token text) RETURNS public.jwt_token
    LANGUAGE plpython3u SECURITY DEFINER
    AS $$
import json
import jwt
import requests
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
import hashlib
from psycopg2 import sql
import random

def login_logic(id_info,token):
    if id_info.get('email_verified'):
        email = id_info['email']
        user_query = plpy.prepare("SELECT email FROM basic_auth.users WHERE email = $1", ["text"])
        users = plpy.execute(user_query, [email])
	# we set a new password every invocation of social() because we need the pass to login and its encrypted.
        random_password = hashlib.md5(str(random.random()).encode()).hexdigest()
        if len(users) == 0:
            # User does not exist, create user
            mode_invite_only_query = plpy.prepare("SELECT COALESCE((SELECT value::bool FROM public.settings WHERE key = 'mode_invite_only'), FALSE)::bool")
            mode_invite_only_enabled = plpy.execute(mode_invite_only_query)[0]['coalesce']
            #email='trilili' ; token='tralala'
            token=json.dumps(token)
            qrys="INSERT INTO basic_auth.users (email,pass, role, validated, validation_info, approved) VALUES ($1, $2, 'client', NOW(), $3, CASE WHEN NOT $4 THEN NOW() ELSE NULL END)"
            qrypt=['text','text','json','bool']
            qryp=[email,random_password,token,mode_invite_only_enabled]
            #plpy.notice(f'{qrys=} {qrypt=}')
            create_user_query = plpy.prepare(qrys,qrypt)
            #plpy.notice(f'{create_user_query=} {type(create_user_query)=}')
            plpy.execute(create_user_query,qryp)
        else:
            # User exists, update password
            update_password_query = plpy.prepare("UPDATE basic_auth.users SET pass = $1 WHERE email = $2", ["text", "text"])
            plpy.execute(update_password_query, [random_password, email])
    # Generate and return our own JWT token for the user
    return plpy.execute(plpy.prepare("SELECT * FROM public.login($1, $2)",['text','text']), [email, random_password])[0]

def validate_google_token(token):
    # Get Google public keys
    response = requests.get('https://www.googleapis.com/oauth2/v1/certs')
    if response.status_code != 200:
        raise Exception('Failed to retrieve Google public keys')
    keys = response.json()


    # Decode the JWT header to find the 'kid' value
    headers = jwt.get_unverified_header(token)

    kid = headers['kid']
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
    #plpy.notice("PEM public key:\n{}".format(pem_public_key.decode()))

    # Obtain the Google client ID set in the database configuration
    google_client_id = plpy.execute("SHOW app.google_client_id")[0]['app.google_client_id']

    # decode the token
    id_info = jwt.decode(token, pem_public_key, algorithms=['RS256'], audience=google_client_id)
    
    # If the token is valid, return the user ID
    if id_info['iss'] in ['accounts.google.com', 'https://accounts.google.com']:
        if id_info.get('email_verified'):
            return login_logic(id_info,token)
        else:
            raise Exception('Google token email not verified')
    else:
        raise jwt.InvalidIssuerError

	
return validate_google_token(token)

$$;
