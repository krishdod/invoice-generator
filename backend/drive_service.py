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
        config_path = 'backend/config/drive_config.json'
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
                os.makedirs('backend/config', exist_ok=True)
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
            token_path = 'backend/config/token.json'
            credentials_path = 'backend/config/credentials.json'
            
            # Load existing token
            if os.path.exists(token_path):
                creds = Credentials.from_authorized_user_file(token_path, self.SCOPES)
            
            # If no valid credentials, get new ones
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(credentials_path):
                        logger.error("credentials.json not found. Please download it from Google Cloud Console.")
                        return False
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_path, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
            
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
            
            with open('backend/config/drive_config.json', 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info("Configuration updated")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update config: {e}")
            return False
