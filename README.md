# JAI CHAMMUNDA FABRICATION - Invoice Generator

A complete frontend-backend invoice generator application with automatic Google Drive integration.

## Features

- 🧾 Professional invoice generation with tax calculations
- 📱 Responsive web interface
- 📤 Automatic PDF upload to Google Drive
- 💾 Invoice data persistence
- 🔄 Auto-incrementing invoice numbers
- 🎨 Print-optimized PDF output

## Project Structure

```
├── frontend/
│   └── JCF_Invoice_App.html    # Main web application
├── backend/
│   ├── server.py               # Flask API server
│   ├── drive_service.py        # Google Drive integration
│   └── requirements.txt        # Python dependencies
└── README.md                   # This file
```

## Setup Instructions

### 1. Backend Setup

1. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Google Drive API Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Drive API
   - Create credentials (OAuth 2.0 Client IDs)
   - Download the credentials file as `credentials.json`
   - Place `credentials.json` in the `backend/` folder

3. **Start the Backend Server**
   ```bash
   cd backend
   python server.py
   ```
   The server will start on `http://localhost:5000`

### 2. Frontend Setup

1. **Open the Frontend**
   - Open `frontend/JCF_Invoice_App.html` in a web browser
   - Ensure the backend server is running first

### 3. First-Time Google Drive Authorization

1. When you first upload a PDF, the system will open a browser window
2. Sign in to your Google account
3. Grant permissions to access Google Drive
4. The authorization will be saved for future use

## Usage

### Creating an Invoice

1. **Invoice Details**: Enter invoice number, date, and destination
2. **Buyer Information**: Fill in buyer name, address, order details
3. **Add Items**: Select products, enter quantities and rates
4. **Generate Preview**: Click "Generate Invoice Preview"
5. **Download PDF**: Click "Download PDF" - it will automatically upload to Google Drive

### Invoice Numbering

- Invoice numbers auto-increment starting from 18
- Use "Next Invoice" button to increment and clear form
- Use "Previous Invoice" button to go back (minimum 18)

### Google Drive Integration

- PDFs are automatically uploaded after download
- Files are organized in a dedicated folder
- Invoice data is saved for record keeping
- Upload status notifications are shown

## Configuration

### Backend Configuration

The backend creates these directories automatically:
- `config/` - Stores Google Drive settings
- `data/` - Stores invoice records

### Customization

- **Company Details**: Edit company information in the HTML file
- **Tax Rates**: Modify CGST/SGST rates in the JavaScript
- **Items**: Add/remove product options in the dropdown
- **Styling**: Customize CSS for appearance

## Troubleshooting

### Common Issues

1. **Upload Failed - Backend Not Running**
   - Ensure the Flask server is running on port 5000
   - Check that all dependencies are installed

2. **Google Drive Authorization Issues**
   - Delete `token.json` from the config folder
   - Restart the backend server
   - Re-authorize when prompted

3. **PDF Generation Issues**
   - Ensure all required fields are filled
   - Check browser console for JavaScript errors

### Server Logs

Check the backend terminal for detailed error messages and API request logs.

## API Endpoints

- `POST /api/upload-to-drive` - Upload PDF and save invoice data
- `GET /api/drive-folders` - List Google Drive folders
- `POST /api/set-drive-folder` - Configure upload folder

## Development

### Adding New Features

1. **Frontend Changes**: Edit `JCF_Invoice_App.html`
2. **Backend Changes**: Modify `server.py` or `drive_service.py`
3. **New Dependencies**: Update `requirements.txt`

### File Formats

- Frontend: HTML with embedded CSS and JavaScript
- Backend: Python Flask with Google Drive API
- Data: JSON format for configuration and records

## Support

For issues or customization requests, check the application logs and ensure all setup steps are completed correctly.
