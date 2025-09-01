"""
Simple User Authentication System
"""
# import sqlite3  # Not using database
import hashlib
import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
import os

from pymongo import MongoClient
from bson.objectid import ObjectId

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI'))
if not client:
    raise Exception('MONGODB_URI environment variable not set')
db = client.stockcharts
users_collection = db.users
watchlists_collection = db.watchlists

def init_db():
    """Initialize MongoDB collections"""
    # Create indexes for better performance
    users_collection.create_index('username', unique=True)
    users_collection.create_index('email', unique=True)
    watchlists_collection.create_index([('user_id', 1), ('symbol', 1)], unique=True)

def hash_password(password):
    """Hash password with salt"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hash_value):
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hash_value

def generate_token(user_id):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            user_id = verify_token(token)
            if not user_id:
                return jsonify({'error': 'Token is invalid'}), 401
            
            request.current_user_id = user_id
            
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def register_user(username, email, password):
    """Register new user"""
    try:
        password_hash = hash_password(password)
        result = users_collection.insert_one({
            'username': username,
            'email': email,
            'password_hash': password_hash,
            'created_at': datetime.datetime.utcnow()
        })
        return str(result.inserted_id)
    except Exception:
        return None

def authenticate_user(username, password):
    """Authenticate user login"""
    user = users_collection.find_one({
        '$or': [{'username': username}, {'email': username}]
    })
    
    if user and verify_password(password, user['password_hash']):
        return str(user['_id'])
    return None

def get_user_watchlist(user_id):
    """Get user's watchlist"""
    watchlist = list(watchlists_collection.find(
        {'user_id': user_id},
        {'symbol': 1, 'added_at': 1, '_id': 0}
    ).sort('added_at', -1))
    return watchlist

def add_to_watchlist(user_id, symbol):
    """Add symbol to user's watchlist"""
    try:
        watchlists_collection.insert_one({
            'user_id': user_id,
            'symbol': symbol.upper(),
            'added_at': datetime.datetime.utcnow()
        })
        return True
    except Exception:
        return False

def remove_from_watchlist(user_id, symbol):
    """Remove symbol from user's watchlist"""
    result = watchlists_collection.delete_one({
        'user_id': user_id,
        'symbol': symbol.upper()
    })
    return result.deleted_count > 0