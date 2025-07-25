"""
Google Drive Service
Handles all Google Drive operations including authentication and file uploads
"""

import os
import json
import logging
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2 import service_account

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DriveService:
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    def __init__(self):
        self.credentials = None
        self.service = None
        self.config = self.load_config()
        self.authenticate()
    
    def load_config(self):
        """Load configuration settings"""
        # Get the directory where this module is located
        module_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(module_dir, 'config', 'drive_config.json')
        default_config = {
            'folder_id': '',
            'auto_upload': True,
            'delete_after_upload': False
        }
        
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    return json.load(f)
            else:
                # Create default config
                config_dir = os.path.join(module_dir, 'config')
                os.makedirs(config_dir, exist_ok=True)
                with open(config_path, 'w') as f:
                    json.dump(default_config, f, indent=2)
                return default_config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return default_config
    
    def authenticate(self):
        """Authenticate with Google Drive API"""
        try:
            creds = None
            # Get the directory where this module is located
            module_dir = os.path.dirname(os.path.abspath(__file__))
            token_path = os.path.join(module_dir, 'config', 'token.json')
            credentials_path = os.path.join(module_dir, 'config', 'credentials.json')
            service_account_path = os.path.join(module_dir, 'config', 'service_account.json')
            
            # Method 1: Try service account authentication (best for production)
            service_account_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
            if service_account_json:
                try:
                    import tempfile
                    # Create temporary service account file from environment variable
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                        temp_file.write(service_account_json)
                        temp_service_account_path = temp_file.name
                    
                    try:
                        creds = service_account.Credentials.from_service_account_file(
                            temp_service_account_path, scopes=self.SCOPES)
                        logger.info("Using service account authentication from environment variable")
                    finally:
                        # Clean up temporary file
                        try:
                            os.unlink(temp_service_account_path)
                        except:
                            pass
                except Exception as e:
                    logger.error(f"Service account authentication from env var failed: {e}")
            
            # Method 2: Try local service account file
            if not creds and os.path.exists(service_account_path):
                try:
                    creds = service_account.Credentials.from_service_account_file(
                        service_account_path, scopes=self.SCOPES)
                    logger.info("Using service account authentication from local file")
                except Exception as e:
                    logger.error(f"Service account authentication from file failed: {e}")
            
            # Method 3: Try OAuth2 token from environment variable (for production)
            if not creds:
                oauth_token_json = os.environ.get('GOOGLE_OAUTH_TOKEN_JSON')
                logger.info(f"Checking for GOOGLE_OAUTH_TOKEN_JSON: {'Found' if oauth_token_json else 'Not found'}")
                if oauth_token_json:
                    try:
                        import tempfile
                        # Create temporary token file from environment variable
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                            temp_file.write(oauth_token_json)
                            temp_token_path = temp_file.name
                        
                        try:
                            creds = Credentials.from_authorized_user_file(temp_token_path, self.SCOPES)
                            if creds and creds.expired and creds.refresh_token:
                                creds.refresh(Request())
                            logger.info("Using OAuth2 authentication from environment variable token")
                        finally:
                            try:
                                os.unlink(temp_token_path)
                            except:
                                pass
                    except Exception as e:
                        logger.error(f"OAuth2 token from environment variable failed: {e}")
            
            # Method 4: Try OAuth2 with existing token file (for local development)
            if not creds and os.path.exists(token_path):
                try:
                    creds = Credentials.from_authorized_user_file(token_path, self.SCOPES)
                    if creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    logger.info("Using OAuth2 authentication from saved token file")
                except Exception as e:
                    logger.error(f"OAuth2 token authentication from file failed: {e}")
            
            # Method 5: Try OAuth2 interactive flow (local development only)
            if not creds and os.path.exists(credentials_path):
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_path, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                    # Save credentials for next run
                    with open(token_path, 'w') as token:
                        token.write(creds.to_json())
                    logger.info("Using OAuth2 interactive authentication")
                except Exception as e:
                    logger.error(f"OAuth2 interactive authentication failed: {e}")
            
            # Method 6: Try OAuth2 credentials from environment variable
            if not creds:
                oauth_creds_json = os.environ.get('GOOGLE_OAUTH_CREDENTIALS_JSON')
                if oauth_creds_json:
                    try:
                        import tempfile
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                            temp_file.write(oauth_creds_json)
                            temp_oauth_path = temp_file.name
                        
                        try:
                            flow = InstalledAppFlow.from_client_secrets_file(
                                temp_oauth_path, self.SCOPES)
                            # Can't do interactive auth in production, so just log the auth URL
                            logger.warning("Interactive OAuth2 authentication not available in production.")
                            logger.warning("Consider using service account authentication instead.")
                        finally:
                            try:
                                os.unlink(temp_oauth_path)
                            except:
                                pass
                    except Exception as e:
                        logger.error(f"OAuth2 environment variable authentication failed: {e}")
            
            if not creds:
                logger.error("All authentication methods failed.")
                logger.error("Available methods:")
                logger.error("1. Set GOOGLE_SERVICE_ACCOUNT_JSON environment variable (recommended for production)")
                logger.error("2. Place service_account.json in backend/config/")
                logger.error("3. Set GOOGLE_OAUTH_TOKEN_JSON environment variable (your existing token)")
                logger.error("4. Place credentials.json in backend/config/ and run locally for OAuth2")
                logger.error("5. Set GOOGLE_OAUTH_CREDENTIALS_JSON environment variable")
                return False
            
            self.credentials = creds
            self.service = build('drive', 'v3', credentials=creds)
            logger.info("Successfully authenticated with Google Drive")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def is_authenticated(self):
        """Check if service is authenticated"""
        return self.service is not None
    
    def get_user_info(self):
        """Get information about the currently authenticated user"""
        try:
            if not self.service:
                return {'error': 'Not authenticated'}
            
            # Get user info from Drive API
            about = self.service.about().get(fields='user').execute()
            user = about.get('user', {})
            
            return {
                'email': user.get('emailAddress'),
                'name': user.get('displayName'),
                'photo': user.get('photoLink')
            }
            
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return {'error': str(e)}
    
    def upload_file(self, file_path, folder_id=None):
        """Upload a file to Google Drive"""
        try:
            if not self.service:
                return {'success': False, 'error': 'Not authenticated'}
            
            if not os.path.exists(file_path):
                return {'success': False, 'error': 'File not found'}
            
            filename = os.path.basename(file_path)
            
            # File metadata
            file_metadata = {
                'name': filename,
                'description': f'Auto-uploaded from Invoice Generator on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
            }
            
            # Set parent folder
            target_folder = folder_id or self.config.get('folder_id')
            if target_folder:
                file_metadata['parents'] = [target_folder]
            
            # Upload file
            media = MediaFileUpload(file_path, resumable=True)
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,webViewLink'
            ).execute()
            
            logger.info(f"Successfully uploaded: {filename} (ID: {file.get('id')})")
            
            # Delete local file if configured
            if self.config.get('delete_after_upload', False):
                try:
                    os.remove(file_path)
                    logger.info(f"Local file deleted: {filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete local file: {e}")
            
            return {
                'success': True,
                'file_id': file.get('id'),
                'file_name': file.get('name'),
                'web_link': file.get('webViewLink')
            }
            
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_folders(self, parent_id=None):
        """Get list of folders from Google Drive"""
        try:
            if not self.service:
                return []
            
            query = "mimeType='application/vnd.google-apps.folder'"
            if parent_id:
                query += f" and '{parent_id}' in parents"
            
            results = self.service.files().list(
                q=query,
                pageSize=100,
                fields="files(id, name, parents)"
            ).execute()
            
            folders = results.get('files', [])
            
            return [
                {
                    'id': folder['id'],
                    'name': folder['name'],
                    'parents': folder.get('parents', [])
                }
                for folder in folders
            ]
            
        except Exception as e:
            logger.error(f"Failed to get folders: {e}")
            return []
    
    def create_folder(self, folder_name, parent_id=None):
        """Create a new folder in Google Drive"""
        try:
            if not self.service:
                return {'success': False, 'error': 'Not authenticated'}
            
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_id:
                file_metadata['parents'] = [parent_id]
            
            folder = self.service.files().create(
                body=file_metadata,
                fields='id,name'
            ).execute()
            
            logger.info(f"Created folder: {folder_name} (ID: {folder.get('id')})")
            
            return {
                'success': True,
                'folder_id': folder.get('id'),
                'folder_name': folder.get('name')
            }
            
        except Exception as e:
            logger.error(f"Failed to create folder: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_config(self, new_config):
        """Update configuration settings"""
        try:
            self.config.update(new_config)
            
            # Get the directory where this module is located
            module_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(module_dir, 'config', 'drive_config.json')
            
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info("Configuration updated")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update config: {e}")
            return False
