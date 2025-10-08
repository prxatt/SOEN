# Vision AI Integration - Praxis-AI Backend

## Overview

The Vision AI service provides advanced image analysis capabilities for Praxis-AI, enabling users to extract text from handwritten notes, detect events from images, analyze documents, and more. This service leverages the AI Orchestrator to intelligently route vision requests to the most appropriate AI model.

## Features

### 🔤 Handwriting OCR
- Extract text from handwritten notes
- Preserve formatting and structure
- Identify headings, bullet points, and paragraphs
- High accuracy for various handwriting styles

### 📅 Event Detection
- Analyze flyers, posters, tickets, and invitations
- Extract event details (title, date, time, location)
- Detect additional information (links, contact info)
- JSON-structured output for easy integration

### 📱 Social Media Integration
- Extract Instagram usernames and links from images
- Clean and format social media handles
- Support for QR codes linking to social profiles

### 📄 Document Analysis
- Analyze receipts, business cards, menus
- Extract structured data from various document types
- Support for multiple languages and formats

### 🔍 QR Code Detection
- Detect and decode QR codes in images
- Extract URLs, text, and other encoded information
- Support for various QR code formats

### 📝 Formatted Text Extraction
- Extract text while preserving formatting
- Support for bold, italic, headings, lists
- Maintain original document structure

### 🔄 Batch Processing
- Process multiple images simultaneously
- Support for different analysis types per image
- Efficient handling of large batches

## API Endpoints

### Handwriting Processing
```typescript
POST /trpc/vision.processHandwriting
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/jpeg"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "text": "Extracted handwritten text",
    "confidence": 0.9,
    "structuredData": {
      "headings": ["Title", "Subtitle"],
      "bulletPoints": ["Point 1", "Point 2"],
      "paragraphs": ["Para 1", "Para 2"]
    }
  }
}
```

### Event Detection
```typescript
POST /trpc/vision.detectEvent
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/jpeg"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "eventDetected": true,
    "title": "Tech Conference 2024",
    "date": "2024-06-15",
    "time": "09:00",
    "location": "Convention Center",
    "additionalInfo": "Early bird discount available",
    "confidence": 0.95
  }
}
```

### Instagram Link Extraction
```typescript
POST /trpc/vision.extractInstagramLink
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/jpeg"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "instagramLink": "@username123"
  }
}
```

### Document Analysis
```typescript
POST /trpc/vision.analyzeDocument
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/jpeg",
  "analysisType": "receipt" // receipt, business_card, menu, general
}
```

### QR Code Detection
```typescript
POST /trpc/vision.detectQRCode
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/jpeg"
}
```

### Batch Processing
```typescript
POST /trpc/vision.processMultipleImages
{
  "images": [
    {
      "base64": "base64-encoded-image-1",
      "mimeType": "image/jpeg",
      "type": "handwriting"
    },
    {
      "base64": "base64-encoded-image-2", 
      "mimeType": "image/jpeg",
      "type": "event"
    }
  ]
}
```

## Supported Formats

- **Image Formats:** JPEG, PNG, GIF, WebP, BMP, TIFF
- **Max File Size:** 10MB per image
- **Batch Limit:** 10 images per batch request
- **Recommended:** JPEG, PNG for best results

## Processing Times

- **Handwriting OCR:** 2-5 seconds
- **Event Detection:** 3-6 seconds  
- **Document Analysis:** 4-8 seconds
- **QR Code Detection:** 1-3 seconds
- **Batch Processing:** Varies by batch size

## Supported Languages

- English, Spanish, French, German, Italian, Portuguese
- Russian, Chinese, Japanese, Korean
- Additional languages supported via AI models

## Usage Examples

### Frontend Integration

```typescript
// Process handwritten note
const handleImageUpload = async (file: File) => {
  const base64 = await fileToBase64(file);
  
  const result = await trpc.vision.processHandwriting.mutate({
    imageBase64: base64,
    mimeType: file.type
  });
  
  if (result.success) {
    setExtractedText(result.data.text);
    setConfidence(result.data.confidence);
  }
};

// Detect event from image
const detectEvent = async (file: File) => {
  const base64 = await fileToBase64(file);
  
  const result = await trpc.vision.detectEvent.mutate({
    imageBase64: base64,
    mimeType: file.type
  });
  
  if (result.success && result.data.eventDetected) {
    // Create calendar event
    createCalendarEvent({
      title: result.data.title,
      date: result.data.date,
      time: result.data.time,
      location: result.data.location
    });
  }
};
```

### Batch Processing

```typescript
const processMultipleImages = async (files: File[]) => {
  const images = await Promise.all(
    files.map(async (file) => ({
      base64: await fileToBase64(file),
      mimeType: file.type,
      type: 'handwriting' as const
    }))
  );
  
  const result = await trpc.vision.processMultipleImages.mutate({
    images
  });
  
  console.log(`Processed ${result.summary.successful} of ${result.summary.total} images`);
};
```

## Error Handling

The Vision AI service includes comprehensive error handling:

- **Invalid Image Format:** Returns clear error message
- **Processing Failures:** Graceful degradation with partial results
- **Rate Limiting:** Automatic retry with exponential backoff
- **Model Failures:** Fallback to alternative AI models

## Security Considerations

- **Image Privacy:** Images are processed securely and not stored
- **Rate Limiting:** Built-in limits to prevent abuse
- **Content Filtering:** Automatic detection of inappropriate content
- **Data Encryption:** All image data encrypted in transit

## Performance Optimization

- **Caching:** Intelligent caching of similar image analyses
- **Model Selection:** Automatic selection of optimal AI model
- **Batch Processing:** Efficient handling of multiple images
- **Compression:** Automatic image optimization before processing

## Monitoring and Analytics

- **Usage Tracking:** Monitor API usage and performance
- **Error Logging:** Comprehensive error tracking and reporting
- **Performance Metrics:** Processing time and accuracy metrics
- **Cost Tracking:** Monitor AI model usage and costs

## Future Enhancements

- **Real-time Processing:** WebSocket support for live image analysis
- **Custom Models:** User-specific model training
- **Advanced OCR:** Support for complex layouts and languages
- **Video Analysis:** Frame-by-frame analysis of video content
- **3D Object Detection:** Analysis of 3D objects and scenes

## Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Ensure good image quality and lighting
   - Use supported image formats
   - Check image resolution (minimum 300x300px)

2. **Processing Failures**
   - Verify image file size (max 10MB)
   - Check image format compatibility
   - Ensure stable internet connection

3. **Inaccurate Results**
   - Try different analysis types
   - Use higher resolution images
   - Consider image preprocessing

### Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Changelog

### Version 1.0.0
- Initial release with handwriting OCR
- Event detection capabilities
- Instagram link extraction
- Document analysis support
- QR code detection
- Batch processing functionality
