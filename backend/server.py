"""
Backend Server for Invoice Generator
Handles PDF generation and Google Drive auto-upload
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime
import logging
from drive_service import DriveService

# Setup Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Drive service
drive_service = DriveService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    user_info = drive_service.get_user_info() if drive_service.is_authenticated() else None
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'drive_connected': drive_service.is_authenticated(),
        'authenticated_user': user_info
    })

@app.route('/api/current-user', methods=['GET'])
def get_current_user():
    """Get current authenticated user info"""
    try:
        user_info = drive_service.get_user_info()
        return jsonify({
            'success': True,
            'user_info': user_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/upload-to-drive', methods=['POST'])
def upload_to_drive():
    """Upload a file to Google Drive"""
    try:
        data = request.get_json()
        
        # Handle both file_path (old) and file_data (new base64) formats
        file_path = data.get('file_path')
        filename = data.get('filename')
        file_data = data.get('file_data')  # base64 encoded
        
        if file_path:
            # Old format: direct file path
            if not os.path.exists(file_path):
                return jsonify({
                    'success': False,
                    'error': 'File not found'
                }), 400
            
            # Upload to Google Drive
            result = drive_service.upload_file(file_path)
            
        elif filename and file_data:
            # New format: base64 file data from frontend
            import base64
            import tempfile
            import re
            
            # Decode base64 data
            try:
                file_bytes = base64.b64decode(file_data)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Invalid base64 data: {str(e)}'
                }), 400
            
            # Generate custom filename based on buyer name and invoice number
            invoice_data = data.get('invoice_data', {})
            buyer_name = invoice_data.get('buyer_name', 'Unknown')
            invoice_no = invoice_data.get('invoice_no', '1')
            
            # Clean buyer name (remove special characters, spaces)
            clean_buyer_name = re.sub(r'[^\w\s-]', '', buyer_name)
            clean_buyer_name = re.sub(r'\s+', '_', clean_buyer_name.strip())
            
            # Generate new filename: BuyerName_(Invoice_InvoiceNumber).pdf
            file_extension = filename.split('.')[-1] if '.' in filename else 'pdf'
            custom_filename = f"{clean_buyer_name}_(Invoice_{invoice_no}).{file_extension}"
            
            # Create temporary file with custom name
            temp_dir = os.path.join('data', 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            temp_file_path = os.path.join(temp_dir, custom_filename)
            
            # Write decoded data to temporary file
            with open(temp_file_path, 'wb') as f:
                f.write(file_bytes)
            
            # Upload to Google Drive with custom filename
            result = drive_service.upload_file(temp_file_path)
            
            # Clean up temporary file
            try:
                os.remove(temp_file_path)
            except:
                pass  # Ignore cleanup errors
                
        else:
            return jsonify({
                'success': False,
                'error': 'Either file_path or (filename + file_data) must be provided'
            }), 400
        
        if result['success']:
            return jsonify({
                'success': True,
                'file_id': result['file_id'],
                'message': 'File uploaded successfully to Google Drive',
                'web_link': result.get('web_link')
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/save-invoice', methods=['POST'])
def save_invoice():
    """Save invoice data and optionally upload to Drive"""
    try:
        data = request.get_json()
        invoice_data = data.get('invoice_data')
        auto_upload = data.get('auto_upload', False)
        
        # Save invoice data locally (optional)
        invoice_filename = f"invoice_{invoice_data.get('invoice_no', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        invoice_path = os.path.join('data', invoice_filename)
        
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        with open(invoice_path, 'w') as f:
            json.dump(invoice_data, f, indent=2)
        
        response = {
            'success': True,
            'message': 'Invoice data saved',
            'invoice_path': invoice_path
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Save invoice error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/configure-drive', methods=['POST'])
def configure_drive():
    """Configure Google Drive settings"""
    try:
        data = request.get_json()
        folder_id = data.get('folder_id', '')
        auto_upload = data.get('auto_upload', True)
        
        # Save configuration
        config = {
            'folder_id': folder_id,
            'auto_upload': auto_upload,
            'updated_at': datetime.now().isoformat()
        }
        
        with open('backend/config/drive_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Drive configuration updated'
        })
        
    except Exception as e:
        logger.error(f"Configure drive error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/get-drive-folders', methods=['GET'])
def get_drive_folders():
    """Get list of folders from Google Drive"""
    try:
        folders = drive_service.get_folders()
        return jsonify({
            'success': True,
            'folders': folders
        })
        
    except Exception as e:
        logger.error(f"Get folders error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('data', exist_ok=True)
    os.makedirs('backend/config', exist_ok=True)
    
    # Show authenticated user info
    if drive_service.is_authenticated():
        user_info = drive_service.get_user_info()
        print(f"\n👤 Authenticated as: {user_info.get('email', 'Unknown')}")
        print(f"📧 User name: {user_info.get('name', 'Unknown')}")
    else:
        print("\n❌ Not authenticated with Google Drive")
    
    # Start server
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('ENVIRONMENT', 'development') == 'development'
    
    print("\n🚀 Starting Invoice Generator Backend Server...")
    print(f"📡 Server will be available at: http://0.0.0.0:{port}")
    print("🔗 Frontend should connect to this URL")
    print("-" * 50)
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
