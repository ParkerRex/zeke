# @zeke/documents

A sophisticated document processing system for extracting structured data from invoices, receipts, and other financial documents using multiple AI models.

## Architectural Insight

The documents package is a sophisticated document processing system that handles invoices and receipts using multiple AI models (Mistral, Gemini). The strong emphasis on schema validation, retry logic, and mime-type safety shows this handles untrusted user uploads while ensuring reliable extraction of financial data.

## Features

- **Multi-model AI processing** - Leverages Mistral for classification and Gemini for embeddings
- **Document type detection** - Automatically identifies invoices vs receipts
- **OCR capabilities** - Extracts text from images and scanned documents
- **Schema validation** - Zod schemas ensure consistent, typed outputs
- **Retry logic** - Exponential backoff for resilient API calls
- **MIME type safety** - Strict validation of uploaded file types
- **Multiple format support** - Handles PDFs, images, and various document formats

## Installation

```bash
pnpm add @zeke/documents
```

## Usage

```typescript
import { DocumentClient } from '@zeke/documents';

const client = new DocumentClient({
  mistralApiKey: process.env.MISTRAL_API_KEY,
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

// Process an invoice
const result = await client.getInvoiceOrReceipt({
  content: fileBuffer,
  fileName: 'invoice.pdf',
  mimeType: 'application/pdf'
});

if (result.type === 'invoice') {
  console.log('Invoice details:', {
    number: result.invoiceNumber,
    date: result.date,
    amount: result.amount,
    vendor: result.vendorName
  });
}
```

## Document Processing Pipeline

1. **MIME Type Validation** - Ensures file type is supported
2. **Content Extraction** - Uses appropriate loader based on file type
3. **Classification** - Determines document type (invoice/receipt)
4. **Data Extraction** - Extracts structured data using specialized processors
5. **Schema Validation** - Validates output against Zod schemas
6. **Response Shaping** - Normalizes data into consistent format

## Supported File Types

- **PDFs** - Native PDF text extraction with OCR fallback
- **Images** - JPEG, PNG, HEIC with OCR processing
- **Documents** - DOCX, TXT, and other text formats
- **Scanned Documents** - OCR for image-based PDFs

## API

### DocumentClient

```typescript
const client = new DocumentClient(config: {
  mistralApiKey: string;
  googleApiKey: string;
  maxRetries?: number;
  timeout?: number;
});
```

### Methods

#### getInvoiceOrReceipt
Processes a document and returns structured invoice or receipt data.

```typescript
const result = await client.getInvoiceOrReceipt({
  content: Buffer | string;
  fileName: string;
  mimeType: string;
});
```

#### classifyDocument
Classifies a document and extracts metadata.

```typescript
const classification = await client.classifyDocument({
  content: Buffer;
  mimeType: string;
});
```

#### embedDocument
Generates vector embeddings for a document.

```typescript
const embeddings = await client.embedDocument({
  text: string;
});
```

## Error Handling

The package implements comprehensive error handling:

```typescript
try {
  const result = await client.getInvoiceOrReceipt(file);
} catch (error) {
  if (error.code === 'UNSUPPORTED_MIME_TYPE') {
    // Handle unsupported file type
  } else if (error.code === 'PROCESSING_TIMEOUT') {
    // Handle timeout
  } else if (error.code === 'VALIDATION_ERROR') {
    // Handle invalid document structure
  }
}
```

## Security

- **File Size Limits** - Enforces maximum file sizes
- **MIME Type Allowlist** - Only processes approved file types
- **Content Sanitization** - Cleans extracted text before processing
- **API Key Validation** - Verifies credentials before processing
- **Timeout Protection** - Prevents runaway requests

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test src/processors
```

## Configuration

Set required environment variables:

```env
MISTRAL_API_KEY=your_mistral_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

Optional configuration:

```typescript
const client = new DocumentClient({
  mistralApiKey: process.env.MISTRAL_API_KEY,
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  maxRetries: 3,        // Default: 3
  timeout: 30000,       // Default: 30s
});
```